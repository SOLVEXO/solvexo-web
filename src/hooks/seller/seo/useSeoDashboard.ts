import { useCallback, useState } from 'react';
import {
  apiGetSeoDashboard,
  apiGetStoreSeo,
  apiUpdateStoreSeo,
  apiGetSeoChecklist,
  apiUpdateSeoChecklistItem,
  type UpdateSeoMetaPayload,
  type UpdateChecklistItemPayload,
} from '@/api/services/seo/seller/dashboard.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoDashboard(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiGetSeoDashboard(p.storeId),
    { storeId },
  );
}

export function useStoreSeo(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiGetStoreSeo(p.storeId),
    { storeId },
  );
}

export function useUpdateStoreSeo() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateStoreSeo = useCallback(async (storeId: string, payload: UpdateSeoMetaPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateStoreSeo(storeId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update store SEO.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { updateStoreSeo, submitting, error };
}

export function useSeoChecklist(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiGetSeoChecklist(p.storeId),
    { storeId },
  );
}

export function useUpdateSeoChecklistItem() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateChecklistItem = useCallback(async (storeId: string, payload: UpdateChecklistItemPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoChecklistItem(storeId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update checklist item.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { updateChecklistItem, submitting, error };
}
