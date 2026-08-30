import { Link } from 'react-router-dom';
import { ImageOff, Heart } from 'lucide-react';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { currencySymbol, fmt2 } from '@/utils/currency';
import type { PublicStoreProduct } from '@/api/services/store';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { novaTheme as t } from '../theme.config';

const CARD_WIDTHS = [320, 480, 640];

/** Theme 02's own product card — rounded image frame, bold sale badge pill,
 *  accent-colored price. Independently implemented from `AtelierProductCard`
 *  and the legacy `ProductCard.tsx` — its own visual language, same real
 *  data shape and wishlist behavior. */
export function NovaProductCard({ product, currency }: { product: PublicStoreProduct; currency: string }) {
  const { isWishlisted, toggleWishlist } = useWishlistContext();
  const inWishlist = product.variantId ? isWishlisted(product._id, product.variantId) : false;
  const symbol = currencySymbol(currency);
  const price = product.subscriberPrice ?? product.defaultVariantPrice;
  const onSale = product.compareAtPrice != null && product.defaultVariantPrice != null && product.compareAtPrice > product.defaultVariantPrice;

  return (
    <div className="group flex flex-col">
      <div className="relative" style={{ aspectRatio: '1/1', background: t.colors.bgAlt, overflow: 'hidden', borderRadius: t.radius.md }}>
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          {product.images?.[0] ? (
            <img
              src={cloudinaryUrl(product.images[0], 480)}
              srcSet={cloudinarySrcSet(product.images[0], CARD_WIDTHS)}
              sizes="(min-width: 1024px) 25vw, 50vw"
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={28} style={{ color: t.colors.inkMuted }} />
            </div>
          )}
        </Link>
        {onSale && (
          <span
            className="absolute top-3 left-3"
            style={{ fontFamily: t.fonts.body, fontSize: '10.5px', fontWeight: 700, color: t.colors.accentInk, background: t.colors.accent, padding: '4px 10px', borderRadius: '9999px' }}
          >
            SALE
          </span>
        )}
        {product.variantId && (
          <button
            type="button"
            onClick={() => toggleWishlist(product._id, product.variantId!)}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-3 right-3 flex items-center justify-center cursor-pointer border-0"
            style={{ width: '32px', height: '32px', borderRadius: '9999px', background: 'rgba(255,255,255,0.92)' }}
          >
            <Heart size={14} fill={inWishlist ? t.colors.accent : 'none'} color={inWishlist ? t.colors.accent : t.colors.ink} />
          </button>
        )}
      </div>
      <Link to={`/product/${product.slug}`} className="no-underline mt-3">
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink, fontWeight: 600 }}>{product.name}</p>
      </Link>
      <div className="flex items-center gap-2 mt-1">
        <span style={{ fontFamily: t.fonts.display, fontSize: '13.5px', fontWeight: 700, color: onSale ? t.colors.accent : t.colors.ink }}>
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
