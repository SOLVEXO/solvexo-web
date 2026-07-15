import { useCallback, useState } from 'react';
import {
  apiListSeoLandingPages,
  apiGetSeoLandingPage,
  apiCreateSeoLandingPage,
  apiUpdateSeoLandingPage,
  apiDeleteSeoLandingPage,
  type LandingPagesListParams,
  type CreateLandingPagePayload,
  type UpdateLandingPagePayload,
} from '@/api/services/seo/admin/landingPages.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoLandingPages(params: LandingPagesListParams) {
  return useAnalyticsQuery(apiListSeoLandingPages, params);
}

export function useSeoLandingPage(id: string) {
  return useAnalyticsQuery(
    (p: { id: string }) => apiGetSeoLandingPage(p.id),
    { id },
  );
}

export function useSeoLandingPageMutations() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createLandingPage = useCallback(async (payload: CreateLandingPagePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiCreateSeoLandingPage(payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create landing page.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateLandingPage = useCallback(async (id: string, payload: UpdateLandingPagePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoLandingPage(id, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update landing page.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteLandingPage = useCallback(async (id: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiDeleteSeoLandingPage(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete landing page.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { createLandingPage, updateLandingPage, deleteLandingPage, submitting, error };
}
