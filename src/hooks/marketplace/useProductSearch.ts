import { useState, useEffect, useCallback } from 'react';
import { apiSearchProducts } from '@/api/services/search';
import type { MarketplaceProduct } from '@/api/services/marketplace';

/** Real full-catalog product search (see apiSearchProducts) — used instead of
 *  useProductsByCategory whenever a search term is active, since that hook's
 *  underlying endpoint only ever returns one category-scoped page and was
 *  never meant to be text-filtered client-side against the whole catalog. */
export function useProductSearch(query: string, page = 1, limit = 20) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!query) { setProducts([]); setTotal(0); setLoading(false); setError(''); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    apiSearchProducts(query, page, limit)
      .then(res => {
        if (!cancelled) {
          setProducts(res.data?.products ?? []);
          setTotal(res.data?.total ?? 0);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to search products.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, page, limit, reloadKey]);

  return { products, total, loading, error, refetch };
}
