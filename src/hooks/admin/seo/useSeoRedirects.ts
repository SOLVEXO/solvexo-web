import { useCallback, useState } from 'react';
import {
  apiListSeoRedirects,
  apiCreateSeoRedirect,
  apiUpdateSeoRedirect,
  apiDeleteSeoRedirect,
  type RedirectsListParams,
  type CreateRedirectPayload,
  type UpdateRedirectPayload,
} from '@/api/services/seo/admin/redirects.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoRedirects(params: RedirectsListParams) {
  return useAnalyticsQuery(apiListSeoRedirects, params);
}

export function useSeoRedirectMutations() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createRedirect = useCallback(async (payload: CreateRedirectPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiCreateSeoRedirect(payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create redirect.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRedirect = useCallback(async (id: string, payload: UpdateRedirectPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoRedirect(id, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update redirect.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteRedirect = useCallback(async (id: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiDeleteSeoRedirect(id);
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
