import { useState } from 'react';
import { apiCreateStore, type CreateStorePayload, type StoreData } from '@/api/commerce/store';

export function useCreateStore() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [store,   setStore]   = useState<StoreData | null>(null);

  async function execute(payload: CreateStorePayload): Promise<StoreData | null> {
    setError('');
    setLoading(true);
    try {
      const res = await apiCreateStore(payload);
      setStore(res.data);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error, store };
}
