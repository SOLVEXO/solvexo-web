import client from '@/api/client';

export type BrowseFilterKey = 'availability' | 'price' | 'vendor' | 'tags' | 'options';
export interface BrowseConfig {
  filters: { key: string; enabled: boolean }[];
  sorts: { key: string; enabled: boolean }[];
  showCounts: boolean;
}

/** Storefront (no login): which filters and sort choices the seller wants on product lists. The server answers with the settings themselves (no `data` wrapper). */
export function apiGetPublicSearchConfig(storeId: string) {
  return client.get<never, BrowseConfig>(`/api/public/search-config/${encodeURIComponent(storeId)}`);
}
