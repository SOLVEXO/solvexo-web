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
