import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic data-fetching hook shared by every analytics endpoint (admin + seller) — one
 * `{data, loading, error, refetch}` loader instead of duplicating the same
 * useEffect/useState wiring per endpoint (mirrors the pattern already used in
 * `useAdminFaqs`/`useGetStore`, generalized over the fetcher + params).
 *
 * Only the LATEST request may write state: when filters change while an older, slower request is still in
 * flight, its late response is ignored instead of overwriting the newer data (or error).
 */
export function useAnalyticsQuery<TData, TParams extends object>(
  fetcher: (params: TParams) => Promise<{ data: TData }>,
  params: TParams,
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);

  // Params are plain filter objects rebuilt every render — key on their JSON
  // shape so the effect only re-runs when the actual filter values change.
  const paramsKey = JSON.stringify(params);

  const load = useCallback(() => {
    const seq = ++requestSeq.current;
    const isLatest = () => seq === requestSeq.current;
    setLoading(true);
    setError('');
    return fetcher(params)
      .then(res => { if (isLatest()) setData(res.data); })
      .catch((err: unknown) => { if (isLatest()) setError(err instanceof Error ? err.message : 'Failed to load analytics.'); })
      .finally(() => { if (isLatest()) setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    load();
    // Unmount / filter change: any response still in flight is now stale.
    return () => { requestSeq.current += 1; };
  }, [load]);

  return { data, loading, error, refetch: load };
}
