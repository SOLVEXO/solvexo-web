import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface CanonicalRuleRow {
  _id: string;
  storeId: string | null;
  pathPattern: string;
  canonicalUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination { page: number; limit: number; total: number; pages: number }

export interface CanonicalRulesListData {
  items: CanonicalRuleRow[];
  pagination: Pagination;
}

export interface CanonicalRulesListParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface CreateCanonicalRulePayload {
  pathPattern: string;
  canonicalUrl: string;
  isActive?: boolean;
}

export type UpdateCanonicalRulePayload = Partial<CreateCanonicalRulePayload>;

export interface DeleteResultData { success: boolean }

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiListSeoCanonicalRules(storeId: string, params: CanonicalRulesListParams = {}) {
  return client.get<never, ApiResponse<CanonicalRulesListData>>(`${ENDPOINTS.SEO.SELLER.CANONICAL_RULES.LIST(storeId)}${qs(params)}`);
}

export function apiCreateSeoCanonicalRule(storeId: string, payload: CreateCanonicalRulePayload) {
  return client.post<never, ApiResponse<CanonicalRuleRow>>(ENDPOINTS.SEO.SELLER.CANONICAL_RULES.CREATE(storeId), payload);
}

export function apiUpdateSeoCanonicalRule(storeId: string, id: string, payload: UpdateCanonicalRulePayload) {
  return client.patch<never, ApiResponse<CanonicalRuleRow>>(ENDPOINTS.SEO.SELLER.CANONICAL_RULES.UPDATE(storeId, id), payload);
}

export function apiDeleteSeoCanonicalRule(storeId: string, id: string) {
  return client.delete<never, ApiResponse<DeleteResultData>>(ENDPOINTS.SEO.SELLER.CANONICAL_RULES.DELETE(storeId, id));
}
