import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { PublicStoresListData } from './store';
import type { ProductsByCategoryResponse } from './marketplace';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** GET /api/search/stores — same response shape as apiListPublicStores (backend delegates straight into it). */
export function apiSearchStores(q: string, page = 1, limit = 20) {
  const query = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  return client.get<never, ApiResponse<PublicStoresListData>>(
    `${ENDPOINTS.SEARCH.STORES}?${query.toString()}`,
  );
}

/** GET /api/search/products — real full-catalog text search (name/description),
 *  unlike the category browse endpoint's client-side-only substring match on
 *  whatever page happened to already be loaded. Same response shape as
 *  apiGetAllProducts (backend delegates into the same ProductsService method
 *  that powers it). Does not support the category/price/rating/type facets —
 *  those only apply to the browse (non-search) path. */
export function apiSearchProducts(q: string, page = 1, limit = 20) {
  const query = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  return client.get<never, ProductsByCategoryResponse>(
    `${ENDPOINTS.SEARCH.PRODUCTS}?${query.toString()}`,
  );
}

export interface RecentSearchEntry { searchId: string; query: string }

/** GET /api/search/recent — requires auth; per-account history synced across devices. */
export function apiGetRecentSearches(limit = 5) {
  return client.get<never, ApiResponse<RecentSearchEntry[]>>(
    `${ENDPOINTS.SEARCH.RECENT}?limit=${limit}`,
  );
}
