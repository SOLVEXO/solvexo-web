import {
  apiGetSeoSearchPerformance,
  apiGetSeoOrganicTraffic,
  type SeoAnalyticsParams,
} from '@/api/services/seo/seller/analytics.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoSearchPerformance(storeId: string, params: SeoAnalyticsParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & SeoAnalyticsParams) => apiGetSeoSearchPerformance(p.storeId, p),
    { storeId, ...params },
  );
}

export function useSeoOrganicTraffic(storeId: string, params: SeoAnalyticsParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & SeoAnalyticsParams) => apiGetSeoOrganicTraffic(p.storeId, p),
    { storeId, ...params },
  );
}
