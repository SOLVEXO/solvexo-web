import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface Banner {
  _id:         string;
  bannerImage: string;
  publicId:    string;
  urlOnTap:    string | null;
  isActive:    boolean;
  order:       number;
  createdAt:   string;
  updatedAt:   string;
}

export interface BannerCountData {
  current:   number;
  max:       number;
  remaining: number;
  isFull:    boolean;
}

export interface CreateBannerPayload {
  bannerImage?: string;
  urlOnTap?:    string;
  order?:       number;
}

export interface UpdateBannerPayload {
  bannerImage?: string;
  urlOnTap?:    string;
  order?:       number;
  isActive?:    boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetBanners() {
  return client.get<never, { success: boolean; count: number; remaining: number; data: Banner[] }>(
    ENDPOINTS.BANNER.LIST,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetBannerCount() {
  return client.get<never, { success: boolean; data: BannerCountData }>(ENDPOINTS.BANNER.COUNT);
}

export function apiCreateBannerFromUrl(payload: CreateBannerPayload) {
  return client.post<never, { success: boolean; message: string; remaining: number; data: Banner }>(
    ENDPOINTS.BANNER.CREATE, payload,
  );
}

export function apiUploadBanner(file: File, urlOnTap?: string) {
  const fd = new FormData();
  fd.append('file', file);
  return client.post<never, { success: boolean; message: string; remaining: number; data: Banner }>(
    ENDPOINTS.BANNER.UPLOAD, fd, { params: urlOnTap ? { urlOnTap } : undefined },
  );
}

export function apiUpdateBanner(id: string, payload: UpdateBannerPayload) {
  return client.patch<never, { success: boolean; message: string; data: Banner }>(
    ENDPOINTS.BANNER.UPDATE(id), payload,
  );
}

export function apiDeleteBanner(id: string) {
  return client.delete<never, { success: boolean; message: string; remaining: number }>(
    ENDPOINTS.BANNER.DELETE(id),
  );
}
