import { useMemo, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Eye, Heart, ShoppingCart } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { handleOf } from '@/utils/activeStoreText';
import type { PublicStoreProduct } from '@/api/services/store';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLocalize } from '@/hooks/useLocalize';
import { displayMoney, saleInfo } from '../../core/money';
import { useCartDrawer } from '../../cartDrawerContext';
import { CARD_IMAGE_SIZES, CARD_IMAGE_WIDTHS, imgProps } from './imgProps';
import { PRODUCT_CARD_RATIO } from '../../imageFit';
import { techTheme as t } from '../theme.config';
import { baseTheme as b } from '../theme.base';
import { TechButton, TechLinkButton, TechStars, TechStock } from '../ui/techUi';
import { useCompare } from './compare';
import { TechQuickView } from './product/TechQuickView';

/** True for values the browser can paint as a colour ("Red", "#c2410c"); other option values render as a text chip. */
function isCssColor(value: string): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', value);
}

/** Card for every real product grid. `layout="list"` is the wide row used by the collection list view. */
export function TechProductCard({ product, currency, layout = 'grid' }: { product: PublicStoreProduct; currency: string; layout?: 'grid' | 'list' }) {
  const { store } = useStorefront();
  const { convert, canConvert, fixedPriceFor } = useCurrencyPreference();
  const { addToCart, adding } = useCartContext();
  const { isWishlisted, toggleWishlist } = useWishlistContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const localize = useLocalize();
  const p = localize.product(product);
  const base = String(store.baseCurrency ?? currency);
  const price = product.defaultVariantPrice;
  const ref = { productId: product._id, variantId: product.variantId };
  const show = (n: number, compare = false) => displayMoney({ currency, convert, canConvert }, n, base, { ...ref, compare });
  const sale = saleInfo({ currency, convert, canConvert, fixedPriceFor }, price, product.compareAtPrice, base, ref);
  const inStock = product.inStock !== false;
  const hasVariant = !!product.variantId;
  const to = `/product/${handleOf(product)}`;
  const ratio = PRODUCT_CARD_RATIO[b.productImageRatio] ?? PRODUCT_CARD_RATIO.square;
  const [hoverImage, setHoverImage] = useState<string | undefined>();
  const showSwatches = b.colorSwatches; // module singleton: read per render so the editor preview reacts to the setting
  const swatches = useMemo(() => {
    if (!showSwatches) return [];
    const seen = new Map<string, { value: string; image?: string }>();
    for (const v of product.variants ?? []) {
      const color = v.options?.find(o => /^colou?r$/i.test(o.name))?.value;
      if (color && !seen.has(color.toLowerCase())) seen.set(color.toLowerCase(), { value: color, image: v.images?.find(Boolean) });
    }
    return Array.from(seen.values());
  }, [product.variants, showSwatches]);
  const image = hoverImage ?? product.images?.[0];
  const secondImage = b.productImageHover === 'second-image' ? product.images?.[1] : undefined;
  const wished = hasVariant ? isWishlisted(product._id, product.variantId as string) : false;
  const [quick, setQuick] = useState(false);
  const compare = useCompare(store.storeId);
  const compared = compare.has(product._id);
  const compareBtn = t.compare && (
    <button type="button" className="tx-icon-btn" aria-pressed={compared} disabled={!compared && compare.full} aria-label={compared ? ts('tx.compare.removeShort', 'Remove from compare') : compare.full ? ts('tx.compare.full', 'Compare list is full (4 products)') : ts('tx.compare.add', 'Add to compare')} onClick={e => { e.preventDefault(); compare.toggle(product); }}>
      <BarChart3 size={16} aria-hidden />
    </button>
  );

  const add = async (e: MouseEvent) => {
    e.preventDefault();
    if (!product.variantId) return;
    const ok = await addToCart(product._id, product.variantId, product.type === 'digital' ? 'digital' : 'physical', 1);
    if (ok && drawerMounted) openDrawer();
  };
  const heart = async (e: MouseEvent) => {
    e.preventDefault();
    if (product.variantId) await toggleWishlist(product._id, product.variantId);
  };

  const pct = product.compareAtPrice && price && product.compareAtPrice > price ? Math.round((1 - price / product.compareAtPrice) * 100) : 0;
  const badgeBase = { position: 'absolute', top: 8, left: 8, padding: '3px 8px', fontSize: 11, fontWeight: 700, lineHeight: 1.3, borderRadius: b.badgeStyle === 'square' ? t.badgeRadiusPx : '9999px' } as const;
  const badges = (
    <>
      {!inStock && b.soldOutBadge && <span style={{ ...badgeBase, background: t.colors.ink, color: t.colors.bg }}>{ts('product.soldOut', 'Sold out')}</span>}
      {inStock && b.saleBadge && sale.onSale && pct > 0 && <span style={{ ...badgeBase, background: t.colors.danger, color: '#fff' }}>{b.saleBadgeText === 'label' ? ts('pg.sale', 'Sale') : `-${pct}%`}</span>}
    </>
  );
  const imageBox = (
    <Link to={to} aria-label={p.name} className="group relative block overflow-hidden" style={{ aspectRatio: ratio, background: t.colors.bgAlt, borderRadius: t.cardRadiusPx }}>
      {image && <img {...imgProps(image, CARD_IMAGE_WIDTHS, CARD_IMAGE_SIZES)} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-contain p-3" />}
      {secondImage && !hoverImage && <img {...imgProps(secondImage, CARD_IMAGE_WIDTHS, CARD_IMAGE_SIZES)} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-contain p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: t.colors.bgAlt }} />}
      {badges}
    </Link>
  );
  const quickBtn = t.quickView && product.type !== 'digital' && (
    <button type="button" className="tx-icon-btn" aria-haspopup="dialog" aria-label={ts('pg.quick_view', 'Quick view')} onClick={e => { e.preventDefault(); setQuick(true); }}>
      <Eye size={16} aria-hidden />
    </button>
  );
  const heartBtn = hasVariant && b.cardWishlist && (
    <button type="button" className="tx-icon-btn" aria-pressed={wished} aria-label={wished ? ts('pg.remove_from_wishlist', 'Remove from wishlist') : ts('pg.add_to_wishlist', 'Add to wishlist')} onClick={heart}>
      <Heart size={16} aria-hidden fill={wished ? 'currentColor' : 'none'} />
    </button>
  );
  const swatchRow = swatches.length > 0 && (
    <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0" aria-label={ts('pg.available_colours', 'Available colours')}>
      {swatches.slice(0, 5).map(sw => (
        <li key={sw.value} title={sw.value} onMouseEnter={() => setHoverImage(sw.image)} onMouseLeave={() => setHoverImage(undefined)}>
          {isCssColor(sw.value)
            ? <span role="img" aria-label={sw.value} className="block size-4 rounded-full" style={{ background: sw.value, border: `1px solid ${t.colors.border}` }} />
            : <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.inkMuted }}>{sw.value}</span>}
        </li>
      ))}
      {swatches.length > 5 && <li className="text-xs" style={{ color: t.colors.inkMuted }}>+{swatches.length - 5}</li>}
    </ul>
  );
  const priceBlock = price != null && (
    <p className="m-0 flex flex-col leading-tight">
      {sale.onSale && <s className="text-[13px]" style={{ color: t.colors.inkMuted }}>{show(sale.compareAmount, true)}</s>}
      <span className="text-[17px] font-semibold" style={{ color: t.colors.price }}>{show(price)}</span>
    </p>
  );
  const addBtnBase = hasVariant && inStock
    ? <TechButton variant="outline" small onClick={add} loading={adding === product.variantId}><ShoppingCart size={15} aria-hidden />{ts('product.addToCart', 'Add to cart')}</TechButton>
    : <TechLinkButton to={to} variant="outline" small>{ts('pg.view_product', 'View product')}</TechLinkButton>;

  const addBtn = b.cardButton ? addBtnBase : null;

  if (layout === 'list') {
    return (
      <article className="tx-card gap-4 p-4 grid-cols-[96px_1fr] sm:grid-cols-[180px_1fr_auto]" data-style={t.productCardStyle} style={{ display: 'grid', background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: t.cardRadiusPx }}>
        {imageBox}
        <div className="flex min-w-0 flex-col gap-2">
          <TechStock inStock={inStock} />
          {b.cardTag && product.vendor && <p className="m-0 text-xs uppercase" style={{ color: t.colors.inkMuted, letterSpacing: '.06em' }}>{product.vendor}</p>}
          <Link to={to} className="text-sm font-medium no-underline hover:underline" style={{ color: t.colors.ink }}>{p.name}</Link>
          {t.showCardRating && <TechStars value={product.averageRating ?? 0} />}
          {swatchRow}
          {priceBlock}
        </div>
        <div className="flex flex-row items-center gap-3 max-sm:col-span-2 sm:flex-col sm:items-end sm:justify-between">
          <span className="flex gap-2">{quickBtn}{heartBtn}{compareBtn}</span>
          {addBtn}
        </div>
        {quick && <TechQuickView slug={handleOf(product)} onClose={() => setQuick(false)} />}
      </article>
    );
  }

  return (
    <article className="tx-card gap-2 p-3" data-style={t.productCardStyle} data-fx-align={b.cardTextAlign} data-fx-hover={b.cardHover} style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: t.cardRadiusPx }}>
      <TechStock inStock={inStock} />
      <div className="relative">
        {imageBox}
        {(quickBtn || heartBtn || compareBtn) && <div className="tx-card-actions">{quickBtn}{heartBtn}{compareBtn}</div>}
      </div>
      {t.showCardRating && <TechStars value={product.averageRating ?? 0} />}
      {b.cardTag && product.vendor && <p className="m-0 text-[11px] uppercase" style={{ color: t.colors.inkMuted, letterSpacing: '.06em' }}>{product.vendor}</p>}
      <Link to={to} className="line-clamp-3 text-[13px] font-medium leading-snug no-underline hover:underline" style={{ color: t.colors.ink }}>{p.name}</Link>
      <div className="mt-auto flex flex-col gap-3 pt-1">
        {swatchRow}
        {priceBlock}
        {addBtn}
      </div>
      {quick && <TechQuickView slug={handleOf(product)} onClose={() => setQuick(false)} />}
    </article>
  );
}
