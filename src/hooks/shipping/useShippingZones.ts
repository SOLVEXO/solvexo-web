import { useState, useEffect } from 'react';
import { apiGetShippingZones, type ShippingZone } from '@/api/commerce/shipping';

export function useShippingZones() {
  const [zones,   setZones]   = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

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
  }, []);

  return { zones, loading, error };
}
