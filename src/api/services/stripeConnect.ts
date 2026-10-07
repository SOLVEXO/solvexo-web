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

/** GET /api/stripe-connect/:storeId/payouts — balance, payout schedule and recent payouts read live from the store's connected account. */
export function apiGetStripePayouts(storeId: string) {
  return client.get<never, ApiResponse<StripePayoutOverview>>(ENDPOINTS.STRIPE_CONNECT.PAYOUTS(storeId));
}
