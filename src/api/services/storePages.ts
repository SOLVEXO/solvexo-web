import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Section } from './storefrontTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type StorePageType   = 'home' | 'custom';
export type StorePageStatus = 'draft' | 'published';

export interface StorePageSeo {
  metaTitle: string | null;
  metaDesc:  string | null;
}

export interface StorePageData {
  _id:           string;
  storeId:       string;
  type:          StorePageType;
  slug:          string;
  title:         string;
  sections:      Section[];
  seo:           StorePageSeo;
  status:        StorePageStatus;
  showInNav:     boolean;
  showInFooter:  boolean;
  createdAt:     string;
  updatedAt:     string;
}

export interface PublicPageSummary {
  _id:          string;
  slug:         string;
  title:        string;
  showInNav:    boolean;
  showInFooter: boolean;
}

// ── Seller ───────────────────────────────────────────────────────────────────

export function apiListStorePages(storeId: string) {
  return client.get<never, ApiResponse<StorePageData[]>>(ENDPOINTS.STORE_PAGES.LIST(storeId));
}

export function apiGetStorePage(storeId: string, pageId: string) {
  return client.get<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.GET(storeId, pageId));
}

export function apiCreateStorePage(storeId: string, payload: { title: string; slug: string }) {
  return client.post<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.CREATE(storeId), payload);
}

export function apiUpdateStorePage(storeId: string, pageId: string, payload: Partial<{ title: string; slug: string; seo: Partial<StorePageSeo>; showInNav: boolean; showInFooter: boolean }>) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.UPDATE(storeId, pageId), payload);
}

export function apiUpdateStorePageSections(storeId: string, pageId: string, sections: Section[]) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.UPDATE_SECTIONS(storeId, pageId), { sections });
}

export function apiPublishStorePage(storeId: string, pageId: string) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.PUBLISH(storeId, pageId));
}

export function apiUnpublishStorePage(storeId: string, pageId: string) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.UNPUBLISH(storeId, pageId));
}

export function apiDeleteStorePage(storeId: string, pageId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_PAGES.DELETE(storeId, pageId));
}

// ── Public ───────────────────────────────────────────────────────────────────

export function apiGetPublicHomePage(storeId: string) {
  return client.get<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.PUBLIC_HOME(storeId));
}

export function apiGetPublicStorePage(storeId: string, slug: string) {
  return client.get<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.PUBLIC_PAGE(storeId, slug));
}

export function apiListPublicStorePages(storeId: string) {
  return client.get<never, ApiResponse<PublicPageSummary[]>>(ENDPOINTS.STORE_PAGES.PUBLIC_LIST(storeId));
}
