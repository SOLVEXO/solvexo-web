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
  /** A gift waiting for its send day: set while `deliveredAt` is still empty. */
  deliverAt?: string | null;
  deliveredAt?: string | null;
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
export function apiDisableGiftCard(storeId: string, giftCardId: string, notify = false) {
  return client.patch<never, ApiResponse<GiftCard> & { emailed?: GiftCardEmailResult }>(ENDPOINTS.GIFT_CARDS.DISABLE(storeId, giftCardId), { notify });
}

/** What happened to the optional "tell the recipient" email (null = it was not asked for). */
export type GiftCardEmailResult = 'sent' | 'failed' | 'disabled' | 'no_recipient' | null;

/** PATCH /api/gift-cards/:storeId/:giftCardId/adjust — real "Edit existing
 *  card value": `delta` can be positive (top-up) or negative (deduction). */
export function apiAdjustGiftCardBalance(storeId: string, giftCardId: string, delta: number, reason?: string, notify = false) {
  return client.patch<never, ApiResponse<GiftCard> & { emailed?: GiftCardEmailResult }>(ENDPOINTS.GIFT_CARDS.ADJUST(storeId, giftCardId), { delta, reason, notify });
}

/** POST /api/gift-cards/:storeId/:giftCardId/resend — emails the code again with the current balance. */
export function apiResendGiftCardEmail(storeId: string, giftCardId: string) {
  return client.post<never, ApiResponse<null> & { emailed?: string }>(ENDPOINTS.GIFT_CARDS.RESEND(storeId, giftCardId), {});
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

/** What the gift card page (opened from the link in the gift card email) shows. */
export interface GiftCardView {
  storeId: string;
  storeName: string;
  code: string;
  currency: string;
  initialValue: number;
  balance: number;
  status: 'active' | 'disabled' | 'expired';
  expiresAt: string | null;
  message: string | null;
  recipientName: string | null;
}

/** GET /api/gift-cards/view/:token (public; the signed token from the email is the key) */
export function apiGetGiftCardView(token: string) {
  return client.get<never, ApiResponse<GiftCardView>>(ENDPOINTS.GIFT_CARDS.VIEW(token));
}

/** POST /api/gift-cards/:storeId/purchase-intent */
export function apiCreateGiftCardPurchaseIntent(
  storeId: string,
  payload: { amount: number; recipientEmail?: string; recipientName?: string; message?: string; sendOn?: string },
) {
  return client.post<never, ApiResponse<{ clientSecret: string; paymentIntentId: string; amount: number; currency: string }>>(
    ENDPOINTS.GIFT_CARDS.PURCHASE_INTENT(storeId), payload,
  );
}
