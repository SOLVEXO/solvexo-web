import { useState, useEffect, useCallback } from 'react';
import {
  apiListShippingCarriers, apiCreateShippingCarrier, apiUpdateShippingCarrier, apiDeleteShippingCarrier,
  type ShippingCarrier, type ShippingCarrierPayload,
} from '@/api/services/shipping';

export function useShippingCarriers(storeId: string) {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiListShippingCarriers(storeId)
      .then(res => { if (!cancelled) setCarriers(res.data ?? []); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load carriers.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, reloadKey]);

  const create = useCallback(async (payload: ShippingCarrierPayload) => {
    await apiCreateShippingCarrier(storeId, payload);
    refetch();
  }, [storeId, refetch]);

  const update = useCallback(async (carrierId: string, payload: Partial<ShippingCarrierPayload> & { isActive?: boolean }) => {
    await apiUpdateShippingCarrier(storeId, carrierId, payload);
    refetch();
  }, [storeId, refetch]);

  const remove = useCallback(async (carrierId: string) => {
    await apiDeleteShippingCarrier(storeId, carrierId);
    refetch();
  }, [storeId, refetch]);

  return { carriers, loading, error, refetch, create, update, remove };
}
