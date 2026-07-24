import { useState, useCallback } from 'react';
import { apiGetProductPreview, type ProductPreviewData } from '@/api/services/marketplace';

// Lazy — fetched on demand (e.g. a "Preview" button click), not on page load.
export function useProductPreview(productId: string) {
  const [data,    setData]    = useState<ProductPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    apiGetProductPreview(productId)
      .then(res => setData(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load preview.'))
      .finally(() => setLoading(false));
  }, [productId]);

  const reset = useCallback(() => { setData(null); setError(''); }, []);

  return { data, loading, error, load, reset };
}
