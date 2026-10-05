import client, { API_BASE_URL } from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type SocialProviderKey = 'google' | 'facebook';

export const SOCIAL_PROVIDER_LABEL: Record<SocialProviderKey, string> = { google: 'Google', facebook: 'Facebook' };

export interface CustomerSocialProviderSetup {
  provider: SocialProviderKey;
  status: 'connected' | 'not_connected';
  clientId: string | null;
  /** Last-4 hint only — the secret itself is never returned. */
  maskedSecret: string | null;
  redirectUri: string;
}

export interface CustomerSocialSetup {
  providers: CustomerSocialProviderSetup[];
  storeOrigins: string[];
}

/** Seller: GET /api/store/:storeId/customer-login */
export function apiGetCustomerSocialSetup(storeId: string) {
  return client.get<never, ApiResponse<CustomerSocialSetup>>(ENDPOINTS.CUSTOMER_SOCIAL_LOGIN.SETUP(storeId));
}

/** Seller: PUT /api/store/:storeId/customer-login/:provider */
export function apiConnectCustomerSocial(storeId: string, provider: SocialProviderKey, body: { clientId: string; clientSecret: string }) {
  return client.put<never, ApiResponse<CustomerSocialSetup>>(ENDPOINTS.CUSTOMER_SOCIAL_LOGIN.PROVIDER(storeId, provider), body);
}

/** Seller: DELETE /api/store/:storeId/customer-login/:provider */
export function apiDisconnectCustomerSocial(storeId: string, provider: SocialProviderKey) {
  return client.delete<never, ApiResponse<CustomerSocialSetup>>(ENDPOINTS.CUSTOMER_SOCIAL_LOGIN.PROVIDER(storeId, provider));
}

/** Storefront: which provider buttons this store has connected (names only). */
export function apiGetStoreSocialProviders(storeId: string) {
  return client.get<never, ApiResponse<{ providers: SocialProviderKey[] }>>(ENDPOINTS.CUSTOMER_SOCIAL_LOGIN.PROVIDERS, { params: { storeId } });
}

/** Full browser URL that starts the provider's own sign-in page for this store (a navigation, not an XHR). */
export function customerSocialStartUrl(provider: SocialProviderKey, storeId: string, returnTo: string): string {
  const qs = new URLSearchParams({ storeId, returnTo });
  return `${(API_BASE_URL ?? '').replace(/\/+$/, '')}${ENDPOINTS.CUSTOMER_SOCIAL_LOGIN.START(provider)}?${qs.toString()}`;
}
