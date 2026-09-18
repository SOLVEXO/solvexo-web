import { Link } from 'react-router-dom';
import { useState, useEffect, type FormEvent } from 'react';
import { Link2 } from 'lucide-react';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
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
  const { store, theme, resolveLink } = useStorefront();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      await apiSubscribeNewsletter(email.trim());
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const footerBlocks = (theme?.footer?.blocks ?? []).filter(b => b.enabled !== false);
  const columnBlocks = footerBlocks.filter(b => b.type === 'footer_column');
  const socialBlocks = footerBlocks.filter(b => b.type === 'social_link');
  const copyrightBlock = footerBlocks.find(b => b.type === 'copyright_text');
  const privacyPage = footerPages.find(p => p.policyType === 'privacy_policy');

  return (
    <>
    <footer style={{ background: t.colors.ink, color: '#EDE9E1' }}>
      <div
        className="mx-auto grid gap-10"
        style={{ maxWidth: t.layout.maxWidth, padding: `56px ${t.layout.containerPadX}`, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        <div>
          <p style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>{store.name}</p>
          {store.tagline && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#B8B2A6', lineHeight: 1.6 }}>{store.tagline}</p>}
          {socialBlocks.length > 0 && (
            <div className="flex items-center gap-3" style={{ marginTop: '16px' }}>
              {socialBlocks.map((b, i) => (
                <a key={b._id ?? i} href={b.settings.url} target="_blank" rel="noopener noreferrer" aria-label={b.settings.platform} style={{ color: '#B8B2A6' }}>
                  <Link2 size={16} />
                </a>
              ))}
            </div>
          )}
        </div>

        {columnBlocks.length > 0 ? (
          columnBlocks.map((b, i) => (
            <div key={b._id ?? i}>
              <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B8B2A6', marginBottom: '14px' }}>{b.settings.heading}</p>
              <div className="flex flex-col gap-2.5">
                {(b.settings.links ?? []).map((link: StorefrontLinkSettings & { label: string }, j: number) => {
                  const resolved = resolveLink(link);
                  return resolved.to ? (
                    <Link key={j} to={resolved.to} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>{link.label}</Link>
                  ) : (
                    <a key={j} href={resolved.href} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>{link.label}</a>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <>
            <div>
              <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B8B2A6', marginBottom: '14px' }}>Shop</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/#shop" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>All Products</Link>
                <Link to="/cart" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>Cart</Link>
                <Link to="/blog" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>Journal</Link>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B8B2A6', marginBottom: '14px' }}>Account</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/account" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>My Account</Link>
                <Link to="/login" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>Sign In</Link>
                {store.contactEmail && <a href={`mailto:${store.contactEmail}`} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>{store.contactEmail}</a>}
                {store.contactPhone && <a href={`tel:${store.contactPhone}`} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1' }}>{store.contactPhone}</a>}
              </div>
            </div>
          </>
        )}

        <div>
          <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B8B2A6', marginBottom: '14px' }}>Stay in touch</p>
          {status === 'done' ? (
            <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.accent }}>Thank you — you're subscribed.</p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-2">
              <label htmlFor="atelier-footer-newsletter" className="sr-only">Your email</label>
              <input
                id="atelier-footer-newsletter"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                className="bg-transparent outline-none atelier-newsletter-input"
                style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#EDE9E1', border: '1px solid #3A362F', padding: '9px 12px', borderRadius: t.radius.sm }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="cursor-pointer border-0 uppercase disabled:opacity-60"
                style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', color: t.colors.ink, background: '#EDE9E1', padding: '9px 12px', borderRadius: t.radius.sm }}
              >
                {status === 'loading' ? 'Submitting…' : 'Subscribe'}
              </button>
              {status === 'error' && <p style={{ fontSize: '11px', color: '#E08A83' }}>Something went wrong — try again.</p>}
            </form>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #3A362F' }}>
        <div
          className="mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center"
          style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}` }}
        >
          <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: '#8A8477' }}>
            {copyrightBlock?.settings.text || `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`}
          </p>
          {footerPages.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              {footerPages.map(p => (
                <Link
                  key={p._id}
                  to={`/${p.slug}`}
                  className="no-underline"
                  style={{ fontFamily: t.fonts.body, fontSize: '12px', color: '#8A8477' }}
                >
                  {(p.policyType && POLICY_LABELS[p.policyType]) || p.title}
                </Link>
              ))}
              {store.showDoNotSellLink && (
                <button
                  type="button"
                  onClick={() => setShowDoNotSell(true)}
                  style={{ fontFamily: t.fonts.body, fontSize: '12px', color: '#8A8477', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
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
