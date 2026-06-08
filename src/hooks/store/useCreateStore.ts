import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCreateStore, type CreateStorePayload, type StoreData } from '@/api/store';

export function useCreateStore() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [store,   setStore]   = useState<StoreData | null>(null);

  async function execute(payload: CreateStorePayload) {
    setError('');
    setLoading(true);
    try {
      const res = await apiCreateStore(payload);
      setStore(res.data);
      navigate('/seller/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error, store };
}
