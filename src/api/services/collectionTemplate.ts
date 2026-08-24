import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Section } from './storefrontTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CollectionTemplateDraft {
  sections: Section[];
}

export interface CollectionTemplateData {
  _id:             string;
  storeId:         string;
  /** The LIVE/published sections — what buyers currently see on `/collections/:slugOrId`. Editing calls target `draft.sections` instead. */
  sections:        Section[];
  /** The seller's working copy — the Collection tab's editor reads from and writes to this. */
  draft:           CollectionTemplateDraft;
  lastPublishedAt: string | null;
  status:          'draft' | 'published';
  createdAt:       string;
  updatedAt:       string;
}

/** Public-storefront shape — a store that's never published a template yet still gets a usable starter grid (see `CollectionTemplateService#getPublic`), so most fields beyond `sections` may be absent. */
export interface PublicCollectionTemplate {
  sections: Section[];
}

// ── Seller ───────────────────────────────────────────────────────────────────

export function apiGetCollectionTemplate(storeId: string) {
  return client.get<never, ApiResponse<CollectionTemplateData>>(ENDPOINTS.COLLECTION_TEMPLATE.GET(storeId));
}

/** The builder's working copy — `draft.sections` plus `lastPublishedAt`, mirroring `apiGetStorePageDraft`'s shape/purpose. */
export function apiGetCollectionTemplateDraft(storeId: string) {
  return client.get<never, ApiResponse<{ sections: Section[]; lastPublishedAt: string | null }>>(ENDPOINTS.COLLECTION_TEMPLATE.DRAFT(storeId));
}

export function apiUpdateCollectionTemplateSections(storeId: string, sections: Section[]) {
  return client.patch<never, ApiResponse<CollectionTemplateData>>(ENDPOINTS.COLLECTION_TEMPLATE.UPDATE_SECTIONS(storeId), { sections });
}

export function apiPublishCollectionTemplate(storeId: string) {
  return client.patch<never, ApiResponse<CollectionTemplateData>>(ENDPOINTS.COLLECTION_TEMPLATE.PUBLISH(storeId));
}

/** "Discard unsaved changes" — copies the live `sections` back over `draft.sections`. Mirrors `apiRevertStorePageDraft`. */
export function apiRevertCollectionTemplateDraft(storeId: string) {
  return client.patch<never, ApiResponse<CollectionTemplateData>>(ENDPOINTS.COLLECTION_TEMPLATE.REVERT_DRAFT(storeId));
}

export interface CollectionTemplateVersionData {
  _id: string;
  sections: Section[];
  publishedAt: string;
}

export function apiListCollectionTemplateVersions(storeId: string) {
  return client.get<never, ApiResponse<CollectionTemplateVersionData[]>>(ENDPOINTS.COLLECTION_TEMPLATE.VERSIONS(storeId));
}

export function apiRestoreCollectionTemplateVersion(storeId: string, versionId: string) {
  return client.post<never, ApiResponse<CollectionTemplateData>>(ENDPOINTS.COLLECTION_TEMPLATE.RESTORE_VERSION(storeId, versionId));
}

// ── Public ───────────────────────────────────────────────────────────────────

export function apiGetPublicCollectionTemplate(storeId: string) {
  return client.get<never, ApiResponse<PublicCollectionTemplate>>(ENDPOINTS.COLLECTION_TEMPLATE.PUBLIC(storeId));
}
