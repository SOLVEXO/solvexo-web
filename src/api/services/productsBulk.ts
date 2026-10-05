import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
}

/** 'inactive' is Shopify's "Archived". */
export type BulkProductStatus = 'active' | 'draft' | 'inactive';

/** Either explicit ids (max 250) or `selectAll` + the list's current server filter (resolved server-side, max 5000). */
export interface BulkTarget {
  productIds?: string[];
  selectAll?:  boolean;
  filter?:     { status?: string; type?: string; q?: string };
}

export interface BulkResult { matched: number; modified: number }

export function apiBulkSetStatus(storeId: string, status: BulkProductStatus, target: BulkTarget) {
  return client.post<never, ApiResponse<BulkResult>>(ENDPOINTS.PRODUCTS_BULK.STATUS(storeId), { status, ...target });
}

export function apiBulkUpdateTags(storeId: string, tags: { add?: string[]; remove?: string[] }, target: BulkTarget) {
  return client.post<never, ApiResponse<BulkResult>>(ENDPOINTS.PRODUCTS_BULK.TAGS(storeId), { ...tags, ...target });
}

export function apiBulkDeleteProducts(storeId: string, target: BulkTarget) {
  return client.post<never, ApiResponse<BulkResult>>(ENDPOINTS.PRODUCTS_BULK.DELETE(storeId), target);
}

export interface BulkEditVariantUpdate {
  variantId:       string;
  price?:          number;
  compareAtPrice?: number | null;
  sku?:            string;
  stock?:          number;
}

export interface BulkEditProductUpdate {
  productId: string;
  name?:     string;
  status?:   BulkProductStatus;
  tags?:     string[];
  variants?: BulkEditVariantUpdate[];
}

export interface BulkEditResult {
  updated: number;
  failed:  number;
  results: { productId: string; ok: boolean; error?: string }[];
}

/** Max 100 products per call — callers chunk. */
export const BULK_EDIT_MAX_PRODUCTS = 100;

export function apiBulkEditProducts(storeId: string, updates: BulkEditProductUpdate[]) {
  return client.post<never, ApiResponse<BulkEditResult>>(ENDPOINTS.PRODUCTS_BULK.EDIT(storeId), { updates });
}
