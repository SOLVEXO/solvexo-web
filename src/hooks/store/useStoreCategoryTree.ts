import { useState, useEffect, useCallback } from 'react';
import { apiGetStoreCategoryTree, type CategoryNode } from '@/api/services/categories';

/** A store's own private category tree — every root category that store has
 *  created (freely, at the seller's own discretion), each with its nested
 *  subcategories (capped at one level deep server-side). Replaces the old
 *  "one fixed main category chosen at onboarding" model. */
export function useStoreCategoryTree(storeId: string | undefined) {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!storeId) { setTree([]); setLoading(false); return; }
    setLoading(true);
    apiGetStoreCategoryTree(storeId)
      .then(res => setTree(res.data ?? []))
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(load, [load]);

  return { tree, loading, refetch: load };
}
