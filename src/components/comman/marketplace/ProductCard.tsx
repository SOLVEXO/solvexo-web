import { useState, memo } from 'react';
import { clsx } from 'clsx';
import { Modal } from '@/components/comman/ui/Modal';
import { ShoppingCart, Star, Heart, ImageOff, Loader2, Eye, Flame } from 'lucide-react';
import type { MarketplaceProduct } from '@/api/services/marketplace';
import { useProductPreview } from '@/hooks/marketplace/useProductPreview';

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-bone overflow-hidden h-full flex flex-col">
      <div className="animate-pulse aspect-square bg-bone" />
      <div className="p-[10px] sm:p-3 flex-1 flex flex-col">
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
// One flat, production-grade tile: square image, a single discount badge, a
// tight rating row, and a solid circular Add-to-Cart action — same visual
// language as FlashSaleCard's Homepage rail tile, just in a grid-card shape
// instead of a rail-card shape. Fix bugs here once, they're fixed everywhere.
export const ProductCard = memo(function ProductCard({ product, onClick, onAddToCart, isAdding, isWishlisted, isWishlisting, onToggleWishlist, compact = false }: {
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
}) {
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
  const lowestPrice    = variants.length > 0
    ? Math.min(...variants.map(v => v.price))
    : null;
  const compareAt   = defaultVariant?.compareAtPrice ?? null;
  const ratingCount = product.totalRatings ?? 0;
  const vId         = defaultVariant?._id ?? '';
  const subscriberPrice = defaultVariant?.subscriberPrice;
  const discountPercent = defaultVariant?.discountPercent;
  const pctOff = compareAt != null && lowestPrice != null && compareAt > lowestPrice
    ? Math.round((1 - lowestPrice / compareAt) * 100)
    : null;
  // Stock tracking only applies to physical goods — digital/educational products are always available.
  const stock = isDigital ? Infinity : (defaultVariant?.stock ?? 0);

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
      className="@container group relative bg-white rounded-xl border border-bone overflow-hidden h-full flex flex-col cursor-pointer transition-colors duration-200 hover:border-carbon/25"
    >
      {/* Image — square, consistent at every grid density */}
      <div className="relative overflow-hidden aspect-square">
        <ProductImage
          images={product.images ?? []}
          name={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />

        {/* Wishlist — small, always reachable (not hover-only, so it works on touch) */}
        <button
          onClick={e => onToggleWishlist(e, product._id, vId)}
          disabled={isWishlisting}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={clsx(
            'absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-white/95 border border-bone',
            'flex items-center justify-center transition-colors duration-150 hover:border-brand-orange/40',
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
              'absolute bottom-2 left-2 w-7 h-7 rounded-lg bg-white/95 border border-bone',
              'flex items-center justify-center transition-colors duration-150 hover:border-brand-orange/40',
              previewLoading ? 'cursor-wait' : 'cursor-pointer',
            )}
          >
            {previewLoading ? <Loader2 size={13} className="text-brand-orange animate-spin" /> : <Eye size={13} className="text-brand-orange" />}
          </button>
        )}

        {/* Top-left: product type — the one category signal that matters here */}
        <span className={clsx(
          'absolute top-2 left-2 px-[6px] py-[1px] rounded-[4px] text-[9px] font-semibold border',
          isDigital
            ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
            : 'bg-brand-pale-orange text-brand-deep-orange border-[#F5D0BC]',
        )}>
          {typeLabel}
        </span>

        {/* Top-right: discount badge(s) — plain markdown in red, live sale
            campaign in orange with a flame, stacked when both apply. */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {pctOff != null && pctOff > 0 && (
            <span className="px-[6px] py-[2px] rounded-[4px] text-[10px] font-bold bg-error text-white">
              -{pctOff}%
            </span>
          )}
          {campaignAmount && (
            <span
              title={campaign ? `${campaign.name} — ends ${new Date(campaign.endDate).toLocaleDateString()}` : undefined}
              className="flex items-center gap-[3px] px-[6px] py-[2px] rounded-[4px] text-[10px] font-bold bg-brand-orange text-white"
            >
              <Flame size={10} className="fill-white shrink-0" />
              -{campaignAmount}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={clsx('flex-1 flex flex-col', compact ? 'px-[9px] pt-[8px] pb-[9px]' : 'px-[10px] pt-[9px] pb-[10px] sm:px-3 sm:pt-[10px] sm:pb-3')}>
        <p className={clsx('font-semibold text-carbon mb-[5px] leading-[1.3] tracking-[-0.01em] line-clamp-2', compact ? 'text-[11.5px]' : 'text-[12px] sm:text-[13px]')}>
          {product.name}
        </p>

        <StarRating rating={product.averageRating} count={ratingCount} />

        {!compact && (product.tags?.length ?? 0) > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 mt-[6px]">
            {product.tags!.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] px-[5px] py-[1px] rounded-[4px] bg-cream text-slate border border-bone whitespace-nowrap">
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

        <div className="flex items-center justify-between gap-2 mt-auto pt-[9px]">
          <div className="flex items-baseline gap-[5px] min-w-0">
            <span className={clsx('font-bold whitespace-nowrap tracking-tight', compact ? 'text-[15px]' : 'text-[14px] sm:text-[17px]', subscriberPrice != null ? 'text-brand-orange' : 'text-carbon')}>
              {subscriberPrice != null ? `$${subscriberPrice.toLocaleString()}` : lowestPrice != null ? `$${lowestPrice.toLocaleString()}` : '—'}
            </span>
            {subscriberPrice != null && lowestPrice != null ? (
              <span className="text-[10px] text-slate/70 line-through shrink-0">${lowestPrice.toLocaleString()}</span>
            ) : compareAt != null && compareAt > (lowestPrice ?? 0) && (
              <span className="text-[10px] text-slate/70 line-through shrink-0">${compareAt.toLocaleString()}</span>
            )}
          </div>

          {/* Add to Cart — a container query (not a viewport breakpoint)
              decides icon-only vs. icon+label, so it's the card's own
              rendered width that matters, not the screen size. That's the
              only way to get this right regardless of sidebar/column count:
              a "big screen" 4-up grid can still hand this card only ~170px,
              while a narrower screen's 2-up grid can hand it 300px+. Below
              ~240px of card width it's icon-only; at/above that it expands
              to a labeled pill. compact grids stay icon-only always. */}
          <button
            onClick={e => onAddToCart(e, product._id, vId, isPhysical ? 'physical' : 'digital')}
            disabled={stock <= 0}
            aria-label={stock <= 0 ? 'Out of stock' : 'Add to cart'}
            className={clsx(
              'flex items-center justify-center gap-[6px] shrink-0 rounded-lg transition-colors duration-150 font-semibold text-[12px]',
              compact ? 'w-8 h-8' : 'w-8 h-8 @[240px]:w-auto @[240px]:h-9 @[240px]:px-[14px]',
              stock <= 0
                ? 'bg-bone text-slate cursor-not-allowed'
                : 'bg-brand-orange text-white hover:bg-brand-deep-orange active:scale-95 cursor-pointer',
            )}
          >
            {isAdding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
            {!compact && (
              <span className="hidden @[240px]:inline whitespace-nowrap">
                {stock <= 0 ? 'Sold Out' : isAdding ? 'Adding…' : 'Add to Cart'}
              </span>
            )}
          </button>
        </div>
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
