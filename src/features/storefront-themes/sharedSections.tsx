import { useEffect, useMemo, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { tt } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { apiSubmitContactMessage } from '@/api/services/storeContact';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useProductPage } from './productContext';
import { renderRichText } from '@/utils/richText';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { PreviewBlock } from './previewInspector';
import { imageFit, focalOf } from './imageFit';
import { copyText } from './sectionCopy';

// Theme-agnostic implementations of the Shopify-parity section library
// (multicolumn, logo_list, marquee, custom_html, image_banner). Each theme
// registers these through its own registry, passing its own design tokens +
// button, so one implementation looks native in every theme and a new theme
// gets all five by adding five one-line registrations.

export interface SharedThemeTokens {
  fonts: { display: string; body: string };
  layout: { maxWidth: string; sectionPadY: string; containerPadX: string };
  imageRadiusPx: string;
  Button: ComponentType<{ variant?: 'primary' | 'outline'; children?: ReactNode }>;
  /** The theme's own product card — used by sections that list products. */
  ProductCard?: ComponentType<{ product: PublicStoreProduct; currency: string }>;
}
export interface SharedColors { bg: string; bgAlt: string; ink: string; inkMuted: string; border: string; accent: string }

interface Props { section: Section; blocks: Block[]; colors: SharedColors; theme: SharedThemeTokens }

function useCta() {
  const { resolveLink } = useStorefront();
  return resolveLink;
}

export function CtaButton({ text, link, theme, variant = 'outline' }: { text?: string; link?: any; theme: SharedThemeTokens; variant?: 'primary' | 'outline' }) {
  const resolveLink = useCta();
  if (!text || !link) return null;
  const target = resolveLink(link);
  const B = theme.Button;
  return target.to
    ? <Link to={target.to} className="no-underline"><B variant={variant}>{text}</B></Link>
    : <a href={target.href} className="no-underline"><B variant={variant}>{text}</B></a>;
}

export function Heading({ text, theme, colors, align }: { text?: string; theme: SharedThemeTokens; colors: SharedColors; align?: CSSProperties['textAlign'] }) {
  if (!text) return null;
  return <h2 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: colors.ink, textAlign: align, marginBottom: '28px' }}>{text}</h2>;
}

// ── Multicolumn ─────────────────────────────────────────────────────────────
function Column({ block, colors, theme, ratio, align }: { block: Block; colors: SharedColors; theme: SharedThemeTokens; ratio: unknown; align: 'left' | 'center' }) {
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const fit = imageFit(ratio, '4 / 3');
  return (
    <div style={{ textAlign: align }}>
      {s.imageUrl && !errored && (
        <div style={{ ...fit.box, background: colors.bgAlt, borderRadius: theme.imageRadiusPx, overflow: 'hidden', marginBottom: '16px' }}>
          <img src={s.imageUrl} alt={s.heading ?? ''} loading="lazy" onError={() => setErrored(true)} style={fit.img} />
        </div>
      )}
      {s.heading && <h3 style={{ fontFamily: theme.fonts.display, fontSize: '19px', fontWeight: 600, color: colors.ink, marginBottom: '8px' }}>{s.heading}</h3>}
      {s.body && <p style={{ fontFamily: theme.fonts.body, fontSize: '14px', color: colors.inkMuted, lineHeight: 1.7, marginBottom: s.ctaText ? '16px' : 0 }}>{renderRichText(s.body)}</p>}
      <CtaButton text={s.ctaText} link={s.ctaLink} theme={theme} />
    </div>
  );
}

