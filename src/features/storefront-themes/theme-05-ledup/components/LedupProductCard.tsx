import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { VendorLink } from '@/features/storefront-themes/core/VendorLink';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { handleOf } from '@/utils/activeStoreText';
import type { PublicStoreProduct } from '@/api/services/store';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLocalize } from '@/hooks/useLocalize';
import { displayMoney } from '../../core/money';
import { useCartDrawer } from '../../cartDrawerContext';

export interface LedupProductCardProps {
  product: PublicStoreProduct;
  currency?: string;
  className?: string;
}

const WATT = /\b\d+(?:[.,]\d+)?\s*W\b/i;
const CCT = /\b\d?CCT\b|\b\d{4}\s*K\b/i;

/** Spec pills come only from what the seller typed (name or tags): nothing is invented. */
function ledupSpecPills(name: string, tags: string[] = []): string[] {
  const hay = [name, ...tags];
  const pick = (re: RegExp) => hay.map(h => h.match(re)?.[0]).find(Boolean);
  return [pick(WATT), pick(CCT)].filter((x): x is string => !!x);
}

export function LedupProductCard({ product, currency, className = '' }: LedupProductCardProps) {
  const { store } = useStorefront();
  const { convert, canConvert, currency: prefCurrency } = useCurrencyPreference();
  const { addToCart } = useCartContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const localize = useLocalize();
  const p = localize.product(product);

  const shown = currency ?? prefCurrency;
  const base = String(store.baseCurrency ?? shown);
  const to = `/product/${handleOf(product)}`;
  const image = product.images?.[0];
  const price = product.defaultVariantPrice;
  const hasPrice = typeof price === 'number' && price > 0;
  const pills = ledupSpecPills(p.name, product.tags);
  const inStock = product.inStock !== false;

  const quickAdd = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.variantId || !inStock) return;
    const ok = await addToCart(product._id, product.variantId, product.type === 'digital' ? 'digital' : 'physical', 1);
    if (ok && drawerMounted) openDrawer();
  };

  return (
    <article className={`ld-product-card group relative flex flex-col p-4 sm:p-5 ${className}`}>
      <Link to={to} className="relative mb-4 block aspect-square w-full overflow-hidden rounded-2xl bg-white p-2">
        {image ? (
          <img
            src={image}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-contain transition duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <span className="text-xs">{ts('ld.noImage', 'No image')}</span>
          </div>
        )}
        <span aria-hidden className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 opacity-0 shadow-md backdrop-blur transition-all duration-200 group-hover:opacity-100">
          <ArrowUpRight size={16} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="m-0 line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
            <Link to={to} className="text-inherit no-underline">{p.name}</Link>
          </h3>
          {product.vendor && <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-400"><VendorLink name={product.vendor} plain /></p>}
        </div>

        {pills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
            {pills.map(s => (
              <span key={s} className="ld-chip max-w-[190px] truncate">
                <bdi>{s}</bdi>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
          {hasPrice ? (
            <span className="text-sm font-bold text-stone-900">
              {displayMoney({ currency: shown, convert, canConvert }, price, base, { productId: product._id, variantId: product.variantId })}
            </span>
          ) : (
            <span className="text-xs font-medium text-stone-500">{ts('ld.datasheet', 'Datasheet')}</span>
          )}
          <button
            type="button"
            onClick={quickAdd}
            disabled={!inStock || !product.variantId}
            aria-label={ts('ld.addToCart', 'Add to cart')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-[var(--ld-accent)] hover:bg-[var(--ld-accent)] hover:text-white disabled:opacity-40"
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
