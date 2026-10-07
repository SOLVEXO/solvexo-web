import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface SearchSuggestions {
  query: string;
  /** Prices are in the STORE currency (convert with the currency context). */
  products: { id: string; name: string; slug: string; image: string | null; price: number | null; compareAtPrice: number | null }[];
  collections: { id: string; name: string; slug: string; image: string | null }[];
  articles: { id: string; title: string; slug: string; excerpt: string; image: string | null }[];
  pages: { id: string; title: string; slug: string }[];
  queries: string[];
}

export interface SearchContentResults {
  articles: SearchSuggestions['articles'];
  pages: SearchSuggestions['pages'];
  totals: { articles: number; pages: number };
}

/** GET /api/public/search/suggest — predictive search (store-scoped, abortable). */
export function apiGetSearchSuggestions(storeId: string, q: string, signal?: AbortSignal) {
  const qs = new URLSearchParams({ storeId, q }).toString();
  return client.get<never, ApiResponse<SearchSuggestions>>(`${ENDPOINTS.SEARCH.PUBLIC_SUGGEST}?${qs}`, { signal });
}

/** GET /api/public/search/content — articles + pages matching a query (results page tabs). */
export function apiGetSearchContent(storeId: string, q: string, signal?: AbortSignal) {
  const qs = new URLSearchParams({ storeId, q, limit: '12' }).toString();
  return client.get<never, ApiResponse<SearchContentResults>>(`${ENDPOINTS.SEARCH.PUBLIC_CONTENT}?${qs}`, { signal });
}
