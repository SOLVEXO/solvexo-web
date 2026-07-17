import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { PublicStoresListData } from './store';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** GET /api/search/stores — same response shape as apiListPublicStores (backend delegates straight into it). */
export function apiSearchStores(q: string, page = 1, limit = 20) {
  const query = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  return client.get<never, ApiResponse<PublicStoresListData>>(
    `${ENDPOINTS.SEARCH.STORES}?${query.toString()}`,
  );
}
