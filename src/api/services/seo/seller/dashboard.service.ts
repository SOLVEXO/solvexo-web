import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface SeoChecklistItem {
  key: string;
  done: boolean;
  automated: boolean;
  completedAt?: string | null;
}

export interface SeoDashboardData {
  storeCompleteness: number;
  productCompletenessAvg: number;
  productCount: number;
  checklistCompletion: number;
  checklist: SeoChecklistItem[];
}

export interface StoreSeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrlOverride?: string;
  noindex?: boolean;
  keywords?: string[];
  aiGenerated?: boolean;
  updatedAt?: string;
  checklist?: { key: string; done: boolean; completedAt: string | null }[];
  /** Read-only here — edited via `apiUpdateStoreRobotsTxt` (`api/services/store.ts`),
   *  a dedicated endpoint since it isn't part of the shared product/store/page
   *  `UpdateSeoMetaDto` shape. */
  robotsTxtOverride?: string | null;
}

export interface UpdateSeoMetaPayload {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrlOverride?: string;
  noindex?: boolean;
  keywords?: string[];
}

export interface UpdateChecklistItemPayload {
  key: string;
  done: boolean;
}

export function apiGetSeoDashboard(storeId: string) {
  return client.get<never, ApiResponse<SeoDashboardData>>(ENDPOINTS.SEO.SELLER.DASHBOARD(storeId));
}

export function apiGetStoreSeo(storeId: string) {
  return client.get<never, ApiResponse<StoreSeoMeta>>(ENDPOINTS.SEO.SELLER.GET_STORE_SEO(storeId));
}

export function apiUpdateStoreSeo(storeId: string, payload: UpdateSeoMetaPayload) {
  return client.patch<never, ApiResponse<StoreSeoMeta>>(ENDPOINTS.SEO.SELLER.UPDATE_STORE_SEO(storeId), payload);
}

export function apiGetSeoChecklist(storeId: string) {
  return client.get<never, ApiResponse<SeoChecklistItem[]>>(ENDPOINTS.SEO.SELLER.GET_CHECKLIST(storeId));
}

export function apiUpdateSeoChecklistItem(storeId: string, payload: UpdateChecklistItemPayload) {
  return client.patch<never, ApiResponse<SeoChecklistItem[]>>(ENDPOINTS.SEO.SELLER.UPDATE_CHECKLIST(storeId), payload);
}
