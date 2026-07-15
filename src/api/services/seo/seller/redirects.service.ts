import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface RedirectRow {
  _id: string;
  storeId: string | null;
  source: string;
  destination: string;
  statusCode: 301 | 302 | number;
  isActive: boolean;
  hitCount: number;
  lastHitAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination { page: number; limit: number; total: number; pages: number }

export interface RedirectsListData {
  items: RedirectRow[];
  pagination: Pagination;
}

export interface RedirectsListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface CreateRedirectPayload {
  source: string;
  destination: string;
  statusCode?: 301 | 302;
  isActive?: boolean;
}

export type UpdateRedirectPayload = Partial<CreateRedirectPayload>;

export interface DeleteResultData { success: boolean }

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiListSeoRedirects(storeId: string, params: RedirectsListParams = {}) {
  return client.get<never, ApiResponse<RedirectsListData>>(`${ENDPOINTS.SEO.SELLER.REDIRECTS.LIST(storeId)}${qs(params)}`);
}

export function apiCreateSeoRedirect(storeId: string, payload: CreateRedirectPayload) {
  return client.post<never, ApiResponse<RedirectRow>>(ENDPOINTS.SEO.SELLER.REDIRECTS.CREATE(storeId), payload);
}

export function apiUpdateSeoRedirect(storeId: string, id: string, payload: UpdateRedirectPayload) {
  return client.patch<never, ApiResponse<RedirectRow>>(ENDPOINTS.SEO.SELLER.REDIRECTS.UPDATE(storeId, id), payload);
}

export function apiDeleteSeoRedirect(storeId: string, id: string) {
  return client.delete<never, ApiResponse<DeleteResultData>>(ENDPOINTS.SEO.SELLER.REDIRECTS.DELETE(storeId, id));
}
