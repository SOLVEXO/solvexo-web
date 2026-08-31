import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface MediaAsset {
  _id: string;
  storeId: string | null;
  url: string;
  publicId: string;
  resourceType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  mimeType: string | null;
  filename: string;
  altText: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetUsage { type: string; label: string }

export interface ListMediaAssetsQuery {
  search?: string;
  type?: 'image' | 'video';
  tag?: string;
  page?: number;
  limit?: number;
}

export interface ListMediaAssetsResult {
  items: MediaAsset[];
  total: number;
  page: number;
  limit: number;
}

function toQueryString(query: ListMediaAssetsQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.type) params.set('type', query.type);
  if (query.tag) params.set('tag', query.tag);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function apiBrowseMediaLibrary(storeId: string, query: ListMediaAssetsQuery = {}) {
  return client.get<never, { success: boolean; data: ListMediaAssetsResult }>(
    `${ENDPOINTS.MEDIA_LIBRARY.BROWSE(storeId)}${toQueryString(query)}`,
  );
}

export function apiUploadMediaAsset(storeId: string, file: File, meta?: { altText?: string; tags?: string[] }) {
  const form = new FormData();
  form.append('file', file);
  if (meta?.altText) form.append('altText', meta.altText);
  if (meta?.tags?.length) form.append('tags', meta.tags.join(','));
  return client.post<never, { success: boolean; data: { url: string; publicId: string; resourceType: string; mediaAssetId: string } }>(
    ENDPOINTS.MEDIA_LIBRARY.UPLOAD(storeId), form, { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export function apiUpdateMediaAsset(storeId: string, assetId: string, patch: { altText?: string; tags?: string[] }) {
  return client.patch<never, { success: boolean; data: MediaAsset }>(ENDPOINTS.MEDIA_LIBRARY.UPDATE(storeId, assetId), patch);
}

export function apiGetMediaAssetUsage(storeId: string, assetId: string) {
  return client.get<never, { success: boolean; data: MediaAssetUsage[] }>(ENDPOINTS.MEDIA_LIBRARY.USAGE(storeId, assetId));
}

export function apiDeleteMediaAsset(storeId: string, assetId: string, force = false) {
  return client.delete<never, { success: boolean; message: string }>(ENDPOINTS.MEDIA_LIBRARY.DELETE(storeId, assetId, force));
}
