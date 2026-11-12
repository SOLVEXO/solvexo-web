// Solvexo's own Google Analytics (GA4): only on the public marketing site and the sign-up flow.
// Merchant storefronts, seller dashboards and the admin panel are never tracked (merchant stores have
// their own Tracking Pixels, see trackingPixels.ts). `SiteAnalyticsTracker` drives this; the sign-up
// and onboarding code calls `trackSiteEvent` for the funnel shown in Super Admin → Website visitors.

/** Top-level paths of the public site (PublicLayout) and the sign-up flow. */
const TRACKED_EXACT = new Set([
  '/', '/pricing', '/sellers', '/faq', '/privacy-policy', '/terms-of-service', '/cookie-policy', '/contact-us',
  '/book-demo', '/about', '/security', '/products', '/solutions',
  '/register', '/signup', '/verify-otp', '/onboard', '/login', '/start', '/manuals', '/blog',
]);
const TRACKED_PREFIXES = ['/products/', '/solutions/', '/onboard/', '/blog/'];

export function isTrackedPath(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return TRACKED_EXACT.has(p) || TRACKED_PREFIXES.some(prefix => p.startsWith(prefix));
}

export const CONSENT_KEY = 'solvexo:analytics-consent';
export type ConsentChoice = 'granted' | 'denied';

export function readConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch { return null; }
}

export function saveConsent(choice: ConsentChoice) {
  try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* private mode: asked again next visit */ }
}

let loadedId: string | null = null;
/** Events sent before the tracker decided (config still loading); flushed on load, dropped when not tracking. */
let pending: [SiteEvent, Record<string, string | number>][] = [];
let decided = false;

/** Adds the gtag.js loader once. Page views are sent by hand (`send_page_view: false`) because this is a SPA. */
export function loadGa(measurementId: string) {
  if (loadedId || typeof document === 'undefined') return;
  loadedId = measurementId;
  window.dataLayer = window.dataLayer || [];
  // gtag.js only reads queued commands pushed as the function's own `arguments` object (Google's snippet:
  // `function gtag(){dataLayer.push(arguments);}`). A rest-parameter array is silently ignored, so no hit is ever sent.
  // eslint-disable-next-line prefer-rest-params
  window.gtag = window.gtag || function gtag() { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(s);
  decided = true;
  for (const [name, params] of pending) window.gtag('event', name, params);
  pending = [];
}

/** No tracking for this visitor (no id configured, or consent declined): forget queued events. */
export function skipGa() {
  decided = true;
  pending = [];
}

export const gaLoaded = () => !!loadedId && typeof window.gtag === 'function';

export function trackPageView(pathname: string, search = '') {
  if (!gaLoaded() || !isTrackedPath(pathname)) return;
  window.gtag!('event', 'page_view', {
    page_location: `${window.location.origin}${pathname}${search}`,
    page_path: pathname,
    page_title: document.title,
  });
}

/** Funnel events: sign_up_start (form sent), sign_up (email verified), store_created (onboarding). */
export type SiteEvent = 'sign_up_start' | 'sign_up' | 'store_created';

export function trackSiteEvent(name: SiteEvent, params: Record<string, string | number> = {}) {
  if (gaLoaded()) window.gtag!('event', name, params);
  else if (!decided && pending.length < 20) pending.push([name, params]);
}

/** Test hook. */
export function __resetSiteAnalytics() { loadedId = null; pending = []; decided = false; }
