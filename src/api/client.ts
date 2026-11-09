import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { getActiveStoreLocale } from '../utils/activeStoreText';
// Cookie-backed (not localStorage) so the token is visible from any seller
// storefront subdomain, not just the exact origin it was issued on — see
// `utils/authCookie.ts`. Imported directly (not via `services/auth.ts`'s
// `TokenStorage`) to avoid a circular import, since `auth.ts` itself imports
// this `client` module.
import { getAuthCookie, clearAuthCookie, setAuthCookie } from '@/utils/authCookie';
import { repairMojibakeDeep } from '@/utils/repairMojibake';
import { getCurrentStorefrontStoreId, getStorefrontToken } from '@/utils/currentStorefront';
import { getStoreSlugFromHost, isCustomDomainCandidate } from '@/utils/storefrontUrl';
import { emitAutoToast, lastManualToast } from '@/utils/toastBridge';
import { describeError, isQuietPath, isWorkspacePath, shouldToastError, successMessage } from '@/utils/apiToast';

// Per-call switch: `client.post(url, body, { toast: false })` keeps the automatic success/error toast away.
declare module 'axios' {
  interface AxiosRequestConfig { toast?: boolean }
  interface InternalAxiosRequestConfig { toastStartedAt?: number }
}

/** Automatic feedback only for a signed-in person in the seller / staff / admin workspace, never on storefronts or the marketing site. */
function autoToastAllowed(config: { toast?: boolean; url?: string } | undefined): boolean {
  if (config?.toast === false) return false;
  if (typeof window === 'undefined' || !isWorkspacePath(window.location.pathname)) return false;
  return !!getAuthCookie('accessToken');
}

const AUTO_TOAST_DELAY_MS = 250;
const recentErrors = new Map<string, number>();

/** Waits a moment and stays quiet when the page already showed its own toast for this action. */
function queueAutoToast(startedAt: number | undefined, variant: 'success' | 'error', message: string, key: string, minGapMs: number): void {
  setTimeout(() => {
    if (lastManualToast() >= (startedAt ?? 0)) return;
    const now = Date.now();
    const last = recentErrors.get(key) ?? 0;
    if (now - last < minGapMs) return;
    recentErrors.set(key, now);
    if (recentErrors.size > 50) recentErrors.clear();
    emitAutoToast(variant, message);
  }, AUTO_TOAST_DELAY_MS);
}

// Endpoints where a 401 means "this specific attempt was rejected" (wrong
// password, invalid/expired OTP, invalid reset token, invalid social token)
// — not "your existing session expired". These must surface their error to
// the calling form instead of force-navigating to /login, which would wipe
// the form's error state via a full reload before the user ever sees it.
const AUTH_ATTEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/social-login',
  '/api/auth/verifyOtp',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/resend-otp',
  '/api/auth/admin/2fa/verify',
];

// ── Axios instance ────────────────────────────────────────────────────────────
// import.meta.env.VITE_API_URL is inlined at BUILD time. If the build runs
// without it set, Vite bakes in `undefined` — axios then silently treats
// every request as relative to whatever origin serves the built bundle
// (e.g. the static frontend host) instead of the real backend. That host
// has no /api route, so its SPA fallback returns index.html with a 200 for
// every API call: requests "succeed" but return HTML, and every `res.data`
// destructure downstream throws on the resulting string. This exact failure
// mode shipped once already (baseURL came out as `void 0` in a production
// bundle) — fail loudly here instead of letting it recur silently.
export const API_BASE_URL = import.meta.env.VITE_API_URL as string | undefined;
if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.error(
    '[Solvexo] VITE_API_URL is not set for this build. All API requests will ' +
    'target the wrong host and silently fail. Set VITE_API_URL and rebuild.',
  );
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor — attach Bearer token automatically ───────────────────
// Sensitive actions (connect a payment gateway, remove staff) ask a two-factor member for a fresh code: the server answers 403 STEP_UP_REQUIRED,
// we ask for the code once, keep the 10-minute token in memory and repeat the request with it.
let stepUp: { value: string; exp: number } | null = null;

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!API_BASE_URL) {
      return Promise.reject(Object.assign(
        new Error('The app is misconfigured (missing API URL). Please contact support.'),
        { isNetworkError: false, status: undefined },
      ));
    }
    // Storefront lookups by URL handle also match the handle translated into the visitor's language (the server caches per URL, so it travels in it).
    const language = getActiveStoreLocale();
    if (language && config.method === 'get' && config.url && /\/api\/(public\/(collections|store-pages|store-blog)\/|products\/getProductById\/)/.test(config.url) && !/[?&]locale=/.test(config.url)) {
      config.params = { ...(config.params ?? {}), locale: language };
    }
    config.toastStartedAt = Date.now();
    if (stepUp && stepUp.exp > Date.now()) config.headers['x-step-up'] = stepUp.value;
    const token = getAuthCookie('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const sfToken = getStorefrontToken(getCurrentStorefrontStoreId());
    if (sfToken && config.headers) config.headers['x-storefront-token'] = sfToken;
    // Let browser set multipart/form-data boundary automatically for FormData
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  err => Promise.reject(err),
);

