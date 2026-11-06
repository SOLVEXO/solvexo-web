import axios from 'axios';
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
  /** 'raw' = anything that isn't an image or video (PDF, Word/Excel/PowerPoint, zip, plain text). */
  type?: 'image' | 'video' | 'raw';
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

type UploadedAsset = { success: boolean; data: { url: string; publicId: string; resourceType: string; mediaAssetId: string } };

/** Fast path: the browser uploads straight to Cloudinary using a short-lived
 *  server signature, then the API verifies + tracks it. The image bytes never
 *  go through our (slow) API server. Falls back to the old via-server upload
 *  if the direct route fails for any reason. */
export async function apiUploadMediaAsset(storeId: string, file: File, meta?: { altText?: string; tags?: string[] }): Promise<UploadedAsset> {
  try {
    const sig = (await client.post<never, { data: { cloudName: string; apiKey: string; timestamp: number; folder: string; allowedFormats: string; signature: string } }>(
      ENDPOINTS.MEDIA_LIBRARY.UPLOAD_SIGNATURE(storeId),
    )).data;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', sig.apiKey);
    fd.append('timestamp', String(sig.timestamp));
    fd.append('folder', sig.folder);
    fd.append('allowed_formats', sig.allowedFormats);
    fd.append('signature', sig.signature);
    const cloud = await axios.post<{ public_id: string }>(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, fd, { timeout: 300_000 },
    );
    return await client.post<never, UploadedAsset>(ENDPOINTS.MEDIA_LIBRARY.REGISTER_UPLOAD(storeId), {
      publicId: cloud.data.public_id, filename: file.name, altText: meta?.altText, tags: meta?.tags?.join(','),
    }, { timeout: 60_000 });
  } catch {
    return apiUploadMediaAssetViaServer(storeId, file, meta);
  }
}

function apiUploadMediaAssetViaServer(storeId: string, file: File, meta?: { altText?: string; tags?: string[] }) {
  const form = new FormData();
  form.append('file', file);
  if (meta?.altText) form.append('altText', meta.altText);
  if (meta?.tags?.length) form.append('tags', meta.tags.join(','));
  return client.post<never, { success: boolean; data: { url: string; publicId: string; resourceType: string; mediaAssetId: string } }>(
    // Image uploads (up to 20MB, Cloudinary round-trip) outlast the client's default 15s timeout.
    ENDPOINTS.MEDIA_LIBRARY.UPLOAD(storeId), form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 600_000 },
  );
}

/** Same as `apiUploadMediaAsset`, sourced from a pasted URL instead of a file. */
export function apiUploadMediaAssetFromUrl(storeId: string, url: string, meta?: { altText?: string; tags?: string[] }) {
  return client.post<never, { success: boolean; data: { url: string; publicId: string; resourceType: string; mediaAssetId: string } }>(
    ENDPOINTS.MEDIA_LIBRARY.UPLOAD_FROM_URL(storeId), { url, altText: meta?.altText, tags: meta?.tags?.join(',') }, { timeout: 120_000 },
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
