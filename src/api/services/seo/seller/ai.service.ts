import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export const AI_SEO_ENTITY_TYPES = ['product', 'category', 'store'] as const;
export type AiSeoEntityType = (typeof AI_SEO_ENTITY_TYPES)[number];

export interface GenerateAiSuggestionPayload {
  entityType: AiSeoEntityType;
  entityId: string;
}

export interface GenerateAiSuggestionBulkPayload {
  entityType: AiSeoEntityType;
  entityIds: string[];
}

export interface AiSeoSuggestion {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface GenerateBulkResultData {
  queued: true;
  jobId: string | number;
}

export interface SeoAiSuggestionLogRow {
  _id: string;
  storeId: string;
  sellerId: string;
  entityType: AiSeoEntityType;
  entityId: string;
  suggestion: AiSeoSuggestion;
  accepted: boolean;
  creditsCost: number;
  createdAt: string;
}

export interface Pagination { page: number; limit: number; total: number; pages: number }

export interface SeoAiSuggestionsData {
  items: SeoAiSuggestionLogRow[];
  pagination: Pagination;
}

export interface SeoAiSuggestionsParams {
  page?: number;
  limit?: number;
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

/** POST .../seo/ai/generate — idempotency-protected server-side; costs AI credits per call. */
export function apiGenerateSeoAiSuggestion(storeId: string, payload: GenerateAiSuggestionPayload) {
  return client.post<never, ApiResponse<AiSeoSuggestion>>(ENDPOINTS.SEO.SELLER.AI.GENERATE(storeId), payload);
}

/** POST .../seo/ai/generate-bulk — queued, credit-metered, partial-success on wallet exhaustion. */
export function apiGenerateSeoAiSuggestionBulk(storeId: string, payload: GenerateAiSuggestionBulkPayload) {
  return client.post<never, ApiResponse<GenerateBulkResultData>>(ENDPOINTS.SEO.SELLER.AI.GENERATE_BULK(storeId), payload);
}

export function apiGetSeoAiSuggestionHistory(storeId: string, params: SeoAiSuggestionsParams = {}) {
  return client.get<never, ApiResponse<SeoAiSuggestionsData>>(`${ENDPOINTS.SEO.SELLER.AI.SUGGESTIONS(storeId)}${qs(params)}`);
}
