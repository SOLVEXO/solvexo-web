import { useState, useEffect, useCallback } from 'react';
import {
  apiListStoreShippingZones, apiCreateStoreShippingZone, apiUpdateStoreShippingZone, apiDeleteStoreShippingZone,
  type ShippingZone, type ShippingZonePayload, type ShippingZoneType,
} from '@/api/services/shipping';

// The seller's own management view over their store's zones — every status,
// scoped to one `zoneType` (Zones tab: 'shipping', Local Delivery tab:
// 'local_delivery'). Distinct from the buyer-facing `useShippingZones` hook,
// which only ever returns active zones for checkout.
// `profileRef` (optional): 'general' or a shipping-profile id — only that profile's zones, and new zones are
// created inside it. Omitted = every zone of the store (legacy behaviour).
export function useStoreShippingZones(storeId: string, zoneType: ShippingZoneType, profileRef?: string) {
  const [zones,   setZones]   = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiListStoreShippingZones(storeId, zoneType, profileRef)
      .then(res => { if (!cancelled) setZones(res.data ?? []); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shipping zones.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, zoneType, profileRef, reloadKey]);

  const create = useCallback(async (payload: ShippingZonePayload) => {
    await apiCreateStoreShippingZone(storeId, {
      ...payload,
      zoneType,
      ...(profileRef ? { profileId: profileRef === 'general' ? null : profileRef } : {}),
    });
    refetch();
  }, [storeId, zoneType, profileRef, refetch]);

  const update = useCallback(async (zoneId: string, payload: Partial<ShippingZonePayload>) => {
    await apiUpdateStoreShippingZone(storeId, zoneId, payload);
    refetch();
  }, [storeId, refetch]);

  const remove = useCallback(async (zoneId: string) => {
    await apiDeleteStoreShippingZone(storeId, zoneId);
    refetch();
  }, [storeId, refetch]);

  return { zones, loading, error, refetch, create, update, remove };
}
