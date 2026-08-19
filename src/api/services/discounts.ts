import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type DiscountType = 'percentage' | 'fixed';
export type DiscountTarget = 'store' | 'category' | 'products';

export interface AutomaticDiscount {
  _id: string;
  storeId: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  currency: string | null;
  target: DiscountTarget;
  categoryIds: string[];
  productIds: string[];
  minOrderAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDiscountPayload {
  name: string;
  discountType: DiscountType;
  discountValue: number;
  target: DiscountTarget;
  categoryIds?: string[];
  productIds?: string[];
  minOrderAmount?: number;
  startsAt?: string;
  endsAt?: string;
}

export type UpdateDiscountPayload = Partial<CreateDiscountPayload> & { isActive?: boolean };

/** POST /api/discounts/:storeId */
export function apiCreateDiscount(storeId: string, payload: CreateDiscountPayload) {
  return client.post<never, ApiResponse<AutomaticDiscount>>(ENDPOINTS.DISCOUNTS.LIST(storeId), payload);
}

/** GET /api/discounts/:storeId */
export function apiGetDiscounts(storeId: string) {
  return client.get<never, ApiResponse<AutomaticDiscount[]>>(ENDPOINTS.DISCOUNTS.LIST(storeId));
}

/** PATCH /api/discounts/:storeId/:discountId */
export function apiUpdateDiscount(storeId: string, discountId: string, payload: UpdateDiscountPayload) {
  return client.patch<never, ApiResponse<AutomaticDiscount>>(ENDPOINTS.DISCOUNTS.UPDATE(storeId, discountId), payload);
}

/** DELETE /api/discounts/:storeId/:discountId */
export function apiDeleteDiscount(storeId: string, discountId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.DISCOUNTS.DELETE(storeId, discountId));
}
