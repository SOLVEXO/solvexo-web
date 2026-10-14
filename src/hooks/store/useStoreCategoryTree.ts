import { useState, useEffect, useCallback } from 'react';
import { apiGetStoreCategoryTree, type CategoryNode } from '@/api/services/categories';

/** A store's own private category tree — every root category that store has
 *  created (freely, at the seller's own discretion), each with its nested
 *  subcategories (capped at one level deep server-side). Replaces the old
 *  "one fixed main category chosen at onboarding" model. `error` is set when
 *  the load fails so a page can show Retry instead of an empty list. */
export function useStoreCategoryTree(storeId: string | undefined) {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!storeId) { setTree([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    apiGetStoreCategoryTree(storeId)
      .then(res => setTree(res.data ?? []))
      .catch(err => { setTree([]); setError(err instanceof Error ? err.message : 'Failed to load categories.'); })
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(load, [load]);

  return { tree, loading, error, refetch: load };
}
