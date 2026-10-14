import { Link } from 'react-router-dom';
import { useState, useEffect, type FormEvent } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { PaymentBadges } from '../../navigation/FooterParts';
import { readFooterOptions, expandCopyright, mutedOf, visibleFooterBlocks } from '../../navigation/headerOptions';
import { FooterColumns, SocialRow } from '../../navigation/FooterColumns';
import { apiSubmitPrivacyRequest } from '@/api/services/store';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { atelierTheme as t } from '../theme.config';

const POLICY_LABELS: Record<string, string> = {
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  refund_policy: 'Refund Policy',
  shipping_policy: 'Shipping Policy',
};

// lucide-react ships no brand/social icons in this version — every platform
// uses the same generic link glyph rather than pulling in a second icon
// library for this one spot.

/** Theme 01's own footer — dark, editorial. The identity column and
 *  newsletter column stay fixed (store identity / a real functional form,
 *  not nav content); the middle columns are real, merchant-authored
 *  `footer_column`/`social_link`/`copyright_text` blocks (Customize →
 *  Footer) — same block vocabulary every theme's footer content uses. Falls
 *  back to two sensible default columns only when the seller hasn't
 *  configured any footer content yet. */
export function AtelierFooter() {
  const { store, theme } = useStorefront();
  // Same fix as NovaFooter.tsx: `showInFooter`/`policyType` existed on
  // StorePage (editable from Page Settings) with no storefront consumer —
  // this wires those flagged pages into a real legal-links row.
  const [footerPages, setFooterPages] = useState<PublicPageSummary[]>([]);
  // Real Customer-Privacy "Do Not Sell" request tool — CCPA-style, opt-in
  // via `Store.showDoNotSellLink` (Settings → Privacy). A genuine submit
  // action (POST .../privacy-requests), not just a disclosure — the seller
  // sees and resolves each request from that same settings tab.
  const [showDoNotSell, setShowDoNotSell] = useState(false);
  const [dnsEmail, setDnsEmail] = useState('');
  const [dnsStatus, setDnsStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const submitDoNotSell = async (e: FormEvent) => {
    e.preventDefault();
    if (!dnsEmail.trim() || dnsStatus === 'loading') return;
    setDnsStatus('loading');
    try {
      await apiSubmitPrivacyRequest(store.storeId, dnsEmail.trim());
      setDnsStatus('done');
    } catch {
      setDnsStatus('error');
    }
  };
  useEffect(() => {
    apiListPublicStorePages(store.storeId)
      .then(res => setFooterPages(res.data.filter(p => p.showInFooter)))
      .catch(() => setFooterPages([]));
  }, [store.storeId]);

  const footerBlocks = visibleFooterBlocks(theme?.footer);
  const socialBlocks = footerBlocks.filter(b => b.type === 'social_link');
  const brandShowsSocial = footerBlocks.some(b => b.type === 'footer_brand' && b.settings.showSocial !== false);
  const copyrightBlock = footerBlocks.find(b => b.type === 'copyright_text');
  const privacyPage = footerPages.find(p => p.policyType === 'privacy_policy');
  const opts = readFooterOptions(theme?.footer, 'Journal');
  const paymentBlock = footerBlocks.find(b => b.type === 'footer_payment_icons');
  const fg = opts.textColor ?? '#EDE9E1';
  const muted = opts.textColor ? mutedOf(opts.textColor) : '#B8B2A6';
  const faint = opts.textColor ? mutedOf(opts.textColor, 52) : '#8A8477';
  const line = opts.textColor ? mutedOf(opts.textColor, 22) : '#3A362F';
  const partTokens = { fontFamily: t.fonts.body, color: fg, muted, fontSize: '13px' };

  return (
    <>
    <footer style={{ background: opts.bgColor ?? t.colors.ink, color: fg }}>
      <div
        className="mx-auto grid gap-10"
        style={{ maxWidth: t.layout.maxWidth, padding: `${theme?.footer?.footerStyle === 'minimal' ? '32px' : '56px'} ${t.layout.containerPadX}`, gap: theme?.footer?.footerStyle === 'minimal' ? '24px' : '40px', gridTemplateColumns: theme?.footer?.footerStyle === 'minimal' ? 'repeat(auto-fit, minmax(260px, 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        <FooterColumns tokens={{
          fontBody: t.fonts.body, fontDisplay: t.fonts.display, fg, muted, brandWeight: 600, socialPill: false, linkSize: '13px',
          heading: { fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '14px' },
          input: { fontFamily: t.fonts.body, fontSize: '13px', color: fg, border: `1px solid ${line}`, padding: '9px 12px', borderRadius: t.radius.sm },
          button: { fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', color: opts.bgColor ?? t.colors.ink, background: fg, padding: '9px 12px', borderRadius: t.radius.sm },
          buttonUppercase: true, doneColor: t.colors.accent, errorColor: '#E08A83', idPrefix: 'atelier', newsletterHeading: 'Stay in touch', blogLabel: 'Journal',
        }} />
      </div>

      <div style={{ borderTop: `1px solid ${line}` }}>
        <div
          className="mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center"
          style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}` }}
        >
          {!brandShowsSocial && socialBlocks.length > 0 && <SocialRow socials={socialBlocks} k={{ fg, muted, socialPill: false }} />}
          {paymentBlock && <PaymentBadges icons={paymentBlock.settings.icons ?? []} tokens={partTokens} border={line} radius={t.radius.sm} />}
          <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: faint }}>
            {expandCopyright(copyrightBlock?.settings.text || `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`)}
          </p>
          {(footerPages.length > 0 || store.showDoNotSellLink) && (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              {footerPages.map(p => (
                <Link
                  key={p._id}
                  to={`/${p.slug}`}
                  className="no-underline"
                  style={{ fontFamily: t.fonts.body, fontSize: '12px', color: faint }}
                >
                  {(p.policyType && POLICY_LABELS[p.policyType]) || p.title}
                </Link>
              ))}
              {store.showDoNotSellLink && (
                <button
                  type="button"
                  onClick={() => setShowDoNotSell(true)}
                  style={{ fontFamily: t.fonts.body, fontSize: '12px', color: faint, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Do Not Sell My Personal Information
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
    {showDoNotSell && (
      <div
        role="dialog" aria-modal="true"
        onClick={() => setShowDoNotSell(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      >
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', color: t.colors.ink, maxWidth: '420px', width: '100%', borderRadius: '12px', padding: '24px' }}>
          <p style={{ fontFamily: t.fonts.display, fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>Your Privacy Choices</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#5A5852', lineHeight: 1.6, marginBottom: '16px' }}>
            {store.name} does not sell your personal information to third parties. You can still submit a formal request below and we'll confirm it in writing.{privacyPage && (
              <> See our <Link to={`/${privacyPage.slug}`} onClick={() => setShowDoNotSell(false)} style={{ color: t.colors.ink, textDecoration: 'underline' }}>Privacy Policy</Link> for more details.</>
            )}
          </p>
          {dnsStatus === 'done' ? (
            <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#3C7A4B', marginBottom: '16px' }}>Request submitted — thank you.</p>
          ) : (
            <form onSubmit={submitDoNotSell} style={{ marginBottom: '16px' }}>
              <label htmlFor="atelier-dns-email" style={{ display: 'block', fontFamily: t.fonts.body, fontSize: '11.5px', color: '#5A5852', marginBottom: '6px' }}>Your email</label>
              <input
                id="atelier-dns-email"
                type="email"
                required
                value={dnsEmail}
                onChange={e => setDnsEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, width: '100%', boxSizing: 'border-box', border: '1.5px solid #E4E1D6', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}
              />
              <button
                type="submit"
                disabled={dnsStatus === 'loading'}
                style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: t.colors.ink, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: dnsStatus === 'loading' ? 'wait' : 'pointer', opacity: dnsStatus === 'loading' ? 0.7 : 1 }}
              >
                {dnsStatus === 'loading' ? 'Submitting…' : 'Submit Request'}
              </button>
              {dnsStatus === 'error' && <p style={{ fontFamily: t.fonts.body, fontSize: '11.5px', color: '#B3261E', marginTop: '8px' }}>Something went wrong — try again.</p>}
            </form>
          )}
          <button
            type="button"
            onClick={() => setShowDoNotSell(false)}
            style={{ padding: '9px 16px', borderRadius: '8px', border: '1.5px solid #E4E1D6', background: 'transparent', color: t.colors.ink, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    )}
    </>
  );
}