// ── Expired sessions ─────────────────────────────────────────────────────────
// The API keeps an access token alive for 24 hours (its Redis session), the refresh token for 7 days. When a request
// comes back 401 because the access token's session ended, get a new one with the refresh token and retry the request
// once, so a seller returning to an idle tab just carries on. Only when that fails is the session really over.
const REFRESH_PATH = '/api/auth/refresh';
let refreshInFlight: Promise<string | null> | null = null;

/** One refresh at a time: every request that 401s while it runs waits for the same new token. Null = could not refresh. */
function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getAuthCookie('refreshToken');
  if (!refreshToken || !API_BASE_URL) return Promise.resolve(null);
  refreshInFlight = axios
    .post(`${API_BASE_URL}${REFRESH_PATH}`, { refreshToken }, { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 })
    .then(res => {
      const token = res.data?.data?.token as { accessToken?: string; refreshToken?: string } | undefined;
      if (!token?.accessToken) return null;
      setAuthCookie('accessToken', token.accessToken);
      if (token.refreshToken) setAuthCookie('refreshToken', token.refreshToken);
      return token.accessToken;
    })
    .catch(() => null)
    .finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

let sessionRedirectStarted = false;
/** The session is over while a dashboard is open: go to the right sign-in page (and back here afterwards) instead of
 *  leaving a dashboard on screen with no signed-in user, which is what crashed pages like Analytics. */
