import { useCallback, useState } from 'react';
import { apiGetSitemapStatus, apiRegenerateSitemap } from '@/api/services/seo/admin/sitemap.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoSitemapStatus() {
  return useAnalyticsQuery((_p: Record<string, never>) => apiGetSitemapStatus(), {});
}

export function useRegenerateSeoSitemap() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const regenerate = useCallback(async () => {
    setSubmitting(true);
    setError('');
    try {
      await apiRegenerateSitemap();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger sitemap regeneration.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { regenerate, submitting, error };
}
