import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface SeoAnalyticsOverviewData {
  clicks: number;
  impressions: number;
  organicSessions: number;
  avgPosition: number | null;
  avgCtr: number | null;
  days: number;
}

export interface SeoSearchPerformanceRow {
  _id: string;
  scope: 'platform' | 'store';
  storeId: string | null;
  provider: 'gsc' | 'bing' | string;
  date: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  avgPosition: number | null;
  organicSessions: number | null;
}

export type SeoOrganicTrafficRow = SeoSearchPerformanceRow;

export interface SeoAnalyticsParams {
  days?: number;
  [key: string]: unknown;
}

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiGetSeoAnalyticsOverview(params: SeoAnalyticsParams = {}) {
  return client.get<never, ApiResponse<SeoAnalyticsOverviewData>>(`${ENDPOINTS.SEO.ADMIN.ANALYTICS.OVERVIEW}${qs(params)}`);
}

export function apiGetSeoSearchPerformance(params: SeoAnalyticsParams = {}) {
  return client.get<never, ApiResponse<SeoSearchPerformanceRow[]>>(`${ENDPOINTS.SEO.ADMIN.ANALYTICS.SEARCH_PERFORMANCE}${qs(params)}`);
}

export function apiGetSeoOrganicTraffic(params: SeoAnalyticsParams = {}) {
  return client.get<never, ApiResponse<SeoOrganicTrafficRow[]>>(`${ENDPOINTS.SEO.ADMIN.ANALYTICS.ORGANIC_TRAFFIC}${qs(params)}`);
}
