import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Section } from './storefrontTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Generalized from a Collection-only singleton into "alternate templates
 *  for a resource type" — a store can have several named templates per
 *  resourceType (e.g. `collection.default` + `collection.sale`,
 *  `product.default` + `product.minimal`). Every call defaults to
 *  `resourceType: 'collection', templateKey: 'default'` when omitted, so
 *  every pre-existing caller (which never passed either) is unaffected. */
export type ResourceTemplateType = 'collection' | 'product' | 'page';

export interface CollectionTemplateDraft {
  sections: Section[];
}

export interface CollectionTemplateData {
  _id:             string;
  storeId:         string;
  resourceType:    ResourceTemplateType;
  templateKey:     string;
  name:            string;
  isDefault:       boolean;
  /** The LIVE/published sections — what buyers currently see. Editing calls target `draft.sections` instead. */
  sections:        Section[];
  /** The seller's working copy — the template editor reads from and writes to this. */
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

function withParams(path: string, resourceType?: ResourceTemplateType, templateKey?: string) {
  const params = new URLSearchParams();
  if (resourceType) params.set('resourceType', resourceType);
  if (templateKey) params.set('templateKey', templateKey);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// ── Template management (alternate templates) ───────────────────────────

export function apiListResourceTemplates(storeId: string, resourceType: ResourceTemplateType) {
  return client.get<never, ApiResponse<CollectionTemplateData[]>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.LIST_TEMPLATES(storeId), resourceType));
}

export function apiCreateResourceTemplate(storeId: string, resourceType: ResourceTemplateType, payload: { name: string; templateKey: string; cloneFromTemplateKey?: string }) {
  return client.post<never, ApiResponse<CollectionTemplateData>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.LIST_TEMPLATES(storeId), resourceType), payload);
}

export function apiDeleteResourceTemplate(storeId: string, resourceType: ResourceTemplateType, templateKey: string) {
  return client.delete<never, ApiResponse<null>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.DELETE_TEMPLATE(storeId, templateKey), resourceType));
}

// ── Seller ───────────────────────────────────────────────────────────────────

export function apiGetCollectionTemplate(storeId: string, resourceType?: ResourceTemplateType, templateKey?: string) {
  return client.get<never, ApiResponse<CollectionTemplateData>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.GET(storeId), resourceType, templateKey));
}

/** The builder's working copy — `draft.sections` plus `lastPublishedAt`, mirroring `apiGetStorePageDraft`'s shape/purpose. */
export function apiGetCollectionTemplateDraft(storeId: string, resourceType?: ResourceTemplateType, templateKey?: string) {
  return client.get<never, ApiResponse<{ sections: Section[]; lastPublishedAt: string | null }>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.DRAFT(storeId), resourceType, templateKey));
}

export function apiUpdateCollectionTemplateSections(storeId: string, sections: Section[], resourceType?: ResourceTemplateType, templateKey?: string) {
  return client.patch<never, ApiResponse<CollectionTemplateData>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.UPDATE_SECTIONS(storeId), resourceType, templateKey), { sections });
}

export function apiPublishCollectionTemplate(storeId: string, resourceType?: ResourceTemplateType, templateKey?: string) {
  return client.patch<never, ApiResponse<CollectionTemplateData>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.PUBLISH(storeId), resourceType, templateKey));
}

/** "Discard unsaved changes" — copies the live `sections` back over `draft.sections`. Mirrors `apiRevertStorePageDraft`. */
export function apiRevertCollectionTemplateDraft(storeId: string, resourceType?: ResourceTemplateType, templateKey?: string) {
  return client.patch<never, ApiResponse<CollectionTemplateData>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.REVERT_DRAFT(storeId), resourceType, templateKey));
}

export interface CollectionTemplateVersionData {
  _id: string;
  sections: Section[];
  publishedAt: string;
}

export function apiListCollectionTemplateVersions(storeId: string, resourceType?: ResourceTemplateType, templateKey?: string) {
  return client.get<never, ApiResponse<CollectionTemplateVersionData[]>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.VERSIONS(storeId), resourceType, templateKey));
}

export function apiRestoreCollectionTemplateVersion(storeId: string, versionId: string, resourceType?: ResourceTemplateType, templateKey?: string) {
  return client.post<never, ApiResponse<CollectionTemplateData>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.RESTORE_VERSION(storeId, versionId), resourceType, templateKey));
}

// ── Public ───────────────────────────────────────────────────────────────────

export function apiGetPublicCollectionTemplate(storeId: string, resourceType?: ResourceTemplateType, templateKey?: string) {
  return client.get<never, ApiResponse<PublicCollectionTemplate>>(withParams(ENDPOINTS.COLLECTION_TEMPLATE.PUBLIC(storeId), resourceType, templateKey));
}
