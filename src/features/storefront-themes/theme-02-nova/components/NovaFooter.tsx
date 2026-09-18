import { Link } from 'react-router-dom';
import { useState, useEffect, type FormEvent } from 'react';
import { Link2 } from 'lucide-react';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { apiSubmitPrivacyRequest } from '@/api/services/store';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { novaTheme as t } from '../theme.config';

const POLICY_LABELS: Record<string, string> = {
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  refund_policy: 'Refund Policy',
  shipping_policy: 'Shipping Policy',
};

/** Theme 02's own footer — bold indigo-tinted panel rather than Atelier's
 *  near-black one, same real functional content: the identity column and
 *  newsletter column stay fixed (store identity / a real functional form);
 *  the middle columns are real, merchant-authored `footer_column`/
 *  `social_link`/`copyright_text` blocks, same shared vocabulary every
 *  theme's footer content uses (see `AtelierFooter`'s own doc comment). */
export function NovaFooter() {
  const { store, theme, resolveLink } = useStorefront();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  // Real, previously-unwired data: `showInFooter`/`policyType` have existed
  // on StorePage (and been editable from Page Settings) with no consumer
  // anywhere — a seller could tag their Privacy Policy page and toggle "Show
  // in footer" and nothing would ever change on the live storefront. This is
  // that missing consumer: any page flagged `showInFooter` (not just
  // policy-tagged ones) gets a real link in a small legal row under the
  // copyright line, same place Shopify puts its auto-linked policies.
  const [footerPages, setFooterPages] = useState<PublicPageSummary[]>([]);
  useEffect(() => {
    apiListPublicStorePages(store.storeId)
      .then(res => setFooterPages(res.data.filter(p => p.showInFooter)))
      .catch(() => setFooterPages([]));
  }, [store.storeId]);
  // Real Customer-Privacy "Do Not Sell" request tool — CCPA-style, opt-in via
  // `Store.showDoNotSellLink` (Settings → Privacy). Same as AtelierFooter's
  // own doc comment: a genuine submit action, not just a disclosure — the
  // seller sees and resolves each request from that same settings tab.
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
    <footer style={{ background: t.colors.ink, color: '#EDEBFF' }}>
      <div
        className="mx-auto grid gap-10"
        style={{ maxWidth: t.layout.maxWidth, padding: `56px ${t.layout.containerPadX}`, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        <div>
          <p style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{store.name}</p>
          {store.tagline && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#ABA6C9', lineHeight: 1.6 }}>{store.tagline}</p>}
          {socialBlocks.length > 0 && (
            <div className="flex items-center gap-3" style={{ marginTop: '16px' }}>
              {socialBlocks.map((b, i) => (
                <a
                  key={b._id ?? i}
                  href={b.settings.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={b.settings.platform}
                  className="flex items-center justify-center"
                  style={{ color: '#EDEBFF', width: '32px', height: '32px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)' }}
                >
                  <Link2 size={15} />
                </a>
              ))}
            </div>
          )}
        </div>

        {columnBlocks.length > 0 ? (
          columnBlocks.map((b, i) => (
            <div key={b._id ?? i}>
              <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ABA6C9', fontWeight: 700, marginBottom: '14px' }}>{b.settings.heading}</p>
              <div className="flex flex-col gap-2.5">
                {(b.settings.links ?? []).map((link: StorefrontLinkSettings & { label: string }, j: number) => {
                  const resolved = resolveLink(link);
                  return resolved.to ? (
                    <Link key={j} to={resolved.to} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>{link.label}</Link>
                  ) : (
                    <a key={j} href={resolved.href} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>{link.label}</a>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <>
            <div>
              <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ABA6C9', fontWeight: 700, marginBottom: '14px' }}>Shop</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/#shop" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>All Products</Link>
                <Link to="/cart" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>Cart</Link>
                <Link to="/blog" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>Stories</Link>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ABA6C9', fontWeight: 700, marginBottom: '14px' }}>Account</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/account" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>My Account</Link>
                <Link to="/login" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>Sign In</Link>
                {store.contactEmail && <a href={`mailto:${store.contactEmail}`} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>{store.contactEmail}</a>}
                {store.contactPhone && <a href={`tel:${store.contactPhone}`} className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF' }}>{store.contactPhone}</a>}
              </div>
            </div>
          </>
        )}

        <div>
          <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ABA6C9', fontWeight: 700, marginBottom: '14px' }}>Stay in the loop</p>
          {status === 'done' ? (
            <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#8B7CFF' }}>Thank you — you're subscribed.</p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-2">
              <label htmlFor="nova-footer-newsletter" className="sr-only">Your email</label>
              <input
                id="nova-footer-newsletter"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                className="bg-transparent outline-none nova-newsletter-input"
                style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: '#EDEBFF', border: '1.5px solid #3A3560', padding: '10px 13px', borderRadius: t.radius.sm }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="cursor-pointer border-0 disabled:opacity-60"
                style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.accentInk, background: t.colors.accent, padding: '10px 13px', borderRadius: '9999px' }}
              >
                {status === 'loading' ? 'Submitting…' : 'Subscribe'}
              </button>
              {status === 'error' && <p style={{ fontSize: '11px', color: '#FF9B8F' }}>Something went wrong — try again.</p>}
            </form>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #2E2A4F' }}>
        <div
          className="mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center"
          style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}` }}
        >
          <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: '#847EA8' }}>
            {copyrightBlock?.settings.text || `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`}
          </p>
          {footerPages.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              {footerPages.map(p => (
                <Link
                  key={p._id}
                  to={`/${p.slug}`}
                  className="no-underline"
                  style={{ fontFamily: t.fonts.body, fontSize: '12px', color: '#ABA6C9' }}
                >
                  {(p.policyType && POLICY_LABELS[p.policyType]) || p.title}
                </Link>
              ))}
              {store.showDoNotSellLink && (
                <button
                  type="button"
                  onClick={() => setShowDoNotSell(true)}
                  style={{ fontFamily: t.fonts.body, fontSize: '12px', color: '#ABA6C9', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
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
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', color: t.colors.ink, maxWidth: '420px', width: '100%', borderRadius: t.radius.md, padding: '24px' }}>
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
              <label htmlFor="nova-dns-email" style={{ display: 'block', fontFamily: t.fonts.body, fontSize: '11.5px', color: '#5A5852', marginBottom: '6px' }}>Your email</label>
              <input
                id="nova-dns-email"
                type="email"
                required
                value={dnsEmail}
                onChange={e => setDnsEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, width: '100%', boxSizing: 'border-box', border: '1.5px solid #E4E1D6', borderRadius: t.radius.sm, padding: '10px 12px', marginBottom: '8px' }}
              />
              <button
                type="submit"
                disabled={dnsStatus === 'loading'}
                style={{ padding: '9px 16px', borderRadius: t.radius.sm, border: 'none', background: t.colors.ink, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: dnsStatus === 'loading' ? 'wait' : 'pointer', opacity: dnsStatus === 'loading' ? 0.7 : 1 }}
              >
                {dnsStatus === 'loading' ? 'Submitting…' : 'Submit Request'}
              </button>
              {dnsStatus === 'error' && <p style={{ fontFamily: t.fonts.body, fontSize: '11.5px', color: '#B3261E', marginTop: '8px' }}>Something went wrong — try again.</p>}
            </form>
          )}
          <button
            type="button"
            onClick={() => setShowDoNotSell(false)}
            style={{ padding: '9px 16px', borderRadius: t.radius.sm, border: `1.5px solid #E4E1D6`, background: 'transparent', color: t.colors.ink, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    )}
    </>
  );
}
