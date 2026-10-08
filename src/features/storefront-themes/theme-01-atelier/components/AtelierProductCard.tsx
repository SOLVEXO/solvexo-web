import { Link } from 'react-router-dom';
import { ImageOff, Heart } from 'lucide-react';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { useStorefrontOptional } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreferenceOptional } from '@/contexts/CurrencyPreferenceContext';
import type { PublicStoreProduct } from '@/api/services/store';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { atelierTheme as t } from '../theme.config';

const CARD_WIDTHS = [320, 480, 640];

/** Theme 01's own product card — portrait ratio, no border, generous
 *  whitespace, price emphasis with the brass accent. Independently
 *  implemented from the legacy `ProductCard.tsx`.
 *
 *  `demo` (default false, every real storefront call site omits it): the
 *  Theme Library's static preview (`themeDemoPreview.ts`) reuses this exact
 *  component — same visual result a real store gets — for a row of
 *  fictional showcase products so the preview reads as a genuinely complete
 *  storefront homepage instead of stopping short at hero/story/testimonials.
 *  Those fictional products have no real `_id`/`slug` a `/product/:slug`
 *  route could resolve, so `demo` swaps the two `<Link>`s for plain
 *  non-navigating wrappers — same markup and classes, just nowhere to
 *  (wrongly) go. */
export function AtelierProductCard({ product, currency, demo = false }: { product: PublicStoreProduct; currency: string; demo?: boolean }) {
  const { isWishlisted, toggleWishlist } = useWishlistContext();
  const inWishlist = product.variantId ? isWishlisted(product._id, product.variantId) : false;
  const symbol = currencySymbol(currency);
  // Prices are stored in the STORE's own currency; `currency` is the buyer's display currency — convert, never
  // print a native amount with the buyer-currency symbol.
  const sf = useStorefrontOptional();
  const cp = useCurrencyPreferenceOptional();
  const nativeCurrency = sf?.store.baseCurrency ?? currency;
  const conv = (n: number) => (cp ? cp.convert(n, nativeCurrency) : n);
  const price = product.defaultVariantPrice;
  // Until the exchange rates have loaded, a converted price would be a guess — show a dash instead of a wrong number.
  const ratesReady = !cp || cp.ratesLoaded || nativeCurrency === cp.currency;
  const displayPrice = price != null && ratesReady ? conv(price) : null;
  const onSale = product.compareAtPrice != null && product.defaultVariantPrice != null && product.compareAtPrice > product.defaultVariantPrice;

  const soldOut = product.inStock === false;
  const second = product.images?.[1];
  const media = product.images?.[0] ? (
    <>
      <img
        src={cloudinaryUrl(product.images[0], 480)}
        srcSet={cloudinarySrcSet(product.images[0], CARD_WIDTHS)}
        sizes="(min-width: 1024px) 25vw, 50vw"
        alt={product.name}
        className={`w-full h-full object-cover transition-transform duration-500 ${t.productImageHover === 'zoom' ? 'group-hover:scale-[1.04]' : ''}`}
        loading="lazy"
      />
      {/* Shopify-style: the second product image fades in on hover. */}
      {second && t.productImageHover === 'second-image' && (
        <img
          src={cloudinaryUrl(second, 480)}
          srcSet={cloudinarySrcSet(second, CARD_WIDTHS)}
          sizes="(min-width: 1024px) 25vw, 50vw"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          loading="lazy"
        />
      )}
    </>
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <ImageOff size={28} style={{ color: t.colors.inkMuted }} />
    </div>
  );
  const title = <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink, fontWeight: 500 }}>{product.name}</p>;

  return (
    <div className="group flex flex-col">
      <div className="relative" style={{ aspectRatio: t.productImageRatio === 'portrait' ? '3/4' : '1/1', background: t.colors.bgAlt, overflow: 'hidden', borderRadius: t.productCardRadiusPx }}>
        {demo ? (
          <div className="block w-full h-full">{media}</div>
        ) : (
          <Link to={`/product/${product.slug}`} className="block w-full h-full">{media}</Link>
        )}
        {(soldOut || onSale) && (
          <span
            className="absolute top-3 left-3 pointer-events-none"
            style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.04em', padding: '4px 9px', background: soldOut ? t.colors.ink : t.colors.accent, color: '#FFFFFF' }}
          >
            {soldOut ? 'Sold out' : 'Sale'}
          </span>
        )}
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
      {demo ? (
        <div className="no-underline mt-3">{title}</div>
      ) : (
        <Link to={`/product/${product.slug}`} className="no-underline mt-3">{title}</Link>
      )}
      <div className="flex items-center gap-2 mt-1">
        <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: onSale ? t.colors.accent : t.colors.inkMuted }}>
          {displayPrice != null ? `${symbol}${fmt2(displayPrice)}` : '—'}
        </span>
        {onSale && ratesReady && product.compareAtPrice != null && (
          <span style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, textDecoration: 'line-through' }}>
            {symbol}{fmt2(conv(product.compareAtPrice))}
          </span>
        )}
      </div>
    </div>
  );
}
