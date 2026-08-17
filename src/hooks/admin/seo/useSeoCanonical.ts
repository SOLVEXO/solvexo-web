import { useCallback, useState } from 'react';
import {
  apiListSeoCanonicalRules,
  apiCreateSeoCanonicalRule,
  apiUpdateSeoCanonicalRule,
  apiDeleteSeoCanonicalRule,
  type CanonicalRulesListParams,
  type CreateCanonicalRulePayload,
  type UpdateCanonicalRulePayload,
} from '@/api/services/seo/admin/canonical.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoCanonicalRules(params: CanonicalRulesListParams) {
  return useAnalyticsQuery(apiListSeoCanonicalRules, params);
}

export function useSeoCanonicalRuleMutations() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createRule = useCallback(async (payload: CreateCanonicalRulePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiCreateSeoCanonicalRule(payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create canonical rule.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRule = useCallback(async (id: string, payload: UpdateCanonicalRulePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoCanonicalRule(id, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update canonical rule.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiDeleteSeoCanonicalRule(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete canonical rule.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { createRule, updateRule, deleteRule, submitting, error };
}
