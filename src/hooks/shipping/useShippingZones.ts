import { useState, useEffect, useCallback } from 'react';
import { apiGetShippingZones, type ShippingZone } from '@/api/services/shipping';

// `storeId` (optional) scopes checkout's zone picker to that store's own
// zones, falling back server-side to the platform-wide default set — see
// `apiGetShippingZones`'s own doc comment. Omitted for the legacy multi-store
// marketplace checkout only. `currency` (optional) is the caller's already-
// resolved display currency — passing it makes each zone's price come back
// pre-converted so it matches what will actually be charged.
export function useShippingZones(storeId?: string, currency?: string) {
  const [zones,   setZones]   = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetShippingZones(storeId, currency)
      .then(res => { if (!cancelled) setZones(res.data ?? []); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shipping zones.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, currency, reloadKey]);

  return { zones, loading, error, refetch };
}
