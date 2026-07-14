import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type LandingPageStatus = 'draft' | 'published';

export interface LandingPageSeoMeta {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  twitterCard: 'summary' | 'summary_large_image' | string;
  canonicalUrlOverride: string | null;
  noindex: boolean;
  keywords: string[];
  aiGenerated: boolean;
  updatedAt: string | null;
}

export interface LandingPageRow {
  _id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  status: LandingPageStatus | string;
  seo: LandingPageSeoMeta;
  createdByAdminId: string | null;
  isDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination { page: number; limit: number; total: number; pages: number }

export interface LandingPagesListData {
  items: LandingPageRow[];
  pagination: Pagination;
}

export interface LandingPagesListParams {
  page?: number;
  limit?: number;
  status?: LandingPageStatus | string;
  [key: string]: unknown;
}

export interface CreateLandingPagePayload {
  slug: string;
  title: string;
  content?: Record<string, unknown>;
  status?: LandingPageStatus | string;
}

export type UpdateLandingPagePayload = Partial<Omit<CreateLandingPagePayload, 'slug'>>;

export interface DeleteResultData { success: boolean }

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiListSeoLandingPages(params: LandingPagesListParams = {}) {
  return client.get<never, ApiResponse<LandingPagesListData>>(`${ENDPOINTS.SEO.ADMIN.LANDING_PAGES.LIST}${qs(params)}`);
}

export function apiGetSeoLandingPage(id: string) {
  return client.get<never, ApiResponse<LandingPageRow>>(ENDPOINTS.SEO.ADMIN.LANDING_PAGES.GET_BY_ID(id));
}

export function apiCreateSeoLandingPage(payload: CreateLandingPagePayload) {
  return client.post<never, ApiResponse<LandingPageRow>>(ENDPOINTS.SEO.ADMIN.LANDING_PAGES.CREATE, payload);
}

export function apiUpdateSeoLandingPage(id: string, payload: UpdateLandingPagePayload) {
  return client.patch<never, ApiResponse<LandingPageRow>>(ENDPOINTS.SEO.ADMIN.LANDING_PAGES.UPDATE(id), payload);
}

export function apiDeleteSeoLandingPage(id: string) {
  return client.delete<never, ApiResponse<DeleteResultData>>(ENDPOINTS.SEO.ADMIN.LANDING_PAGES.DELETE(id));
}
