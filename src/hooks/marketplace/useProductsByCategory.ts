import { useState, useEffect } from 'react';
import { apiGetAllProducts, type MarketplaceProduct } from '@/api/commerce/marketplace';

export function useProductsByCategory(page = 1, limit = 10) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetAllProducts(page, limit)
      .then(res => {
        if (!cancelled) {
          setProducts(res.data.products);
          setTotal(res.data.total);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit]);

  return { products, total, loading, error };
}
