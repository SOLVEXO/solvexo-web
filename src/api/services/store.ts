import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ActiveCampaignBadge } from './marketplace';

export type SellerType  = 'creator' | 'reseller' | 'brand' | 'retailer';
export type ProductType = 'physical_products' | 'digital_downloads' | 'educational_resources' | 'services' | 'in_person_pos';

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
  coverImage?:  string | null;
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
  coverImage:   string | null;
  categoryId:   string;
  description:  string;
  sellerType:   SellerType;
  productTypes: ProductType[];
  enabledTools: string[];
  plan:         string;
  aiCredits:    number;
  customDomain: string | null;
  whiteLabelEnabled: boolean;
  status:       'active' | 'inactive';
  isDelete:     boolean;
  registers:    unknown[];
  shifts:       unknown[];
  createdAt:    string;
  updatedAt:    string;
}

export interface MyStoreItem extends StoreData {
  sellerName:    string;
  sellerEmail:   string;
  /** Active, non-deleted product count for this store. */
  productCount:  number;
  /** All-time net revenue (gross minus refunds) across non-cancelled orders. */
  totalSalesUSD: number;
}

export interface MyStoresSummary {
  storeCount:      number;
  totalProducts:   number;
  totalRevenueUSD: number;
}

interface ApiResponse<T>      { success: boolean; message?: string; data: T }
interface MyStoresResponse    { success: boolean; count: number; summary: MyStoresSummary; data: MyStoreItem[] }

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

/** PATCH /api/store/:storeId/custom-domain */
export function apiSetCustomDomain(storeId: string, domain: string | null) {
  return client.patch<never, ApiResponse<{ customDomain: string | null }>>(ENDPOINTS.STORE.CUSTOM_DOMAIN(storeId), { domain });
}

/** PATCH /api/store/:storeId/white-label */
export function apiSetWhiteLabel(storeId: string, enabled: boolean) {
  return client.patch<never, ApiResponse<{ whiteLabelEnabled: boolean }>>(ENDPOINTS.STORE.WHITE_LABEL(storeId), { enabled });
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
  averageRating:  number;
  reviewCount:    number;
  builderConfig:  Record<string, unknown> | null;
  sellerType:     string | null;
  badges:         string[];
  createdAt:      string;
  activeCampaign: ActiveCampaignBadge | null;
}

export interface PublicStoreProductsParams {
  page?:       number;
  limit?:      number;
  sort?:       'newest' | 'price_asc' | 'price_desc' | 'best_rated';
  type?:       'all' | 'physical' | 'digital';
  categoryId?: string;
  tag?:        string;
}

export interface PublicStoreProduct {
  _id:         string;
  name:        string;
  images?:     string[];
  type?:       'physical' | 'digital';
  productType?: 'physical' | 'digital' | 'educational';
  tags?:       string[];
  averageRating?: number;
  defaultVariantPrice: number | null;
  // Present only when the requester has an active, discount-granting
  // subscription to this store — resolved server-side only.
  subscriberPrice?:    number;
  youSaveUSD?:         number;
  discountPercent?:    number;
  subscriberPlanName?: string;
  activeCampaign?:     ActiveCampaignBadge | null;
}

export interface PublicStoreProductsData {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  products:   PublicStoreProduct[];
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

// ── Public store browse / discovery ────────────────────────────────────────────

export interface PublicStoreListItem {
  storeId:        string;
  name:           string;
  slug:           string;
  logo:           string | null;
  coverImage:     string | null;
  description:    string | null;
  categoryId:     string | null;
  followersCount: number;
  averageRating:  number;
  reviewCount:    number;
  sellerType:     SellerType | null;
  badges:         string[];
  productCount?:  number;
}

export interface ListPublicStoresParams {
  page?:       number;
  limit?:      number;
  categoryId?: string;
  q?:          string;
  sort?:       'rating' | 'followers' | 'newest';
}

export interface PublicStoresListData {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stores:     PublicStoreListItem[];
}

/** GET /api/store/public — browse/search public stores. */
export function apiListPublicStores(params?: ListPublicStoresParams) {
  const query = new URLSearchParams();
  if (params?.page)       query.set('page',       String(params.page));
  if (params?.limit)      query.set('limit',      String(params.limit));
  if (params?.categoryId) query.set('categoryId', params.categoryId);
  if (params?.q)          query.set('q',          params.q);
  if (params?.sort)       query.set('sort',       params.sort);
  const qs = query.toString();
  return client.get<never, ApiResponse<PublicStoresListData>>(
    `${ENDPOINTS.STORE.PUBLIC_LIST}${qs ? `?${qs}` : ''}`,
  );
}

/** GET /api/store/public/top — cached top-stores row (home screen). */
export function apiGetTopStores(limit = 10) {
  return client.get<never, ApiResponse<{ stores: PublicStoreListItem[] }>>(
    `${ENDPOINTS.STORE.PUBLIC_TOP}?limit=${limit}`,
  );
}

export interface PlatformStats {
  storesCount:  number;
  sellersCount: number;
  buyersCount:  number;
  gmv:          number;
  avgRating:    number;
  ratingCount:  number;
}

/** GET /api/store/public/platform-stats — real, cached homepage stat strip. */
export function apiGetPlatformStats() {
  return client.get<never, ApiResponse<PlatformStats>>(ENDPOINTS.STORE.PUBLIC_PLATFORM_STATS);
}

export interface Testimonial {
  id:                 string;
  name:               string;
  storeName:          string | null;
  rating:             number;
  text:               string;
  isVerifiedPurchase: boolean;
}

/** GET /api/store/public/testimonials — real, cached homepage reviews (min length + rating filtered). */
export function apiGetTestimonials(limit = 6) {
  return client.get<never, ApiResponse<Testimonial[]>>(
    `${ENDPOINTS.STORE.PUBLIC_TESTIMONIALS}?limit=${limit}`,
  );
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

// ── Customers (staff-facing) ──────────────────────────────────────────────────

export interface StoreCustomer {
  _id:         string;
  name:        string;
  email:       string;
  phone:       string;
  createdAt:   string | null;
  orderCount:  number;
  totalSpent:  number;
  lastOrderAt: string | null;
}

export interface UpdateStoreCustomerPayload {
  name?:  string;
  phone?: string;
  email?: string;
}

interface PaginatedCustomers {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary:    { totalOrders: number; totalRevenue: number };
  customers:  StoreCustomer[];
}

/** GET /api/store/:storeId/customers  (seller only) */
export function apiGetStoreCustomers(storeId: string, page = 1, limit = 20) {
  return client.get<never, ApiResponse<PaginatedCustomers>>(
    `${ENDPOINTS.STORE.CUSTOMERS.LIST(storeId)}?page=${page}&limit=${limit}`,
  );
}

/** PATCH /api/store/:storeId/customers/:customerId  (seller only) */
export function apiUpdateStoreCustomer(storeId: string, customerId: string, payload: UpdateStoreCustomerPayload) {
  return client.patch<never, ApiResponse<StoreCustomer>>(
    ENDPOINTS.STORE.CUSTOMERS.UPDATE(storeId, customerId), payload,
  );
}
