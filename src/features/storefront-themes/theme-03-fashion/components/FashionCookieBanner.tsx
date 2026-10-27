import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CookieBannerProps } from '@/features/storefront/CookieConsentBanner';
import { fashionTheme as t } from '../theme.config';

/** Maison cookie banner: same choices and wording as the platform banner (Reject all / Accept all / per-category
 *  preferences) but dressed in the store's own colours, fonts and button shape. Appearance (bar or corner card,
 *  dark / light / brand) still comes from the seller's Customer privacy settings. */
export function FashionCookieBanner({ message, position = 'bottom_bar', colorMode = 'dark', onDecide }: CookieBannerProps) {
  const { t: tr } = useTranslation('storefront');
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const prefsId = useId();
  const corner = position === 'bottom_corner';

  const c = t.colors;
  const palette = colorMode === 'light'
    ? { bg: c.bg, ink: c.ink, muted: c.inkMuted, btnBg: c.accent, btnInk: c.accentInk, line: c.border }
    : colorMode === 'brand'
      ? { bg: c.accent, ink: c.accentInk, muted: c.accentInk, btnBg: c.accentInk, btnInk: c.accent, line: 'rgba(255,255,255,.25)' }
      : { bg: c.ink, ink: c.bg, muted: c.bg, btnBg: c.bg, btnInk: c.ink, line: 'rgba(255,255,255,.2)' };
  const fade = colorMode === 'light' ? 1 : 0.78;

  const btn = (primary: boolean) => ({
    cursor: 'pointer', flexShrink: 0, fontFamily: t.fonts.body, fontSize: 13, fontWeight: 600, lineHeight: 1, padding: '11px 20px',
    borderRadius: t.buttonRadiusPx, background: primary ? palette.btnBg : 'transparent', color: primary ? palette.btnInk : palette.ink,
    border: primary ? '1.5px solid transparent' : `1.5px solid ${palette.line}`,
  } as const);

  return (
    <div role="dialog" aria-label={tr('cookies.manage', 'Manage Preferences')} aria-live="polite"
      style={{
        position: 'fixed', zIndex: 9999, background: palette.bg, color: palette.ink, fontFamily: t.fonts.body,
        ...(corner
          ? { bottom: 16, insetInline: 16, maxWidth: 380, marginInlineStart: 'auto', borderRadius: 24, boxShadow: '0 12px 36px rgba(0,0,0,.22)', border: colorMode === 'light' ? `1px solid ${palette.line}` : 'none' }
          : { bottom: 0, insetInline: 0, boxShadow: '0 -6px 24px rgba(0,0,0,.14)', borderTop: colorMode === 'light' ? `1px solid ${palette.line}` : 'none' }),
      }}>
      <div className="fx-bidi" style={{ padding: corner ? 20 : '16px clamp(16px, 4vw, 40px)', display: 'flex', flexDirection: corner ? 'column' : 'row', flexWrap: 'wrap', alignItems: corner ? 'stretch' : 'center', justifyContent: 'center', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, flex: corner ? undefined : '1 1 280px', minWidth: 0, maxWidth: corner ? undefined : 680, opacity: fade === 1 ? 1 : 0.92 }}>
          {message || tr('cookies.message', 'We use cookies to improve your experience and for analytics. Choose which categories you allow.')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, justifyContent: corner ? 'space-between' : 'flex-end' }}>
          <button type="button" onClick={() => setShowPreferences(s => !s)} aria-expanded={showPreferences} aria-controls={prefsId}
            style={{ cursor: 'pointer', background: 'none', border: 0, padding: '8px 4px', fontFamily: 'inherit', fontSize: 13, color: palette.ink, opacity: fade, textDecoration: 'underline' }}>
            {tr('cookies.manage', 'Manage Preferences')}
          </button>
          <button type="button" onClick={() => onDecide({ analytics: false, marketing: false })} style={btn(false)}>{tr('cookies.rejectAll', 'Reject All')}</button>
          <button type="button" onClick={() => onDecide({ analytics: true, marketing: true })} style={btn(true)}>{tr('cookies.acceptAll', 'Accept All')}</button>
        </div>
      </div>

      {showPreferences && (
        <div id={prefsId} className="fx-bidi" style={{ borderTop: `1px solid ${palette.line}`, padding: corner ? '4px 20px 20px' : '16px clamp(16px, 4vw, 40px) 20px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: corner ? undefined : 680, marginInline: corner ? undefined : 'auto' }}>
          {([
            { key: 'necessary', label: tr('cookies.necessary', 'Necessary'), desc: tr('cookies.necessaryDesc', ' — required for the store to function, always on'), checked: true, locked: true, set: () => undefined },
            { key: 'analytics', label: tr('cookies.analytics', 'Analytics'), desc: tr('cookies.analyticsDesc', ' — helps us understand how visitors use this store'), checked: analytics, locked: false, set: setAnalytics },
            { key: 'marketing', label: tr('cookies.marketing', 'Marketing'), desc: tr('cookies.marketingDesc', ' — used for ads and retargeting on other platforms'), checked: marketing, locked: false, set: setMarketing },
          ]).map(row => (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, fontSize: 13.5, lineHeight: 1.5 }}>
              <span id={`${prefsId}-${row.key}`}><strong style={{ fontWeight: 600 }}>{row.label}</strong><span style={{ opacity: fade }}>{row.desc}</span></span>
              <input type="checkbox" checked={row.checked} disabled={row.locked} onChange={e => row.set(e.target.checked)} aria-labelledby={`${prefsId}-${row.key}`}
                style={{ width: 18, height: 18, flexShrink: 0, accentColor: palette.btnBg, cursor: row.locked ? 'default' : 'pointer' }} />
            </div>
          ))}
          <button type="button" onClick={() => onDecide({ analytics, marketing })} style={{ ...btn(true), alignSelf: 'flex-end' }}>{tr('cookies.save', 'Save Preferences')}</button>
        </div>
      )}
    </div>
  );
}
