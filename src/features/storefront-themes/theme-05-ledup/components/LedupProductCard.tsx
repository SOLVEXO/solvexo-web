import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { cardBadgeBox, cardBadgeOf, cardInfoText } from '../../productCardExtras';
import { VendorLink } from '@/features/storefront-themes/core/VendorLink';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { ts } from '@/utils/tStatic';
import { handleOf } from '@/utils/activeStoreText';
import type { PublicStoreProduct } from '@/api/services/store';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLocalize } from '@/hooks/useLocalize';
import { displayMoney, saleInfo } from '../../core/money';
import { baseTheme as b } from '../theme.base';
import { ledupTheme as t } from '../theme.config';
import { useCartDrawer } from '../../cartDrawerContext';

export interface LedupProductCardProps {
  product: PublicStoreProduct;
  currency?: string;
  className?: string;
}

const WATT = /\b\d+(?:[.,]\d+)?\s*W\b/i;
const CCT = /\b\d?CCT\b|\b\d{4}\s*K\b/i;

/** Spec pills come only from what the seller typed (name or tags): nothing is invented. */
function ledupSpecPills(name: string, tags: string[] = [], variants: { options?: { name: string; value: string }[] }[] = []): string[] {
  const hay = [name, ...tags];
  const pick = (re: RegExp) => hay.map(h => h.match(re)?.[0]).find(Boolean);
  // Variant options the seller named like a spec (Power / Watt, CCT / Colour temperature / Kelvin): first value of each.
  const opt = (re: RegExp) => variants.flatMap(v => v.options ?? []).find(o => re.test(o.name))?.value;
  return [pick(WATT) ?? opt(/power|watt|potenc/i), pick(CCT) ?? opt(/cct|kelvin|temperature|temperatura/i)].filter((x): x is string => !!x);
}

