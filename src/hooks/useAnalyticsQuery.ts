import { useCallback, useEffect, useState } from 'react';

/**
 * Generic data-fetching hook shared by every analytics endpoint (admin + seller) — one
 * `{data, loading, error, refetch}` loader instead of duplicating the same
 * useEffect/useState wiring per endpoint (mirrors the pattern already used in
 * `useAdminFaqs`/`useGetStore`, generalized over the fetcher + params).
 */
export function useAnalyticsQuery<TData, TParams extends object>(
  fetcher: (params: TParams) => Promise<{ data: TData }>,
  params: TParams,
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Params are plain filter objects rebuilt every render — key on their JSON
  // shape so the effect only re-runs when the actual filter values change.
  const paramsKey = JSON.stringify(params);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return fetcher(params)
      .then(res => setData(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load analytics.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}
