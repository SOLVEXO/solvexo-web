import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { apiGetPublicStoreProducts, type PublicStoreProduct, type PublicStoreProductsParams } from '@/api/services/store';
import type { Block } from '@/api/services/storefrontTypes';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLocalize } from '@/hooks/useLocalize';
import { handleOf } from '@/utils/activeStoreText';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useWholesaleGate } from '@/features/storefront-themes/core/b2b/useWholesale';
import { displayMoney, saleInfo } from '@/features/storefront-themes/core/money';
import { useLoad } from '@/features/storefront-themes/core/pageHooks';
import { featuredProductsQuery } from '@/features/storefront-themes/core/sectionProductQuery';
import { PreviewBlock } from '@/features/storefront-themes/previewInspector';

/** What a theme hands over so the columns look native: its fonts, shapes and colours. The seller overrides any piece. */
export interface ColumnsTokens {
  fontDisplay: string; fontBody: string; ink: string; inkMuted: string; border: string; panelBg: string; accent: string; radius: string;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = (v: unknown): string | undefined => (typeof v === 'string' && HEX.test(v) ? v : undefined);
const num = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const flag = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

const CSS = `
.cc-grid{display:grid;grid-template-columns:repeat(var(--cc-cols),minmax(0,1fr));gap:var(--cc-gap)}
@media (max-width:1100px){.cc-grid{grid-template-columns:repeat(min(var(--cc-cols),2),minmax(0,1fr))}}
@media (max-width:640px){.cc-grid{grid-template-columns:minmax(0,1fr)}}
.cc-row{display:flex;gap:var(--cc-img-gap);text-decoration:none;color:inherit;min-width:0}
.cc-row:hover .cc-name{text-decoration:underline}
.cc-img{flex:none;overflow:hidden}
.cc-img img{display:block;width:100%;height:100%;object-fit:cover}
.cc-name{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:var(--cc-lines)}
`;

function urlFor(b: Record<string, any>): string {
  if (b.source === 'collection' && b.collectionId) return `/collections/${b.collectionId}`;
  if (b.source === 'category' && b.categoryId) return `/category/${b.categoryId}`;
  return '/search';
}

function Column({ block, s, tokens }: { block: Block; s: Record<string, any>; tokens: ColumnsTokens }) {
  const b = block.settings as Record<string, any>;
  const { store } = useStorefront();
  const { currency, convert, canConvert, fixedPriceFor } = useCurrencyPreference();
  const locked = useWholesaleGate().locked;
  const localize = useLocalize();
  const query = featuredProductsQuery({ ...b, limit: num(b.limit, 1, 24, 3) }, 3);
  const key = JSON.stringify(query);
  const { data: items } = useLoad(
    () => apiGetPublicStoreProducts(store.storeId, JSON.parse(key) as PublicStoreProductsParams).then(r => r.data?.products ?? []),
    [store.storeId, key],
  );

  const imageSize = num(s.imageSize, 24, 320, 100);
  const pos = s.imagePosition === 'right' ? 'row-reverse' : s.imagePosition === 'top' ? 'column' : 'row';
  const align = s.align === 'center' ? 'center' : s.align === 'right' ? 'right' : 'left';
  const titleSize = num(s.titleSize, 9, 48, 16);
  const priceSize = num(s.priceSize, 9, 48, 16);
  const headingSize = num(s.headingSize, 10, 120, 22);
  const headingColor = hex(b.headingColor) ?? hex(s.headingColor) ?? tokens.ink;
  const titleColor = hex(s.titleColor) ?? tokens.ink;
  const priceColor = hex(s.priceColor) ?? tokens.accent;
  const oldColor = hex(s.oldPriceColor) ?? tokens.inkMuted;
  const lineColor = hex(s.lineColor) ?? tokens.border;
  const dividerColor = hex(s.dividerColor) ?? tokens.border;
  const showImage = flag(s.showImage, true);
  const showOld = flag(s.showOldPrice, true);
  const showBadge = flag(s.showBadge, false);
  const base = String(store.baseCurrency ?? currency);
  const money = (n: number, compare = false, ref?: { productId: string; variantId?: string | null }) => displayMoney({ currency, convert, canConvert }, n, base, { ...ref, compare } as never);
  const bg = hex(b.bgColor) ?? hex(s.columnBg);
  const colPad = num(s.columnPadding, 0, 120, bg || flag(s.columnBorder, false) ? 20 : 0);
  const viewAll = flag(s.showViewAll, false) ? (b.viewAllText || s.viewAllText || ts('pg.view_all', 'View all')) : '';
  const heading = typeof b.heading === 'string' ? b.heading : '';
  const headingNode = heading && (
    b.headingLinkOn === true
      ? <Link to={urlFor(b)} style={{ color: 'inherit', textDecoration: 'none' }}>{heading}</Link>
      : heading
  );

  const rows = (items ?? []).map((p: PublicStoreProduct, i, all) => {
    const lp = localize.product(p);
    const price = p.defaultVariantPrice;
    const ref = { productId: p._id, variantId: p.variantId ?? undefined };
    const sale = saleInfo({ currency, convert, canConvert, fixedPriceFor }, price, p.compareAtPrice, base, ref);
    const rowStyle: CSSProperties = {
      flexDirection: pos, textAlign: align, alignItems: pos === 'column' ? 'stretch' : 'center',
      background: hex(s.rowBg), borderRadius: num(s.rowRadius, 0, 200, 0), padding: num(s.rowPadding, 0, 80, 0),
      borderBottom: flag(s.rowDivider, false) && i < all.length - 1 ? `1px solid ${dividerColor}` : undefined,
      paddingBottom: flag(s.rowDivider, false) ? Math.max(num(s.rowPadding, 0, 80, 0), 12) : undefined,
    };
    return (
      <Link key={p._id} to={`/product/${handleOf(p)}`} className="cc-row" style={rowStyle}>
        {showImage && p.images?.[0] && (
          <span className="cc-img" style={{ width: pos === 'column' ? '100%' : imageSize, height: pos === 'column' ? undefined : imageSize, aspectRatio: pos === 'column' ? '1 / 1' : undefined, borderRadius: num(s.imageRadius, 0, 200, 4), background: tokens.panelBg }}>
            <img src={p.images[0]} alt="" loading="lazy" />
          </span>
        )}
        <span style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="cc-name" style={{ color: titleColor, fontSize: titleSize, lineHeight: 1.3, fontFamily: tokens.fontBody }}>{lp.name}</span>
          {!locked && price != null && (
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', alignItems: 'baseline', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', fontFamily: tokens.fontBody }}>
              {showOld && sale.onSale && <s style={{ color: oldColor, fontSize: Math.max(10, priceSize - 1) }}>{money(sale.compareAmount, true, ref)}</s>}
              <span style={{ color: priceColor, fontSize: priceSize, fontWeight: 600 }}>{money(price, false, ref)}</span>
              {showBadge && sale.onSale && sale.percentOff ? (
                <span style={{ background: hex(s.badgeBg) ?? tokens.accent, color: hex(s.badgeText) ?? '#fff', fontSize: Math.max(10, priceSize - 3), padding: '1px 6px', borderRadius: 999 }}>-{sale.percentOff}%</span>
              ) : null}
            </span>
          )}
        </span>
      </Link>
    );
  });

  return (
    <PreviewBlock blockId={String(block._id)}>
      <div style={{ background: bg, borderRadius: num(s.columnRadius, 0, 200, 0), padding: colPad, border: flag(s.columnBorder, false) ? `1px solid ${lineColor}` : undefined, minWidth: 0 }}>
        {heading && (
          <h3 style={{ margin: 0, fontSize: headingSize, fontWeight: 500, lineHeight: 1.2, color: headingColor, fontFamily: tokens.fontDisplay, textAlign: align, paddingBottom: flag(s.showHeadingLine, true) ? num(s.headingGap, 0, 80, 18) : num(s.headingGap, 0, 80, 12), borderBottom: flag(s.showHeadingLine, true) && num(s.lineWidth, 0, 8, 1) > 0 ? `${num(s.lineWidth, 0, 8, 1)}px solid ${lineColor}` : undefined, marginBottom: num(s.headingGap, 0, 80, 18) }}>
            {headingNode}
          </h3>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: num(s.rowGap, 0, 120, 14) }}>
          {items === null || items === undefined ? <div aria-busy="true" style={{ height: imageSize * 2, background: tokens.panelBg, borderRadius: 8, opacity: 0.6 }} /> : rows}
        </div>
        {viewAll && items && items.length > 0 && (
          <Link to={urlFor(b)} style={{ display: 'inline-block', marginTop: 14, color: hex(s.viewAllColor) ?? tokens.ink, fontSize: 14, textDecoration: 'underline', fontFamily: tokens.fontBody }}>{viewAll}</Link>
        )}
      </div>
    </PreviewBlock>
  );
}

/**
 * "Collection columns": side-by-side columns, each listing one source's products as compact rows (photo, name, price, old price).
 * Every size, colour, divider and switch is the seller's; a theme only supplies fonts, shapes and defaults.
 */
export function CollectionColumnsGrid({ settings, blocks, tokens }: { settings: Record<string, any>; blocks: Block[]; tokens: ColumnsTokens }) {
  if (blocks.length === 0) return null;
  const cols = num(settings.columns, 1, 8, Math.min(4, blocks.length));
  return (
    <>
      <style>{CSS}</style>
      <div className="cc-grid" style={{ ['--cc-cols' as string]: cols, ['--cc-gap' as string]: `${num(settings.gap, 0, 200, 32)}px`, ['--cc-img-gap' as string]: `${num(settings.imageGap, 0, 60, 16)}px`, ['--cc-lines' as string]: num(settings.titleLines, 1, 6, 3) } as CSSProperties}>
        {blocks.map((b, i) => <Column key={b._id ?? i} block={b} s={settings} tokens={tokens} />)}
      </div>
    </>
  );
}
