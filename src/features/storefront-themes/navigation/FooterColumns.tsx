import { Link } from 'react-router-dom';
import { useState, type CSSProperties, type FormEvent } from 'react';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import type { Block } from '@/api/services/storefrontTypes';
import { NavAnchor } from './NavAnchor';
import { SocialIcon, FooterContact } from './FooterParts';
import { readFooterOptions, footerLayoutBlocks, FOOTER_COLUMN_TYPES } from './headerOptions';

export interface FooterColumnTokens {
  fontBody: string;
  fontDisplay: string;
  fg: string;
  muted: string;
  heading: CSSProperties;
  linkSize: string;
  brandWeight: number;
  socialPill: boolean;
  input: CSSProperties;
  button: CSSProperties;
  buttonUppercase: boolean;
  doneColor: string;
  errorColor: string;
  idPrefix: string;
  newsletterHeading: string;
  blogLabel: string;
}

/** Footer blocks that are visible on the storefront, in the retailer's order. */
export function visibleFooterBlocks(footer: Parameters<typeof footerLayoutBlocks>[0]): Block[] {
  return footerLayoutBlocks(footer).filter(b => b.enabled !== false);
}

/** The footer's column area: every column-type block in the order the retailer arranged it. */
export function FooterColumns({ tokens: k }: { tokens: FooterColumnTokens }) {
  const { store, theme, resolveLink } = useStorefront();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const footer = theme?.footer;
  const opts = readFooterOptions(footer, k.blogLabel);
  const blocks = visibleFooterBlocks(footer);
  const socials = blocks.filter(b => b.type === 'social_link');
  const hasColumnBlocks = blocks.some(b => b.type === 'footer_column');
  const footerLogo = opts.logoSource === 'store' ? store.logo : opts.logoSource === 'custom' ? opts.logoUrl : null;
  const body = { fontFamily: k.fontBody, fontSize: '13px', color: k.muted, lineHeight: 1.6 } as const;
  const link = { fontFamily: k.fontBody, fontSize: k.linkSize, color: k.fg } as const;
  const parts = { fontFamily: k.fontBody, color: k.fg, muted: k.muted, fontSize: '13px' };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await apiSubscribeNewsletter(email.trim(), { storeId: store.storeId, source: 'store_footer' });
      setPendingConfirm(!!res.data?.pendingConfirmation);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const defaultColumns = (
    <>
      <div>
        <p style={k.heading}>{opts.shopColumnHeading}</p>
        <div className="flex flex-col gap-2.5">
          <Link to="/#shop" className="no-underline" style={link}>All Products</Link>
          <Link to="/cart" className="no-underline" style={link}>Cart</Link>
          <Link to="/blog" className="no-underline" style={link}>{opts.blogLabel}</Link>
        </div>
      </div>
      <div>
        <p style={k.heading}>{opts.accountColumnHeading}</p>
        <div className="flex flex-col gap-2.5">
          <Link to="/account" className="no-underline" style={link}>My Account</Link>
          <Link to="/login" className="no-underline" style={link}>Sign In</Link>
          {store.contactEmail && <a href={`mailto:${store.contactEmail}`} className="no-underline" style={link}>{store.contactEmail}</a>}
          {store.contactPhone && <a href={`tel:${store.contactPhone}`} className="no-underline" style={link}>{store.contactPhone}</a>}
        </div>
      </div>
    </>
  );

  const columns = blocks.filter(b => FOOTER_COLUMN_TYPES.includes(b.type));
  // The built-in Shop/Account columns stand in for link columns until the retailer adds their own.
  const defaultsAfter = !hasColumnBlocks && opts.showDefaultColumns ? Math.max(0, columns.findIndex(b => b.type === 'footer_brand')) : -1;

  const render = (b: Block, i: number) => {
    const s = b.settings as Record<string, any>;
    const key = b._id ?? `${b.type}-${i}`;
    switch (b.type) {
      case 'footer_brand':
        return (
          <div key={key}>
            {footerLogo
              ? <img src={footerLogo} alt={store.name} style={{ width: opts.logoWidth, maxWidth: '100%', height: 'auto', marginBottom: '10px' }} />
              : <p style={{ fontFamily: k.fontDisplay, fontSize: '20px', fontWeight: k.brandWeight, marginBottom: '10px', color: k.fg }}>{store.name}</p>}
            {s.showTagline !== false && store.tagline && <p style={body}>{store.tagline}</p>}
            {s.text && <p style={{ ...body, marginTop: '10px', whiteSpace: 'pre-line' }}>{s.text}</p>}
            {s.showSocial !== false && socials.length > 0 && <SocialRow socials={socials} k={k} />}
          </div>
        );
      case 'footer_column':
        return (
          <div key={key}>
            <p style={k.heading}>{s.heading}</p>
            <div className="flex flex-col gap-2.5">
              {(s.links ?? []).map((l: StorefrontLinkSettings & { label: string }, j: number) => (
                <NavAnchor key={j} link={resolveLink(l)} className="no-underline" style={link}>{l.label}</NavAnchor>
              ))}
            </div>
          </div>
        );
      case 'footer_text':
        return (
          <div key={key}>
            {s.heading && <p style={k.heading}>{s.heading}</p>}
            <p style={{ ...body, whiteSpace: 'pre-line' }}>{s.text}</p>
          </div>
        );
      case 'footer_contact':
        return (
          <div key={key}>
            <p style={k.heading}>{s.heading || 'Contact'}</p>
            <FooterContact settings={s} tokens={parts} />
          </div>
        );
      case 'footer_image':
        return s.imageUrl ? (
          <div key={key}>
            {s.heading && <p style={k.heading}>{s.heading}</p>}
            <img src={s.imageUrl} alt={s.alt || ''} style={{ width: typeof s.width === 'number' ? s.width : 160, maxWidth: '100%', height: 'auto' }} />
          </div>
        ) : null;
      case 'footer_newsletter':
        return (
          <div key={key}>
            <p style={k.heading}>{s.heading || k.newsletterHeading}</p>
            {s.text && <p style={{ ...body, marginBottom: '10px' }}>{s.text}</p>}
            {status === 'done' ? (
              <p style={{ fontFamily: k.fontBody, fontSize: '13px', color: k.doneColor }}>{pendingConfirm ? 'Almost done — check your inbox to confirm your subscription.' : "Thank you — you're subscribed."}</p>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-2">
                <label htmlFor={`${k.idPrefix}-footer-newsletter-${i}`} className="sr-only">Your email</label>
                <input id={`${k.idPrefix}-footer-newsletter-${i}`} type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Your email" className={`bg-transparent outline-none ${k.idPrefix}-newsletter-input`} style={k.input} />
                <button type="submit" disabled={status === 'loading'} className={`cursor-pointer border-0 disabled:opacity-60 ${k.buttonUppercase ? 'uppercase' : ''}`} style={k.button}>
                  {status === 'loading' ? 'Submitting…' : 'Subscribe'}
                </button>
                {status === 'error' && <p style={{ fontSize: '11px', color: k.errorColor }}>Something went wrong — try again.</p>}
              </form>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {defaultsAfter === -1 || columns.length === 0
        ? (defaultsAfter === -1 ? columns.map(render) : defaultColumns)
        : columns.flatMap((b, i) => (i === defaultsAfter ? [render(b, i), <div key="defaults" style={{ display: 'contents' }}>{defaultColumns}</div>] : [render(b, i)]))}
    </>
  );
}

export function SocialRow({ socials, k }: { socials: Block[]; k: Pick<FooterColumnTokens, 'fg' | 'muted' | 'socialPill'> }) {
  return (
    <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: '16px' }}>
      {socials.map((b, i) => (
        <a key={b._id ?? i} href={b.settings.url as string} target="_blank" rel="noopener noreferrer" aria-label={b.settings.platform as string}
          className="flex items-center justify-center"
          style={k.socialPill
            ? { color: k.fg, width: '32px', height: '32px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)' }
            : { color: k.muted }}>
          <SocialIcon platform={b.settings.platform as string} size={k.socialPill ? 15 : 16} />
        </a>
      ))}
    </div>
  );
}
