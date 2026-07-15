import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type SeoIssueSeverity = 'info' | 'warning' | 'error';

export interface SeoAuditIssue {
  severity: SeoIssueSeverity;
  code: string;
  message: string;
  entityType?: 'product' | 'category' | 'store' | null;
  entityId?: string | null;
}

export interface SeoAuditResult {
  _id: string;
  storeId: string;
  score: number;
  issues: SeoAuditIssue[];
  checklistCompletionPercent: number;
  runAt: string;
}

export interface SeoAuditHistoryRow {
  _id: string;
  score: number;
  runAt: string;
  checklistCompletionPercent: number;
}

export interface Pagination { page: number; limit: number; total: number; pages: number }

export interface SeoAuditHistoryData {
  items: SeoAuditHistoryRow[];
  pagination: Pagination;
}

export interface SeoAuditHistoryParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface RunAuditResultData { queued: true }

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiRunSeoAudit(storeId: string) {
  return client.post<never, ApiResponse<RunAuditResultData>>(ENDPOINTS.SEO.SELLER.AUDIT.RUN(storeId));
}

export function apiGetLatestSeoAudit(storeId: string) {
  return client.get<never, ApiResponse<SeoAuditResult>>(ENDPOINTS.SEO.SELLER.AUDIT.LATEST(storeId));
}

export function apiGetSeoAuditHistory(storeId: string, params: SeoAuditHistoryParams = {}) {
  return client.get<never, ApiResponse<SeoAuditHistoryData>>(`${ENDPOINTS.SEO.SELLER.AUDIT.HISTORY(storeId)}${qs(params)}`);
}
