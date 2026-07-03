import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PosAuditLog {
  _id:         string;
  storeId:     string;
  employeeId:  string | null;
  action:      string;
  targetId:    string | null;
  targetType:  string | null;
  metadata:    Record<string, unknown> | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface AuditLogsQuery {
  page?:       number;
  limit?:      number;
  employeeId?: string;
  action?:     string;
  targetType?: string;
  from?:       string;
  to?:         string;
}

interface PaginatedResponse {
  success: boolean;
  data: {
    pagination: { page: number; limit: number; total: number; totalPages: number };
    logs:       PosAuditLog[];
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

/** GET /api/pos/audit-logs/:storeId?page=&... */
export function apiGetAuditLogs(storeId: string, query: AuditLogsQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return client.get<never, PaginatedResponse>(
    `${ENDPOINTS.POS.AUDIT_LOGS.LIST(storeId)}${qs ? `?${qs}` : ''}`,
  );
}
