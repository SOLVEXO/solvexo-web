import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGetProductById, type MarketplaceProduct, type ProductVariant } from '@/api/services/marketplace';
import { dropSsr, peekSsr, wantSsr } from '@/utils/ssrData';

interface ProductDetail {
  product:        MarketplaceProduct & { sellerName: string };
  variants:       ProductVariant[];
  defaultVariant: ProductVariant;
  bundle?: { components: { name: string; image: string | null; quantity: number }[]; available: number | null } | null;
}

/** Key under which a server-rendered page carries this product (the id here is the product's URL handle). */
export function productSsrKey(id: string): string { return `product:${id}`; }

export function useProductById(id: string) {
  const ssrKey = id ? productSsrKey(id) : undefined;
  // Server-rendered / inline copy: the first render already shows the product (no skeleton, no request). Used once.
  const [seeded] = useState(() => peekSsr<ProductDetail>(ssrKey));
  const skipFirst = useRef(seeded !== undefined);
  const [detail,  setDetail]  = useState<ProductDetail | null>(seeded ?? null);
  const [loading, setLoading] = useState(seeded === undefined);
  const [error,   setError]   = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  // Server collecting pass: ask for this product (no effect runs on the server).
  if (seeded === undefined && id) wantSsr(ssrKey, () => apiGetProductById(id).then(res => res.data));

  useEffect(() => {
    if (!id) return;
    if (skipFirst.current) { skipFirst.current = false; if (ssrKey) dropSsr(ssrKey); return; }
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
  }, [id, reloadKey, ssrKey]);

  return { detail, loading, error, refetch };
}
