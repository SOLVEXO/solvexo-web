import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface GiftCardSettings {
  storeId: string;
  purchaseEnabled: boolean;
  denominations: number[];
  neverExpires: boolean;
  expiryMonths: number;
}

export type UpdateGiftCardSettingsPayload = Partial<Pick<GiftCardSettings, 'purchaseEnabled' | 'denominations' | 'neverExpires' | 'expiryMonths'>>;

export interface GiftCard {
  _id: string;
  storeId: string;
  code: string;
  currency: string;
  initialValue: number;
  balance: number;
  status: 'active' | 'disabled' | 'expired';
  issuedBy: 'purchase' | 'manual';
  recipientEmail: string | null;
  recipientName: string | null;
  message: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface IssueManualGiftCardPayload {
  value: number;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}

// ── Seller-facing ──────────────────────────────────────────────────────────

/** GET /api/gift-cards/:storeId/settings */
export function apiGetGiftCardSettings(storeId: string) {
  return client.get<never, ApiResponse<GiftCardSettings>>(ENDPOINTS.GIFT_CARDS.SETTINGS(storeId));
}

/** PATCH /api/gift-cards/:storeId/settings */
export function apiUpdateGiftCardSettings(storeId: string, payload: UpdateGiftCardSettingsPayload) {
  return client.patch<never, ApiResponse<GiftCardSettings>>(ENDPOINTS.GIFT_CARDS.SETTINGS(storeId), payload);
}

/** POST /api/gift-cards/:storeId/issue */
export function apiIssueGiftCard(storeId: string, payload: IssueManualGiftCardPayload) {
  return client.post<never, ApiResponse<GiftCard>>(ENDPOINTS.GIFT_CARDS.ISSUE(storeId), payload);
}

/** GET /api/gift-cards/:storeId */
export function apiListGiftCards(storeId: string, query: { page?: number; limit?: number; status?: string; code?: string } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.code) params.set('code', query.code);
  const qs = params.toString();
  return client.get<never, ApiResponse<{ items: GiftCard[]; total: number; page: number; limit: number }>>(
    `${ENDPOINTS.GIFT_CARDS.LIST(storeId)}${qs ? `?${qs}` : ''}`,
  );
}

/** PATCH /api/gift-cards/:storeId/:giftCardId/disable */
export function apiDisableGiftCard(storeId: string, giftCardId: string) {
  return client.patch<never, ApiResponse<GiftCard>>(ENDPOINTS.GIFT_CARDS.DISABLE(storeId, giftCardId), {});
}

// ── Buyer-facing ───────────────────────────────────────────────────────────

export interface GiftCardPublicSettings {
  purchaseEnabled: boolean;
  denominations: number[];
  currency: string;
}

/** GET /api/gift-cards/:storeId/public-settings */
export function apiGetGiftCardPublicSettings(storeId: string) {
  return client.get<never, ApiResponse<GiftCardPublicSettings>>(ENDPOINTS.GIFT_CARDS.PUBLIC_SETTINGS(storeId));
}

/** POST /api/gift-cards/:storeId/purchase-intent */
export function apiCreateGiftCardPurchaseIntent(
  storeId: string,
  payload: { amount: number; recipientEmail?: string; recipientName?: string; message?: string },
) {
  return client.post<never, ApiResponse<{ clientSecret: string; paymentIntentId: string; amount: number; currency: string }>>(
    ENDPOINTS.GIFT_CARDS.PURCHASE_INTENT(storeId), payload,
  );
}
