import client from '../../client';
import { ENDPOINTS } from '../../endpoints';
import type { VariantOption } from '../product';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PosProductVariant {
  variantId:      string;
  sku:            string;
  price:          number;
  compareAtPrice?: number | null;
  stock:          number;
  options?:       VariantOption[];
  isDefault?:     boolean;
  images?:        string[];
}

export interface PosProduct {
  productId:  string;
  name:       string;
  type:       string;
  image:      string | null;
  categoryId?: string;
  variants:   PosProductVariant[];
}

export interface PosProductsQuery {
  page?:       number;
  limit?:      number;
  categoryId?: string;
}

export interface BarcodeResult {
  productId: string;
  name:      string;
  type:      string;
  image:     string | null;
  variant: PosProductVariant & { barcode: string };
}

interface ApiResponse<T> { success: boolean; data: T }
interface SearchResponse { success: boolean; count: number; data: PosProduct[] }
interface BrowseResponse {
  success: boolean;
  data: {
    pagination: { page: number; limit: number; total: number; totalPages: number };
    products:   PosProduct[];
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

/** GET /api/pos/products/search?storeId=&q= */
export function apiSearchPosProducts(storeId: string, q: string) {
  return client.get<never, SearchResponse>(
    `${ENDPOINTS.POS.PRODUCTS.SEARCH}?storeId=${encodeURIComponent(storeId)}&q=${encodeURIComponent(q)}`,
  );
}

/** GET /api/pos/products/:storeId?page=&limit=&categoryId= */
export function apiGetPosProducts(storeId: string, query: PosProductsQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.categoryId) params.set('categoryId', query.categoryId);
  const qs = params.toString();
  return client.get<never, BrowseResponse>(
    `${ENDPOINTS.POS.PRODUCTS.LIST(storeId)}${qs ? `?${qs}` : ''}`,
  );
}

/** GET /api/pos/products/barcode/:storeId/:barcode */
export function apiGetProductByBarcode(storeId: string, barcode: string) {
  return client.get<never, ApiResponse<BarcodeResult>>(
    ENDPOINTS.POS.PRODUCTS.GET_BY_BARCODE(storeId, encodeURIComponent(barcode)),
  );
}
