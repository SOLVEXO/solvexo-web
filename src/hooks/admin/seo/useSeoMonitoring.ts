import { useCallback, useState } from 'react';
import {
  apiGetSeoCrawlLogs,
  apiGetSeoCrawlStats,
  apiGetSeoIndexSnapshots,
  apiRefreshSeoIndexSnapshots,
  apiGetSeoCwv,
  apiRefreshSeoCwv,
  type CrawlLogsParams,
} from '@/api/services/seo/admin/monitoring.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoCrawlLogs(params: CrawlLogsParams) {
  return useAnalyticsQuery(apiGetSeoCrawlLogs, params);
}

export function useSeoCrawlStats() {
  return useAnalyticsQuery((_p: Record<string, never>) => apiGetSeoCrawlStats(), {});
}

export function useSeoIndexSnapshots() {
  return useAnalyticsQuery((_p: Record<string, never>) => apiGetSeoIndexSnapshots(), {});
}

export function useSeoCwv() {
  return useAnalyticsQuery((_p: Record<string, never>) => apiGetSeoCwv(), {});
}

export function useSeoMonitoringActions() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const refreshIndexSnapshots = useCallback(async () => {
    setSubmitting(true);
    setError('');
    try {
      await apiRefreshSeoIndexSnapshots();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh index snapshots.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const refreshCwv = useCallback(async (urls: string[]) => {
    setSubmitting(true);
    setError('');
    try {
      await apiRefreshSeoCwv(urls);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh Core Web Vitals.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { refreshIndexSnapshots, refreshCwv, submitting, error };
}
