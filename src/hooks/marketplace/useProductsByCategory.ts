import { useState, useEffect, useCallback } from 'react';
import { apiGetAllProducts, type MarketplaceProduct } from '@/api/services/marketplace';

export function useProductsByCategory(
  page = 1, limit = 10, categoryId?: string,
  productType?: 'physical' | 'digital' | 'educational',
  educationLevel?: string, normalizedCustomLevel?: string,
  campaignId?: string,
) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetAllProducts(page, limit, categoryId, productType, educationLevel, normalizedCustomLevel, campaignId)
      .then(res => {
        if (!cancelled) {
          setProducts(res.data?.products ?? []);
          setTotal(res.data?.total ?? 0);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, categoryId, productType, educationLevel, normalizedCustomLevel, campaignId, reloadKey]);

  return { products, total, loading, error, refetch };
}