export function LedupProductCard({ product, currency, className = '' }: LedupProductCardProps) {
  const { store } = useStorefront();
  const { convert, canConvert, fixedPriceFor, currency: prefCurrency } = useCurrencyPreference();
  const { addToCart } = useCartContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const { isWishlisted, toggleWishlist } = useWishlistContext();
  const localize = useLocalize();
  const p = localize.product(product);

  const shown = currency ?? prefCurrency;
  const base = String(store.baseCurrency ?? shown);
  const to = `/product/${handleOf(product)}`;
  const image = product.images?.[0];
  const price = product.defaultVariantPrice;
  const hasPrice = typeof price === 'number' && price > 0;
  const pills = ledupSpecPills(p.name, product.tags, product.variants);
  const inStock = product.inStock !== false;
  const ref = { productId: product._id, variantId: product.variantId };
  const sale = saleInfo({ currency: shown, convert, canConvert, fixedPriceFor }, price, product.compareAtPrice, base, ref);
  const pct = product.compareAtPrice && price && product.compareAtPrice > price ? Math.round((1 - price / product.compareAtPrice) * 100) : 0;
  const chip = { padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#fff', borderRadius: b.badgeStyle === 'square' ? 6 : 999 } as const;

  const infoText = cardInfoText(product, b.cardInfoLine);
  const ownBadge = cardBadgeOf(product, { bg: t.colors.accent, ink: '#FFFFFF' });

  const wished = product.variantId ? isWishlisted(product._id, product.variantId) : false;
  const heart = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variantId) await toggleWishlist(product._id, product.variantId);
  };
  const center = b.cardTextAlign === 'center';
  const rating = Math.round(product.averageRating ?? 0);

  const quickAdd = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.variantId || !inStock) return;
    const ok = await addToCart(product._id, product.variantId, product.type === 'digital' ? 'digital' : 'physical', 1);
    if (ok && drawerMounted) openDrawer();
  };

  return (
    <article className={`ld-product-card group relative flex flex-col p-4 sm:p-5 ${className}`}>
      <div className="absolute left-3 top-3 z-[1] flex flex-col items-start gap-1">
        {!inStock && b.soldOutBadge && <span style={{ ...chip, background: '#4b423b' }}>{ts('product.soldOut', 'Sold out')}</span>}
        {inStock && b.saleBadge && sale.onSale && pct > 0 && <span style={{ ...chip, background: t.colors.danger }}>{b.saleBadgeText === 'label' ? ts('pg.sale', 'Sale') : `-${pct}%`}</span>}
      </div>
      {ownBadge && (
        <span data-card-badge style={{ ...cardBadgeBox(b.cardBadgePosition, 12, b.cardBadgePosition === 'top-left' && ((!inStock && b.soldOutBadge) || (inStock && b.saleBadge && sale.onSale && pct > 0)) ? 28 : b.cardBadgePosition === 'top-right' && b.cardWishlist && product.variantId ? 38 : 0), ...chip, background: ownBadge.bg, color: ownBadge.ink }}>{ownBadge.text}</span>
      )}
      {b.cardWishlist && product.variantId && (
        <button type="button" onClick={heart} aria-pressed={wished}
          aria-label={wished ? ts('pg.remove_from_wishlist', 'Remove from wishlist') : ts('pg.add_to_wishlist', 'Add to wishlist')}
          className="absolute right-3 top-3 z-[1] flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:border-[var(--ld-accent)]">
          <Heart size={14} fill={wished ? 'currentColor' : 'none'} style={wished ? { color: t.colors.danger } : undefined} />
        </button>
      )}
      <Link to={to} className="relative mx-auto mb-4 block aspect-square w-full max-w-[150px] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-[350ms] ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <span className="text-xs">{ts('ld.noImage', 'No image')}</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className={center ? 'text-center' : undefined}>
          <h3 className="m-0 line-clamp-2 break-words text-[17px] font-medium leading-snug text-[#4b423b]" title={p.name}>
            <Link to={to} className="text-inherit no-underline">{p.name}</Link>
          </h3>
          {b.cardTag && infoText && <p className="mt-1 truncate text-[11px] text-[#a1948c]">{b.cardInfoLine === 'vendor' ? <VendorLink name={product.vendor ?? ''} plain /> : infoText}</p>}
          {b.cardRating && rating > 0 && (
            <p className="m-0 mt-1.5 flex items-center gap-1 text-[12px] text-[#4b423b]" aria-label={ts('reviews.outOf5', '{{value}} out of 5 stars', { value: rating })} style={center ? { justifyContent: 'center' } : undefined}>
              <Star size={12} fill="#FB923C" stroke="#FB923C" aria-hidden /> <bdi>{(product.averageRating ?? 0).toFixed(1)}</bdi>
            </p>
          )}
          {pills.length > 0 && (
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0" style={center ? { justifyContent: 'center' } : undefined}>
              {pills.map(x => <li key={x} className="rounded-full bg-[#f1ede9] px-2.5 py-0.5 text-[11px] text-[#4b423b]"><bdi>{x}</bdi></li>)}
            </ul>
          )}
        </div>

        <div className={`mt-3 flex items-center ${b.cardButton ? 'justify-between' : center ? 'justify-center' : 'justify-start'}`}>
          {hasPrice ? (
            <span className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-[#4b423b]">
              <span>{displayMoney({ currency: shown, convert, canConvert }, price, base, ref)}</span>
              {sale.onSale && <s className="text-xs font-normal text-[#a1948c]">{displayMoney({ currency: shown, convert, canConvert }, sale.compareAmount, base, { ...ref, compare: true })}</s>}
            </span>
          ) : (
            <span className="text-xs font-medium text-stone-500">{ts('ld.datasheet', 'Datasheet')}</span>
          )}
          {b.cardButton && <button
            type="button"
            onClick={quickAdd}
            disabled={!inStock || !product.variantId}
            aria-label={ts('ld.addToCart', 'Add to cart')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-[var(--ld-accent)] hover:bg-[var(--ld-accent)] hover:text-white disabled:opacity-40"
          >
            <ShoppingBag size={14} />
          </button>}
        </div>
      </div>
    </article>
  );
}
