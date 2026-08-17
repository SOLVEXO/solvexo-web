import { useCallback, useState } from 'react';
import {
  apiListStoreCategoriesSeo,
  apiGetPageSeo,
  apiUpdatePageSeo,
  type UpdatePageSeoPayload,
} from '@/api/services/seo/seller/content.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useStoreCategoriesSeo(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiListStoreCategoriesSeo(p.storeId),
    { storeId },
  );
}

export function usePageSeo(storeId: string, pageId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string; pageId: string }) => apiGetPageSeo(p.storeId, p.pageId),
    { storeId, pageId },
  );
}

export function useUpdatePageSeo() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updatePageSeo = useCallback(async (storeId: string, pageId: string, payload: UpdatePageSeoPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdatePageSeo(storeId, pageId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page SEO.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { updatePageSeo, submitting, error };
}
