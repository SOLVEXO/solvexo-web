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
  /** @deprecated superseded by `metaDescription` — kept as a read-fallback only. */
  metaDesc:  string | null;
  metaDescription: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  twitterCard: 'summary' | 'summary_large_image';
  canonicalUrlOverride: string | null;
  noindex: boolean;
  keywords: string[];
}

export interface StorePageDraft {
  sections: Section[];
}

export interface StorePageData {
  _id:             string;
  storeId:         string;
  type:            StorePageType;
  slug:            string;
  title:           string;
  /** The LIVE/published sections — what buyers currently see. Editing calls target `draft.sections` instead (see `apiUpdateStorePageSections`); nothing here changes until `apiPublishStorePage` is called. */
  sections:        Section[];
  /** The seller's working copy — this is what the Page Sections editor should read from and write to. */
  draft:           StorePageDraft;
  lastPublishedAt: string | null;
  seo:             StorePageSeo;
  status:          StorePageStatus;
  showInNav:       boolean;
  showInFooter:    boolean;
  createdAt:       string;
  updatedAt:       string;
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

/** The seller editor's working copy — `draft.sections` plus `lastPublishedAt`, mirroring `apiGetStoreThemeDraft`'s shape/purpose. Not required for today's Pages tab (which reads `draft` off the normal `apiGetStorePage`/`apiListStorePages` response), but available for anything that wants just the draft without the rest of the page doc. */
export function apiGetStorePageDraft(storeId: string, pageId: string) {
  return client.get<never, ApiResponse<{ sections: Section[]; lastPublishedAt: string | null }>>(ENDPOINTS.STORE_PAGES.DRAFT(storeId, pageId));
}

export function apiPublishStorePage(storeId: string, pageId: string) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.PUBLISH(storeId, pageId));
}

export function apiUnpublishStorePage(storeId: string, pageId: string) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.UNPUBLISH(storeId, pageId));
}

/** "Discard unsaved changes" — copies the live `sections` back over `draft.sections`. Mirrors `apiRevertStoreThemeDraft`. */
export function apiRevertStorePageDraft(storeId: string, pageId: string) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.REVERT_DRAFT(storeId, pageId));
}

export interface StorePageVersionData {
  _id: string;
  sections: Section[];
  publishedAt: string;
}

export function apiListStorePageVersions(storeId: string, pageId: string) {
  return client.get<never, ApiResponse<StorePageVersionData[]>>(ENDPOINTS.STORE_PAGES.VERSIONS(storeId, pageId));
}

export function apiRestoreStorePageVersion(storeId: string, pageId: string, versionId: string) {
  return client.post<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.RESTORE_VERSION(storeId, pageId, versionId));
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
