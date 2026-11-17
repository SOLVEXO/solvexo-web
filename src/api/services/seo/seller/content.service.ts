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

export interface CollectionSeoRow {
  _id: string;
  name: string;
  slug: string;
  status: string;
  seo?: { metaTitle?: string | null; metaDescription?: string | null } | null;
}

export function apiListStoreCollectionsSeo(storeId: string) {
  return client.get<never, ApiResponse<CollectionSeoRow[]>>(ENDPOINTS.SEO.SELLER.CONTENT.COLLECTIONS(storeId));
}

export function apiUpdateCollectionSeo(storeId: string, collectionId: string, payload: { metaTitle?: string; metaDescription?: string }) {
  return client.patch<never, ApiResponse<CollectionSeoRow>>(ENDPOINTS.SEO.SELLER.CONTENT.UPDATE_COLLECTION(storeId, collectionId), payload);
}
