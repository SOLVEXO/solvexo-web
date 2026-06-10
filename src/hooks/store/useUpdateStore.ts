import { useState } from 'react';
import { apiUpdateStore, type UpdateStorePayload, type StoreData } from '@/api/commerce/store';

export function useUpdateStore() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [store,   setStore]   = useState<StoreData | null>(null);

  async function execute(payload: UpdateStorePayload) {
    setError('');
    setLoading(true);
    try {
      const res = await apiUpdateStore(payload);
      setStore(res.data);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update store.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error, store };
}
