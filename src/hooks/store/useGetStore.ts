import { useState, useEffect } from 'react';
import { apiGetStoreById, type StoreData } from '@/api/store';

export function useGetStore(id: string) {
  const [store,   setStore]   = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGetStoreById(id)
      .then(res  => setStore(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load store.'))
      .finally(() => setLoading(false));
  }, [id]);

  return { store, loading, error };
}
