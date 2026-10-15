import { Link } from 'react-router-dom';
import { useContentLocale } from '@/features/storefront/storefrontMarket';
import { localizeMenuItemLabel } from '@/utils/localize';
import { useTranslation } from 'react-i18next';
import { Fragment, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import type { Block } from '@/api/services/storefrontTypes';
import { NavAnchor } from './NavAnchor';
import { SocialIcon, FooterContact } from './FooterParts';
import { readFooterOptions, visibleFooterBlocks, footerColumnFlex, FOOTER_COLUMN_TYPES } from './headerOptions';

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

type SocialLook = 'plain' | 'circle' | 'square';

function NewsletterForm({ k, id, wide }: { k: FooterColumnTokens; id: string; wide?: boolean }) {
  const { t: tr } = useTranslation('storefront');
  const { store } = useStorefront();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [pendingConfirm, setPendingConfirm] = useState(false);
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
  if (status === 'done') {
    return <p style={{ fontFamily: k.fontBody, fontSize: '13px', color: k.doneColor }}>{pendingConfirm ? tr('footer.pendingConfirm', "Almost done — check your inbox to confirm your subscription.") : tr('footer.subscribed', "Thank you — you're subscribed.")}</p>;
  }
  return (
    <form onSubmit={submit} className={wide ? 'flex flex-col sm:flex-row gap-2 w-full' : 'flex flex-col gap-2'}>
      <label htmlFor={id} className="sr-only">{tr('footer.yourEmail', "Your email")}</label>
      <input id={id} type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder={tr('footer.yourEmail', "Your email")} className={`bg-transparent outline-none ${k.idPrefix}-newsletter-input ${wide ? 'flex-1 min-w-0' : ''}`} style={k.input} />
      <button type="submit" disabled={status === 'loading'} className={`cursor-pointer border-0 disabled:opacity-60 ${k.buttonUppercase ? 'uppercase' : ''}`} style={{ ...k.button, ...(wide ? { paddingLeft: 22, paddingRight: 22 } : {}) }}>
        {status === 'loading' ? tr('footer.submitting', "Submitting…") : tr('footer.subscribe', "Subscribe")}
      </button>
      {status === 'error' && <p style={{ fontSize: '11px', color: k.errorColor }}>{tr('footer.error', "Something went wrong — try again.")}</p>}
    </form>
  );
}

/** A wide email sign-up strip above the footer columns (used when the retailer picks "sign-up on top"). */
export function FooterNewsletterStrip({ tokens: k, maxWidth, padX, line }: { tokens: FooterColumnTokens; maxWidth: string; padX: string; line: string }) {
  const { theme } = useStorefront();
  const opts = readFooterOptions(theme?.footer, k.blogLabel);
  const block = visibleFooterBlocks(theme?.footer).find(b => b.type === 'footer_newsletter');
  if (!opts.newsletterTop || !block) return null;
  const s = block.settings;
  return (
    <div style={{ borderBottom: `1px solid ${line}` }}>
      <div className="mx-auto flex flex-col md:flex-row md:items-center gap-5 md:gap-10" style={{ maxWidth, padding: `36px ${padX}`, textAlign: opts.align }}>
        <div className="md:flex-1 min-w-0">
          <p style={{ fontFamily: k.fontDisplay, fontSize: '22px', fontWeight: k.brandWeight, color: k.fg, marginBottom: s.text ? 6 : 0 }}>{s.heading || k.newsletterHeading}</p>
          {s.text && <p style={{ fontFamily: k.fontBody, fontSize: '14px', color: k.muted, lineHeight: 1.6 }}>{s.text}</p>}
        </div>
        <div className="md:flex-1 min-w-0 md:max-w-[460px]"><NewsletterForm k={k} id={`${k.idPrefix}-footer-newsletter-top`} wide /></div>
      </div>
    </div>
  );
}

export function SocialRow({ socials, k, look, center }: { socials: Block[]; k: Pick<FooterColumnTokens, 'fg' | 'muted' | 'socialPill'>; look?: SocialLook | null; center?: boolean }) {
  const style = look ?? (k.socialPill ? 'circle' : 'plain');
  const box: CSSProperties = style === 'plain'
    ? { color: k.muted }
    : { color: k.fg, width: '34px', height: '34px', borderRadius: style === 'circle' ? '9999px' : '8px', background: 'rgba(255,255,255,0.08)', border: `1px solid color-mix(in srgb, ${k.fg} 18%, transparent)` };
  return (
    <div className={`flex items-center gap-3 flex-wrap ${center ? 'justify-center' : ''}`} style={{ marginTop: '16px' }}>
      {socials.map((b, i) => (
        <a key={b._id ?? i} href={b.settings.url as string} target="_blank" rel="noopener noreferrer" aria-label={b.settings.platform as string}
          className="flex items-center justify-center transition-opacity hover:opacity-75" style={box}>
          <SocialIcon platform={b.settings.platform as string} size={style === 'plain' ? 17 : 15} />
        </a>
      ))}
    </div>
  );
}

/** The footer's column area: every column-type block in the order the retailer arranged it. */
export function FooterColumns({ tokens: k }: { tokens: FooterColumnTokens }) {
  const { store, theme, resolveLink } = useStorefront();
  const { t: tr } = useTranslation('storefront');
  const locale = useContentLocale();
  const [openCols, setOpenCols] = useState<string[]>([]);
  const footer = theme?.footer;
  const opts = readFooterOptions(footer, k.blogLabel);
  const blocks = visibleFooterBlocks(footer);
  const socials = blocks.filter(b => b.type === 'social_link');
  const hasColumnBlocks = blocks.some(b => b.type === 'footer_column');
  const footerLogo = opts.logoSource === 'store' ? store.logo : opts.logoSource === 'custom' ? opts.logoUrl : null;
  const center = opts.align === 'center';
  const body = { fontFamily: k.fontBody, fontSize: '13px', color: k.muted, lineHeight: 1.6 } as const;
  const link = { fontFamily: k.fontBody, fontSize: k.linkSize, color: k.fg } as const;
  const parts = { fontFamily: k.fontBody, color: k.fg, muted: k.muted, fontSize: '13px' };
  const heading: CSSProperties = opts.headingUppercase ? k.heading : { ...k.heading, textTransform: 'none', letterSpacing: 'normal', fontSize: '14px' };

  /** Column heading; on phones (when the retailer allows it) it folds the column open/closed. */
  const fold = (id: string, title: ReactNode, children: ReactNode, key?: string) => {
    if (!opts.mobileAccordion || !title) return <Fragment key={key}>{title && <p style={heading}>{title}</p>}{children}</Fragment>;
    const open = openCols.includes(id);
    return (
      <Fragment key={key}>
        <p className="hidden sm:block" style={heading}>{title}</p>
        <button type="button" aria-expanded={open} onClick={() => setOpenCols(o => (open ? o.filter(x => x !== id) : [...o, id]))}
          className="sm:hidden w-full flex items-center justify-between bg-transparent border-0 cursor-pointer p-0 text-left" style={{ ...heading, marginBottom: open ? heading.marginBottom : 0 }}>
          {title}<ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s ease' }} />
        </button>
        <div className={open ? '' : 'hidden sm:block'}>{children}</div>
      </Fragment>
    );
  };

  const linkList = (items: ReactNode) => <div className={`flex flex-col gap-2.5 ${center ? 'items-center' : ''}`}>{items}</div>;
  const defaultColumns: [string, ReactNode][] = [
    ['d-shop', fold('d-shop', opts.shopColumnHeading, linkList(<>
      <Link to="/#shop" className="no-underline" style={link}>{tr('footer.allProducts', "All Products")}</Link>
      <Link to="/cart" className="no-underline" style={link}>{tr('footer.cart', "Cart")}</Link>
      <Link to="/blog" className="no-underline" style={link}>{opts.blogLabel}</Link>
    </>))],
    ['d-account', fold('d-account', opts.accountColumnHeading, linkList(<>
      <Link to="/account" className="no-underline" style={link}>{tr('footer.myAccount', "My Account")}</Link>
      <Link to="/login" className="no-underline" style={link}>{tr('footer.signIn', "Sign In")}</Link>
      {store.contactEmail && <a href={`mailto:${store.contactEmail}`} className="no-underline" style={link}>{store.contactEmail}</a>}
      {store.contactPhone && <a href={`tel:${store.contactPhone}`} className="no-underline" style={link}>{store.contactPhone}</a>}
    </>))],
  ];

  const content = (b: Block, i: number): ReactNode => {
    const s = b.settings;
    const id = b._id ?? `${b.type}-${i}`;
    switch (b.type) {
      case 'footer_brand':
        return (
          <>
            {footerLogo
              ? <img src={footerLogo} alt={store.name} style={{ width: opts.logoWidth, maxWidth: '100%', height: 'auto', marginBottom: '10px', marginInline: center ? 'auto' : undefined }} />
              : <p style={{ fontFamily: k.fontDisplay, fontSize: '20px', fontWeight: k.brandWeight, marginBottom: '10px', color: k.fg }}>{store.name}</p>}
            {s.showTagline !== false && store.tagline && <p style={body}>{store.tagline}</p>}
            {s.text && <p style={{ ...body, marginTop: '10px', whiteSpace: 'pre-line' }}>{s.text}</p>}
            {s.showSocial !== false && socials.length > 0 && <SocialRow socials={socials} k={k} look={opts.socialStyle} center={center} />}
          </>
        );
      case 'footer_column':
        return fold(id, s.heading, linkList((s.links ?? []).map((l: StorefrontLinkSettings & { label: string; labelTranslations?: Record<string, string | undefined> | null }, j: number) => (
          <NavAnchor key={j} link={resolveLink(l)} className="no-underline transition-opacity hover:opacity-75" style={link}>{localizeMenuItemLabel(l, locale)}</NavAnchor>
        ))));
      case 'footer_text':
        return fold(id, s.heading, <p style={{ ...body, whiteSpace: 'pre-line' }}>{s.text}</p>);
      case 'footer_contact':
        return fold(id, s.heading || 'Contact', <FooterContact settings={s} tokens={parts} />);
      case 'footer_image':
        return s.imageUrl ? (
          <>
            {s.heading && <p style={heading}>{s.heading}</p>}
            <img src={s.imageUrl} alt={s.alt || ''} style={{ width: typeof s.width === 'number' ? s.width : 160, maxWidth: '100%', height: 'auto', marginInline: center ? 'auto' : undefined }} />
          </>
        ) : null;
      case 'footer_newsletter':
        if (opts.newsletterTop) return null;
        return (
          <>
            <p style={heading}>{s.heading || k.newsletterHeading}</p>
            {s.text && <p style={{ ...body, marginBottom: '10px' }}>{s.text}</p>}
            <NewsletterForm k={k} id={`${k.idPrefix}-footer-newsletter-${i}`} />
          </>
        );
      default:
        return null;
    }
  };

  const cell = (key: string, width: unknown, node: ReactNode) => node == null ? null : (
    <div key={key} className="min-w-0 [flex:1_1_100%] sm:[flex:var(--fc)]" style={{ '--fc': footerColumnFlex(width), textAlign: opts.align } as CSSProperties}>{node}</div>
  );

  const columns = blocks.filter(b => FOOTER_COLUMN_TYPES.includes(b.type));
  // The built-in Shop/Account columns stand in for link columns until the retailer adds their own.
  const showDefaults = !hasColumnBlocks && opts.showDefaultColumns;
  const brandAt = columns.findIndex(b => b.type === 'footer_brand');
  const out: ReactNode[] = [];
  columns.forEach((b, i) => {
    out.push(cell(b._id ?? `${b.type}-${i}`, b.settings.width, content(b, i)));
    if (showDefaults && i === Math.max(0, brandAt)) defaultColumns.forEach(([key, node]) => out.push(cell(key, 'auto', node)));
  });
  if (showDefaults && columns.length === 0) defaultColumns.forEach(([key, node]) => out.push(cell(key, 'auto', node)));
  return <>{out}</>;
}
