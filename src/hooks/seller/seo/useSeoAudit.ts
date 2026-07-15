import { useCallback, useState } from 'react';
import {
  apiRunSeoAudit,
  apiGetLatestSeoAudit,
  apiGetSeoAuditHistory,
  type SeoAuditHistoryParams,
} from '@/api/services/seo/seller/audit.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useLatestSeoAudit(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiGetLatestSeoAudit(p.storeId),
    { storeId },
  );
}

export function useSeoAuditHistory(storeId: string, params: SeoAuditHistoryParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & SeoAuditHistoryParams) => apiGetSeoAuditHistory(p.storeId, p),
    { storeId, ...params },
  );
}

export function useRunSeoAudit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const runAudit = useCallback(async (storeId: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiRunSeoAudit(storeId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start SEO audit.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { runAudit, submitting, error };
}
