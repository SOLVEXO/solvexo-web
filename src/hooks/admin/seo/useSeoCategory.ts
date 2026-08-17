import { useCallback, useState } from 'react';
import {
  apiGetCategorySeo,
  apiUpdateCategorySeo,
  type UpdateSeoMetaPayload,
} from '@/api/services/seo/admin/category.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useCategorySeo(categoryId: string) {
  return useAnalyticsQuery(
    (p: { categoryId: string }) => apiGetCategorySeo(p.categoryId),
    { categoryId },
  );
}

export function useUpdateCategorySeo() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateCategorySeo = useCallback(async (categoryId: string, payload: UpdateSeoMetaPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateCategorySeo(categoryId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category SEO.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { updateCategorySeo, submitting, error };
}
