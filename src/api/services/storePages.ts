import client from '../client';
import { dedupedGet } from '../../utils/dedupedGet';
import { ENDPOINTS } from '../endpoints';
import type { Section } from './storefrontTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type StorePageType   = 'home' | 'custom';
export type StorePageStatus = 'draft' | 'published';
/** Tags a custom page as one of the standard legal/policy roles — at most
 *  one page per store per type (enforced on the backend). Used to
 *  auto-surface real links in the storefront footer/checkout and to make a
 *  policy page easy to find from the seller's Menu editor, without a
 *  separate hardcoded "Policies" content system of its own. */
export type StorePagePolicyType = 'privacy_policy' | 'terms_of_service' | 'refund_policy' | 'shipping_policy';

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
  translations?: import('@/utils/localize').ContentTranslations;
  _id:             string;
  storeId:         string;
  /** The installed theme instance whose sections/draft/version history are represented in this response. */
  installedThemeId?: string | null;
  type:            StorePageType;
  slug:            string;
  title:           string;
  /** The LIVE/published sections — what buyers currently see. Editing calls target `draft.sections` instead (see `apiUpdateStorePageSections`); nothing here changes until `apiPublishStorePage` is called. */
  sections:        Section[];
  /** The seller's working copy — this is what the Page Sections editor should read from and write to. */
  draft:           StorePageDraft;
  lastPublishedAt: string | null;
  /** Scheduled go-live time (ISO), or null. */
  publishAt?: string | null;
  seo:             StorePageSeo;
  status:          StorePageStatus;
  showInNav:       boolean;
  showInFooter:    boolean;
  policyType:      StorePagePolicyType | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface PublicPageSummary {
  /** Seller translations per language (see utils/localize). */
  translations?: import('@/utils/localize').ContentTranslations;
  _id:          string;
  slug:         string;
  title:        string;
  showInNav:    boolean;
  showInFooter: boolean;
  policyType:   StorePagePolicyType | null;
}

// ── Seller ───────────────────────────────────────────────────────────────────

function withInstance(path: string, installedThemeId?: string) {
  return installedThemeId ? `${path}?instance=${encodeURIComponent(installedThemeId)}` : path;
}

export function apiListStorePages(storeId: string, installedThemeId?: string) {
  return client.get<never, ApiResponse<StorePageData[]>>(withInstance(ENDPOINTS.STORE_PAGES.LIST(storeId), installedThemeId));
}

export function apiGetStorePage(storeId: string, pageId: string, installedThemeId?: string) {
  return client.get<never, ApiResponse<StorePageData>>(withInstance(ENDPOINTS.STORE_PAGES.GET(storeId, pageId), installedThemeId));
}

export function apiCreateStorePage(storeId: string, payload: { title: string; slug: string }) {
  return client.post<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.CREATE(storeId), payload);
}

export function apiUpdateStorePage(storeId: string, pageId: string, payload: Partial<{ title: string; slug: string; seo: Partial<StorePageSeo>; showInNav: boolean; showInFooter: boolean; policyType: StorePagePolicyType | null; publishAt: string | null }>) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.UPDATE(storeId, pageId), payload);
}

export function apiUpdateStorePageSections(storeId: string, pageId: string, sections: Section[], installedThemeId?: string, baseUpdatedAt?: string) {
  return client.patch<never, ApiResponse<StorePageData>>(withInstance(ENDPOINTS.STORE_PAGES.UPDATE_SECTIONS(storeId, pageId), installedThemeId), { sections, ...(baseUpdatedAt ? { baseUpdatedAt } : {}) });
}

/** The seller editor's working copy — `draft.sections` plus `lastPublishedAt`, mirroring `apiGetStoreThemeDraft`'s shape/purpose. Not required for today's Pages tab (which reads `draft` off the normal `apiGetStorePage`/`apiListStorePages` response), but available for anything that wants just the draft without the rest of the page doc. */
export function apiGetStorePageDraft(storeId: string, pageId: string, installedThemeId?: string) {
  return client.get<never, ApiResponse<{ sections: Section[]; lastPublishedAt: string | null }>>(withInstance(ENDPOINTS.STORE_PAGES.DRAFT(storeId, pageId), installedThemeId));
}

export function apiPublishStorePage(storeId: string, pageId: string, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StorePageData>>(withInstance(ENDPOINTS.STORE_PAGES.PUBLISH(storeId, pageId), installedThemeId));
}

export function apiUnpublishStorePage(storeId: string, pageId: string) {
  return client.patch<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.UNPUBLISH(storeId, pageId));
}

/** "Discard unsaved changes" — copies the live `sections` back over `draft.sections`. Mirrors `apiRevertStoreThemeDraft`. */
export function apiRevertStorePageDraft(storeId: string, pageId: string, installedThemeId?: string) {
  return client.patch<never, ApiResponse<StorePageData>>(withInstance(ENDPOINTS.STORE_PAGES.REVERT_DRAFT(storeId, pageId), installedThemeId));
}

export interface StorePageVersionData {
  _id: string;
  sections: Section[];
  publishedAt: string;
}

export function apiListStorePageVersions(storeId: string, pageId: string, installedThemeId?: string) {
  return client.get<never, ApiResponse<StorePageVersionData[]>>(withInstance(ENDPOINTS.STORE_PAGES.VERSIONS(storeId, pageId), installedThemeId));
}

export function apiRestoreStorePageVersion(storeId: string, pageId: string, versionId: string, installedThemeId?: string) {
  return client.post<never, ApiResponse<StorePageData>>(withInstance(ENDPOINTS.STORE_PAGES.RESTORE_VERSION(storeId, pageId, versionId), installedThemeId));
}

/** A draft copy of a custom page (new link, hidden from navigation). */
/** Settings → Policies: creates + publishes the store's policy page from a ready-made text (an existing one is returned as is). */
export function apiCreatePolicyFromTemplate(storeId: string, policyType: StorePagePolicyType) {
  return client.post<never, ApiResponse<StorePageData> & { created: boolean }>(ENDPOINTS.STORE_PAGES.POLICY_TEMPLATE(storeId, policyType));
}

export function apiDuplicateStorePage(storeId: string, pageId: string) {
  return client.post<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.DUPLICATE(storeId, pageId));
}

export function apiDeleteStorePage(storeId: string, pageId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_PAGES.DELETE(storeId, pageId));
}

// ── Public ───────────────────────────────────────────────────────────────────

export function apiGetPublicHomePage(storeId: string) {
  return dedupedGet(`home:${storeId}`, () => client.get<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.PUBLIC_HOME(storeId)));
}

export function apiGetPublicStorePage(storeId: string, slug: string) {
  return client.get<never, ApiResponse<StorePageData>>(ENDPOINTS.STORE_PAGES.PUBLIC_PAGE(storeId, slug));
}

export function apiListPublicStorePages(storeId: string) {
  return dedupedGet(`pages:${storeId}`, () => client.get<never, ApiResponse<PublicPageSummary[]>>(ENDPOINTS.STORE_PAGES.PUBLIC_LIST(storeId)));
}

/** False only when the store's (cached) published-page list proves no page uses this slug, so a missing page never costs a 404 request.
 *  Any doubt (list failed, slug appears in a translated handle) answers true and the caller asks the server. */
export async function apiPublicPageMayExist(storeId: string, slug: string): Promise<boolean> {
  try {
    const list = (await apiListPublicStorePages(storeId)).data ?? [];
    return list.some(p => p.slug === slug || JSON.stringify(p.translations ?? {}).includes(JSON.stringify(slug)));
  } catch { return true; }
}
