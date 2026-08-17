import { useCallback, useState } from 'react';
import {
  apiListSeoCanonicalRules,
  apiCreateSeoCanonicalRule,
  apiUpdateSeoCanonicalRule,
  apiDeleteSeoCanonicalRule,
  type CanonicalRulesListParams,
  type CreateCanonicalRulePayload,
  type UpdateCanonicalRulePayload,
} from '@/api/services/seo/seller/canonical.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoCanonicalRules(storeId: string, params: CanonicalRulesListParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & CanonicalRulesListParams) => apiListSeoCanonicalRules(p.storeId, p),
    { storeId, ...params },
  );
}

export function useSeoCanonicalRuleMutations() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createRule = useCallback(async (storeId: string, payload: CreateCanonicalRulePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiCreateSeoCanonicalRule(storeId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create canonical rule.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRule = useCallback(async (storeId: string, id: string, payload: UpdateCanonicalRulePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateSeoCanonicalRule(storeId, id, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update canonical rule.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteRule = useCallback(async (storeId: string, id: string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiDeleteSeoCanonicalRule(storeId, id);
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
