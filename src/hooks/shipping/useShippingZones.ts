import { useState, useEffect, useCallback } from 'react';
import { apiGetShippingZones, type ShippingZone } from '@/api/services/shipping';

export function useShippingZones() {
  const [zones,   setZones]   = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetShippingZones()
      .then(res => { if (!cancelled) setZones(res.data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shipping zones.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return { zones, loading, error, refetch };
}
