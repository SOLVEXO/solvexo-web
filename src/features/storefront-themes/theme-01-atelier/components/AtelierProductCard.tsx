import { Link } from 'react-router-dom';
import { ImageOff, Heart } from 'lucide-react';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { currencySymbol, fmt2 } from '@/utils/currency';
import type { PublicStoreProduct } from '@/api/services/store';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { atelierTheme as t } from '../theme.config';

const CARD_WIDTHS = [320, 480, 640];

/** Theme 01's own product card — portrait ratio, no border, generous
 *  whitespace, price emphasis with the brass accent. Independently
 *  implemented from the legacy `ProductCard.tsx`. */
export function AtelierProductCard({ product, currency }: { product: PublicStoreProduct; currency: string }) {
  const { isWishlisted, toggleWishlist } = useWishlistContext();
  const inWishlist = product.variantId ? isWishlisted(product._id, product.variantId) : false;
  const symbol = currencySymbol(currency);
  const price = product.subscriberPrice ?? product.defaultVariantPrice;
  const onSale = product.compareAtPrice != null && product.defaultVariantPrice != null && product.compareAtPrice > product.defaultVariantPrice;

  return (
    <div className="group flex flex-col">
      <div className="relative" style={{ aspectRatio: '3/4', background: t.colors.bgAlt, overflow: 'hidden' }}>
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          {product.images?.[0] ? (
            <img
              src={cloudinaryUrl(product.images[0], 480)}
              srcSet={cloudinarySrcSet(product.images[0], CARD_WIDTHS)}
              sizes="(min-width: 1024px) 25vw, 50vw"
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={28} style={{ color: t.colors.inkMuted }} />
            </div>
          )}
        </Link>
        {product.variantId && (
          <button
            type="button"
            onClick={() => toggleWishlist(product._id, product.variantId!)}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-3 right-3 flex items-center justify-center cursor-pointer border-0"
            style={{ width: '32px', height: '32px', background: 'rgba(250,248,244,0.9)' }}
          >
            <Heart size={14} fill={inWishlist ? t.colors.accent : 'none'} color={inWishlist ? t.colors.accent : t.colors.ink} />
          </button>
        )}
      </div>
      <Link to={`/product/${product.slug}`} className="no-underline mt-3">
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink, fontWeight: 500 }}>{product.name}</p>
      </Link>
      <div className="flex items-center gap-2 mt-1">
        <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: onSale ? t.colors.accent : t.colors.inkMuted }}>
          {price != null ? `${symbol}${fmt2(price)}` : '—'}
        </span>
        {onSale && product.compareAtPrice != null && (
          <span style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, textDecoration: 'line-through' }}>
            {symbol}{fmt2(product.compareAtPrice)}
          </span>
        )}
      </div>
    </div>
  );
}
