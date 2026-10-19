import client from '../client';
import { dedupedGet } from '../../utils/dedupedGet';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CollectionSeo {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  twitterCard: 'summary' | 'summary_large_image';
  canonicalUrlOverride: string | null;
  noindex: boolean;
  keywords: string[];
}

export interface CollectionRules {
  categoryId: string | null;
  tags: string[];
  matchType: 'all' | 'any';
  /** Only products whose title contains this text. */
  titleContains?: string | null;
}

export const COLLECTION_SORT_OPTIONS = [
  { value: 'manual', label: 'Featured (your order / newest first)' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'best_rated', label: 'Best rated' },
  { value: 'best_selling', label: 'Best selling' },
] as const;
export type CollectionSort = (typeof COLLECTION_SORT_OPTIONS)[number]['value'];

export interface CollectionData {
  _id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  type: 'manual' | 'automatic';
  productIds: string[];
  rules: CollectionRules;
  /** How the storefront page orders products until the shopper picks another sort. */
  defaultSort?: CollectionSort;
  status: 'active' | 'draft';
  sortOrder: number;
  seo: CollectionSeo;
  /** Which of the store's own Collection alternate templates this collection renders through. Defaults to `'default'`. */
  templateKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCollectionSummary {
  /** Seller translations per language (see utils/localize). */
  translations?: import('@/utils/localize').ContentTranslations;
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  type: 'manual' | 'automatic';
  sortOrder: number;
  defaultSort?: CollectionSort;
  seo?: Partial<CollectionSeo>;
  /** Which of the store's own Collection alternate templates this collection renders through — see `CollectionDetailPage`. Defaults to `'default'` when absent. */
  templateKey?: string;
}

export interface CreateCollectionPayload {
  name: string;
  /** null clears the stored value. */
  description?: string | null;
  image?: string | null;
  defaultSort?: CollectionSort;
  seo?: { metaTitle?: string | null; metaDescription?: string | null };
  type: 'manual' | 'automatic';
  productIds?: string[];
  rules?: Partial<CollectionRules>;
  status?: 'active' | 'draft';
}

export type UpdateCollectionPayload = Partial<CreateCollectionPayload> & { status?: 'active' | 'draft'; templateKey?: string };

// ── Seller ───────────────────────────────────────────────────────────────────

export function apiListCollections(storeId: string) {
  return client.get<never, ApiResponse<CollectionData[]>>(ENDPOINTS.COLLECTIONS.LIST(storeId));
}

export function apiGetCollection(storeId: string, collectionId: string) {
  return client.get<never, ApiResponse<CollectionData>>(ENDPOINTS.COLLECTIONS.GET(storeId, collectionId));
}

export function apiCreateCollection(storeId: string, payload: CreateCollectionPayload) {
  return client.post<never, ApiResponse<CollectionData>>(ENDPOINTS.COLLECTIONS.CREATE(storeId), payload);
}

export function apiUpdateCollection(storeId: string, collectionId: string, payload: UpdateCollectionPayload) {
  return client.patch<never, ApiResponse<CollectionData>>(ENDPOINTS.COLLECTIONS.UPDATE(storeId, collectionId), payload);
}

export function apiUpdateCollectionProducts(storeId: string, collectionId: string, productIds: string[]) {
  return client.patch<never, ApiResponse<CollectionData>>(ENDPOINTS.COLLECTIONS.UPDATE_PRODUCTS(storeId, collectionId), { productIds });
}

export function apiDeleteCollection(storeId: string, collectionId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.COLLECTIONS.DELETE(storeId, collectionId));
}

// ── Public ───────────────────────────────────────────────────────────────────

export function apiGetPublicCollections(storeId: string) {
  return dedupedGet(`collections:${storeId}`, () => client.get<never, ApiResponse<PublicCollectionSummary[]>>(ENDPOINTS.COLLECTIONS.PUBLIC_LIST(storeId)));
}

export function apiGetPublicCollectionBySlug(storeId: string, slugOrId: string) {
  return client.get<never, ApiResponse<PublicCollectionSummary & { seo: CollectionSeo }>>(ENDPOINTS.COLLECTIONS.PUBLIC_GET(storeId, slugOrId));
}
