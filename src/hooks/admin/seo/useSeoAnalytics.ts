import {
  apiGetSeoAnalyticsOverview,
  apiGetSeoSearchPerformance,
  apiGetSeoOrganicTraffic,
  type SeoAnalyticsParams,
} from '@/api/services/seo/admin/analytics.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoAnalyticsOverview(params: SeoAnalyticsParams) {
  return useAnalyticsQuery(apiGetSeoAnalyticsOverview, params);
}

export function useSeoSearchPerformance(params: SeoAnalyticsParams) {
  return useAnalyticsQuery(apiGetSeoSearchPerformance, params);
}

export function useSeoOrganicTraffic(params: SeoAnalyticsParams) {
  return useAnalyticsQuery(apiGetSeoOrganicTraffic, params);
}
