import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type CampaignStatus = 'draft' | 'active' | 'ended';
export type DiscountType = 'percentage' | 'fixed';

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
