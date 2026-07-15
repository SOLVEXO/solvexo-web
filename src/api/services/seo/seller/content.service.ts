import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface CategorySeoRow {
  _id: string;
  name: string;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    noindex?: boolean;
    keywords?: string[];
  } | null;
}

export interface PageSeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  noindex?: boolean;
}

export interface UpdatePageSeoPayload {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function apiListStoreCategoriesSeo(storeId: string) {
  return client.get<never, ApiResponse<CategorySeoRow[]>>(ENDPOINTS.SEO.SELLER.CONTENT.CATEGORIES(storeId));
}

export function apiGetPageSeo(storeId: string, pageId: string) {
  return client.get<never, ApiResponse<PageSeoMeta>>(ENDPOINTS.SEO.SELLER.CONTENT.GET_PAGE(storeId, pageId));
}

export function apiUpdatePageSeo(storeId: string, pageId: string, payload: UpdatePageSeoPayload) {
  return client.patch<never, ApiResponse<PageSeoMeta>>(ENDPOINTS.SEO.SELLER.CONTENT.UPDATE_PAGE(storeId, pageId), payload);
}
