import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type ActivityCategory = 'products' | 'orders' | 'finance' | 'marketing' | 'customers' | 'settings' | 'security';

export interface ActivityLogEntry {
  _id:             string;
  storeId:         string;
  actorId:         string | null;
  actorName:       string | null;
  actorRole:       string | null;
  category:        ActivityCategory;
  action:          string;
  description:     string | null;
  targetId:        string | null;
  targetType:      string | null;
  ip:              string | null;
  userAgent:       string | null;
  isSecurityAlert: boolean;
  createdAt:       string;
}

export interface ActivityLogQuery {
  page?:     number;
  limit?:    number;
  category?: ActivityCategory;
  actorId?:  string;
  search?:   string;
  from?:     string;
  to?:       string;
}

export interface ActivityLogStats {
  totalEvents:      number;
  staffActionsToday: number;
  activeStaffToday: number;
  securityAlerts:   number;
  lastLogin: { at: string; actorName: string | null; ip: string | null; userAgent: string | null } | null;
}

interface ApiResponse<T> { success: boolean; data: T }
interface PaginatedLogs {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  logs:       ActivityLogEntry[];
}

/** GET /api/activity-log/:storeId */
export function apiGetActivityLog(storeId: string, query: ActivityLogQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
  const qs = params.toString();
  return client.get<never, ApiResponse<PaginatedLogs>>(
    `${ENDPOINTS.ACTIVITY_LOG.LIST(storeId)}${qs ? `?${qs}` : ''}`,
  );
}

/** GET /api/activity-log/:storeId/stats */
export function apiGetActivityStats(storeId: string) {
  return client.get<never, ApiResponse<ActivityLogStats>>(ENDPOINTS.ACTIVITY_LOG.STATS(storeId));
}

/** GET /api/activity-log/:storeId/export — triggers a CSV file download */
export async function apiExportActivityLog(storeId: string, storeName: string) {
  const csv = await client.get<never, string>(ENDPOINTS.ACTIVITY_LOG.EXPORT(storeId), { responseType: 'text' });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activity-log-${storeName.toLowerCase().replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
