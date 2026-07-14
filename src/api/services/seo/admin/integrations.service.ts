import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export const SEO_INTEGRATION_PROVIDERS = ['gsc', 'ga4', 'merchant_center', 'bing'] as const;
export type SeoIntegrationProvider = (typeof SEO_INTEGRATION_PROVIDERS)[number];

export const SEO_INTEGRATION_STATUSES = ['connected', 'syncing', 'error', 'needs_reauth', 'disconnected'] as const;
export type SeoIntegrationStatus = (typeof SEO_INTEGRATION_STATUSES)[number];

// `.select('-accessTokenEncrypted -refreshTokenEncrypted')` in
// SeoIntegrationsService.list — tokens are never sent to the client.
export interface SeoIntegrationRow {
  _id: string;
  scope: 'platform' | 'store';
  storeId: string | null;
  sellerId: string | null;
  provider: SeoIntegrationProvider | string;
  accessTokenExpiresAt: string | null;
  config: Record<string, unknown>;
  status: SeoIntegrationStatus | string;
  lastError: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizeUrlData { url: string }

export interface ConnectIntegrationPayload {
  /** OAuth authorization code (or, for Bing, the pasted API key). */
  code: string;
  redirectUri: string;
  /** Site URL, GA4 property id, or Merchant Center account id, depending on provider. */
  siteIdentifier: string;
}

export interface ConnectResultData {
  success: boolean;
  status: SeoIntegrationStatus | string;
}

export interface DisconnectResultData { success: boolean }

export interface SeoCoverageResult {
  indexedCount: number;
  excludedCount: number;
  errors: string[];
}

export interface SeoPerformanceRow {
  date: string;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  avgPosition?: number;
  organicSessions?: number;
}

export interface SyncResultData {
  coverage: SeoCoverageResult;
  performance: SeoPerformanceRow[];
}

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiListSeoIntegrations() {
  return client.get<never, ApiResponse<SeoIntegrationRow[]>>(ENDPOINTS.SEO.ADMIN.INTEGRATIONS.LIST);
}

export function apiGetSeoIntegrationAuthUrl(provider: SeoIntegrationProvider | string, redirectUri: string) {
  return client.get<never, ApiResponse<AuthorizeUrlData>>(
    `${ENDPOINTS.SEO.ADMIN.INTEGRATIONS.AUTHORIZE_URL(provider)}${qs({ redirectUri })}`,
  );
}

export function apiConnectSeoIntegration(provider: SeoIntegrationProvider | string, payload: ConnectIntegrationPayload) {
  return client.post<never, ApiResponse<ConnectResultData>>(ENDPOINTS.SEO.ADMIN.INTEGRATIONS.CONNECT(provider), payload);
}

export function apiDisconnectSeoIntegration(provider: SeoIntegrationProvider | string) {
  return client.delete<never, ApiResponse<DisconnectResultData>>(ENDPOINTS.SEO.ADMIN.INTEGRATIONS.DISCONNECT(provider));
}

export function apiSyncSeoIntegration(provider: SeoIntegrationProvider | string, days?: number) {
  return client.post<never, ApiResponse<SyncResultData>>(`${ENDPOINTS.SEO.ADMIN.INTEGRATIONS.SYNC(provider)}${qs({ days })}`);
}
