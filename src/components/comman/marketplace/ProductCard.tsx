import { useState, memo } from 'react';
import { clsx } from 'clsx';
import { Card } from '@/components/comman/ui/Card';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { ShoppingCart, Star, Heart, ImageOff, Loader2, Zap, Eye } from 'lucide-react';
import type { MarketplaceProduct } from '@/api/services/marketplace';
import { useProductPreview } from '@/hooks/marketplace/useProductPreview';

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-bone overflow-hidden">
      <div className="animate-pulse h-[130px] sm:h-[160px] lg:h-[180px] bg-bone" />
      <div className="p-2 sm:p-4">
        <div className="animate-pulse h-[12px] bg-bone rounded-[6px] mb-2" />
        <div className="animate-pulse h-[10px] bg-bone rounded-[6px] w-[55%] mb-[10px]" />
        <div className="flex justify-between items-center">
          <div className="animate-pulse h-5 w-14 bg-bone rounded-[6px]" />
          <div className="animate-pulse h-[28px] w-8 sm:w-[86px] bg-bone rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Product Image ─────────────────────────────────────────────────────────────
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
      className={clsx('w-full object-cover block transition-transform duration-500 ease-out group-hover:scale-[1.07]', className)}
    />
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={10}
          className={i <= Math.round(rating) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'}
        />
      ))}
      <span className="text-[10px] font-semibold text-carbon ml-[2px]">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
      {!!count && (
        <span className="text-[10px] text-slate hidden sm:inline">({count})</span>
      )}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
