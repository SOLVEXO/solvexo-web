import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface StripeConnectStatus {
  connected: boolean;
  status: 'not_connected' | 'pending' | 'active' | 'restricted';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
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
