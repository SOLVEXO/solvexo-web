import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types — mirror solvexo-api's `src/integrations` module exactly ─────────

export type IntegrationType = 'payment' | 'whatsapp';
export type PaymentProviderKey = 'safepay' | 'jazzcash' | 'easypaisa' | 'payfast' | 'stripe';
export type IntegrationMode = 'sandbox' | 'live';
export type IntegrationStatus = 'not_connected' | 'connected' | 'disabled' | 'error' | 'needs_reauth';

export interface StoreIntegrationView {
  id: string | null;
  type: IntegrationType;
  provider: PaymentProviderKey | 'whatsapp_cloud';
  mode: IntegrationMode;
  status: IntegrationStatus;
  isEnabledForCheckout: boolean;
  lastVerifiedAt: string | null;
  lastError: string | null;
  config: Record<string, any>;
  maskedHints: Record<string, string>;
  /** Stripe only — it has no `StoreIntegration` row of its own; manage it
   *  via the existing Stripe Connect endpoints instead of this module. */
  manageVia?: { statusUrl: string; connectUrl: string };
}

export interface StoreIntegrationsList {
  payment: StoreIntegrationView[];
  whatsapp: StoreIntegrationView;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** GET /api/store/:storeId/integrations — every payment provider available
 *  for this store's own currency (PKR → Safepay/JazzCash/Easypaisa/PayFast,
 *  currently only Safepay is actually connectable; USD → Stripe, synthesized
 *  live from the existing Stripe Connect status) plus WhatsApp. */
export function apiListStoreIntegrations(storeId: string) {
  return client.get<never, ApiResponse<StoreIntegrationsList>>(ENDPOINTS.STORE_INTEGRATIONS.LIST(storeId));
}

export interface ConnectSafepayPayload {
  secretKey: string;
  clientId: string;
  webhookSecret: string;
  displayName?: string;
}

/** POST /api/store/:storeId/integrations/payment/safepay/connect */
export function apiConnectSafepay(storeId: string, payload: ConnectSafepayPayload) {
  return client.post<never, ApiResponse<StoreIntegrationView>>(
    ENDPOINTS.STORE_INTEGRATIONS.CONNECT(storeId, 'payment', 'safepay'),
    payload,
  );
}

export interface ConnectWhatsAppPayload {
  /** Meta Embedded Signup's exchangeable code — from the JS SDK's login callback, never typed by hand. */
  code: string;
  /** From the same callback's WA_EMBEDDED_SIGNUP postMessage event — never the same thing as `code`. */
  phoneNumberId: string;
  businessId?: string | null;
  displayName?: string;
}

/** POST /api/store/:storeId/integrations/whatsapp/whatsapp_cloud/connect */
export function apiConnectWhatsApp(storeId: string, payload: ConnectWhatsAppPayload) {
  return client.post<never, ApiResponse<StoreIntegrationView>>(
    ENDPOINTS.STORE_INTEGRATIONS.CONNECT(storeId, 'whatsapp', 'whatsapp_cloud'),
    payload,
  );
}

/** POST /api/store/:storeId/integrations/:id/test — re-verifies stored
 *  credentials still work (not a live sandbox transaction for payment
 *  gateways — see the backend's own doc comment on why). */
export function apiTestIntegration(storeId: string, id: string) {
  return client.post<never, ApiResponse<{ ok: boolean; message: string }>>(ENDPOINTS.STORE_INTEGRATIONS.TEST(storeId, id));
}

/** PATCH /api/store/:storeId/integrations/:id — refuses to enable checkout
 *  on a `mode: 'live'` integration until `/test` has succeeded at least once. */
export function apiUpdateIntegration(storeId: string, id: string, payload: { isEnabledForCheckout?: boolean; displayName?: string }) {
  return client.patch<never, ApiResponse<StoreIntegrationView>>(ENDPOINTS.STORE_INTEGRATIONS.UPDATE(storeId, id), payload);
}

/** DELETE /api/store/:storeId/integrations/:id — wipes the stored credential
 *  and reverts to not_connected (row kept for audit history). */
export function apiDisconnectIntegration(storeId: string, id: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_INTEGRATIONS.DELETE(storeId, id));
}

// ── Buyer-facing checkout payment methods ──────────────────────────────────

export interface PublicPaymentMethod {
  provider: PaymentProviderKey;
  displayName: string;
  currency: 'PKR' | 'USD';
  logo?: string;
}

/** GET /api/checkout/:checkoutId/payment-methods — always `[]` for a
 *  checkout spanning more than one store (that keeps using the existing
 *  COD/Stripe checkout path, unaffected by this). */
export function apiGetCheckoutPaymentMethods(checkoutId: string) {
  return client.get<never, ApiResponse<PublicPaymentMethod[]>>(ENDPOINTS.CHECKOUT.PAYMENT_METHODS(checkoutId));
}

export interface PaymentSession {
  /** Hosted-checkout redirect (Safepay, JazzCash, Easypaisa, PayFast) — send the buyer here. */
  redirectUrl?: string;
  /** Client-side SDK token (Stripe PaymentIntent client secret) — not used for Safepay. */
  clientToken?: string;
  /** Provider's own attempt id — stored so the return page can poll/verify status. */
  sessionId: string;
}

/** POST /api/checkout/:checkoutId/payment-methods/:provider/initiate —
 *  idempotency-key protected (same interceptor as the rest of checkout), so
 *  a retried tap never opens two payment sessions. */
export function apiInitiateCheckoutPaymentMethod(checkoutId: string, provider: PaymentProviderKey, returnUrl: string, cancelUrl: string) {
  return client.post<never, ApiResponse<PaymentSession>>(
    ENDPOINTS.CHECKOUT.INITIATE_PAYMENT_METHOD(checkoutId, provider),
    { returnUrl, cancelUrl },
  );
}
