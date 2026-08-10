import { useState, useEffect, useRef, memo } from 'react';
import { clsx } from 'clsx';
import { Modal } from '@/components/comman/ui/Modal';
import { ShoppingCart, Star, Heart, ImageOff, Loader2, Eye, Flame, BadgeCheck, Store, ScanEye, Check, AlertCircle, ShieldCheck, RotateCcw, Truck } from 'lucide-react';
import type { MarketplaceProduct } from '@/api/services/marketplace';
import { useProductPreview } from '@/hooks/marketplace/useProductPreview';
import { currencySymbol } from '@/utils/currency';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function ProductCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' }) {
  if (layout === 'list') {
    return (
      <div className="bg-white rounded-xl border border-bone overflow-hidden flex flex-row items-stretch">
        <div className="w-[112px] sm:w-[168px] shrink-0 animate-pulse bg-bone" />
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center gap-[8px]">
          <div className="animate-pulse h-[11px] w-3/4 bg-bone rounded-md" />
          <div className="animate-pulse h-[10px] w-1/3 bg-bone rounded-md" />
          <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-bone/70">
            <div className="animate-pulse h-[16px] w-14 bg-bone rounded-md" />
            <div className="animate-pulse h-9 w-28 bg-bone rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-bone overflow-hidden h-full flex flex-col">
      <div className="animate-pulse aspect-square bg-bone" />
      <div className="px-[9px] pb-2 sm:px-[10px] sm:pb-[10px] pt-2 flex-1 flex flex-col">
        <div className="animate-pulse h-[10px] bg-bone rounded-md mb-[6px]" />
        <div className="animate-pulse h-[10px] w-2/3 bg-bone rounded-md mb-2" />
        <div className="animate-pulse h-[11px] w-16 bg-bone rounded-full mb-2" />
        <div className="mt-auto flex items-end justify-between">
          <div className="animate-pulse h-[14px] w-14 bg-bone rounded-md" />
          <div className="animate-pulse h-7 w-7 bg-bone rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Product Image ─────────────────────────────────────────────────────────────
// Exported as-is — reused by MegaMenuBar and FlashSaleCard for their own
// (differently-proportioned) product tiles.
export function ProductImage({ images, name, className }: { images: string[]; name: string; className?: string }) {
  const [errored, setErrored] = useState(false);
  const src = images[0];

  if (!src || errored) {
    return (
      <div className={clsx('bg-brand-pale-orange flex flex-col items-center justify-center gap-[6px]', className)}>
        <ImageOff size={24} className="text-brand-orange opacity-[0.45]" style={{ display: 'block', flexShrink: 0 }} />
        <span className="text-[9px] text-slate max-w-[80px] text-center leading-[1.4] overflow-hidden">
          {name.slice(0, 20)}{name.length > 20 ? '…' : ''}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={clsx('w-full object-cover block', className)}
    />
  );
}

// ── Star Rating — compact, muted count, matches FlashSaleCard's rating row ────
export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-[5px]">
      <div className="flex items-center gap-[1px]">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={10}
            className={i <= Math.round(rating) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'}
          />
        ))}
      </div>
      <span className="text-[10px] font-semibold text-carbon">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
      {!!count && (
        <span className="text-[10px] text-slate hidden sm:inline">({count})</span>
      )}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
// Shared by every marketplace-style product grid — Marketplace, Education
// Marketplace, Seller Store, and product/search/category listings generally.
// One flat, production-grade tile: framed square image, a single discount
// badge, a tight rating row, and a full-width outlined Add-to-Cart action —
// same visual language as FlashSaleCard's Homepage rail tile, just in a
// grid-card shape instead of a rail-card shape. Fix bugs here once, they're
// fixed everywhere.
export const ProductCard = memo(function ProductCard({ product, onClick, onAddToCart, isAdding, addToCartFailed = false, isWishlisted, isWishlisting, onToggleWishlist, compact = false, layout = 'grid' }: {
  product:          MarketplaceProduct;
  onClick:          (id: string) => void;
  onAddToCart:      (e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => void;
  isAdding:         boolean;
  /** True for a few seconds right after this card's own Add to Cart request
   *  failed (network/API error) — shows a recoverable error state on the
   *  button ("Try Again") instead of silently reverting to idle, the one
   *  state this progression was missing (idle → loading → success → error). */
  addToCartFailed?: boolean;
  isWishlisted:     boolean;
  isWishlisting:    boolean;
  onToggleWishlist: (e: React.MouseEvent, id: string, variantId: string) => void;
  // Denser variant for grids with more/narrower columns — tighter padding and
  // type scale only; the image stays square and the CTA stays icon-only
  // regardless, so there's no narrow-column truncation risk to design around.
  compact?: boolean;
  /** 'list' lays the same card out as a horizontal row (image left, details
   *  right) for the product-header view toggle — same data/sub-elements,
   *  just reflowed, not a separate card design. */
  layout?: 'grid' | 'list';
}) {
  const isList       = layout === 'list';
  const pType        = product.productType ?? product.type ?? 'physical';
  const isPhysical   = pType === 'physical';
  const isEducational = pType === 'educational';
  const isDigital    = !isPhysical;
  const typeLabel    = isPhysical ? 'Physical' : isEducational ? 'Educational' : 'Digital';

  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: previewData, loading: previewLoading, error: previewError, load: loadPreview, reset: resetPreview } = useProductPreview(product._id);
  const openPreview = (e: React.MouseEvent) => { e.stopPropagation(); setPreviewOpen(true); loadPreview(); };
  const closePreview = () => { setPreviewOpen(false); resetPreview(); };

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const openQuickView = (e: React.MouseEvent) => { e.stopPropagation(); setQuickViewOpen(true); };

  // "Added ✓" confirmation — fires once when `isAdding` finishes (true→false),
  // not merely absent. Every other state (idle/adding/out-of-stock) already
  // had a distinct look; this was the one gap — the highest-frequency action
  // on this card gave no positive confirmation once the spinner disappeared.
  const [justAdded, setJustAdded] = useState(false);
  const wasAdding = useRef(false);
  useEffect(() => {
    if (wasAdding.current && !isAdding && !addToCartFailed) {
      setJustAdded(true);
      const t = setTimeout(() => setJustAdded(false), 1500);
      wasAdding.current = isAdding;
      return () => clearTimeout(t);
    }
    wasAdding.current = isAdding;
  }, [isAdding, addToCartFailed]);

  const variants        = product.variants ?? [];

  // Variant preview swatches — real per-variant photos (when a product's
  // variants actually have distinct images), not a fabricated color/size
  // picker. Selecting one only swaps which photo the card shows; the real
  // variant selection still happens on the product page.
  const [activeVariantImage, setActiveVariantImage] = useState<string | null>(null);
  const variantSwatchImages = Array.from(new Set(
    variants.map(v => v.images?.[0]).filter((img): img is string => Boolean(img)),
  ));
  const showVariantSwatches = !isList && variantSwatchImages.length > 1;
  const activeImageSrc = activeVariantImage ?? product.images?.[0];
  const secondImage = !activeVariantImage ? (product.images ?? [])[1] : undefined;
  const defaultVariant = variants.find(v => v.isDefault) ?? variants[0];
  const nativeLowestPrice = variants.length > 0
    ? Math.min(...variants.map(v => v.price))
    : null;
  const nativeCompareAt = defaultVariant?.compareAtPrice ?? null;
  const ratingCount = product.totalRatings ?? 0;
  const vId         = defaultVariant?._id ?? '';
  const nativeSubscriberPrice = defaultVariant?.subscriberPrice;
  const discountPercent = defaultVariant?.discountPercent;

  // Every price is converted from this product's own native (store)
  // currency into the buyer's currently-selected display currency — this is
  // what makes the navbar PKR/USD switch actually change what's shown here,
  // not just its symbol. Real checkout amounts are computed fresh
  // server-side regardless; this conversion is purely for display before
  // any checkout exists.
  const { currency: displayCurrency, convert } = useCurrencyPreference();
  const nativeCurrency = defaultVariant?.currency;
  const lowestPrice = nativeLowestPrice != null ? convert(nativeLowestPrice, nativeCurrency) : null;
  const compareAt = nativeCompareAt != null ? convert(nativeCompareAt, nativeCurrency) : null;
  const subscriberPrice = nativeSubscriberPrice != null ? convert(nativeSubscriberPrice, nativeCurrency) : undefined;
  const priceSymbol = currencySymbol(displayCurrency);
  const pctOff = compareAt != null && lowestPrice != null && compareAt > lowestPrice
    ? Math.round((1 - lowestPrice / compareAt) * 100)
    : null;
  // Stock tracking only applies to physical goods with tracking enabled —
  // digital/educational products, and any physical variant the seller marked
  // unlimitedStock, are always available. Previously this fell through to
  // `?? 0`, which read an untracked (unlimitedStock) variant's stock as 0 and
  // incorrectly showed it as out of stock / disabled Add to Cart.
  const stock = isDigital || defaultVariant?.unlimitedStock ? Infinity : (defaultVariant?.stock ?? 0);

  // Two distinct signals, both worth surfacing: a plain compareAtPrice
  // markdown (this item itself is discounted) and an active platform/seller
  // sale campaign (a time-boxed event this item is part of) — a flame marks
  // the campaign badge so it doesn't read as a duplicate of the plain one.
  // A no-discount "featured" campaign with no value isn't essential enough
  // to earn a badge on its own.
  const campaign = product.activeCampaign;
  const campaignAmount = campaign?.discountType && campaign.discountValue != null
    ? (campaign.discountType === 'percentage'
        ? `${campaign.discountValue}%`
        : `${priceSymbol}${convert(campaign.discountValue, campaign.currency ?? 'USD')}`)
    : null;

  return (
    <>
    <div
      onClick={() => onClick(product._id)}
      className={clsx(
        // No shadow, no hover border-color change — depth/hover signal comes
        // from the lift + the accent bar sweeping in + a warm background tint.
        'group relative bg-white hover:bg-brand-pale-orange/[0.15] rounded-2xl border border-bone overflow-hidden cursor-pointer',
        'transition-[transform,background-color] duration-300 ease-out',
        'hover:-translate-y-[4px]',
        isList ? 'flex flex-row items-stretch' : 'h-full flex flex-col',
      )}
    >
      {/* Accent bar — sweeps in on hover, same language used across the
          homepage's cards; the hover signal instead of a shadow or a
          border-color change. */}
      <div className={clsx(
        'absolute top-0 left-0 h-[3px] bg-gradient-to-r from-brand-orange to-brand-deep-orange scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 z-[1]',
        isList ? 'w-[3px] h-full top-0 bottom-0 left-0 scale-y-0 scale-x-100 group-hover:scale-y-100 origin-top' : 'w-full',
      )} />

      {/* Image — full-bleed to the card's own rounded top corners (parent's
          overflow-hidden clips it), Amazon/Alibaba-style rather than an inset frame. */}
      <div className={clsx('relative shrink-0', isList ? 'w-[112px] sm:w-[168px]' : '')}>
        <div className={clsx('relative overflow-hidden bg-bone', isList ? 'w-full h-full' : 'aspect-square')}>
          <ProductImage
            images={activeImageSrc ? [activeImageSrc] : []}
            name={product.name}
            className={clsx(
              'absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out',
              secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-[1.06]',
            )}
          />
          {/* Second-image swap on hover — real product photo, not a fake effect;
              only rendered when the product actually has a second image and no
              variant swatch is actively selected. */}
          {secondImage && (
            <img
              src={secondImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-0 scale-[1.03] transition-opacity duration-500 ease-out group-hover:opacity-100"
            />
          )}

          {/* Variant swatches — real per-variant photos, fade out on hover so
              they never collide with the Quick View bar sliding up. */}
          {showVariantSwatches && (
            <div className="absolute bottom-2 right-2 flex items-center gap-[3px] transition-opacity duration-200 group-hover:opacity-0">
              {variantSwatchImages.slice(0, 2).map((img) => (
                <button
                  key={img}
                  onClick={e => { e.stopPropagation(); setActiveVariantImage(img); }}
                  aria-label="View this variant"
                  className={clsx(
                    'w-6 h-6 rounded-[6px] overflow-hidden border-2 cursor-pointer',
                    activeImageSrc === img ? 'border-brand-orange' : 'border-white',
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {variantSwatchImages.length > 2 && (
                <span className="w-6 h-6 rounded-[6px] bg-carbon/75 text-white text-[9px] font-bold flex items-center justify-center">
                  +{variantSwatchImages.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Quick View — reveals on hover, opens a modal with the data already
              on this card (no extra fetch). Desktop-hover affordance; still
              reachable via the card's own click on touch. */}
          {!isList && (
            <button
              onClick={openQuickView}
              aria-label="Quick view"
              className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 flex items-center justify-center gap-[6px] py-[7px] bg-carbon/80 backdrop-blur-sm text-white text-[10.5px] font-semibold border-none cursor-pointer transition-transform duration-[250ms] ease-out"
            >
              <ScanEye size={13} /> Quick View
            </button>
          )}
        </div>

        {/* Top-left: product type + discount/campaign badge(s), stacked —
            plain markdown in red, live sale campaign in orange with a flame. */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          <span className={clsx(
            'px-[6px] py-[2px] rounded-md text-[9px] font-bold tracking-[0.01em] border',
            isEducational
              ? 'bg-info-bg text-info border-info/25'
              : isDigital
                ? 'bg-[#ede9fe] text-[#7c3aed] border-[#ddd6fe]'
                : 'bg-brand-pale-orange text-brand-deep-orange border-[#f5d0bc]',
          )}>
            {typeLabel}
          </span>
          {pctOff != null && pctOff > 0 && (
            <span className="px-[6px] py-[2px] rounded-md text-[9px] font-bold bg-error text-white">
              -{pctOff}%
            </span>
          )}
          {campaignAmount && (
            <span
              title={campaign ? `${campaign.name} — ends ${new Date(campaign.endDate).toLocaleDateString()}` : undefined}
              className="flex items-center gap-[3px] px-[6px] py-[2px] rounded-md text-[9px] font-bold bg-brand-orange text-white"
            >
              <Flame size={10} className="fill-white shrink-0" />
              -{campaignAmount}
            </span>
          )}
        </div>

        {/* Top-right: wishlist — small, always reachable (not hover-only, so it works on touch) */}
        <button
          onClick={e => onToggleWishlist(e, product._id, vId)}
          disabled={isWishlisting}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={clsx(
            'absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-bone',
            'flex items-center justify-center transition-[transform,background-color] duration-150 hover:bg-brand-pale-orange hover:scale-[1.08]',
            isWishlisting ? 'cursor-wait' : 'cursor-pointer',
          )}
        >
          <Heart
            key={isWishlisted ? 'on' : 'off'}
            size={13}
            className={clsx('heart-pop transition-colors duration-150', isWishlisted ? 'text-[#e11d48] fill-[#e11d48]' : 'text-slate')}
          />
        </button>

        {/* Preview — digital/educational only, same size/position language as wishlist */}
        {isDigital && product.digital?.previewAvailable && (
          <button
            onClick={openPreview}
            disabled={previewLoading}
            aria-label="Preview"
            className={clsx(
              'absolute bottom-2 left-2 w-7 h-7 rounded-full bg-white border border-bone',
              'flex items-center justify-center transition-[transform,background-color] duration-150 hover:bg-brand-pale-orange hover:scale-[1.08]',
              previewLoading ? 'cursor-wait' : 'cursor-pointer',
            )}
          >
            {previewLoading ? <Loader2 size={13} className="text-brand-orange animate-spin" /> : <Eye size={13} className="text-brand-orange" />}
          </button>
        )}
      </div>

      {/* Body — Title / Seller / Rating / Price row / Add to Cart. Tags dropped
          entirely here (not part of the compact card layout) to keep the card
          short; still shown in Quick View for anyone who wants that detail. */}
      <div className={clsx(
        'flex-1 flex min-w-0',
        isList ? 'flex-col justify-center gap-[3px] p-3 sm:p-4' : clsx('flex-col pt-2', compact ? 'px-[9px] pb-2' : 'px-[9px] pb-2 sm:px-[10px] sm:pb-[10px]'),
      )}>
        <p className={clsx('font-semibold text-carbon leading-[1.3] tracking-[-0.01em]', isList ? 'text-[13px] sm:text-[14px] line-clamp-1' : clsx('mb-[2px] line-clamp-2', compact ? 'text-[11.5px]' : 'text-[12px]'))}>
          {product.name}
        </p>

        {!compact && !isList && product.description && (
          <p className="text-[9.5px] text-slate/85 leading-[1.35] line-clamp-1 mb-1">
            {product.description}
          </p>
        )}

        {!compact && product.sellerName && (
          <p className={clsx('flex items-center gap-[4px] text-[10px] text-slate truncate', isList ? '' : 'mb-1')}>
            <Store size={9} className="text-slate/60 shrink-0" />
            {product.sellerName}
            {product.sellerVerified && (
              <BadgeCheck size={11} className="text-brand-orange fill-brand-pale-orange shrink-0" />
            )}
          </p>
        )}

        <div className="flex items-center justify-between gap-[6px]">
          <div className="flex items-center gap-[6px] min-w-0">
            <StarRating rating={product.averageRating} count={ratingCount} />
            {!compact && product.purchaseCount > 0 && (
              <span className="text-[9.5px] text-slate hidden sm:inline whitespace-nowrap">· {product.purchaseCount}+ sold</span>
            )}
          </div>
          {/* Stock status — merged into the rating row instead of its own
              paragraph line, so real inventory signal doesn't cost extra height. */}
          {!compact && (
            <span className={clsx(
              'shrink-0 text-[9px] font-bold px-[6px] py-[1.5px] rounded-full whitespace-nowrap',
              stock <= 0 ? 'bg-error-bg text-error' : stock <= 5 ? 'bg-warning-bg text-warning' : 'bg-success-bg text-success',
            )}>
              {stock <= 0 ? 'Out of stock' : stock <= 5 ? `${stock} left` : 'In Stock'}
            </span>
          )}
        </div>

        {subscriberPrice != null && (
          <p className="text-[9px] font-semibold text-brand-orange mt-[3px]">Members save {discountPercent}%</p>
        )}

        <div className={clsx('flex items-center gap-3 min-w-0', isList ? 'justify-between flex-wrap mt-2 pt-2 border-t border-bone/70' : 'justify-start mt-auto pt-2')}>
          <div className="flex items-baseline gap-[5px] min-w-0">
            <span className={clsx('font-bold whitespace-nowrap tracking-tight', compact ? 'text-[14px]' : 'text-[14px] sm:text-[16px]', subscriberPrice != null ? 'text-brand-orange' : 'text-carbon')}>
              {subscriberPrice != null ? `${priceSymbol} ${subscriberPrice.toLocaleString()}` : lowestPrice != null ? `${priceSymbol} ${lowestPrice.toLocaleString()}` : '—'}
            </span>
            {subscriberPrice != null && lowestPrice != null ? (
              <span className="text-[10px] text-slate/70 line-through shrink-0">{priceSymbol} {lowestPrice.toLocaleString()}</span>
            ) : compareAt != null && compareAt > (lowestPrice ?? 0) && (
              <span className="text-[10px] text-slate/70 line-through shrink-0">{priceSymbol}{compareAt.toLocaleString()}</span>
            )}
          </div>

          {/* Add to Cart — full-width beneath the price in the standard grid
              card. Compact grids keep a small icon-only square docked to the
              right; list rows keep a labeled button docked to the row's end. */}
          {isList && (
            <button
              onClick={e => onAddToCart(e, product._id, vId, isPhysical ? 'physical' : 'digital')}
              disabled={stock <= 0}
              aria-label={stock <= 0 ? 'Out of stock' : 'Add to cart'}
              className={clsx(
                'flex items-center justify-center gap-[6px] rounded-lg border transition-colors duration-150 font-semibold text-[12px] h-9 px-4 shrink-0',
                stock <= 0
                  ? 'bg-bone text-slate border-bone cursor-not-allowed'
                  : addToCartFailed
                    ? 'bg-error-bg text-error border-error/40 hover:bg-error hover:text-white cursor-pointer'
                    : justAdded
                      ? 'bg-success text-white border-success'
                      : 'bg-brand-pale-orange/40 text-brand-deep-orange border-brand-orange/70 hover:bg-brand-orange hover:text-white active:scale-[0.98] cursor-pointer',
              )}
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : addToCartFailed ? <AlertCircle size={14} /> : justAdded ? <Check size={14} /> : <ShoppingCart size={14} />}
              <span className="whitespace-nowrap">{stock <= 0 ? 'Sold Out' : isAdding ? 'Adding…' : addToCartFailed ? 'Try Again' : justAdded ? 'Added' : 'Add to Cart'}</span>
            </button>
          )}
        </div>

        {!isList && (
          <div className={clsx('flex items-stretch gap-[6px] mt-2', compact && 'justify-end')}>
            <button
              onClick={e => onAddToCart(e, product._id, vId, isPhysical ? 'physical' : 'digital')}
              disabled={stock <= 0}
              aria-label={stock <= 0 ? 'Out of stock' : 'Add to cart'}
              className={clsx(
                'flex items-center justify-center gap-[6px] rounded-lg border transition-[background-color,border-color,color,transform] duration-150 font-semibold text-[11.5px] active:scale-[0.96]',
                compact ? 'w-7 h-7' : 'flex-1 h-8',
                stock <= 0
                  ? 'bg-bone text-slate border-bone cursor-not-allowed'
                  : addToCartFailed
                    ? 'bg-error-bg text-error border-error/40 hover:bg-error hover:text-white cursor-pointer'
                    : justAdded
                      ? 'bg-success text-white border-success'
                      : 'bg-brand-pale-orange/40 text-brand-deep-orange border-brand-orange/70 hover:bg-brand-orange hover:text-white cursor-pointer',
              )}
            >
              {isAdding ? <Loader2 size={13} className="animate-spin" /> : addToCartFailed ? <AlertCircle size={13} /> : justAdded ? <Check size={13} /> : <ShoppingCart size={13} />}
              {!compact && (
                <span className="whitespace-nowrap">
                  {stock <= 0 ? 'Sold Out' : isAdding ? 'Adding…' : addToCartFailed ? 'Try Again' : justAdded ? 'Added' : 'Add to Cart'}
                </span>
              )}
            </button>
            {/* Persistent Quick View — same action as the image's hover-reveal
                bar, but always reachable, which matters on touch devices
                that have no hover state at all. */}
            {!compact && (
              <button
                onClick={openQuickView}
                aria-label="Quick view"
                className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-bone text-charcoal bg-white hover:bg-brand-pale-orange hover:text-brand-orange transition-colors duration-150 cursor-pointer"
              >
                <ScanEye size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {quickViewOpen && (
      <Modal title="Quick View" onClose={() => setQuickViewOpen(false)} width={680} mobileSheet>
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-full sm:w-[240px] shrink-0 aspect-[4/5] rounded-xl overflow-hidden bg-bone border border-bone">
            <ProductImage images={product.images ?? []} name={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="hidden sm:block w-px shrink-0 bg-[#f0ede5]" />

          <div className="flex-1 min-w-0 flex flex-col">
            <span className={clsx(
              'self-start px-[7px] py-[2px] rounded-md text-[9.5px] font-bold tracking-[0.01em] border mb-2',
              isEducational
                ? 'bg-info-bg text-info border-info/25'
                : isDigital
                  ? 'bg-[#ede9fe] text-[#7c3aed] border-[#ddd6fe]'
                  : 'bg-brand-pale-orange text-brand-deep-orange border-[#f5d0bc]',
            )}>
              {typeLabel}
            </span>
            <p className="text-[16px] font-bold text-carbon leading-snug mb-1">{product.name}</p>
            {product.sellerName && (
              <p className="flex items-center gap-[4px] text-[12px] text-slate mb-2">
                <Store size={11} className="text-slate/60 shrink-0" /> {product.sellerName}
                {product.sellerVerified && <BadgeCheck size={13} className="text-brand-orange fill-brand-pale-orange shrink-0" />}
              </p>
            )}
            <StarRating rating={product.averageRating} count={ratingCount} />

            {product.description && (
              <p className="text-[12px] text-slate leading-relaxed mt-2 line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-cream border border-bone px-3 py-[10px] mt-3">
              <div className="flex items-baseline gap-[6px]">
                <span className={clsx('font-bold text-[22px] tracking-tight', subscriberPrice != null ? 'text-brand-orange' : 'text-carbon')}>
                  {subscriberPrice != null ? `${priceSymbol} ${subscriberPrice.toLocaleString()}` : lowestPrice != null ? `${priceSymbol} ${lowestPrice.toLocaleString()}` : '—'}
                </span>
                {compareAt != null && compareAt > (lowestPrice ?? 0) && (
                  <span className="text-[13px] text-slate/70 line-through">{priceSymbol}{compareAt.toLocaleString()}</span>
                )}
              </div>
              <span className={clsx(
                'shrink-0 px-[8px] py-[3px] rounded-full text-[10.5px] font-semibold',
                stock <= 0 ? 'bg-error-bg text-error' : stock <= 5 ? 'bg-amber-50 text-amber-600' : 'bg-success-bg text-success',
              )}>
                {stock <= 0 ? 'Out of stock' : stock <= 5 ? `Only ${stock} left` : 'In stock'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={e => { onAddToCart(e, product._id, vId, isPhysical ? 'physical' : 'digital'); }}
                disabled={stock <= 0}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-[7px] rounded-lg border h-11 font-semibold text-[13px] transition-colors duration-150',
                  stock <= 0
                    ? 'bg-bone text-slate border-bone cursor-not-allowed'
                    : addToCartFailed
                      ? 'bg-error text-white border-error hover:bg-error/90 cursor-pointer'
                      : justAdded
                        ? 'bg-success text-white border-success'
                        : 'bg-brand-orange text-white border-brand-orange hover:bg-brand-deep-orange cursor-pointer',
                )}
              >
                {isAdding ? <Loader2 size={15} className="animate-spin" /> : addToCartFailed ? <AlertCircle size={15} /> : justAdded ? <Check size={15} /> : <ShoppingCart size={15} />}
                {stock <= 0 ? 'Sold Out' : isAdding ? 'Adding…' : addToCartFailed ? 'Try Again' : justAdded ? 'Added to Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => { setQuickViewOpen(false); onClick(product._id); }}
                className="flex items-center justify-center gap-[6px] rounded-lg border border-bone h-11 px-4 text-[13px] font-semibold text-charcoal bg-white hover:bg-cream transition-colors duration-150 cursor-pointer"
              >
                View Full Details
              </button>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#f0ede5] text-[11px] text-slate">
              <span className="flex items-center gap-[5px]"><ShieldCheck size={13} className="text-success shrink-0" /> Secure checkout</span>
              {isPhysical && <span className="flex items-center gap-[5px]"><Truck size={13} className="text-brand-orange shrink-0" /> Fast delivery</span>}
              <span className="flex items-center gap-[5px]"><RotateCcw size={13} className="text-brand-orange shrink-0" /> Easy returns</span>
            </div>
          </div>
        </div>
      </Modal>
    )}

    {previewOpen && (
      <Modal title="Preview" onClose={closePreview} width={560} mobileSheet>
        {previewLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-slate">
            <Loader2 size={16} className="animate-spin" /> Loading preview…
          </div>
        )}
        {!previewLoading && previewError && (
          <p className="text-[13px] text-error text-center py-10">{previewError}</p>
        )}
        {!previewLoading && !previewError && previewData?.type === 'pdf' && (
          <div className="flex flex-col gap-3">
            {previewData.pages.map((url, i) => (
              <img key={i} src={url} alt={`Preview page ${i + 1}`} className="w-full rounded-lg border border-bone" />
            ))}
          </div>
        )}
        {!previewLoading && !previewError && previewData?.type === 'image' && (
          <img src={previewData.url} alt="Preview" className="w-full rounded-lg border border-bone" />
        )}
        {!previewLoading && !previewError && previewData?.type === 'video' && (
          <video src={previewData.url} controls className="w-full rounded-lg" />
        )}
        {!previewLoading && !previewError && previewData?.type === 'audio' && (
          <audio src={previewData.url} controls className="w-full" />
        )}
      </Modal>
    )}
    </>
  );
});
