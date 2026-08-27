import { Link } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { atelierTheme as t } from '../theme.config';

/** Theme 01's own footer — dark, editorial, three columns + a newsletter
 *  strip. Independently implemented, no import from the legacy
 *  `StorefrontFooter`. Newsletter reuses the real shared
 *  `apiSubscribeNewsletter` service (legitimate shared infra), not a fake
 *  form. */
export function AtelierFooter() {
  const { store } = useStorefront();
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

  return (
    <footer style={{ background: t.colors.ink, color: '#EDE9E1' }}>
      <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10" style={{ maxWidth: t.layout.maxWidth, padding: `56px ${t.layout.containerPadX}` }}>
        <div>
          <p style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>{store.name}</p>
          {store.tagline && <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: '#B8B2A6', lineHeight: 1.6 }}>{store.tagline}</p>}
        </div>

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
          </div>
        </div>

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
        <p
          className="mx-auto text-center"
          style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}`, fontFamily: t.fonts.body, fontSize: '12px', color: '#8A8477' }}
        >
          © {new Date().getFullYear()} {store.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
