import { useState, useEffect, useCallback } from 'react';
import { apiListShippingProfiles, type ShippingProfilesData } from '@/api/services/shipping';

interface ProfilesState { key: string; data: ShippingProfilesData | null; error: string }

// Seller's shipping profiles (General + custom) with product/rate counts and the store's ship-from locations.
// Previous data stays on screen while a refetch is in flight (loading is derived from the request key).
export function useShippingProfiles(storeId: string) {
  const [state, setState] = useState<ProfilesState>({ key: '', data: null, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const reqKey = `${storeId}:${reloadKey}`;

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    apiListShippingProfiles(storeId)
      .then(res => { if (!cancelled) setState({ key: reqKey, data: res.data, error: '' }); })
      .catch((err: unknown) => {
        if (!cancelled) setState(prev => ({ key: reqKey, data: prev.data, error: err instanceof Error ? err.message : 'Failed to load shipping profiles.' }));
      });
    return () => { cancelled = true; };
  }, [storeId, reqKey]);

  return { data: state.data, loading: state.key !== reqKey, error: state.error, refetch };
}
