import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface StripeConnectStatus {
  connected: boolean;
  status: 'not_connected' | 'pending' | 'active' | 'restricted';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

/** GET /api/stripe-connect/status */
export function apiGetStripeConnectStatus() {
  return client.get<never, ApiResponse<StripeConnectStatus>>(ENDPOINTS.STRIPE_CONNECT.STATUS);
}

/** POST /api/stripe-connect/onboarding-link */
export function apiCreateStripeConnectOnboardingLink(refreshUrl: string, returnUrl: string) {
  return client.post<never, ApiResponse<{ url: string }>>(ENDPOINTS.STRIPE_CONNECT.ONBOARDING_LINK, { refreshUrl, returnUrl });
}

/** POST /api/stripe-connect/sync */
export function apiSyncStripeConnectStatus() {
  return client.post<never, ApiResponse<StripeConnectStatus>>(ENDPOINTS.STRIPE_CONNECT.SYNC, {});
}
