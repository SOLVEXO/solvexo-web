// Ad-platform pixel firing — the client-side half of the Tracking Pixels
// feature (backend: src/tracking-pixels, settings service: api/services/
// trackingPixels.ts). Each platform's script talks straight from the
// buyer's browser to that platform's own servers — there is no Solvexo
// "track event" endpoint in this loop, exactly like a Shopify store's own
// Pixels integration. `loadPixelScripts` is called once by
// `StorefrontLayout` after it resolves which store is being viewed;
// `trackPixelEvent` is called from `CartContext` (AddToCart) and from each
// theme's checkout-return page (Purchase). It is a no-op for any platform
// the seller hasn't connected an id for.

export interface TrackingPixelIds {
  facebookPixelId:          string | null;
  googleAnalyticsId:        string | null;
  googleAdsId:               string | null;
  googleAdsConversionLabel: string | null;
  tiktokPixelId:             string | null;
}

export type PixelEventName = 'PageView' | 'AddToCart' | 'Purchase';

export interface PixelEventParams {
  value?:       number;
  currency?:    string;
  contentIds?:  string[];
  contentName?: string;
  numItems?:    number;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    ttq?: {
      load: (id: string) => void;
      page: () => void;
      track: (event: string, params?: Record<string, unknown>) => void;
      [key: string]: unknown;
    };
  }
}

/** Real Customer-Privacy consent categories (Shopify's own cookie-banner
 *  "Manage Preferences" model — Necessary is always on/never asked about;
 *  Analytics and Marketing are the two real, separately-consentable
 *  buckets, and every pixel below is mapped to exactly one). Callers that
 *  never enabled the cookie banner (or a store where it's disabled) pass
 *  `{ analytics: true, marketing: true }` — the old unconditional behavior. */
export interface CookieConsentCategories {
  analytics: boolean;
  marketing: boolean;
}

let loadedForSession = false;
let activeSettings: TrackingPixelIds | null = null;
let activeConsent: CookieConsentCategories = { analytics: true, marketing: true };

/** Injects the base script for each connected platform whose CATEGORY is
 *  consented, once per page session. Real Analytics/Marketing split, not
 *  cosmetic: Google Analytics only loads under `consent.analytics`;
 *  Facebook/Google Ads/TikTok (all ad-retargeting platforms) only load
 *  under `consent.marketing`. Safe to call on every storefront page load —
 *  guarded so a second call (e.g. a client-side route change re-mounting
 *  the layout) never double-injects. Does not itself fire PageView; call
 *  `trackPixelEvent('PageView')` right after this returns. */
export function loadPixelScripts(settings: TrackingPixelIds, consent: CookieConsentCategories = { analytics: true, marketing: true }): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  activeSettings = settings;
  activeConsent = consent;
  if (loadedForSession) return;
  loadedForSession = true;

  if (consent.marketing && settings.facebookPixelId) {
    injectFacebookPixel(settings.facebookPixelId);
  }
  const analyticsId = consent.analytics ? settings.googleAnalyticsId : null;
  const adsId = consent.marketing ? settings.googleAdsId : null;
  if (analyticsId || adsId) {
    injectGoogleGtag(analyticsId, adsId);
  }
  if (consent.marketing && settings.tiktokPixelId) {
    injectTikTokPixel(settings.tiktokPixelId);
  }
}

function injectFacebookPixel(pixelId: string): void {
  if (document.getElementById('solvexo-fb-pixel')) return;

  window.fbq = window.fbq || function fbqStub(...args: unknown[]) {
    (fbqStub as unknown as { callQueue: unknown[][] }).callQueue = (fbqStub as unknown as { callQueue: unknown[][] }).callQueue || [];
    (fbqStub as unknown as { callQueue: unknown[][] }).callQueue.push(args);
  };
  window._fbq = window._fbq || window.fbq;

  const script = document.createElement('script');
  script.id = 'solvexo-fb-pixel';
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
}

function injectGoogleGtag(analyticsId: string | null, adsId: string | null): void {
  if (document.getElementById('solvexo-ga-pixel')) return;
  const loaderId = analyticsId || adsId;
  if (!loaderId) return;

  const script = document.createElement('script');
  script.id = 'solvexo-ga-pixel';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(loaderId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer!.push(args); };
  window.gtag('js', new Date());
  if (analyticsId) window.gtag('config', analyticsId, { send_page_view: false });
  if (adsId) window.gtag('config', adsId);
}

function injectTikTokPixel(pixelId: string): void {
  if (document.getElementById('solvexo-tt-pixel') || window.ttq) return;

  const script = document.createElement('script');
  script.id = 'solvexo-tt-pixel';
  script.async = true;
  // Standard TikTok Pixel base-code loader, scoped to just this pixel id —
  // the seller's own id from Tracking Pixel Settings, not a Solvexo id.
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) { var e = ttq._i[t] || []; for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
      ttq.load = function (e, n) {
        var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i;
        ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
        ttq._o = ttq._o || {}; ttq._o[e] = n || {};
        var o = d.createElement("script"); o.type = "text/javascript"; o.async = true; o.src = i + "?sdkid=" + e + "&lib=" + t;
        var a = d.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a);
      };
      ttq.load('${pixelId}');
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
}

const FB_EVENT: Record<PixelEventName, string> = { PageView: 'PageView', AddToCart: 'AddToCart', Purchase: 'Purchase' };
const GA_EVENT: Record<PixelEventName, string> = { PageView: 'page_view', AddToCart: 'add_to_cart', Purchase: 'purchase' };
const TT_EVENT: Record<PixelEventName, string> = { PageView: 'ViewContent', AddToCart: 'AddToCart', Purchase: 'CompletePayment' };

/** Fires a real event on every ad platform the seller has connected an id
 *  for; a no-op on any platform whose script never loaded (id not set, or
 *  `loadPixelScripts` hasn't run yet on this page). */
export function trackPixelEvent(eventName: PixelEventName, params: PixelEventParams = {}): void {
  if (typeof window === 'undefined') return;

  if (window.fbq) {
    window.fbq('track', FB_EVENT[eventName], {
      value: params.value,
      currency: params.currency,
      content_ids: params.contentIds,
      content_name: params.contentName,
      num_items: params.numItems,
    });
  }

  if (window.gtag) {
    window.gtag('event', GA_EVENT[eventName], {
      value: params.value,
      currency: params.currency,
      items: params.contentIds,
    });
    if (eventName === 'Purchase' && activeConsent.marketing && activeSettings?.googleAdsId && activeSettings?.googleAdsConversionLabel) {
      window.gtag('event', 'conversion', {
        send_to: `${activeSettings.googleAdsId}/${activeSettings.googleAdsConversionLabel}`,
        value: params.value,
        currency: params.currency,
      });
    }
  }

  if (window.ttq) {
    window.ttq.track(TT_EVENT[eventName], {
      value: params.value,
      currency: params.currency,
      content_id: params.contentIds?.[0],
      contents: params.contentIds?.map(id => ({ content_id: id })),
    });
  }
}
