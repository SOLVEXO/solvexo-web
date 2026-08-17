import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// `category.seo` is an embedded sub-document that may never have been set —
// `getCategorySeo`/`updateCategorySeo` (seo-content.service.ts) return `{}` or
// a partial merge in that case, so every field here is optional rather than
// mirroring the schema's non-null defaults.
export interface CategorySeoMeta {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  twitterCard?: 'summary' | 'summary_large_image' | string;
  canonicalUrlOverride?: string | null;
  noindex?: boolean;
  keywords?: string[];
  aiGenerated?: boolean;
  updatedAt?: string | null;
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

export function apiGetCategorySeo(categoryId: string) {
  return client.get<never, ApiResponse<CategorySeoMeta>>(ENDPOINTS.SEO.ADMIN.CATEGORY.GET_SEO(categoryId));
}

export function apiUpdateCategorySeo(categoryId: string, payload: UpdateSeoMetaPayload) {
  return client.patch<never, ApiResponse<CategorySeoMeta>>(ENDPOINTS.SEO.ADMIN.CATEGORY.UPDATE_SEO(categoryId), payload);
}
