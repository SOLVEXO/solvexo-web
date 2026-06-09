import { useState, useEffect } from 'react';
import { apiGetStoreById, type StoreData } from '@/api/store';

export function useGetStore(id: string) {
  const [store,   setStore]   = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setStore(null);
    apiGetStoreById(id)
      .then(res  => { if (!cancelled) setStore(res.data); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load store.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { store, loading, error };
}
