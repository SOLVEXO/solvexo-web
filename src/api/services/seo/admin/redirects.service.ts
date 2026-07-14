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
  isDelete: boolean;
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

export function apiListSeoRedirects(params: RedirectsListParams = {}) {
  return client.get<never, ApiResponse<RedirectsListData>>(`${ENDPOINTS.SEO.ADMIN.REDIRECTS.LIST}${qs(params)}`);
}

export function apiCreateSeoRedirect(payload: CreateRedirectPayload) {
  return client.post<never, ApiResponse<RedirectRow>>(ENDPOINTS.SEO.ADMIN.REDIRECTS.CREATE, payload);
}

export function apiUpdateSeoRedirect(id: string, payload: UpdateRedirectPayload) {
  return client.patch<never, ApiResponse<RedirectRow>>(ENDPOINTS.SEO.ADMIN.REDIRECTS.UPDATE(id), payload);
}

export function apiDeleteSeoRedirect(id: string) {
  return client.delete<never, ApiResponse<DeleteResultData>>(ENDPOINTS.SEO.ADMIN.REDIRECTS.DELETE(id));
}
