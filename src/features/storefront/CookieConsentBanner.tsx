import { useState } from 'react';
import type { CookieConsentCategories } from '@/utils/trackingPixels';

const DEFAULT_MESSAGE = 'We use cookies to improve your experience and for analytics. Choose which categories you allow.';

export type CookieBannerPosition = 'bottom_bar' | 'bottom_corner';
export type CookieBannerColorMode = 'dark' | 'light' | 'brand';

interface Palette { bg: string; text: string; textMuted: string; buttonBg: string; buttonText: string; border: string }

function resolvePalette(colorMode: CookieBannerColorMode, brandColor: string): Palette {
  if (colorMode === 'light') {
    return { bg: '#FFFFFF', text: '#141413', textMuted: '#68665F', buttonBg: '#141413', buttonText: '#FFFFFF', border: 'rgba(0,0,0,0.1)' };
  }
  if (colorMode === 'brand') {
    return { bg: brandColor, text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.75)', buttonBg: '#FFFFFF', buttonText: brandColor, border: 'rgba(255,255,255,0.2)' };
  }
  return { bg: '#1a1917', text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.75)', buttonBg: '#FFFFFF', buttonText: '#1a1917', border: 'rgba(255,255,255,0.15)' };
}

/** Real Shopify-style "Customer Privacy" cookie-consent banner — shown only
 *  when the seller has opted in (`Store.cookieBannerEnabled`, see
 *  `StorefrontLayout.tsx`'s consent-gating effect). Genuine per-category
 *  consent, not a single "Accept" button: Necessary is always on (nothing
 *  to ask — no cookie in this app is itself a tracking cookie, only the
 *  ad-platform SCRIPTS this banner gates are), Analytics/Marketing are each
 *  real, separately-consentable, and separately enforced by
 *  `loadPixelScripts()` (Google Analytics → analytics; Facebook/Google Ads/
 *  TikTok → marketing). `position`/`colorMode` are purely cosmetic (real
 *  Shopify-equivalent appearance controls, see `Store.cookieBannerPosition`/
 *  `cookieBannerColorMode`'s own schema doc comment) — neither changes any
 *  consent/enforcement behavior above. */
export function CookieConsentBanner({
  message, position = 'bottom_bar', colorMode = 'dark', brandColor = '#D97757', onDecide,
}: {
  message: string | null;
  position?: CookieBannerPosition;
  colorMode?: CookieBannerColorMode;
  brandColor?: string;
  onDecide: (consent: CookieConsentCategories) => void;
}) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const p = resolvePalette(colorMode, brandColor);
  const isCorner = position === 'bottom_corner';

  return (
    <div
      className={isCorner ? 'fixed z-[9999] bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] rounded-2xl overflow-hidden' : 'fixed bottom-0 inset-x-0 z-[9999]'}
      style={{ background: p.bg, color: p.text, boxShadow: isCorner ? '0 8px 28px rgba(0,0,0,0.22)' : '0 -4px 16px rgba(0,0,0,0.15)' }}
    >
      <div className={isCorner ? 'p-4 flex flex-col gap-3' : 'px-4 py-3 flex flex-wrap items-center justify-center gap-3'}>
        <p className={isCorner ? 'text-[12.5px]' : 'text-[12.5px] flex-1 min-w-0 max-w-[640px]'} style={{ color: p.text, opacity: 0.92 }}>
          {message || DEFAULT_MESSAGE}
        </p>
        <div className={isCorner ? 'flex items-center justify-between gap-3' : 'flex items-center gap-3 shrink-0'}>
          <button
            type="button"
            onClick={() => setShowPreferences(s => !s)}
            className="text-[12px] bg-transparent border-none cursor-pointer underline"
            style={{ color: p.textMuted }}
          >
            Manage Preferences
          </button>
          <button
            type="button"
            onClick={() => onDecide({ analytics: true, marketing: true })}
            className="px-4 py-2 rounded-lg text-[12.5px] font-semibold border-none cursor-pointer shrink-0"
            style={{ background: p.buttonBg, color: p.buttonText }}
          >
            Accept All
          </button>
        </div>
      </div>

      {showPreferences && (
        <div className={isCorner ? 'px-4 pb-4 flex flex-col gap-3' : 'px-4 py-4 mx-auto max-w-[640px] flex flex-col gap-3'} style={{ borderTop: `1px solid ${p.border}` }}>
          <label className="flex items-center justify-between gap-3 text-[12.5px]">
            <span>
              <span className="font-semibold">Necessary</span>
              <span style={{ color: p.textMuted }}> — required for the store to function, always on</span>
            </span>
            <input type="checkbox" checked disabled className="shrink-0" />
          </label>
          <label className="flex items-center justify-between gap-3 text-[12.5px]">
            <span>
              <span className="font-semibold">Analytics</span>
              <span style={{ color: p.textMuted }}> — helps us understand how visitors use this store</span>
            </span>
            <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="shrink-0" />
          </label>
          <label className="flex items-center justify-between gap-3 text-[12.5px]">
            <span>
              <span className="font-semibold">Marketing</span>
              <span style={{ color: p.textMuted }}> — used for ads and retargeting on other platforms</span>
            </span>
            <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="shrink-0" />
          </label>
          <button
            type="button"
            onClick={() => onDecide({ analytics, marketing })}
            className="self-end px-4 py-[7px] rounded-lg text-[12px] font-semibold border-none cursor-pointer"
            style={{ background: p.buttonBg, color: p.buttonText }}
          >
            Save Preferences
          </button>
        </div>
      )}
    </div>
  );
}
