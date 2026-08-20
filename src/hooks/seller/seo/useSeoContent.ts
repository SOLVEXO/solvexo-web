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

/** @deprecated Backed by the legacy `Store.seo.pages` map (keyed by a fixed
 *  'home'/'about'/'contact' enum, not a real `StorePage._id`) — no longer
 *  called anywhere (`PagesTab.tsx` now edits the real `StorePage.seo` field
 *  directly via `apiUpdateStorePage`, at parity with Product/Category SEO).
 *  Left in place rather than deleted per this codebase's migration-safety
 *  convention; a future pass can remove `Store.seo.pages` and this alongside
 *  it once confirmed nothing else reads that map. */
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
