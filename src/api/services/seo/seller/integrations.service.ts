import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export const SEO_INTEGRATION_PROVIDERS = ['gsc', 'ga4', 'merchant_center', 'bing'] as const;
export type SeoIntegrationProvider = (typeof SEO_INTEGRATION_PROVIDERS)[number];

export const SEO_INTEGRATION_STATUSES = ['connected', 'syncing', 'error', 'needs_reauth', 'disconnected'] as const;
export type SeoIntegrationStatus = (typeof SEO_INTEGRATION_STATUSES)[number];

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
  code: string;
  redirectUri: string;
  siteIdentifier: string;
}

export interface ConnectResultData {
  success: boolean;
  status: SeoIntegrationStatus | string;
}

export interface DisconnectResultData { success: boolean }

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiListSeoIntegrations(storeId: string) {
  return client.get<never, ApiResponse<SeoIntegrationRow[]>>(ENDPOINTS.SEO.SELLER.INTEGRATIONS.LIST(storeId));
}

export function apiGetSeoIntegrationAuthUrl(storeId: string, provider: SeoIntegrationProvider | string, redirectUri: string) {
  return client.get<never, ApiResponse<AuthorizeUrlData>>(
    `${ENDPOINTS.SEO.SELLER.INTEGRATIONS.AUTHORIZE_URL(storeId, provider)}${qs({ redirectUri })}`,
  );
}

export function apiConnectSeoIntegration(storeId: string, provider: SeoIntegrationProvider | string, payload: ConnectIntegrationPayload) {
  return client.post<never, ApiResponse<ConnectResultData>>(ENDPOINTS.SEO.SELLER.INTEGRATIONS.CONNECT(storeId, provider), payload);
}

export function apiDisconnectSeoIntegration(storeId: string, provider: SeoIntegrationProvider | string) {
  return client.delete<never, ApiResponse<DisconnectResultData>>(ENDPOINTS.SEO.SELLER.INTEGRATIONS.DISCONNECT(storeId, provider));
}
