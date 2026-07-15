import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface CrawlLogRow {
  _id: string;
  userAgent: string;
  path: string;
  statusCode: number;
  storeId: string | null;
  ip: string | null;
  botName: string | null;
  createdAt: string;
}

export interface Pagination { page: number; limit: number; total: number; pages: number }

export interface CrawlLogsData {
  items: CrawlLogRow[];
  pagination: Pagination;
}

export interface CrawlLogsParams {
  page?: number;
  limit?: number;
  botName?: string;
  [key: string]: unknown;
}

export interface CrawlStatsData {
  last30Days: {
    byBot: { _id: string | null; hits: number }[];
    errorHits: number;
  };
}

export interface IndexSnapshotRow {
  _id: string;
  scope: 'platform' | 'store';
  storeId: string | null;
  provider: 'gsc' | 'bing' | string;
  indexedCount: number;
  excludedCount: number;
  errors: string[];
  snapshotDate: string;
}

export interface RefreshIndexSnapshotsResultData { synced: number; failed: number }

export interface CoreWebVitalsRow {
  _id: string;
  url: string;
  storeId: string | null;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  source: 'crux' | 'psi' | string;
  measuredAt: string;
}

export interface RefreshCwvResultData { measured: number; failed: number }

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

// ── Crawl logs ────────────────────────────────────────────────────────────────

export function apiGetSeoCrawlLogs(params: CrawlLogsParams = {}) {
  return client.get<never, ApiResponse<CrawlLogsData>>(`${ENDPOINTS.SEO.ADMIN.MONITORING.CRAWL_LOGS}${qs(params)}`);
}

export function apiGetSeoCrawlStats() {
  return client.get<never, ApiResponse<CrawlStatsData>>(ENDPOINTS.SEO.ADMIN.MONITORING.CRAWL_STATS);
}

// ── Index snapshots ───────────────────────────────────────────────────────────

export function apiGetSeoIndexSnapshots() {
  return client.get<never, ApiResponse<IndexSnapshotRow[]>>(ENDPOINTS.SEO.ADMIN.MONITORING.INDEX_SNAPSHOTS);
}

export function apiRefreshSeoIndexSnapshots() {
  return client.post<never, ApiResponse<RefreshIndexSnapshotsResultData>>(ENDPOINTS.SEO.ADMIN.MONITORING.REFRESH_INDEX_SNAPSHOTS);
}

// ── Core Web Vitals ───────────────────────────────────────────────────────────

export function apiGetSeoCwv() {
  return client.get<never, ApiResponse<CoreWebVitalsRow[]>>(ENDPOINTS.SEO.ADMIN.MONITORING.CWV);
}

export function apiRefreshSeoCwv(urls: string[]) {
  return client.post<never, ApiResponse<RefreshCwvResultData>>(ENDPOINTS.SEO.ADMIN.MONITORING.REFRESH_CWV, { urls });
}
