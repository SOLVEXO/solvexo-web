import { useCallback, useState } from 'react';
import {
  apiGetFaqSeo,
  apiUpdateFaqSeo,
  type UpdateSeoMetaPayload,
} from '@/api/services/seo/admin/faq.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useFaqSeo(faqId: string) {
  return useAnalyticsQuery(
    (p: { faqId: string }) => apiGetFaqSeo(p.faqId),
    { faqId },
  );
}

export function useUpdateFaqSeo() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateFaqSeo = useCallback(async (faqId: string, payload: UpdateSeoMetaPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiUpdateFaqSeo(faqId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update FAQ SEO.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { updateFaqSeo, submitting, error };
}
