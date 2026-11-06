import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { apiPublicCartUpsell, type RecommendationCard } from '@/api/services/merchandising';
import { useCartContext } from '@/contexts/CartContext';

/** Headless: the store-enabled cart upsell for these cart products (null = off / empty / loading). */
export function useCartUpsell(storeId: string, productIds: string[]): { title: string; items: RecommendationCard[] } | null {
  const [data, setData] = useState<{ title: string; items: RecommendationCard[] } | null>(null);
  const key = productIds.join(',');
  useEffect(() => {
    if (!storeId || productIds.length === 0) return;
    let cancelled = false;
    apiPublicCartUpsell(storeId, productIds).then(r => { if (!cancelled && r.data.enabled) setData({ title: r.data.title, items: r.data.items }); }).catch(() => undefined);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, key]);
  return data && data.items.length > 0 && productIds.length > 0 ? data : null;
}

/** Cart-page upsell block (seller-configured). Renders nothing when off or empty. The theme passes its own button look. */
export function CartUpsell({ storeId, productIds, buttonClassName = 'rounded-full border px-3 py-1.5 text-sm', buttonStyle, headingClassName = 'm-0 mb-4 text-lg font-medium' }: {
  storeId: string; productIds: string[]; buttonClassName?: string; buttonStyle?: CSSProperties; headingClassName?: string;
}) {
  const { addToCart, adding } = useCartContext();
  const data = useCartUpsell(storeId, productIds);
  if (!data) return null;
  return (
    <section aria-label={data.title} className="mt-10">
      <h2 className={headingClassName}>{data.title}</h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
        {data.items.map(c => (
          <li key={c.id} className="flex flex-col gap-2">
            <Link to={`/product/${c.slug ?? c.id}`} className="block aspect-square overflow-hidden rounded-lg bg-black/5">{c.image && <img src={c.image} alt={c.name} className="size-full object-cover" loading="lazy" />}</Link>
            <span className="truncate text-sm">{c.name}</span>
            <button type="button" className={buttonClassName} style={buttonStyle} disabled={adding === c.variantId} onClick={() => void addToCart(c.id, c.variantId, c.type, 1)}>{ts('product.addToCart', 'Add to cart')}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
