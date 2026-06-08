import { useState, useEffect } from 'react';
import { apiGetMyStores, type MyStoreItem } from '@/api/store';

export function useMyStores() {
  const [stores,  setStores]  = useState<MyStoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    apiGetMyStores()
      .then(res  => setStores(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load stores.'))
      .finally(() => setLoading(false));
  }, []);

  return { stores, loading, error };
}
