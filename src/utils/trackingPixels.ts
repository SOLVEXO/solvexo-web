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

export type PixelEventName = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

/** One product line of an event — what the ad platforms need to match it to your product catalog. */
export interface PixelItem {
  /** The PRODUCT id (never an order id): this is what Meta / TikTok / Google match against the catalog feed. */
  id:        string;
  name?:     string;
  price?:    number;
  quantity?: number;
}

export interface PixelEventParams {
  value?:       number;
  currency?:    string;
  contentIds?:  string[];
  contentName?: string;
  numItems?:    number;
  items?:       PixelItem[];
  /** Purchase: the order number(s), so Google Analytics can de-duplicate a reloaded confirmation page. */
  transactionId?: string;
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

// Strict per-provider id formats (mirrors the backend DTO). Ids end up inside
// script source / URLs, so anything outside these alphabets is dropped.
export const PIXEL_ID_PATTERNS = {
  facebookPixelId: /^\d{5,20}$/,
  googleAnalyticsId: /^(?:G|GT)-[A-Za-z0-9]{4,20}$/,
  googleAdsId: /^AW-\d{5,15}$/,
  googleAdsConversionLabel: /^[A-Za-z0-9_-]{4,64}$/,
  tiktokPixelId: /^[A-Za-z0-9]{10,30}$/,
} as const;

function validPixelId(kind: keyof typeof PIXEL_ID_PATTERNS, value: string | null | undefined): string | null {
  return typeof value === 'string' && PIXEL_ID_PATTERNS[kind].test(value.trim()) ? value.trim() : null;
}

/** Returns a copy of the settings with every malformed id nulled out. */
export function sanitizePixelIds(settings: TrackingPixelIds): TrackingPixelIds {
  return {
    facebookPixelId: validPixelId('facebookPixelId', settings.facebookPixelId),
    googleAnalyticsId: validPixelId('googleAnalyticsId', settings.googleAnalyticsId),
    googleAdsId: validPixelId('googleAdsId', settings.googleAdsId),
    googleAdsConversionLabel: validPixelId('googleAdsConversionLabel', settings.googleAdsConversionLabel),
    tiktokPixelId: validPixelId('tiktokPixelId', settings.tiktokPixelId),
  };
}

let activeSettings: TrackingPixelIds | null = null;
let activeConsent: CookieConsentCategories = { analytics: true, marketing: true };
// Which Google ids have been configured on the loaded gtag.js (it can be loaded for analytics first, ads later).
const gtagConfigured = { analytics: false, ads: false };

/** Injects the base script for each connected platform whose CATEGORY is
 *  consented. Real Analytics/Marketing split, not cosmetic: Google Analytics
 *  only loads under `consent.analytics`; Facebook/Google Ads/TikTok (all
 *  ad-retargeting platforms) only load under `consent.marketing`. Safe to
 *  call on every storefront page load and every time the visitor's consent
 *  changes: each platform is only ever injected once, and a platform that
 *  was not allowed yet (visitor first accepted analytics only) is loaded the
 *  moment its category is accepted later. Does not itself fire PageView;
 *  call `trackPixelEvent('PageView')` right after this returns. */
export function loadPixelScripts(rawSettings: TrackingPixelIds, consent: CookieConsentCategories = { analytics: true, marketing: true }): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const settings = sanitizePixelIds(rawSettings);
  activeSettings = settings;
  activeConsent = consent;

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
  const loaderId = analyticsId || adsId;
  if (!loaderId) return;

  if (!document.getElementById('solvexo-ga-pixel')) {
    gtagConfigured.analytics = false;
    gtagConfigured.ads = false;
    const script = document.createElement('script');
    script.id = 'solvexo-ga-pixel';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(loaderId)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    // gtag.js only reads queued commands pushed as the function's own `arguments` object (Google's snippet:
    // `function gtag(){dataLayer.push(arguments);}`). A rest-parameter array is silently ignored, so no hit is ever sent.
    // eslint-disable-next-line prefer-rest-params
    window.gtag = window.gtag || function gtag() { window.dataLayer!.push(arguments); };
    window.gtag('js', new Date());
  }
  // Each id is configured once, whenever its consent category becomes available.
  if (analyticsId && !gtagConfigured.analytics) { window.gtag!('config', analyticsId, { send_page_view: false }); gtagConfigured.analytics = true; }
  if (adsId && !gtagConfigured.ads) { window.gtag!('config', adsId); gtagConfigured.ads = true; }
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
      ttq.load(${JSON.stringify(pixelId)});
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
}

const FB_EVENT: Record<PixelEventName, string> = { PageView: 'PageView', ViewContent: 'ViewContent', AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout', Purchase: 'Purchase' };
const GA_EVENT: Record<PixelEventName, string> = { PageView: 'page_view', ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout', Purchase: 'purchase' };
const TT_EVENT: Record<Exclude<PixelEventName, 'PageView'>, string> = { ViewContent: 'ViewContent', AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout', Purchase: 'CompletePayment' };

/** Fires a real event on every ad platform the seller has connected an id
 *  for; a no-op on any platform whose script never loaded (id not set, or
 *  `loadPixelScripts` hasn't run yet on this page). */
export function trackPixelEvent(eventName: PixelEventName, params: PixelEventParams = {}): void {
  if (typeof window === 'undefined') return;

  const ids = params.items?.map(i => i.id) ?? params.contentIds;

  if (window.fbq) {
    window.fbq('track', FB_EVENT[eventName], {
      value: params.value,
      currency: params.currency,
      content_ids: ids,
      content_type: ids ? 'product' : undefined,
      content_name: params.contentName,
      num_items: params.numItems,
      contents: params.items?.map(i => ({ id: i.id, quantity: i.quantity ?? 1, item_price: i.price })),
    });
  }

  if (window.gtag) {
    // GA4 wants item OBJECTS (item_id, item_name, price, quantity) — a list of bare id strings is ignored.
    const gaItems = params.items
      ? params.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 }))
      : ids?.map(id => ({ item_id: id }));
    window.gtag('event', GA_EVENT[eventName], {
      value: params.value,
      currency: params.currency,
      items: gaItems,
      ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
    });
    if (eventName === 'Purchase' && activeConsent.marketing && activeSettings?.googleAdsId && activeSettings?.googleAdsConversionLabel) {
      window.gtag('event', 'conversion', {
        send_to: `${activeSettings.googleAdsId}/${activeSettings.googleAdsConversionLabel}`,
        value: params.value,
        currency: params.currency,
        ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
      });
    }
  }

  if (window.ttq) {
    if (eventName === 'PageView') {
      window.ttq.page();
    } else {
      window.ttq.track(TT_EVENT[eventName], {
        value: params.value,
        currency: params.currency,
        content_type: ids ? 'product' : undefined,
        contents: params.items
          ? params.items.map(i => ({ content_id: i.id, content_name: i.name, price: i.price, quantity: i.quantity ?? 1 }))
          : ids?.map(id => ({ content_id: id })),
      });
    }
  }
}
