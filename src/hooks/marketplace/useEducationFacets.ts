import { useState, useEffect, useCallback } from 'react';
import {
  apiGetEducationFacets,
  type EducationFacetLevel, type EducationFacetOtherLevel,
} from '@/api/services/marketplace';

/** Live Tier-1 (educationLevel) + Tier-2 (normalizedCustomLevel under "other") facet counts — nothing hardcoded. */
export function useEducationFacets() {
  const [levels,      setLevels]      = useState<EducationFacetLevel[]>([]);
  const [otherLevels, setOtherLevels] = useState<EducationFacetOtherLevel[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [error,        setError]      = useState('');
  const [reloadKey,    setReloadKey]  = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetEducationFacets()
      .then(res => {
        if (!cancelled) {
          setLevels(res.data?.levels ?? []);
          setOtherLevels(res.data?.otherLevels ?? []);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load filters.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return { levels, otherLevels, loading, error, refetch };
}
