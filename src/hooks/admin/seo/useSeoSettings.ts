import { useCallback, useState } from 'react';
import {
  apiGetSeoSettings,
  apiUpdateSeoSettings,
  apiListSeoRules,
  apiCreateSeoRule,
  apiUpdateSeoRule,
  apiDeleteSeoRule,
  type UpdatePlatformSeoSettingsPayload,
  type UpsertSeoRulePayload,
} from '@/api/services/seo/admin/settings.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoSettings() {
  return useAnalyticsQuery((_p: Record<string, never>) => apiGetSeoSettings(), {});
}

export function useUpdateSeoSettings() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateSettings = useCallback(async (payload: UpdatePlatformSeoSettingsPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoSettings(payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SEO settings.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { updateSettings, submitting, error };
}

export function useSeoRules() {
  return useAnalyticsQuery((_p: Record<string, never>) => apiListSeoRules(), {});
}

export function useSeoRuleMutations() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createRule = useCallback(async (payload: UpsertSeoRulePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiCreateSeoRule(payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create SEO rule.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRule = useCallback(async (code: string, payload: Omit<UpsertSeoRulePayload, 'code'>) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoRule(code, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SEO rule.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteRule = useCallback(async (code: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiDeleteSeoRule(code);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete SEO rule.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { createRule, updateRule, deleteRule, submitting, error };
}
