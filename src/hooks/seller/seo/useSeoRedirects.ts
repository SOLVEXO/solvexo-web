import { useCallback, useState } from 'react';
import {
  apiListSeoRedirects,
  apiCreateSeoRedirect,
  apiUpdateSeoRedirect,
  apiDeleteSeoRedirect,
  type RedirectsListParams,
  type CreateRedirectPayload,
  type UpdateRedirectPayload,
} from '@/api/services/seo/seller/redirects.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoRedirects(storeId: string, params: RedirectsListParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & RedirectsListParams) => apiListSeoRedirects(p.storeId, p),
    { storeId, ...params },
  );
}

export function useSeoRedirectMutations() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createRedirect = useCallback(async (storeId: string, payload: CreateRedirectPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiCreateSeoRedirect(storeId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create redirect.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRedirect = useCallback(async (storeId: string, id: string, payload: UpdateRedirectPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoRedirect(storeId, id, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update redirect.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteRedirect = useCallback(async (storeId: string, id: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiDeleteSeoRedirect(storeId, id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete redirect.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { createRedirect, updateRedirect, deleteRedirect, submitting, error };
}
