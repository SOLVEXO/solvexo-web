import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface StoreCreditTransaction {
  _id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
  expiresAt?: string | null;
  orderId?: string | null;
}

export interface StoreCreditAccount {
  currency: string;
  balance: number;
  nextExpiry: { expiresAt: string; amount: number } | null;
  transactions: { items: StoreCreditTransaction[]; total: number; page: number; limit: number };
}

export interface StoreCreditQuery { page?: number; limit?: number }

function qs(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** GET /api/store-credit/my?storeId= — the logged-in buyer's balance at one store. */
export function apiGetMyStoreCredit(storeId: string, params: StoreCreditQuery = {}) {
  return client.get<never, ApiResponse<StoreCreditAccount>>(
    `${ENDPOINTS.STORE_CREDIT.MY}${qs({ storeId, ...params })}`,
  );
}

/** GET /api/store-credit/:storeId/customers/:customerId (seller/staff) */
export function apiGetCustomerStoreCredit(storeId: string, customerId: string, params: StoreCreditQuery = {}) {
  return client.get<never, ApiResponse<StoreCreditAccount>>(
    `${ENDPOINTS.STORE_CREDIT.CUSTOMER(storeId, customerId)}${qs({ ...params })}`,
  );
}

export interface AdjustStoreCreditPayload { amount: number; note?: string; expiresAt?: string | null }

/** POST /api/store-credit/:storeId/customers/:customerId/adjust (seller/staff) */
export function apiAdjustStoreCredit(storeId: string, customerId: string, payload: AdjustStoreCreditPayload) {
  return client.post<never, ApiResponse<StoreCreditAccount>>(
    ENDPOINTS.STORE_CREDIT.ADJUST(storeId, customerId), payload,
  );
}
