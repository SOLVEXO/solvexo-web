import { Link } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { Link2 } from 'lucide-react';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { novaTheme as t } from '../theme.config';

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

  return (
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
        <p
          className="mx-auto text-center"
          style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}`, fontFamily: t.fonts.body, fontSize: '12px', color: '#847EA8' }}
        >
          {copyrightBlock?.settings.text || `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
