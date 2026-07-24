import { clsx } from 'clsx';
import { ShoppingCart, Heart, Loader2, Star } from 'lucide-react';
import { ProductImage } from './ProductCard';
import type { MarketplaceProduct } from '@/api/services/marketplace';

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function FlashSaleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-bone overflow-hidden h-full flex flex-col">
      <div className="animate-pulse aspect-square bg-bone" />
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="animate-pulse h-[9px] w-16 bg-bone rounded-full mb-2" />
        <div className="animate-pulse h-[12px] bg-bone rounded-md mb-2" />
        <div className="animate-pulse h-[12px] w-2/3 bg-bone rounded-md mb-3" />
        <div className="mt-auto flex items-end justify-between">
          <div className="animate-pulse h-[18px] w-14 bg-bone rounded-md" />
          <div className="animate-pulse h-9 w-9 bg-bone rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Flash Sale card — a dedicated, image-forward design for the Homepage's
// Flash Sale rail. Deliberately not a ProductCard variant: the proportions
// (dominant portrait image, floating wishlist FAB, circular cart button)
// diverge enough from ProductCard's grid-card layout that forcing them into
// one shared component would mean two designs fighting inside the same
// markup. Same product data, same handlers/signatures as ProductCard —
// only the presentation is different. ──
export function FlashSaleCard({ product, onClick, onAddToCart, isAdding, isWishlisted, isWishlisting, onToggleWishlist }: {
  product:          MarketplaceProduct;
  onClick:          (id: string) => void;
  onAddToCart:      (e: React.MouseEvent, id: string, variantId: string, type: 'physical' | 'digital') => void;
  isAdding:         boolean;
  isWishlisted:     boolean;
  isWishlisting:    boolean;
  onToggleWishlist: (e: React.MouseEvent, id: string, variantId: string) => void;
}) {
  const pType      = product.productType ?? product.type ?? 'physical';
  const isPhysical = pType === 'physical';
  const isDigital  = !isPhysical;
  const typeLabel  = isPhysical ? 'Physical' : pType === 'educational' ? 'Educational' : 'Digital';

  const defaultVariant = product.variants.find(v => v.isDefault) ?? product.variants[0];
  const lowestPrice    = product.variants.length > 0
    ? Math.min(...product.variants.map(v => v.price))
    : null;
  const compareAt   = defaultVariant?.compareAtPrice ?? null;
  const ratingCount = product.totalRatings ?? 0;
  const vId         = defaultVariant?._id ?? '';
  const subscriberPrice = defaultVariant?.subscriberPrice;
  const displayPrice    = subscriberPrice ?? lowestPrice;
  const pctOff = compareAt != null && displayPrice != null && compareAt > displayPrice
    ? Math.round((1 - displayPrice / compareAt) * 100)
    : null;
  const savings = compareAt != null && displayPrice != null && compareAt > displayPrice
    ? compareAt - displayPrice
    : null;
  // Stock tracking only applies to physical goods — digital/educational products are always available.
  const stock = isDigital ? Infinity : (defaultVariant?.stock ?? 0);

  return (
    <div
      onClick={() => onClick(product._id)}
      className="group relative bg-white rounded-2xl border border-bone overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-[3px] hover:border-brand-orange/35"
    >
      {/* Image — square, the card's focal point without dominating the whole card */}
      <div className="relative overflow-hidden aspect-square">
        <ProductImage
          images={product.images ?? []}
          name={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />

        {/* Category badge — compact, opaque (no blur/glass) */}
        <span className={clsx(
          'absolute top-[7px] left-[7px] px-[6px] py-[1.5px] rounded-full text-[8px] font-bold tracking-[0.02em] border bg-white',
          isDigital ? 'text-[#7C3AED] border-[#DDD6FE]' : 'text-brand-deep-orange border-[#F5D0BC]',
        )}>
          {typeLabel}
        </span>

        {/* Discount — premium sale chip */}
        {pctOff != null && pctOff > 0 && (
          <span className="absolute top-[7px] right-[7px] px-[7px] py-[2.5px] rounded-full text-[9px] font-bold bg-error text-white">
            -{pctOff}%
          </span>
        )}

        {/* Wishlist — floating action button, always reachable (no hover-only on touch devices) */}
        <button
          onClick={e => onToggleWishlist(e, product._id, vId)}
          disabled={isWishlisting}
          className={clsx(
            'absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white border border-bone flex items-center justify-center',
            'transition-all duration-200 hover:scale-110 hover:border-brand-orange/40',
            isWishlisting ? 'cursor-wait' : 'cursor-pointer',
          )}
        >
          <Heart
            key={isWishlisted ? 'on' : 'off'}
            size={12}
            className={clsx('heart-pop transition-colors duration-150', isWishlisted ? 'text-[#E11D48] fill-[#E11D48]' : 'text-slate')}
          />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-3.5">
        {/* Rating */}
        <div className="flex items-center gap-[5px] mb-[7px]">
          <div className="flex items-center gap-[1px]">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                size={10}
                className={i <= Math.round(product.averageRating) ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone'}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold text-carbon">
            {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
          </span>
          {ratingCount > 0 && (
            <span className="text-[10px] text-slate">({ratingCount})</span>
          )}
        </div>

        {/* Title — 2 lines max */}
        <p className="text-[12px] font-semibold text-carbon leading-snug line-clamp-2 mb-2">
          {product.name}
        </p>

        {/* Price hierarchy + Add to Cart */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-[6px] flex-wrap">
              <span className={clsx('text-[16px] font-bold tracking-tight', subscriberPrice != null ? 'text-brand-orange' : 'text-carbon')}>
                {displayPrice != null ? `$${displayPrice.toLocaleString()}` : '—'}
              </span>
              {compareAt != null && compareAt > (displayPrice ?? 0) && (
                <span className="text-[10.5px] text-slate line-through">${compareAt.toLocaleString()}</span>
              )}
            </div>
            {savings != null && savings > 0 && (
              <p className="text-[9.5px] font-semibold text-success mt-[2px]">Save ${savings.toLocaleString()}</p>
            )}
            {stock <= 0 ? (
              <p className="text-[9.5px] font-semibold text-error mt-[2px]">Out of stock</p>
            ) : stock <= 5 && (
              <p className="text-[9.5px] font-semibold text-amber-600 mt-[2px]">Only {stock} left</p>
            )}
          </div>

          {/* Add to Cart — compact circular action button */}
          <button
            onClick={e => onAddToCart(e, product._id, vId, isPhysical ? 'physical' : 'digital')}
            disabled={stock <= 0}
            className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200',
              stock <= 0
                ? 'bg-bone border-bone text-slate cursor-not-allowed'
                : 'bg-brand-pale-orange border-brand-pale-orange text-brand-deep-orange hover:opacity-[0.88] hover:scale-105 active:scale-90 cursor-pointer',
            )}
          >
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : <ShoppingCart size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}
