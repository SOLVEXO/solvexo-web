import { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { CookieBannerProps } from '@/features/storefront/CookieConsentBanner';
import { ledupTheme as t } from '../theme.config';

/** Consent banner in the Ledup look: dark bar or corner card. Same consent behaviour as the platform banner (Necessary always on; Analytics and Marketing are separate choices). */
export function LedupCookieBanner({ message, position = 'bottom_bar', onDecide }: CookieBannerProps) {
  const { t: tr } = useTranslation('storefront');
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const prefsId = useId();
  const corner = position === 'bottom_corner';

  const ghost = 'cursor-pointer rounded-full border border-stone-600 bg-transparent px-4 py-2 text-xs font-medium text-stone-300 transition hover:bg-stone-800 hover:text-white';
  const solid = 'cursor-pointer rounded-full border-0 bg-[#8C7355] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#796247]';

  const rows = [
    { key: 'necessary', label: tr('cookies.necessary', 'Necessary'), desc: tr('cookies.necessaryDesc', ' — required for the store to function, always on'), checked: true, locked: true, set: () => {} },
    { key: 'analytics', label: tr('cookies.analytics', 'Analytics'), desc: tr('cookies.analyticsDesc', ' — helps us understand how visitors use this store'), checked: analytics, locked: false, set: setAnalytics },
    { key: 'marketing', label: tr('cookies.marketing', 'Marketing'), desc: tr('cookies.marketingDesc', ' — used for ads and retargeting on other platforms'), checked: marketing, locked: false, set: setMarketing },
  ];

  return (
    <div
      role="dialog"
      aria-label={tr('cookies.manage', 'Manage Preferences')}
      className={`fixed z-[9999] bg-stone-900 text-white shadow-2xl ${corner ? 'bottom-4 end-4 max-w-sm rounded-2xl border border-stone-800 p-6' : 'inset-x-0 bottom-0 border-t border-stone-800 p-4 sm:px-8'}`}
      style={{ fontFamily: t.fonts.body }}
    >
      <div className={`flex items-center justify-between gap-4 ${corner ? 'flex-col items-stretch' : 'flex-col sm:flex-row'}`}>
        <p className="m-0 max-w-2xl text-xs leading-relaxed text-stone-300 sm:text-sm">
          {message || tr('cookies.message', 'We use cookies to improve your experience and for analytics. Choose which categories you allow.')}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button type="button" aria-expanded={showPreferences} aria-controls={prefsId} onClick={() => setShowPreferences(v => !v)} className={ghost}>{tr('cookies.manage', 'Manage Preferences')}</button>
          <button type="button" onClick={() => onDecide({ analytics: false, marketing: false })} className={ghost}>{tr('cookies.rejectAll', 'Reject All')}</button>
          <button type="button" onClick={() => onDecide({ analytics: true, marketing: true })} className={solid}>{tr('cookies.acceptAll', 'Accept All')}</button>
        </div>
      </div>
      {showPreferences && (
        <div id={prefsId} className="mt-4 flex flex-col gap-3 border-t border-stone-800 pt-4">
          {rows.map(r => (
            <label key={r.key} className="flex items-start gap-3 text-xs text-stone-300">
              <input type="checkbox" checked={r.checked} disabled={r.locked} onChange={e => r.set(e.target.checked)} className="mt-0.5 accent-[#8C7355]" />
              <span><strong className="text-white">{r.label}</strong>{r.desc}</span>
            </label>
          ))}
          <button type="button" onClick={() => onDecide({ analytics, marketing })} className={`${solid} self-end`}>{tr('cookies.save', 'Save Preferences')}</button>
        </div>
      )}
    </div>
  );
}
