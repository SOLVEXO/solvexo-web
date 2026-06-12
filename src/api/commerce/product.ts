import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DigitalFile {
  url:      string;
  name:     string;
  size:     number;
  mimeType: string;
}

export interface DigitalMeta {
  files:                DigitalFile[];
  downloadLimit:        string;          // 'unlimited' or a number as string
  linkExpiryDays:       number | null;
  pdfStampingEnabled:   boolean;
  licenseType:          'personal' | 'commercial';
  buyerDeliveryMessage: string;
}

export interface ProductVariant {
  _id:            string;
  productId:      string;
  sku:            string;
  price:          number;
  compareAtPrice: number | null;
  size:           string | null;
  color:          string | null;
  stock:          number;
  shippingWeight: string | null;
  images:         string[];
  isDefault:      boolean;
  status:         string;
  isDelete:       boolean;
  createdAt:      string;
  updatedAt:      string;
}

export interface StoreProduct {
  _id:               string;
  sellerId:          string;
  storeId:           string;
  name:              string;
  slug:              string;
  description:       string;
  productType:       'physical' | 'digital';
  type:              'physical' | 'digital';
  categoryId:        string;
  subCategoryId:     string | null;
  images:            string[];
  tags:              string[];
  digital:           DigitalMeta | null;
  status:            'draft' | 'active' | 'archived';
  isListedOnSolvexo: boolean;
  isDelete:          boolean;
  createdAt:         string;
  updatedAt:         string;
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface CreatePhysicalPayload {
  storeId:           string;
  name:              string;
  description:       string;
  subCategoryId:     string | null;
  images:            string[];
  tags:              string[];
  isListedOnSolvexo: boolean;
  status:            'draft' | 'active';
  price:             number;
  compareAtPrice:    number | null;
  size:              string;
  color:             string;
  stock:             number;
  shippingWeight:    string;
}

export interface CreateDigitalPayload {
  storeId:           string;
  name:              string;
  description:       string;
  productType:       'digital';
  subCategoryId:     string | null;
  images:            string[];
  tags:              string[];
  isListedOnSolvexo: boolean;
  status:            'draft' | 'active';
  price:             number;
  compareAtPrice:    number | null;
  digital:           DigitalMeta;
}

export interface EditPhysicalPayload {
  productId:         string;
  name:              string;
  description:       string;
  subCategoryId:     string | null;
  images:            string[];
  tags:              string[];
  isListedOnSolvexo: boolean;
  status:            'draft' | 'active';
  price:             number;
  compareAtPrice:    number | null;
  size:              string;
  color:             string;
  stock:             number;
  shippingWeight:    string | number;
}

export interface EditDigitalPayload {
  productId:      string;
  variantId:      string | null;
  name:           string;
  description:    string;
  status:         'draft' | 'active';
  price:          number;
  compareAtPrice: number | null;
  digital:        DigitalMeta;
}

// ── Response shapes ───────────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
}

export interface CreateProductData {
  product:        StoreProduct;
  defaultVariant: ProductVariant;
}

export interface EditProductData {
  product: StoreProduct;
  variant: ProductVariant;
}

export interface GetProductData {
  product: StoreProduct;
}

// ── API functions ─────────────────────────────────────────────────────────────

export function apiCreatePhysicalProduct(payload: CreatePhysicalPayload) {
  return client.post<never, ApiResponse<CreateProductData>>(
    ENDPOINTS.PRODUCT.CREATE_PHYSICAL, payload,
  );
}

export function apiCreateDigitalProduct(payload: CreateDigitalPayload) {
  return client.post<never, ApiResponse<CreateProductData>>(
    ENDPOINTS.PRODUCT.CREATE_DIGITAL, payload,
  );
}

export function apiEditPhysicalProduct(id: string, payload: EditPhysicalPayload) {
  return client.post<never, ApiResponse<EditProductData>>(
    ENDPOINTS.PRODUCT.EDIT_PHYSICAL(id), payload,
  );
}

export function apiEditDigitalProduct(id: string, payload: EditDigitalPayload) {
  return client.post<never, ApiResponse<EditProductData>>(
    ENDPOINTS.PRODUCT.EDIT_DIGITAL(id), payload,
  );
}

export function apiGetMyProductById(id: string) {
  return client.get<never, ApiResponse<GetProductData>>(
    ENDPOINTS.PRODUCT.GET_MY_PRODUCT_BY_ID(id),
  );
}
