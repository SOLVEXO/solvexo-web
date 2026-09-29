import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { apiGetAdminActivityStats } from '@/api/services/activityLog';

export function useAdminActivityStats() {
  return useAnalyticsQuery(apiGetAdminActivityStats, {});
}
