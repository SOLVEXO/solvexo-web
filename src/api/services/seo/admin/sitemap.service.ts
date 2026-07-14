import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type SitemapType = 'products' | 'stores' | 'categories' | 'pages';

export interface SitemapChunk {
  type: SitemapType | string;
  storeId: string | null;
  chunkIndex: number;
  urlCount: number;
  generatedAt: string | null;
}

export interface SitemapStatusData {
  chunkCount: number;
  totalUrls: number;
  lastGeneratedAt: string | null;
  chunks: SitemapChunk[];
}

export interface SitemapRegenerateResultData { queued: true }

export function apiGetSitemapStatus() {
  return client.get<never, ApiResponse<SitemapStatusData>>(ENDPOINTS.SEO.ADMIN.SITEMAP.STATUS);
}

/** Always enqueues a background job (never runs inline) — see SeoSitemapService.enqueueRegenerate. */
export function apiRegenerateSitemap() {
  return client.post<never, ApiResponse<SitemapRegenerateResultData>>(ENDPOINTS.SEO.ADMIN.SITEMAP.REGENERATE);
}
