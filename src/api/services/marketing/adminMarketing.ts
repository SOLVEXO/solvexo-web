import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type CampaignStatus = 'draft' | 'active' | 'ended';
export type DiscountType = 'percentage' | 'fixed';

export interface Campaign {
  _id: string;
  name: string;
  description: string | null;
  bannerImage: string | null;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  discountType: DiscountType | null;
  discountValue: number | null;
  participatingStoreIds: string[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  bannerImage?: string;
  startDate: string;
  endDate: string;
  discountType?: DiscountType;
  discountValue?: number;
}

export type UpdateCampaignPayload = Partial<CreateCampaignPayload>;

export type PlatformCouponDiscountType = 'percentage' | 'fixed';

export interface PlatformCoupon {
  _id: string;
  scope: 'seller' | 'platform';
  code: string;
  discountType: PlatformCouponDiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformCouponPayload {
  code: string;
  discountType: PlatformCouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  usageLimit?: number;
  expiresAt?: string;
}

export interface UpdatePlatformCouponPayload {
  discountValue?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  expiresAt?: string;
  isActive?: boolean;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ─────────────────────────────────────────────────────────────────────────────
// API — Campaigns
// ─────────────────────────────────────────────────────────────────────────────
export function apiCreateCampaign(payload: CreateCampaignPayload) {
  return client.post<never, ApiResponse<Campaign>>(ENDPOINTS.MARKETING.ADMIN.CAMPAIGNS.CREATE, payload);
}

export function apiListCampaigns(status?: CampaignStatus) {
  return client.get<never, ApiResponse<Campaign[]>>(ENDPOINTS.MARKETING.ADMIN.CAMPAIGNS.LIST, {
    params: status ? { status } : undefined,
  });
}

export function apiUpdateCampaign(id: string, payload: UpdateCampaignPayload) {
  return client.put<never, ApiResponse<Campaign>>(ENDPOINTS.MARKETING.ADMIN.CAMPAIGNS.UPDATE(id), payload);
}

export function apiSetCampaignStatus(id: string, status: CampaignStatus) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.MARKETING.ADMIN.CAMPAIGNS.SET_STATUS(id), { status });
}

export function apiDeleteCampaign(id: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.MARKETING.ADMIN.CAMPAIGNS.DELETE(id));
}

// ─────────────────────────────────────────────────────────────────────────────
// API — Platform-wide coupons
// ─────────────────────────────────────────────────────────────────────────────
export function apiCreatePlatformCoupon(payload: CreatePlatformCouponPayload) {
  return client.post<never, ApiResponse<PlatformCoupon>>(ENDPOINTS.MARKETING.ADMIN.COUPONS.CREATE, payload);
}

export function apiListPlatformCoupons() {
  return client.get<never, ApiResponse<PlatformCoupon[]>>(ENDPOINTS.MARKETING.ADMIN.COUPONS.LIST);
}

export function apiUpdatePlatformCoupon(id: string, payload: UpdatePlatformCouponPayload) {
  return client.patch<never, ApiResponse<PlatformCoupon>>(ENDPOINTS.MARKETING.ADMIN.COUPONS.UPDATE(id), payload);
}

export function apiDeletePlatformCoupon(id: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.MARKETING.ADMIN.COUPONS.DELETE(id));
}
