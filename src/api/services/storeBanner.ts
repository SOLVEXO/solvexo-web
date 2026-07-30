import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export const STORE_BANNER_TYPES = ['hero', 'promotion', 'season', 'collection', 'video'] as const;
export type StoreBannerType = (typeof STORE_BANNER_TYPES)[number];

export type StoreBannerStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired';

export const STORE_BANNER_LINK_TYPES = ['product', 'category', 'external', 'collection'] as const;
export type StoreBannerLinkType = (typeof STORE_BANNER_LINK_TYPES)[number];

export interface StoreBanner {
  _id:             string;
  storeId:         string;
  type:            StoreBannerType;
  imageUrl:        string;
  publicId:        string;
  mobileImageUrl:  string | null;
  mobilePublicId:  string;
  videoUrl:        string | null;
  ctaLabel:        string | null;
  linkType:        StoreBannerLinkType;
  linkTarget:      string | null;
  order:           number;
  priority:        number;
  status:          StoreBannerStatus;
  startAt:         string | null;
  endAt:           string | null;
  createdBy:       string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface CreateStoreBannerFields {
  type?:       StoreBannerType;
  ctaLabel?:   string;
  linkType?:   StoreBannerLinkType;
  linkTarget?: string;
  order?:      number;
  priority?:   number;
  startAt?:    string;
  endAt?:      string;
}

export type UpdateStoreBannerFields = Partial<CreateStoreBannerFields>;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC (storefront)
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetPublicStoreBanners(storeId: string) {
  return client.get<never, { success: boolean; count: number; data: StoreBanner[] }>(
    ENDPOINTS.STORE_BANNER.PUBLIC(storeId),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELLER
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetStoreBanners(storeId: string) {
  return client.get<never, { success: boolean; data: StoreBanner[] }>(ENDPOINTS.STORE_BANNER.LIST(storeId));
}

export function apiCreateStoreBanner(storeId: string, fields: CreateStoreBannerFields, file: File, mobileFile?: File) {
  const fd = new FormData();
  fd.append('file', file);
  if (mobileFile) fd.append('mobileFile', mobileFile);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) fd.append(key, String(value));
  });
  return client.post<never, { success: boolean; message: string; data: StoreBanner }>(
    ENDPOINTS.STORE_BANNER.CREATE(storeId), fd,
  );
}

export function apiUpdateStoreBanner(storeId: string, bannerId: string, fields: UpdateStoreBannerFields) {
  return client.patch<never, { success: boolean; message: string; data: StoreBanner }>(
    ENDPOINTS.STORE_BANNER.UPDATE(storeId, bannerId), fields,
  );
}

export function apiPauseStoreBanner(storeId: string, bannerId: string) {
  return client.patch<never, { success: boolean; message: string; data: StoreBanner }>(
    ENDPOINTS.STORE_BANNER.PAUSE(storeId, bannerId),
  );
}

export function apiResumeStoreBanner(storeId: string, bannerId: string) {
  return client.patch<never, { success: boolean; message: string; data: StoreBanner }>(
    ENDPOINTS.STORE_BANNER.RESUME(storeId, bannerId),
  );
}

export function apiGetStoreBannerTimeline(storeId: string, bannerId: string) {
  return client.get<never, { success: boolean; data: unknown[] }>(
    ENDPOINTS.STORE_BANNER.TIMELINE(storeId, bannerId),
  );
}

export function apiDeleteStoreBanner(storeId: string, bannerId: string) {
  return client.delete<never, { success: boolean; message: string }>(
    ENDPOINTS.STORE_BANNER.DELETE(storeId, bannerId),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA LIBRARY (reusable creatives — "choose existing" picker)
// ─────────────────────────────────────────────────────────────────────────────
export interface MediaAsset {
  _id:          string;
  url:          string;
  publicId:     string;
  resourceType: string;
  width:        number | null;
  height:       number | null;
  createdAt:    string;
}

export function apiGetMediaLibrary() {
  return client.get<never, { success: boolean; data: MediaAsset[] }>(ENDPOINTS.MEDIA_LIBRARY.LIST);
}
