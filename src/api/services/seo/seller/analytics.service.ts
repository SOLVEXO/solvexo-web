import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface SeoSearchPerformanceRow {
  _id: string;
  scope: 'store';
  storeId: string;
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

export function apiGetSeoSearchPerformance(storeId: string, params: SeoAnalyticsParams = {}) {
  return client.get<never, ApiResponse<SeoSearchPerformanceRow[]>>(`${ENDPOINTS.SEO.SELLER.ANALYTICS.SEARCH_PERFORMANCE(storeId)}${qs(params)}`);
}

export function apiGetSeoOrganicTraffic(storeId: string, params: SeoAnalyticsParams = {}) {
  return client.get<never, ApiResponse<SeoOrganicTrafficRow[]>>(`${ENDPOINTS.SEO.SELLER.ANALYTICS.ORGANIC_TRAFFIC(storeId)}${qs(params)}`);
}
