import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGetStoreCategoryTree, type CategoryNode } from '@/api/services/categories';
import { dropSsr, peekSsr, wantSsr } from '@/utils/ssrData';

/** Key under which a server-rendered page carries a store's category tree. */
export function categoryTreeSsrKey(storeId: string, includeHidden = false): string {
  return `categories:${storeId}:${includeHidden ? 'all' : 'public'}`;
}

/** A store's own private category tree — every root category that store has
 *  created (freely, at the seller's own discretion), each with its nested
 *  subcategories (capped at one level deep server-side). Replaces the old
 *  "one fixed main category chosen at onboarding" model. `error` is set when
 *  the load fails so a page can show Retry instead of an empty list. */
export function useStoreCategoryTree(storeId: string | undefined, includeHidden = false) {
  const ssrKey = storeId ? categoryTreeSsrKey(storeId, includeHidden) : undefined;
  // Server-rendered / inline copy: the first render already has the tree (no skeleton, no request). Used once.
  const [seeded] = useState(() => peekSsr<CategoryNode[]>(ssrKey));
  const skipFirst = useRef(seeded !== undefined);
  const [tree, setTree] = useState<CategoryNode[]>(seeded ?? []);
  const [loading, setLoading] = useState(seeded === undefined);
  const [error, setError] = useState('');

  // Server collecting pass: ask for the tree (no effect runs on the server).
  if (seeded === undefined && storeId) wantSsr(ssrKey, () => apiGetStoreCategoryTree(storeId, includeHidden).then(res => res.data ?? []));

  const load = useCallback(() => {
    if (!storeId) { setTree([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    apiGetStoreCategoryTree(storeId, includeHidden)
      .then(res => setTree(res.data ?? []))
      .catch(err => { setTree([]); setError(err instanceof Error ? err.message : 'Failed to load categories.'); })
      .finally(() => setLoading(false));
  }, [storeId, includeHidden]);

  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; if (ssrKey) dropSsr(ssrKey); return; }
    load();
  }, [load, ssrKey]);

  return { tree, loading, error, refetch: load };
}
