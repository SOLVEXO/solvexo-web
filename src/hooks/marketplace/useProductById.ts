import { useState, useEffect } from 'react';
import { apiGetProductById, type MarketplaceProduct, type ProductVariant } from '@/api/commerce/marketplace';

interface ProductDetail {
  product:        MarketplaceProduct & { sellerName: string };
  variants:       ProductVariant[];
  defaultVariant: ProductVariant;
}

export function useProductById(id: string) {
  const [detail,  setDetail]  = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetProductById(id)
      .then(res => { if (!cancelled) setDetail(res.data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load product.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { detail, loading, error };
}
