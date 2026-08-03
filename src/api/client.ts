import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

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
];

// ── Axios instance ────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor — attach Bearer token automatically ───────────────────
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let browser set multipart/form-data boundary automatically for FormData
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  err => Promise.reject(err),
);

// ── Response interceptor — normalize errors, handle 401 ──────────────────────
client.interceptors.response.use(
  (res: AxiosResponse) => res.data,   // unwrap → caller gets { success, message, data }
  err => {
    const msg: string =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.';

    // Session expired → force logout. Not for the auth-attempt endpoints
    // above — there, a 401 is the expected "wrong credentials/OTP/token"
    // response for that one request, and must show inline on the form.
    const isAuthAttempt = AUTH_ATTEMPT_PATHS.some(p => err.config?.url?.includes(p));
    if (err.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authCtx');
      // Carries the page the user was on back through login so a session
      // expiring mid-task doesn't strand them on the role's default
      // dashboard afterward — LoginPage/AdminLoginPage read this back.
      const here = window.location.pathname + window.location.search;
      const isLoginPage = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/admin/login');
      window.location.href = isLoginPage ? '/login' : `/login?redirect=${encodeURIComponent(here)}`;
    }

    // Platform-wide maintenance mode (see main.ts) — admin/auth routes are
    // exempted server-side, so this only ever fires for buyer/seller calls.
    if (err.response?.status === 503 && err.response?.data?.maintenanceMode === true) {
      if (window.location.pathname !== '/maintenance') window.location.href = '/maintenance';
    }

    // `isNetworkError` distinguishes "the request never reached the server" (no
    // network, timeout, DNS failure — safe to retry/queue) from a real server
    // rejection (4xx/5xx — retrying with the same input will just fail again).
    // Existing call sites are unaffected: they only ever read `.message`.
    return Promise.reject(Object.assign(new Error(msg), {
      isNetworkError: !err.response,
      status: err.response?.status,
    }));
  },
);

export function isNetworkError(err: unknown): boolean {
  return err instanceof Error && (err as Error & { isNetworkError?: boolean }).isNetworkError === true;
}

export default client;
