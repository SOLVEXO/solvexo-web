import { useState, useEffect } from 'react';
import { apiGetPinnedProducts, apiGetBestSellers, apiGetNewArrivals, apiGetTrendingProducts } from '@/api/services/product';
import type { PublicStoreProduct } from '@/api/services/store';

type Section = 'pinned' | 'bestSellers' | 'newArrivals' | 'trending';

const FETCHERS: Record<Section, (storeId: string) => Promise<{ data: { products: PublicStoreProduct[] } }>> = {
  pinned: apiGetPinnedProducts,
  bestSellers: apiGetBestSellers,
  newArrivals: apiGetNewArrivals,
  trending: apiGetTrendingProducts,
};

/** One of the four storefront promotion sections (pinned/best-sellers/new-arrivals/trending) — all public, no schema of their own. */
export function useStorefrontProductSection(storeId: string | undefined, section: Section) {
  const [products, setProducts] = useState<PublicStoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setProducts([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    FETCHERS[section](storeId)
      .then(res => { if (!cancelled) setProducts(res.data.products ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, section]);

  return { products, loading };
}
