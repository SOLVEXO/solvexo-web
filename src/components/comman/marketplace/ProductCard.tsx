import { useState, memo } from 'react';
import { clsx } from 'clsx';
import { Modal } from '@/components/comman/ui/Modal';
import { ShoppingCart, Star, Heart, ImageOff, Loader2, Eye, Flame, BadgeCheck } from 'lucide-react';
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
      <div className="px-[10px] pb-[10px] sm:px-3 sm:pb-3 pt-[10px] flex-1 flex flex-col">
        <div className="animate-pulse h-[10px] bg-bone rounded-md mb-2" />
        <div className="animate-pulse h-[10px] w-2/3 bg-bone rounded-md mb-[10px]" />
        <div className="animate-pulse h-[11px] w-16 bg-bone rounded-full mb-3" />
        <div className="mt-auto flex items-end justify-between">
          <div className="animate-pulse h-[16px] w-14 bg-bone rounded-md" />
          <div className="animate-pulse h-7 w-7 sm:h-8 sm:w-8 bg-bone rounded-lg" />
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
export const ProductCard = memo(function ProductCard({ product, onClick, onAddToCart, isAdding, isWishlisted, isWishlisting, onToggleWishlist, compact = false, layout = 'grid' }: {
  product:          MarketplaceProduct;
  onClick:          (id: string) => void;
  onAddToCart:      (e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => void;
  isAdding:         boolean;
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
  const isList     = layout === 'list';
  const pType      = product.productType ?? product.type ?? 'physical';
  const isPhysical = pType === 'physical';
  const isDigital  = !isPhysical;
  const typeLabel  = isPhysical ? 'Physical' : pType === 'educational' ? 'Educational' : 'Digital';

  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: previewData, loading: previewLoading, error: previewError, load: loadPreview, reset: resetPreview } = useProductPreview(product._id);
  const openPreview = (e: React.MouseEvent) => { e.stopPropagation(); setPreviewOpen(true); loadPreview(); };
  const closePreview = () => { setPreviewOpen(false); resetPreview(); };

  const variants        = product.variants ?? [];
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
    ? (campaign.discountType === 'percentage' ? `${campaign.discountValue}%` : `$${campaign.discountValue}`)
    : null;

  return (
    <>
    <div
      onClick={() => onClick(product._id)}
      className={clsx(
        'group relative bg-white rounded-xl border border-bone overflow-hidden cursor-pointer',
        'transition-[transform,border-color] duration-300 ease-out',
        'hover:-translate-y-[3px] hover:border-brand-orange/40',
        isList ? 'flex flex-row items-stretch' : 'h-full flex flex-col',
      )}
    >
      {/* Image — full-bleed to the card's own rounded top corners (parent's
          overflow-hidden clips it), Amazon/Alibaba-style rather than an inset frame. */}
      <div className={clsx('relative shrink-0', isList ? 'w-[112px] sm:w-[168px]' : '')}>
        <div className={clsx('relative overflow-hidden bg-bone', isList ? 'w-full h-full' : 'aspect-square')}>
          <ProductImage
            images={product.images ?? []}
            name={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        </div>

        {/* Top-left: product type + discount/campaign badge(s), stacked —
            plain markdown in red, live sale campaign in orange with a flame. */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          <span className={clsx(
            'px-[6px] py-[1px] rounded-md text-[9px] font-semibold border',
            isDigital
              ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
              : 'bg-brand-pale-orange text-brand-deep-orange border-[#F5D0BC]',
          )}>
            {typeLabel}
          </span>
          {pctOff != null && pctOff > 0 && (
            <span className="px-[6px] py-[2px] rounded-md text-[10px] font-bold bg-error text-white">
              -{pctOff}%
            </span>
          )}
          {campaignAmount && (
            <span
              title={campaign ? `${campaign.name} — ends ${new Date(campaign.endDate).toLocaleDateString()}` : undefined}
              className="flex items-center gap-[3px] px-[6px] py-[2px] rounded-md text-[10px] font-bold bg-brand-orange text-white"
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
            'absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white border border-bone',
            'flex items-center justify-center transition-[transform,border-color] duration-150 hover:border-brand-orange/50 hover:scale-[1.06]',
            isWishlisting ? 'cursor-wait' : 'cursor-pointer',
          )}
        >
          <Heart
            key={isWishlisted ? 'on' : 'off'}
            size={13}
            className={clsx('heart-pop transition-colors duration-150', isWishlisted ? 'text-[#E11D48] fill-[#E11D48]' : 'text-slate')}
          />
        </button>

        {/* Preview — digital/educational only, same size/position language as wishlist */}
        {isDigital && product.digital?.previewAvailable && (
          <button
            onClick={openPreview}
            disabled={previewLoading}
            aria-label="Preview"
            className={clsx(
              'absolute bottom-2.5 left-2.5 w-8 h-8 rounded-full bg-white border border-bone',
              'flex items-center justify-center transition-[transform,border-color] duration-150 hover:border-brand-orange/50 hover:scale-[1.06]',
              previewLoading ? 'cursor-wait' : 'cursor-pointer',
            )}
          >
            {previewLoading ? <Loader2 size={13} className="text-brand-orange animate-spin" /> : <Eye size={13} className="text-brand-orange" />}
          </button>
        )}
      </div>

      {/* Body */}
      <div className={clsx(
        'flex-1 flex min-w-0',
        isList ? 'flex-col justify-center gap-[3px] p-3 sm:p-4' : clsx('flex-col', compact ? 'px-[9px] pb-[9px]' : 'px-[10px] pb-[10px] sm:px-3 sm:pb-3'),
      )}>
        <p className={clsx('font-semibold text-carbon leading-[1.35] tracking-[-0.01em]', isList ? 'text-[13px] sm:text-[14px] line-clamp-1' : clsx('mb-[2px] line-clamp-2', compact ? 'text-[11.5px]' : 'text-[12px] sm:text-[13px]'))}>
          {product.name}
        </p>

        {!compact && product.sellerName && (
          <p className={clsx('flex items-center gap-[3px] text-[10px] sm:text-[11px] text-slate truncate', isList ? '' : 'mb-[6px]')}>
            by {product.sellerName}
            {product.sellerVerified && (
              <BadgeCheck size={12} className="text-brand-orange fill-brand-pale-orange shrink-0" />
            )}
          </p>
        )}

        <StarRating rating={product.averageRating} count={ratingCount} />

        {!compact && !isList && (product.tags?.length ?? 0) > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 mt-[6px]">
            {product.tags!.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] px-[5px] py-[1px] rounded-md bg-cream text-slate border border-bone whitespace-nowrap">
                {tag}
              </span>
            ))}
          </div>
        )}

        {subscriberPrice != null && (
          <p className="text-[9px] sm:text-[10px] font-semibold text-brand-orange mt-[5px]">Members save {discountPercent}%</p>
        )}
        {stock <= 0 ? (
          <p className="text-[9px] sm:text-[10px] font-semibold text-error mt-[5px]">Out of stock</p>
        ) : stock <= 5 && (
          <p className="text-[9px] sm:text-[10px] font-semibold text-amber-600 mt-[5px]">Only {stock} left</p>
        )}

        <div className={clsx('flex items-center gap-3 min-w-0', isList ? 'justify-between flex-wrap mt-2 pt-2 border-t border-bone/70' : 'justify-start mt-auto pt-[9px]')}>
          <div className="flex items-baseline gap-[5px] min-w-0">
            <span className={clsx('font-bold whitespace-nowrap tracking-tight', compact ? 'text-[15px]' : 'text-[14px] sm:text-[17px]', subscriberPrice != null ? 'text-brand-orange' : 'text-carbon')}>
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
                  : 'bg-white text-brand-orange border-brand-orange hover:bg-brand-orange hover:text-white active:scale-[0.98] cursor-pointer',
              )}
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
              <span className="whitespace-nowrap">{stock <= 0 ? 'Sold Out' : isAdding ? 'Adding…' : 'Add to Cart'}</span>
            </button>
          )}
        </div>

        {!isList && (
          <button
            onClick={e => onAddToCart(e, product._id, vId, isPhysical ? 'physical' : 'digital')}
            disabled={stock <= 0}
            aria-label={stock <= 0 ? 'Out of stock' : 'Add to cart'}
            className={clsx(
              'flex items-center justify-center gap-[6px] rounded-lg border transition-colors duration-150 font-semibold text-[12px] mt-[9px]',
              compact ? 'w-8 h-8 self-end' : 'w-full h-9',
              stock <= 0
                ? 'bg-bone text-slate border-bone cursor-not-allowed'
                : 'bg-white text-brand-orange border-brand-orange hover:bg-brand-orange hover:text-white active:scale-[0.98] cursor-pointer',
            )}
          >
            {isAdding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
            {!compact && (
              <span className="whitespace-nowrap">
                {stock <= 0 ? 'Sold Out' : isAdding ? 'Adding…' : 'Add to Cart'}
              </span>
            )}
          </button>
        )}
      </div>
    </div>

    {previewOpen && (
      <Modal title="Preview" onClose={closePreview} width={560}>
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