// Shared by the general Marketplace and the Education marketplace — same look
// everywhere a product grid appears, one place to fix bugs (see the isDigital/
// stock computation below, which must treat 'educational' as non-physical too).
export const ProductCard = memo(function ProductCard({ product, onClick, onAddToCart, isAdding, isWishlisted, isWishlisting, onToggleWishlist, compact = false }: {
  product:          MarketplaceProduct;
  onClick:          (id: string) => void;
  onAddToCart:      (e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => void;
  isAdding:         boolean;
  isWishlisted:     boolean;
  isWishlisting:    boolean;
  onToggleWishlist: (e: React.MouseEvent, id: string, variantId: string) => void;
  // Denser variant for grids with more/narrower columns (e.g. Homepage's 6-up Flash
  // Sale) — the "Add to Cart" label is always icon-only here, since a viewport-width
  // media query can't know how narrow this particular grid column actually is, and a
  // narrow column + a shrink-0, non-wrapping button label is exactly what clipped text
  // inside the card's own overflow-hidden.
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

  const defaultVariant = product.variants.find(v => v.isDefault) ?? product.variants[0];
  const lowestPrice    = product.variants.length > 0
    ? Math.min(...product.variants.map(v => v.price))
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

  const campaign = product.activeCampaign;
  const campaignLabel = campaign
    ? (campaign.discountType && campaign.discountValue != null
        ? (campaign.discountType === 'percentage' ? `${campaign.discountValue}% OFF` : `$${campaign.discountValue} OFF`)
        : 'FEATURED')
    : null;

  return (
    <>
    <Card padding="none" hover onClick={() => onClick(product._id)} className="overflow-hidden rounded-[16px] h-full flex flex-col">
      {/* Image container */}
      <div className="relative overflow-hidden group/img">
        <ProductImage
          images={product.images ?? []}
          name={product.name}
          className={clsx(
            'transition-transform duration-500 ease-out group-hover/img:scale-[1.07]',
            compact ? 'h-[104px] sm:h-[124px] lg:h-[138px]' : 'h-[130px] sm:h-[160px] lg:h-[180px]',
          )}
        />

        {/* Hover overlay — dark gradient + Quick View label */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,20,19,0.55)] via-[rgba(20,20,19,0.18)] to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-[10px] opacity-0 group-hover/img:opacity-100 translate-y-[6px] group-hover/img:translate-y-0 transition-all duration-300 pointer-events-none">
          <span className="px-3 py-[4px] rounded-full bg-white/90 text-carbon text-[10.5px] font-semibold tracking-wide backdrop-blur-sm">
            Quick View
          </span>
        </div>

        {/* Wishlist button — bottom-right, out of the way of the top-corner badge stacks */}
        <button
          onClick={e => onToggleWishlist(e, product._id, vId)}
          disabled={isWishlisting}
          className={clsx(
            'absolute bottom-[8px] right-[8px] w-8 h-8 sm:w-9 sm:h-9 rounded-full',
            'bg-[rgba(255,255,255,0.92)] border-none flex items-center justify-center',
            'transition-transform duration-150 hover:scale-[1.15]',
            isWishlisting ? 'cursor-wait' : 'cursor-pointer',
          )}
        >
          <Heart
            key={isWishlisted ? 'on' : 'off'}
            size={13}
            className={clsx('heart-pop transition-[color,fill] duration-150', isWishlisted ? 'text-[#E11D48] fill-[#E11D48]' : 'text-slate fill-none')}
          />
        </button>

        {/* Bottom-left: preview button (digital/educational only) — opens right here, no navigation */}
        {isDigital && product.digital?.previewAvailable && (
          <button
            onClick={openPreview}
            disabled={previewLoading}
            aria-label="Preview"
            className={clsx(
              'absolute bottom-[8px] left-[8px] w-8 h-8 sm:w-9 sm:h-9 rounded-full',
              'bg-[rgba(255,255,255,0.92)] border-none flex items-center justify-center',
              'transition-transform duration-150 hover:scale-[1.15]',
              previewLoading ? 'cursor-wait' : 'cursor-pointer',
            )}
          >
            {previewLoading ? <Loader2 size={13} className="text-brand-orange animate-spin" /> : <Eye size={13} className="text-brand-orange" />}
          </button>
        )}

        {/* Top-left: product type only */}
        <div className="absolute top-[8px] left-[8px]">
          <span className={clsx(
            'px-[6px] py-[2px] rounded-[5px] text-[9px] sm:text-[10px] font-semibold border',
            isDigital
              ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
              : 'bg-brand-pale-orange text-brand-deep-orange border-[#F5D0BC]',
          )}>
            {typeLabel}
          </span>
        </div>

        {/* Top-right: discount badges — split from the type badge so up to
            two of these never has to stack three-deep in one corner. */}
        <div className="absolute top-[8px] right-[8px] flex flex-col gap-[4px] items-end">
          {pctOff != null && pctOff > 0 && (
            <span className={clsx('font-bold bg-[#E11D48] text-white', compact ? 'px-[7px] py-[2px] rounded-full text-[10px]' : 'px-[6px] py-[2px] rounded-[5px] text-[9px] sm:text-[10px]')}>
              -{pctOff}%
            </span>
          )}
          {campaignLabel && (
            <span
              title={campaign ? `${campaign.name} — ends ${new Date(campaign.endDate).toLocaleDateString()}` : undefined}
              className={clsx(
                'flex items-center gap-[3px] font-bold bg-gradient-to-r from-brand-orange to-[#F0A57A] text-white',
                compact ? 'px-[7px] py-[2px] rounded-full text-[9px]' : 'px-[6px] py-[2px] rounded-[5px] text-[9px] sm:text-[10px]',
              )}
            >
              <Zap size={9} className="fill-white shrink-0" />
              {campaignLabel}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={clsx('flex-1 flex flex-col', compact ? 'px-[10px] pt-[10px] pb-[10px]' : 'px-2 pt-2 pb-2 sm:px-[14px] sm:pt-3 sm:pb-[14px]')}>
        <p className={clsx('font-bold text-carbon mb-[3px] leading-[1.35] tracking-[-0.01em] line-clamp-2', compact ? 'text-[11.5px]' : 'text-[12px] sm:text-[13px]')}>
          {product.name}
        </p>
        {!compact && product.sellerName && (
          <p className="hidden sm:block text-[10.5px] text-slate truncate mb-[3px]">by {product.sellerName}</p>
        )}
        <StarRating rating={product.averageRating} count={ratingCount} />
        {/* Fixed-height slot (regardless of tag count, incl. 0 or 10+) so card height stays consistent across the grid */}
        {!compact && (
          <div className="hidden lg:flex flex-wrap gap-1 mt-[6px] h-[22px] overflow-hidden">
            {product.tags?.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-[6px] py-[1px] rounded bg-cream text-slate border border-bone whitespace-nowrap">
                {tag}
              </span>
            ))}
          </div>
        )}
        {subscriberPrice != null && (
          <p className="text-[9px] sm:text-[10px] font-semibold text-brand-orange mt-1">Members save {discountPercent}%</p>
        )}
        {stock <= 0 ? (
          <p className="text-[9px] sm:text-[10px] font-semibold text-error mt-1">Out of stock</p>
        ) : stock <= 5 && (
          <p className="text-[9px] sm:text-[10px] font-semibold text-amber-600 mt-1">Only {stock} left</p>
        )}
        <div className="flex items-center justify-between gap-1 mt-auto pt-[8px] sm:pt-[10px]">
          <div className="flex items-baseline gap-[3px] min-w-0">
            <span className={clsx('font-bold truncate', compact ? 'text-[14px]' : 'text-[13px] sm:text-[15px]', subscriberPrice != null ? 'text-brand-orange' : 'text-carbon')}>
              {subscriberPrice != null ? `$${subscriberPrice.toLocaleString()}` : lowestPrice != null ? `$${lowestPrice.toLocaleString()}` : '—'}
            </span>
            {subscriberPrice != null && lowestPrice != null ? (
              <span className="hidden sm:inline text-[11px] text-slate line-through shrink-0">${lowestPrice.toLocaleString()}</span>
            ) : compareAt != null && compareAt > (lowestPrice ?? 0) && (
              <span className="hidden sm:inline text-[11px] text-slate line-through shrink-0">${compareAt.toLocaleString()}</span>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={stock <= 0}
            onClick={e => onAddToCart(e, product._id, vId, isPhysical ? 'physical' : 'digital')}
            className="inline-flex shrink-0 min-h-9! min-w-9!"
          >
            {isAdding ? <Loader2 size={11} className="animate-spin" /> : <ShoppingCart size={11} />}
            {!compact && <span className="hidden lg:inline">{stock <= 0 ? 'Sold Out' : isAdding ? 'Adding…' : 'Add to Cart'}</span>}
          </Button>
        </div>
      </div>
    </Card>

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
