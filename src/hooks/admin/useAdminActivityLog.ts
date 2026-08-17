import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { apiGetAdminActivityLog, type AdminActivityLogQuery } from '@/api/services/activityLog';

export function useAdminActivityLog(query: AdminActivityLogQuery) {
  return useAnalyticsQuery(apiGetAdminActivityLog, query);
}
