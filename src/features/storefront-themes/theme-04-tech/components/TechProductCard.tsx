import { useState, type MouseEvent } from 'react';
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
import { TechButton, TechLinkButton, TechStars, TechStock } from '../ui/techUi';
import { useCompare } from './compare';
import { TechQuickView } from './product/TechQuickView';

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
  const ratio = PRODUCT_CARD_RATIO.square;
  const image = product.images?.[0];
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

  const imageBox = (
    <Link to={to} aria-label={p.name} className="relative block overflow-hidden" style={{ aspectRatio: ratio, background: t.colors.bgAlt, borderRadius: t.cardRadiusPx }}>
      {image && <img {...imgProps(image, CARD_IMAGE_WIDTHS, CARD_IMAGE_SIZES)} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-contain p-3" />}
    </Link>
  );
  const quickBtn = t.quickView && product.type !== 'digital' && (
    <button type="button" className="tx-icon-btn" aria-haspopup="dialog" aria-label={ts('pg.quick_view', 'Quick view')} onClick={e => { e.preventDefault(); setQuick(true); }}>
      <Eye size={16} aria-hidden />
    </button>
  );
  const heartBtn = hasVariant && (
    <button type="button" className="tx-icon-btn" aria-pressed={wished} aria-label={wished ? ts('pg.remove_from_wishlist', 'Remove from wishlist') : ts('pg.add_to_wishlist', 'Add to wishlist')} onClick={heart}>
      <Heart size={16} aria-hidden fill={wished ? 'currentColor' : 'none'} />
    </button>
  );
  const priceBlock = price != null && (
    <p className="m-0 flex flex-col leading-tight">
      {sale.onSale && <s className="text-[13px]" style={{ color: t.colors.inkMuted }}>{show(sale.compareAmount, true)}</s>}
      <span className="text-[17px] font-semibold" style={{ color: t.colors.price }}>{show(price)}</span>
    </p>
  );
  const addBtn = hasVariant && inStock
    ? <TechButton variant="outline" small onClick={add} loading={adding === product.variantId}><ShoppingCart size={15} aria-hidden />{ts('product.addToCart', 'Add to cart')}</TechButton>
    : <TechLinkButton to={to} variant="outline" small>{ts('pg.view_product', 'View product')}</TechLinkButton>;

  if (layout === 'list') {
    return (
      <article className="tx-card gap-4 p-4 grid-cols-[96px_1fr] sm:grid-cols-[180px_1fr_auto]" data-style={t.productCardStyle} style={{ display: 'grid', background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: t.cardRadiusPx }}>
        {imageBox}
        <div className="flex min-w-0 flex-col gap-2">
          <TechStock inStock={inStock} />
          <Link to={to} className="text-sm font-medium no-underline hover:underline" style={{ color: t.colors.ink }}>{p.name}</Link>
          {t.showCardRating && <TechStars value={product.averageRating ?? 0} />}
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
    <article className="tx-card gap-2 p-3" data-style={t.productCardStyle} style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: t.cardRadiusPx }}>
      <TechStock inStock={inStock} />
      <div className="relative">
        {imageBox}
        {(quickBtn || heartBtn || compareBtn) && <div className="tx-card-actions">{quickBtn}{heartBtn}{compareBtn}</div>}
      </div>
      {t.showCardRating && <TechStars value={product.averageRating ?? 0} />}
      <Link to={to} className="line-clamp-3 text-[13px] font-medium leading-snug no-underline hover:underline" style={{ color: t.colors.ink }}>{p.name}</Link>
      <div className="mt-auto flex flex-col gap-3 pt-1">
        {priceBlock}
        {addBtn}
      </div>
      {quick && <TechQuickView slug={handleOf(product)} onClose={() => setQuick(false)} />}
    </article>
  );
}