function redirectToSignIn() {
  if (sessionRedirectStarted || typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (!isWorkspacePath(pathname)) return;
  sessionRedirectStarted = true;
  let staffStore: string | null = null;
  try { staffStore = window.localStorage.getItem('solvexo:staff-store'); } catch { /* storage unavailable */ }
  const onStaffStore = !!staffStore && new RegExp(`^/(?:[a-z]{2}/)?store/${staffStore}(?:/|$)`).test(pathname);
  const loginPath = onStaffStore ? `/staff-login/${staffStore}` : '/login';
  window.location.assign(`${loginPath}?redirect=${encodeURIComponent(pathname + search)}&expired=1`);
}

// ── Response interceptor — normalize errors, handle 401 ──────────────────────
client.interceptors.response.use(
  (res: AxiosResponse) => {
    // Every backend controller returns a JSON object body (no endpoint sends
    // 204/empty responses) — if a 2xx response ever arrives without one (e.g.
    // a stale deploy, a proxy/CDN returning an empty 200, a version-skewed
    // frontend/backend pair), surface a readable error here instead of
    // letting every call site's `const { x } = res.data` throw a raw
    // "Cannot destructure property 'x' of 'res.data' as it is undefined".
    if (res.data === null || res.data === undefined || typeof res.data !== 'object') {
      throw Object.assign(new Error('Unexpected response from server. Please try again.'), {
        isNetworkError: false,
        status: res.status,
      });
    }
    const method = res.config?.method?.toLowerCase();
    if (method && method !== 'get' && autoToastAllowed(res.config) && !isQuietPath(res.config?.url)) {
      queueAutoToast(res.config?.toastStartedAt, 'success', successMessage(method, res.data), `ok:${method}:${res.config?.url}`, 1500);
    }
    repairMojibakeDeep(res.data);   // names saved as garbled text ("Ø¹Ø«Ù…Ø§Ù†") show correctly everywhere
    return res.data;   // unwrap → caller gets { success, message, data } (or module-specific equivalent)
  },
  (err: AxiosError<ApiErrorBody>) => {
    const cfg = err.config as (InternalAxiosRequestConfig & { _authRetried?: boolean }) | undefined;
    const sentToken = !!cfg?.headers?.Authorization;
    const attempt = AUTH_ATTEMPT_PATHS.some(p => cfg?.url?.includes(p)) || !!cfg?.url?.includes(REFRESH_PATH);
    if (err.response?.status === 401 && cfg && sentToken && !attempt && !cfg._authRetried) {
      cfg._authRetried = true;
      return refreshAccessToken().then(token => {
        if (!token) return handleApiError(err, true);
        cfg.headers.Authorization = `Bearer ${token}`;
        return client(cfg);
      });
    }
    if (err.response?.status === 403 && err.response.data?.code === 'STEP_UP_REQUIRED' && cfg && !(cfg as { _stepUpTried?: boolean })._stepUpTried && typeof window !== 'undefined') {
      (cfg as { _stepUpTried?: boolean })._stepUpTried = true;
      const code = window.prompt('This action needs a fresh code. Enter the 6-digit code from your authenticator app (or a recovery code):');
      if (code && code.trim()) {
        return client.post('/api/2fa/me/step-up', { code: code.trim() }, { toast: false })
          .then((r) => {
            const d = (r as unknown as { data?: { token?: string; expiresInMinutes?: number } }).data;
            if (!d?.token) return handleApiError(err, sentToken);
            stepUp = { value: d.token, exp: Date.now() + ((d.expiresInMinutes ?? 10) - 1) * 60_000 };
            cfg.headers['x-step-up'] = d.token;
            return client(cfg);
          })
          .catch((e) => handleApiError(e as AxiosError<ApiErrorBody>, sentToken));
      }
    }
    if (err.response?.status === 403 && err.response.data?.code === 'TWO_FACTOR_REQUIRED' && typeof window !== 'undefined') {
      const m = /^\/store\/([^/]+)\//.exec(window.location.pathname);
      if (m && !/\/security\/?$/.test(window.location.pathname)) window.location.assign(`/store/${m[1]}/security?setup=1`);
    }
    return handleApiError(err, sentToken);
  },
);

interface ApiErrorBody { message?: string; maintenanceMode?: boolean; code?: string; [key: string]: unknown }

function handleApiError(err: AxiosError<ApiErrorBody>, sentToken: boolean): Promise<never> {
  {
    const msg: string =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.';

    // A visitor anywhere on the site (apex or a storefront subdomain) is very
    // often not logged in at all, or has a stale/expired token still sitting
    // in storage from a previous session — background personalization calls
    // (profile, notifications, etc.) 401ing here is normal and must fail
    // silently, never force-navigate the visitor away from whatever page
    // they're actually on. Session expired → clear the stale local session
    // only (so it stops being resent and re-401ing on every next call); no
    // redirect. Not for the auth-attempt endpoints above — there, a 401 is
    // the expected "wrong credentials/OTP/token" response for that one
    // request, and must show inline on the form.
    const isAuthAttempt = AUTH_ATTEMPT_PATHS.some(p => err.config?.url?.includes(p));
    if (err.response?.status === 401 && !isAuthAttempt) {
      clearAuthCookie('accessToken');
      clearAuthCookie('refreshToken');
      clearAuthCookie('user');
      sessionStorage.removeItem('authCtx');
      if (sentToken) redirectToSignIn();
    }

    const onStorefront = !!getStoreSlugFromHost() || isCustomDomainCandidate();

    // Platform-wide maintenance mode (see main.ts) — admin/auth routes are
    // exempted server-side, so this only ever fires for buyer/seller calls.
    if (err.response?.status === 503 && err.response?.data?.maintenanceMode === true && !onStorefront) {
      if (window.location.pathname !== '/maintenance') window.location.href = '/maintenance';
    }

    // Automatic error toast (dashboards only). A page that shows its own toast wins; repeats of the same problem are throttled.
    if (autoToastAllowed(err.config) && !(err.response?.status === 503 && err.response?.data?.maintenanceMode === true)) {
      const method = err.config?.method?.toLowerCase();
      const isNet = !err.response;
      if (!isQuietPath(err.config?.url) && err.code !== 'ERR_CANCELED' && shouldToastError({ method, status: err.response?.status, isNetworkError: isNet, authAttempt: isAuthAttempt })) {
        const d = describeError({ status: err.response?.status, code: err.code, message: err.response?.data?.message, isNetworkError: isNet, online: typeof navigator === 'undefined' ? true : navigator.onLine, method });
        queueAutoToast(err.config?.toastStartedAt, 'error', d.message, `err:${d.key}`, method === 'get' ? 15_000 : 3000);
      }
    }

    // `isNetworkError` distinguishes "the request never reached the server" (no
    // network, timeout, DNS failure — safe to retry/queue) from a real server
    // rejection (4xx/5xx — retrying with the same input will just fail again).
    // Existing call sites are unaffected: they only ever read `.message`.
    return Promise.reject(Object.assign(new Error(msg), {
      isNetworkError: !err.response,
      status: err.response?.status,
      apiCode: err.response?.data?.code as string | undefined,
      // The full error body, for the few callers that need more than the
      // message (e.g. Sales Ops' duplicate-lead check returns existingLeadId).
      details: err.response?.data as Record<string, unknown> | undefined,
    }));
  }
}

export function isNetworkError(err: unknown): boolean {
  return err instanceof Error && (err as Error & { isNetworkError?: boolean }).isNetworkError === true;
}

export default client;


