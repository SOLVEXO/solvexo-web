import { useCallback, useEffect, useState } from 'react';
import {
  apiGetStoreVerification, apiGetStoreVerificationRequirements,
  type SellerVerification, type VerificationRequirements,
} from '@/api/services/store';
import { fallbackRequirements } from './verificationForm';

interface Loaded {
  key: string;
  data: SellerVerification | null;
  requirements: VerificationRequirements | null;
  error: string;
}

/** Loads this store's verification (seller only). `quiet` = background read: no automatic error toast.
 *  On reload the previous data stays visible until the new response lands. */
export function useStoreVerification(storeId: string, opts: { enabled?: boolean; quiet?: boolean; withRequirements?: boolean } = {}) {
  const { enabled = true, quiet = false, withRequirements = false } = opts;
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>({ key: '', data: null, requirements: null, error: '' });
  const key = `${storeId}:${tick}`;

  useEffect(() => {
    if (!enabled || !storeId) return;
    let cancelled = false;
    apiGetStoreVerification(storeId, { quiet })
      .then(async res => {
        const v = res.data;
        let req = v.requirements ?? null;
        if (!req && withRequirements) {
          req = await apiGetStoreVerificationRequirements(storeId).then(r => r.data).catch(() => null);
        }
        if (!cancelled) setLoaded({ key, data: v, requirements: req ?? fallbackRequirements(v.country, v.businessType), error: '' });
      })
      .catch(err => {
        if (!cancelled) setLoaded(prev => ({ ...prev, key, error: err instanceof Error ? err.message : 'Could not load your verification.' }));
      });
    return () => { cancelled = true; };
  }, [key, storeId, enabled, quiet, withRequirements]);

  const reload = useCallback(() => setTick(t => t + 1), []);
  return {
    data: loaded.data,
    requirements: loaded.requirements,
    loading: enabled && loaded.key !== key,
    error: loaded.error,
    reload,
  };
}
