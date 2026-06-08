import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type SellerType   = 'creator' | 'reseller' | 'brand';
export type ProductType  = 'physical_products' | 'digital_downloads' | 'services';
export type EnabledTool  =
  | 'inventory_manager' | 'shipping_manager' | 'digital_delivery'
  | 'ai_studio' | 'marketplace_listing';

export interface CreateStorePayload {
  name:         string;
  logo?:        string;
  categoryId:   string;
  description?: string;
  sellerType:   SellerType;
  productTypes: ProductType[];
}

export interface StoreData {
  _id:          string;
  sellerId:     string;
  name:         string;
  slug:         string;
  logo:         string;
  categoryId:   string;
  description:  string;
  sellerType:   SellerType;
  productTypes: ProductType[];
  enabledTools: EnabledTool[];
  plan:         string;
  aiCredits:    number;
  status:       'active' | 'inactive';
  isDelete:     boolean;
  registers:    unknown[];
  shifts:       unknown[];
  createdAt:    string;
  updatedAt:    string;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ─────────────────────────────────────────────────────────────────────────────
// STORE API
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/store/create-store */
export function apiCreateStore(payload: CreateStorePayload) {
  return client.post<never, ApiResponse<StoreData>>(ENDPOINTS.STORE.CREATE, payload);
}

/** GET /api/store/getStoreById/:id */
export function apiGetStoreById(id: string) {
  return client.get<never, ApiResponse<StoreData>>(ENDPOINTS.STORE.GET_BY_ID(id));
}
