import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface StripeConnectStatus {
  connected: boolean;
  status: 'not_connected' | 'pending' | 'active' | 'restricted';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  /** Platform Stripe key is a test key: every card payment is a Stripe TEST payment. */
  testMode?: boolean;
}

/** GET /api/stripe-connect/:storeId/status — Stripe Connect is per store. */
export function apiGetStripeConnectStatus(storeId: string) {
  return client.get<never, ApiResponse<StripeConnectStatus>>(ENDPOINTS.STRIPE_CONNECT.STATUS(storeId));
}

/** POST /api/stripe-connect/:storeId/onboarding-link */
export function apiCreateStripeConnectOnboardingLink(storeId: string, refreshUrl: string, returnUrl: string) {
  return client.post<never, ApiResponse<{ url: string }>>(ENDPOINTS.STRIPE_CONNECT.ONBOARDING_LINK(storeId), { refreshUrl, returnUrl });
}

/** POST /api/stripe-connect/:storeId/sync */
export function apiSyncStripeConnectStatus(storeId: string) {
  return client.post<never, ApiResponse<StripeConnectStatus>>(ENDPOINTS.STRIPE_CONNECT.SYNC(storeId), {});
}

export interface StripePayoutOverview {
  testMode: boolean;
  schedule: { interval: 'manual' | 'daily' | 'weekly' | 'monthly' | null; delayDays: number | null; weeklyAnchor: string | null; monthlyAnchor: number | null };
  balance: { available: { amount: number; currency: string }[]; pending: { amount: number; currency: string }[] };
  payouts: { id: string; amount: number; currency: string; status: string; arrivalDate: string | null; created: string; method: string; failureMessage: string | null }[];
}

export interface StripeBalanceTransaction {
  id: string;
  type: string;
  description: string | null;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  created: string;
  availableOn: string | null;
  status: string;
  sourceId: string | null;
}

export interface StripePayoutDetail {
  testMode: boolean;
  payout: { id: string; amount: number; currency: string; status: string; method: string; arrivalDate: string | null; created: string; failureMessage: string | null; statementDescriptor: string | null };
  transactions: StripeBalanceTransaction[];
  hasMore: boolean;
  totals: { currency: string; gross: number; fees: number; net: number }[];
}

/** GET /api/stripe-connect/:storeId/payouts/:payoutId — one payout and the transactions it paid out. */
export function apiGetStripePayoutDetail(storeId: string, payoutId: string) {
  return client.get<never, ApiResponse<StripePayoutDetail>>(ENDPOINTS.STRIPE_CONNECT.PAYOUT_DETAIL(storeId, payoutId));
}

export interface StripeBalanceTransactionsPage { testMode: boolean; transactions: StripeBalanceTransaction[]; hasMore: boolean; nextCursor: string | null }

/** GET /api/stripe-connect/:storeId/balance-transactions — card sales, refunds, fees and payouts of the store's connected account (cursor-paged). */
export function apiGetStripeBalanceTransactions(storeId: string, params: { limit?: number; startingAfter?: string; type?: string } = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, String(v)); });
  const q = p.toString();
  return client.get<never, ApiResponse<StripeBalanceTransactionsPage>>(`${ENDPOINTS.STRIPE_CONNECT.BALANCE_TRANSACTIONS(storeId)}${q ? `?${q}` : ''}`);
}

/** GET /api/stripe-connect/:storeId/payouts — balance, payout schedule and recent payouts read live from the store's connected account. */
export function apiGetStripePayouts(storeId: string) {
  return client.get<never, ApiResponse<StripePayoutOverview>>(ENDPOINTS.STRIPE_CONNECT.PAYOUTS(storeId));
}