export function MulticolumnSection({ section, blocks, colors, theme }: Props) {
  if (blocks.length === 0) return null;
  const cols = [1, 2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : Math.min(blocks.length, 3);
  const align = section.settings.textAlign === 'center' ? 'center' : 'left';
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} align={align} />
        <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
          {blocks.map((b, i) => (
            <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
              <Column block={b} colors={colors} theme={theme} ratio={section.settings.imageRatio} align={align} />
            </PreviewBlock>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Logo list ───────────────────────────────────────────────────────────────
function Logo({ block, height, grayscale }: { block: Block; height: number; grayscale: boolean }) {
  const resolveLink = useCta();
  const s = block.settings;
  if (!s.imageUrl) return null;
  const img = <img src={s.imageUrl} alt={s.alt ?? ''} loading="lazy" style={{ height, width: 'auto', maxWidth: '180px', objectFit: 'contain', filter: grayscale ? 'grayscale(1)' : undefined, opacity: grayscale ? 0.7 : 1 }} />;
  if (!s.link) return img;
  const target = resolveLink(s.link);
  return target.to ? <Link to={target.to}>{img}</Link> : <a href={target.href}>{img}</a>;
}

export function LogoListSection({ section, blocks, colors, theme }: Props) {
  if (blocks.length === 0) return null;
  const height = Number(section.settings.logoHeight) || 48;
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} align="center" />
        <div className="flex flex-wrap items-center justify-center" style={{ gap: '28px 48px' }}>
          {blocks.map((b, i) => (
            <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
              <Logo block={b} height={height} grayscale={section.settings.grayscale !== false} />
            </PreviewBlock>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Marquee (scrolling announcement text) ───────────────────────────────────
const MARQUEE_SECONDS = { slow: 40, medium: 25, fast: 12 } as const;

export function MarqueeSection({ section, blocks, colors, theme }: Props) {
  const resolveLink = useCta();
  if (blocks.length === 0) return null;
  const speed = MARQUEE_SECONDS[section.settings.speed as keyof typeof MARQUEE_SECONDS] ?? MARQUEE_SECONDS.medium;
  const reverse = section.settings.direction === 'right';
  const pause = section.settings.pauseOnHover !== false;
  const items = blocks.map((b, i) => {
    const text = <span style={{ fontFamily: theme.fonts.body, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap' }}>{b.settings.text}</span>;
    const target = b.settings.link ? resolveLink(b.settings.link) : null;
    const inner = !target ? text : target.to ? <Link to={target.to} className="no-underline">{text}</Link> : <a href={target.href} className="no-underline">{text}</a>;
    return <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}><span className="inline-flex items-center" style={{ gap: '40px', paddingRight: '40px' }}>{inner}<span aria-hidden style={{ color: colors.accent }}>✦</span></span></PreviewBlock>;
  });
  const id = `mq-${String(section._id ?? 'x')}`;
  return (
    <div className={id} style={{ background: colors.bgAlt, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, overflow: 'hidden', padding: '14px 0' }}>
      <style>{`
        .${id} .mq-track{display:flex;width:max-content;animation:mq-scroll ${speed}s linear infinite;animation-direction:${reverse ? 'reverse' : 'normal'}}
        ${pause ? `.${id}:hover .mq-track{animation-play-state:paused}` : ''}
        @keyframes mq-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @media (prefers-reduced-motion:reduce){.${id} .mq-track{animation:none}}
      `}</style>
      <div className="mq-track">
        <div className="flex">{items}{items}</div>
        <div className="flex" aria-hidden>{items}{items}</div>
      </div>
    </div>
  );
}

// ── Custom HTML ─────────────────────────────────────────────────────────────
export function CustomHtmlSection({ section, theme }: Props) {
  const html = useMemo(() => sanitizeHtml(String(section.settings.html ?? '')), [section.settings.html]);
  if (!html) return null;
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// ── Image banner ────────────────────────────────────────────────────────────
const BANNER_HEIGHT = { small: '320px', medium: '480px', large: '640px' } as const;

export function ImageBannerSection({ section, colors, theme }: Props) {
  const s = section.settings;
  const [errored, setErrored] = useState(false);
  if (!s.imageUrl && !s.heading && !s.subheading) return null;
  const adapt = s.heightPreset === 'adapt' && s.imageUrl;
  const textColor = s.textColor || (s.imageUrl ? '#FFFFFF' : colors.ink);
  const align = s.contentAlign === 'center' ? 'center' : s.contentAlign === 'right' ? 'right' : 'left';
  const justify = s.contentPosition === 'top' ? 'flex-start' : s.contentPosition === 'bottom' ? 'flex-end' : 'center';
  const alignItems = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  const overlay = Math.min(80, Math.max(0, Number(s.overlayOpacity ?? 30)));
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: colors.bgAlt, minHeight: adapt ? undefined : BANNER_HEIGHT[s.heightPreset as keyof typeof BANNER_HEIGHT] ?? BANNER_HEIGHT.medium }}>
      {s.imageUrl && !errored && (
        <img src={s.imageUrl} alt="" onError={() => setErrored(true)}
          style={adapt ? { display: 'block', width: '100%', height: 'auto' } : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: focalOf(s.focalPoint) }} />
      )}
      {s.imageUrl && overlay > 0 && <div aria-hidden style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlay / 100})` }} />}
      <div style={{ position: adapt ? 'absolute' : 'relative', inset: adapt ? 0 : undefined, minHeight: adapt ? undefined : 'inherit', display: 'flex', flexDirection: 'column', justifyContent: justify, alignItems, textAlign: align, gap: '14px', padding: `48px ${theme.layout.containerPadX}`, color: textColor }}>
        <div style={{ width: '100%', maxWidth: theme.layout.maxWidth, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems, gap: '14px' }}>
          {s.heading && <h2 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 600, lineHeight: 1.1, maxWidth: '720px' }}>{s.heading}</h2>}
          {s.subheading && <p style={{ fontFamily: theme.fonts.body, fontSize: '16px', lineHeight: 1.6, maxWidth: '560px', opacity: 0.92 }}>{s.subheading}</p>}
          <CtaButton text={s.ctaText} link={s.ctaLink} theme={theme} variant="primary" />
        </div>
      </div>
    </div>
  );
}

// ── Collection list ("shop by collection") ──────────────────────────────────
function CollectionTile({ c, colors, theme, ratio, showDescription }: {
  c: PublicCollectionSummary; colors: SharedColors; theme: SharedThemeTokens; ratio: unknown; showDescription: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const fit = imageFit(ratio, '4 / 3');
  return (
    <Link to={`/collections/${c.slug}`} className="no-underline block" style={{ color: colors.ink }}>
      <div style={{ ...fit.box, background: colors.bgAlt, borderRadius: theme.imageRadiusPx, overflow: 'hidden', marginBottom: '14px', display: c.image && !errored ? undefined : 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {c.image && !errored
          ? <img src={c.image} alt={c.name} loading="lazy" onError={() => setErrored(true)} style={fit.img} />
          : <span style={{ fontFamily: theme.fonts.display, fontSize: '20px', color: colors.inkMuted, padding: '12px', textAlign: 'center' }}>{c.name}</span>}
      </div>
      <h3 style={{ fontFamily: theme.fonts.display, fontSize: '18px', fontWeight: 600, color: colors.ink, margin: 0 }}>{c.name}</h3>
      {showDescription && c.description && (
        <p className="line-clamp-2" style={{ fontFamily: theme.fonts.body, fontSize: '13.5px', color: colors.inkMuted, lineHeight: 1.6, margin: '6px 0 0' }}>{c.description}</p>
      )}
    </Link>
  );
}

export function CollectionListSection({ section, colors, theme }: Props) {
  const { store } = useStorefront();
  const [items, setItems] = useState<PublicCollectionSummary[] | null>(null);
  useEffect(() => {
    let off = false;
    apiGetPublicCollections(store.storeId).then(r => { if (!off) setItems(r.data ?? []); }).catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [store.storeId]);
  if (!items || items.length === 0) return null;
  const cols = [2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : 3;
  const limit = Math.min(24, Math.max(1, Number(section.settings.limit) || 6));
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} />
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
          {items.slice(0, limit).map(c => (
            <CollectionTile key={c._id} c={c} colors={colors} theme={theme} ratio={section.settings.imageRatio} showDescription={section.settings.showDescription === true} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Image gallery ───────────────────────────────────────────────────────────
function GalleryPhoto({ block, theme, colors, ratio }: { block: Block; theme: SharedThemeTokens; colors: SharedColors; ratio: unknown }) {
  const resolveLink = useCta();
  const [errored, setErrored] = useState(false);
  const s = block.settings;
  if (!s.imageUrl || errored) return null;
  const fit = imageFit(ratio, '1 / 1');
  const img = (
    <div style={{ ...fit.box, background: colors.bgAlt, borderRadius: theme.imageRadiusPx, overflow: 'hidden' }}>
      <img src={s.imageUrl} alt={s.alt ?? ''} loading="lazy" onError={() => setErrored(true)} style={fit.img} />
    </div>
  );
  if (!s.link) return img;
  const target = resolveLink(s.link);
  return target.to ? <Link to={target.to} className="block">{img}</Link> : <a href={target.href} className="block" {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{img}</a>;
}

export function GalleryGridSection({ section, blocks, colors, theme }: Props) {
  if (blocks.length === 0) return null;
  const cols = [2, 3, 4, 5].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : 3;
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} />
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.floor(1100 / cols)}px), 1fr))` }}>
          {blocks.map((b, i) => (
            <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
              <GalleryPhoto block={b} theme={theme} colors={colors} ratio={section.settings.imageRatio} />
            </PreviewBlock>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Store locations ─────────────────────────────────────────────────────────
export function StoreLocationsSection({ section, blocks, colors, theme }: Props) {
  if (blocks.length === 0) return null;
  const text: CSSProperties = { fontFamily: theme.fonts.body, fontSize: '14px', color: colors.inkMuted, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' };
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} />
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
          {blocks.map((b, i) => {
            const s = b.settings;
            return (
              <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
                <article style={{ border: `1px solid ${colors.border}`, borderRadius: theme.imageRadiusPx, padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px', background: colors.bg }}>
                  <h3 style={{ fontFamily: theme.fonts.display, fontSize: '19px', fontWeight: 600, color: colors.ink, margin: 0 }}>{s.name}</h3>
                  {s.address && <p style={text}>{s.address}</p>}
                  {s.phone && <a href={`tel:${String(s.phone).replace(/[^\d+]/g, '')}`} className="no-underline" style={{ ...text, color: colors.ink }}>{s.phone}</a>}
                  {s.email && <a href={`mailto:${s.email}`} className="no-underline" style={{ ...text, color: colors.ink }}>{s.email}</a>}
                  {s.hours && <p style={text}>{s.hours}</p>}
                  {s.mapUrl && (
                    <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="no-underline" style={{ fontFamily: theme.fonts.body, fontSize: '13px', fontWeight: 600, color: colors.accent, marginTop: '4px' }}>
                      {copyText(s, 'directionsLabel', 'Get directions →')}
                    </a>
                  )}
                </article>
              </PreviewBlock>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Contact form ────────────────────────────────────────────────────────────
export function ContactFormSection({ section, colors, theme }: Props) {
  const { store } = useStorefront();
  const s = section.settings;
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues(v => ({ ...v, [key]: e.target.value }));
  const field: CSSProperties = { width: '100%', fontFamily: theme.fonts.body, fontSize: '14px', color: colors.ink, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: theme.imageRadiusPx === '0px' ? '0' : '6px', padding: '11px 14px', outline: 'none' };
  const label: CSSProperties = { fontFamily: theme.fonts.body, fontSize: '12.5px', fontWeight: 600, color: colors.ink, display: 'block', marginBottom: '6px' };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      await apiSubmitContactMessage(store.storeId, {
        name: values.name.trim(), email: values.email.trim(), message: values.message.trim(),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}), website: values.website,
      });
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send your message. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: '640px' }}>
        <Heading text={s.heading} theme={theme} colors={colors} align="center" />
        {s.intro && <p style={{ fontFamily: theme.fonts.body, fontSize: '14.5px', color: colors.inkMuted, textAlign: 'center', lineHeight: 1.7, margin: '-12px 0 24px' }}>{s.intro}</p>}
        {status === 'done' ? (
          <p role="status" style={{ fontFamily: theme.fonts.body, fontSize: '15px', color: colors.ink, textAlign: 'center', padding: '28px', border: `1px solid ${colors.border}`, borderRadius: theme.imageRadiusPx }}>
            {s.successMessage || 'Thanks — we got your message and will reply soon.'}
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
              <div><label htmlFor="cf-name" style={label}>{copyText(s, 'nameLabel', 'Name')}</label><input id="cf-name" required maxLength={80} value={values.name} onChange={set('name')} autoComplete="name" style={field} /></div>
              <div><label htmlFor="cf-email" style={label}>{copyText(s, 'emailLabel', 'Email')}</label><input id="cf-email" type="email" required maxLength={120} value={values.email} onChange={set('email')} autoComplete="email" style={field} /></div>
            </div>
            {s.showPhone !== false && (
              <div><label htmlFor="cf-phone" style={label}>{copyText(s, 'phoneLabel', 'Phone (optional)')}</label><input id="cf-phone" type="tel" maxLength={25} value={values.phone} onChange={set('phone')} autoComplete="tel" style={field} /></div>
            )}
            <div><label htmlFor="cf-message" style={label}>{copyText(s, 'messageLabel', 'Message')}</label><textarea id="cf-message" required rows={6} maxLength={3000} value={values.message} onChange={set('message')} style={{ ...field, resize: 'vertical' }} /></div>
            {/* Bot trap: invisible to people, so only automated fills reach it. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}>
              <label htmlFor="cf-website">Website</label>
              <input id="cf-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
            </div>
            {status === 'error' && <p role="alert" style={{ fontFamily: theme.fonts.body, fontSize: '13px', color: '#B3413A', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={status === 'sending'} className="cursor-pointer border-0 disabled:opacity-60"
              style={{ alignSelf: 'center', fontFamily: theme.fonts.body, fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', color: colors.bg, background: colors.ink, padding: '13px 36px', borderRadius: theme.imageRadiusPx === '0px' ? '0' : '9999px' }}>
              {status === 'sending' ? tt('sections.sending', "Sending…") : (s.buttonLabel || tt('sections.sendMessage', "Send message"))}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Related products (other products of the viewed product's category) ─────
export function RelatedProductsSection({ section, colors, theme }: Props) {
  const { store } = useStorefront();
  const product = useProductPage();
  const { currency } = useCurrencyPreference();
  const [items, setItems] = useState<PublicStoreProduct[] | null>(null);
  const limit = Math.min(12, Math.max(2, Number(section.settings.limit) || 4));
  const Card = theme.ProductCard;
  const productId = product?.productId;
  const categoryId = product?.categoryId ?? undefined;

  useEffect(() => {
    if (!productId) return;
    let off = false;
    apiGetPublicStoreProducts(store.storeId, { categoryId, limit: limit + 1, sort: 'best_selling' })
      .then(res => { if (!off) setItems((res.data?.products ?? []).filter(p => p._id !== productId).slice(0, limit)); })
      .catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [store.storeId, productId, categoryId, limit]);

  // Only meaningful on a product page; elsewhere (or with nothing to show) it simply does not render.
  if (!Card || !productId || !items || items.length === 0) return null;
  const cols = [2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : 4;
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} />
        <div className="grid gap-x-6 gap-y-10" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.floor(1100 / cols)}px), 1fr))` }}>
          {items.map(p => <Card key={p._id} product={p} currency={currency} />)}
        </div>
      </div>
    </div>
  );
}
