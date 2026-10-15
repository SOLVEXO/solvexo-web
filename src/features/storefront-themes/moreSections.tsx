import { useEffect, useState } from 'react';
import { tt } from '@/utils/tStatic';
import { Link, useParams } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { apiGetPublicCollectionBySlug, type PublicCollectionSummary } from '@/api/services/collections';
import { useCurrencyPreference, useCurrencyPreferenceOptional } from '@/contexts/CurrencyPreferenceContext';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { renderRichText } from '@/utils/richText';
import { PreviewBlock } from './previewInspector';
import { imageFit } from './imageFit';
import { CtaButton, Heading, type SharedColors, type SharedThemeTokens } from './sharedSections';

// Shopify Dawn sections that were missing: Divider, Multirow, Collage,
// Featured product, Collection banner, Recently viewed. One shared
// implementation each, styled by the registering theme's tokens.

interface Props { section: Section; blocks: Block[]; colors: SharedColors; theme: SharedThemeTokens }
const box = (theme: SharedThemeTokens) => ({ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` });

// ── Divider / spacer ────────────────────────────────────────────────────────
export function DividerSection({ section, colors, theme }: Props) {
  const height = Math.min(160, Math.max(0, Number(section.settings.height ?? 32)));
  const line = section.settings.style !== 'space';
  return (
    <div style={{ padding: `${height / 2}px ${theme.layout.containerPadX}` }} aria-hidden="true">
      {line && <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth, height: '1px', background: colors.border }} />}
    </div>
  );
}

// ── Multirow (image + text rows, alternating sides) ─────────────────────────
function Row({ block, index, colors, theme, ratio, alternate }: { block: Block; index: number; colors: SharedColors; theme: SharedThemeTokens; ratio: unknown; alternate: boolean }) {
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const fit = imageFit(ratio, '4 / 3', s.focalPoint);
  const imageRight = alternate ? index % 2 === 1 : false;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center">
      <div className={imageRight ? 'md:order-2' : ''} style={{ ...fit.box, background: colors.bgAlt, borderRadius: theme.imageRadiusPx, overflow: 'hidden' }}>
        {s.imageUrl && !errored && <img src={s.imageUrl} alt={s.heading ?? ''} loading="lazy" onError={() => setErrored(true)} style={fit.img} />}
      </div>
      <div>
        {s.heading && <h3 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 600, color: colors.ink, marginBottom: '12px' }}>{s.heading}</h3>}
        {s.body && <p style={{ fontFamily: theme.fonts.body, fontSize: '14.5px', color: colors.inkMuted, lineHeight: 1.75, marginBottom: s.ctaText ? '20px' : 0 }}>{renderRichText(s.body)}</p>}
        <CtaButton text={s.ctaText} link={s.ctaLink} theme={theme} />
      </div>
    </div>
  );
}

export function MultirowSection({ section, blocks, colors, theme }: Props) {
  if (blocks.length === 0) return null;
  return (
    <div style={box(theme)}>
      <div className="mx-auto flex flex-col gap-14" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} />
        {blocks.map((b, i) => (
          <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
            <Row block={b} index={i} colors={colors} theme={theme} ratio={section.settings.imageRatio} alternate={section.settings.alternate !== false} />
          </PreviewBlock>
        ))}
      </div>
    </div>
  );
}

// ── Collage (one large tile + smaller ones) ─────────────────────────────────
function CollageTile({ block, big, colors, theme }: { block: Block; big: boolean; colors: SharedColors; theme: SharedThemeTokens }) {
  const { resolveLink } = useStorefront();
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const inner = (
    <div className="relative h-full w-full" style={{ background: colors.bgAlt, borderRadius: theme.imageRadiusPx, overflow: 'hidden', minHeight: big ? '360px' : '200px' }}>
      {s.imageUrl && !errored && <img src={s.imageUrl} alt={s.heading ?? ''} loading="lazy" onError={() => setErrored(true)} className="absolute inset-0 w-full h-full" style={{ objectFit: 'cover' }} />}
      {s.heading && (
        <div className="absolute inset-x-0 bottom-0" style={{ padding: '18px', background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}>
          <span style={{ fontFamily: theme.fonts.display, fontSize: big ? '24px' : '18px', fontWeight: 600, color: '#FFFFFF' }}>{s.heading}</span>
        </div>
      )}
    </div>
  );
  if (!s.link) return inner;
  const target = resolveLink(s.link);
  return target.to
    ? <Link to={target.to} className="no-underline block h-full">{inner}</Link>
    : <a href={target.href} className="no-underline block h-full">{inner}</a>;
}

export function CollageSection({ section, blocks, colors, theme }: Props) {
  if (blocks.length === 0) return null;
  const items = blocks.slice(0, 5);
  const [first, ...rest] = items;
  const bigRight = section.settings.layout === 'right';
  return (
    <div style={box(theme)}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} />
        <div className={`grid grid-cols-1 gap-4 ${rest.length ? 'md:grid-cols-2' : ''}`}>
          <div className={bigRight ? 'md:order-2' : ''}>
            <PreviewBlock blockId={String(first._id ?? 0)}><CollageTile block={first} big colors={colors} theme={theme} /></PreviewBlock>
          </div>
          {rest.length > 0 && (
            <div className={`grid gap-4 ${rest.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {rest.map((b, i) => <PreviewBlock key={b._id ?? i + 1} blockId={String(b._id ?? i + 1)}><CollageTile block={b} big={false} colors={colors} theme={theme} /></PreviewBlock>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Featured product (one product, large) ───────────────────────────────────
function usePrice() {
  const { store } = useStorefront();
  const cp = useCurrencyPreferenceOptional();
  const native = store.baseCurrency ?? cp?.currency ?? 'USD';
  const shown = cp?.currency ?? native;
  const ready = !cp || cp.ratesLoaded || native === shown;
  return (n?: number | null) => (n == null || !ready ? '—' : `${currencySymbol(shown)}${fmt2(cp ? cp.convert(n, native) : n)}`);
}

export function FeaturedProductSection({ section, colors, theme }: Props) {
  const { store } = useStorefront();
  const price = usePrice();
  const id = Array.isArray(section.settings.productIds) ? section.settings.productIds[0] : undefined;
  const [product, setProduct] = useState<PublicStoreProduct | null | undefined>(undefined);
  useEffect(() => {
    if (!id) { setProduct(null); return; }
    let off = false;
    apiGetPublicStoreProducts(store.storeId, { ids: [id], limit: 1 })
      .then(r => { if (!off) setProduct(r.data?.products?.[0] ?? null); })
      .catch(() => { if (!off) setProduct(null); });
    return () => { off = true; };
  }, [store.storeId, id]);
  if (!product) return null;
  const B = theme.Button;
  const onSale = product.compareAtPrice != null && product.defaultVariantPrice != null && product.compareAtPrice > product.defaultVariantPrice;
  return (
    <div style={box(theme)}>
      <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center" style={{ maxWidth: theme.layout.maxWidth }}>
        <div style={{ aspectRatio: '1 / 1', background: colors.bgAlt, borderRadius: theme.imageRadiusPx, overflow: 'hidden' }}>
          {product.images?.[0] && <img src={product.images[0]} alt={product.name} loading="lazy" className="w-full h-full" style={{ objectFit: 'cover' }} />}
        </div>
        <div className="flex flex-col gap-4 items-start">
          {section.settings.heading && <p style={{ fontFamily: theme.fonts.body, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.accent, margin: 0 }}>{section.settings.heading}</p>}
          <h2 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 600, color: colors.ink, margin: 0 }}>{product.name}</h2>
          <div className="flex items-baseline gap-3">
            <span style={{ fontFamily: theme.fonts.body, fontSize: '20px', color: colors.ink }}>{price(product.defaultVariantPrice)}</span>
            {onSale && <s style={{ fontFamily: theme.fonts.body, fontSize: '15px', color: colors.inkMuted }}>{price(product.compareAtPrice)}</s>}
          </div>
          <Link to={`/product/${product.slug}`} className="no-underline"><B variant="primary">{(section.settings.buttonLabel as string) || tt('sections.viewProduct', "View product")}</B></Link>
        </div>
      </div>
    </div>
  );
}

// ── Collection banner ───────────────────────────────────────────────────────
export function CollectionBannerSection({ section, colors, theme }: Props) {
  const { store, previewCollectionId } = useStorefront() as ReturnType<typeof useStorefront> & { previewCollectionId?: string | null };
  // Picked collection, else (on the Collection template) the one being viewed.
  const { slugOrId } = useParams();
  const ref = (section.settings.collectionId as string | undefined) || previewCollectionId || slugOrId || undefined;
  const [c, setC] = useState<PublicCollectionSummary | null>(null);
  useEffect(() => {
    if (!ref) { setC(null); return; }
    let off = false;
    apiGetPublicCollectionBySlug(store.storeId, ref).then(r => { if (!off) setC(r.data ?? null); }).catch(() => { if (!off) setC(null); });
    return () => { off = true; };
  }, [store.storeId, ref]);
  if (!c) return null;
  const showImage = section.settings.showImage !== false && !!c.image;
  return (
    <div style={box(theme)}>
      <div className={`mx-auto grid grid-cols-1 gap-8 items-center ${showImage ? 'md:grid-cols-2' : ''}`} style={{ maxWidth: theme.layout.maxWidth }}>
        <div>
          <h1 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 600, color: colors.ink, margin: '0 0 12px' }}>{c.name}</h1>
          {section.settings.showDescription !== false && c.description && <p style={{ fontFamily: theme.fonts.body, fontSize: '14.5px', color: colors.inkMuted, lineHeight: 1.7, margin: 0 }}>{c.description}</p>}
        </div>
        {showImage && (
          <div style={{ aspectRatio: '16 / 10', background: colors.bgAlt, borderRadius: theme.imageRadiusPx, overflow: 'hidden' }}>
            <img src={c.image!} alt={c.name} className="w-full h-full" style={{ objectFit: 'cover' }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recently viewed ─────────────────────────────────────────────────────────
const RV_KEY = (storeId: string) => `sx_recently_viewed_${storeId}`;

/** Called by each theme's product page: remembers the last 12 products this
 *  browser viewed in this store (local only — nothing is sent anywhere). */
export function recordRecentlyViewed(storeId: string, productId: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(RV_KEY(storeId)) ?? '[]');
    const next = [productId, ...list.filter(id => id !== productId)].slice(0, 12);
    localStorage.setItem(RV_KEY(storeId), JSON.stringify(next));
  } catch { /* storage blocked: the section just stays empty */ }
}

export function RecentlyViewedSection({ section, colors, theme }: Props) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  const [items, setItems] = useState<PublicStoreProduct[]>([]);
  const limit = Math.min(12, Math.max(2, Number(section.settings.limit) || 4));
  useEffect(() => {
    let ids: string[] = [];
    try { ids = JSON.parse(localStorage.getItem(RV_KEY(store.storeId)) ?? '[]'); } catch { ids = []; }
    if (!Array.isArray(ids) || ids.length === 0) return;
    let off = false;
    apiGetPublicStoreProducts(store.storeId, { ids: ids.slice(0, limit), limit })
      .then(r => { if (!off) setItems(r.data?.products ?? []); })
      .catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [store.storeId, limit]);
  const Card = theme.ProductCard;
  if (!Card || items.length === 0) return null;
  const cols = [2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : 4;
  return (
    <div style={box(theme)}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} />
        <div className="grid gap-x-6 gap-y-10" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.floor(1100 / cols)}px), 1fr))` }}>
          {items.map(p => <Card key={p._id} product={p} currency={currency} />)}
        </div>
      </div>
    </div>
  );
}
