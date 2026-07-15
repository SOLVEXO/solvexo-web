import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type SeoPreviewEntityType = 'product' | 'category' | 'store';

export interface SchemaPreviewData {
  jsonLd: Record<string, unknown> | Record<string, unknown>[];
}

export interface SocialPreviewData {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  url: string;
}

export function apiPreviewSeoSchema(storeId: string, entityType: SeoPreviewEntityType, entityId: string) {
  return client.get<never, ApiResponse<SchemaPreviewData>>(ENDPOINTS.SEO.SELLER.PREVIEW.SCHEMA(storeId, entityType, entityId));
}

export function apiPreviewSeoSocial(storeId: string, entityType: SeoPreviewEntityType, entityId: string) {
  return client.get<never, ApiResponse<SocialPreviewData>>(ENDPOINTS.SEO.SELLER.PREVIEW.SOCIAL(storeId, entityType, entityId));
}
