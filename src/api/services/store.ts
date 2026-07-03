import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type SellerType  = 'creator' | 'reseller' | 'brand' | 'retailer';
export type ProductType = 'physical_products' | 'digital_downloads' | 'services' | 'in_person_pos';

export interface CreateStorePayload {
  name:         string;
  logo?:        string;
  categoryId:   string;
  description?: string;
  sellerType:   SellerType;
  productTypes: ProductType[];
}

export interface UpdateStorePayload {
  storeId:      string;
  name?:        string;
  logo?:        string;
  categoryId?:  string;
  description?: string;
  productTypes?: ProductType[];
}

export interface StoreData {
  _id:          string;
  sellerId:     string;
  name:         string;
  slug:         string;
  logo:         string | null;
  categoryId:   string;
  description:  string;
  sellerType:   SellerType;
  productTypes: ProductType[];
  enabledTools: string[];
  plan:         string;
  aiCredits:    number;
  status:       'active' | 'inactive';
  isDelete:     boolean;
  registers:    unknown[];
  shifts:       unknown[];
  createdAt:    string;
  updatedAt:    string;
}

export interface MyStoreItem extends StoreData {
  sellerName:  string;
  sellerEmail: string;
}

interface ApiResponse<T>      { success: boolean; message?: string; data: T }
interface MyStoresResponse    { success: boolean; count: number; data: MyStoreItem[] }

/** POST /api/store/create-store */
export function apiCreateStore(payload: CreateStorePayload) {
  return client.post<never, ApiResponse<StoreData>>(ENDPOINTS.STORE.CREATE, payload);
}

/** POST /api/store/update-store */
export function apiUpdateStore(payload: UpdateStorePayload) {
  return client.post<never, ApiResponse<StoreData>>(ENDPOINTS.STORE.UPDATE, payload);
}

/** GET /api/store/getStoreById/:id */
export function apiGetStoreById(id: string) {
  return client.get<never, ApiResponse<StoreData>>(ENDPOINTS.STORE.GET_BY_ID(id));
}

/** GET /api/store/my-stores */
export function apiGetMyStores() {
  return client.get<never, MyStoresResponse>(ENDPOINTS.STORE.MY_STORES);
}

// ── Builder ───────────────────────────────────────────────────────────────────

export interface SaveBuilderConfigPayload {
  storeId:       string;
  builderConfig: Record<string, unknown>;
  coverImage?:   string;
}

export interface BuilderConfigData {
  builderConfig: Record<string, unknown> | null;
  coverImage:    string | null;
  storeName:     string;
  description:   string;
}

/** POST /api/store/save-builder-config */
export function apiSaveBuilderConfig(payload: SaveBuilderConfigPayload) {
  return client.post<never, ApiResponse<StoreData>>(ENDPOINTS.STORE.SAVE_BUILDER_CONFIG, payload);
}

/** GET /api/store/builder-config/:storeId */
export function apiGetBuilderConfig(storeId: string) {
  return client.get<never, ApiResponse<BuilderConfigData>>(ENDPOINTS.STORE.GET_BUILDER_CONFIG(storeId));
}

// ── Public Storefront ─────────────────────────────────────────────────────────

export interface PublicStoreData {
  storeId:        string;
  sellerId:       string;
  name:           string;
  slug:           string;
  logo:           string | null;
  coverImage:     string | null;
  description:    string | null;
  followersCount: number;
  builderConfig:  Record<string, unknown> | null;
  sellerType:     string | null;
  badges:         string[];
}

export interface PublicStoreProductsParams {
  page?:       number;
  limit?:      number;
  sort?:       'newest' | 'price_asc' | 'price_desc' | 'best_rated';
  type?:       'all' | 'physical' | 'digital';
  categoryId?: string;
  tag?:        string;
}

export interface PublicStoreProductsData {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  products:   unknown[];
}

/** GET /api/store/public/:slug */
export function apiGetPublicStore(slug: string) {
  return client.get<never, ApiResponse<PublicStoreData>>(ENDPOINTS.STORE.PUBLIC_BY_SLUG(slug));
}

/** GET /api/store/public/:storeId/products */
export function apiGetPublicStoreProducts(storeId: string, params?: PublicStoreProductsParams) {
  const query = new URLSearchParams();
  if (params?.page)       query.set('page',       String(params.page));
  if (params?.limit)      query.set('limit',      String(params.limit));
  if (params?.sort)       query.set('sort',        params.sort);
  if (params?.type)       query.set('type',        params.type);
  if (params?.categoryId) query.set('categoryId', params.categoryId);
  if (params?.tag)        query.set('tag',         params.tag);
  const qs = query.toString();
  return client.get<never, ApiResponse<PublicStoreProductsData>>(
    `${ENDPOINTS.STORE.PUBLIC_PRODUCTS(storeId)}${qs ? `?${qs}` : ''}`,
  );
}

/** GET /api/store/public/:storeId/filters */
export function apiGetPublicStoreFilters(storeId: string) {
  return client.get<never, ApiResponse<{ tags: string[] }>>(ENDPOINTS.STORE.PUBLIC_FILTERS(storeId));
}

// ── Follow ────────────────────────────────────────────────────────────────────

export interface FollowStatusData {
  following: boolean;
}

export interface FollowerUser {
  _id:          string;
  name:         string;
  email?:       string;
  profileImage?: string;
}

export interface FollowersData {
  total:      number;
  pagination: { page: number; limit: number; totalPages: number };
  followers:  Array<{ followedAt: string; user: FollowerUser }>;
}

/** POST /api/store/:storeId/follow  (toggle follow/unfollow) */
export function apiFollowStore(storeId: string) {
  return client.post<never, ApiResponse<{ following: boolean }>>(ENDPOINTS.STORE.FOLLOW(storeId));
}

/** GET /api/store/:storeId/follow-status */
export function apiGetFollowStatus(storeId: string) {
  return client.get<never, ApiResponse<FollowStatusData>>(ENDPOINTS.STORE.FOLLOW_STATUS(storeId));
}

/** GET /api/store/:storeId/followers  (seller only) */
export function apiGetStoreFollowers(storeId: string, page = 1, limit = 20) {
  return client.get<never, ApiResponse<FollowersData>>(
    `${ENDPOINTS.STORE.FOLLOWERS(storeId)}?page=${page}&limit=${limit}`,
  );
}
