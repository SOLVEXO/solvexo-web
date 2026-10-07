import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types — mirror solvexo-api's `src/integrations` module exactly ─────────

export type IntegrationType = 'payment' | 'whatsapp' | 'tax' | 'shipping';
export type PaymentProviderKey = 'safepay' | 'jazzcash' | 'easypaisa' | 'payfast' | 'stripe' | 'bank_transfer';
export type IntegrationMode = 'sandbox' | 'live';
export type IntegrationStatus = 'not_connected' | 'connected' | 'disabled' | 'error' | 'needs_reauth';

export interface StoreIntegrationView {
  id: string | null;
  type: IntegrationType;
  provider: PaymentProviderKey | 'whatsapp_cloud' | 'taxjar' | 'shippo';
  mode: IntegrationMode;
  status: IntegrationStatus;
  isEnabledForCheckout: boolean;
  lastVerifiedAt: string | null;
  lastError: string | null;
  config: Record<string, any>;
  maskedHints: Record<string, string>;
  /** Opaque routing token embedded in this integration's public webhook URL
   *  (`{apiBaseUrl}/api/webhooks/payments/{provider}/{webhookToken}`) — not a
   *  secret. Null for types (e.g. WhatsApp) with no per-store webhook URL. */
  webhookToken: string | null;
  /** Stripe only — it has no `StoreIntegration` row of its own; manage it
   *  via the existing Stripe Connect endpoints instead of this module. */
  manageVia?: { statusUrl: string; connectUrl: string };
}

export interface ManualPaymentMethodView { id: string; name: string; instructions: string; isActive: boolean; sortOrder: number }

export interface StoreIntegrationsList {
  payment: StoreIntegrationView[];
  /** Seller-defined custom manual payment methods (Shopify "Custom payment method"). */
  manualMethods: ManualPaymentMethodView[];
  whatsapp: StoreIntegrationView;
  /** Real, live per-order tax calculation (TaxJar) — see TaxService's own
   *  doc comment. `not_connected` is the normal default; the store's
   *  existing flat Store.taxRate % keeps working exactly as before. */
  tax: StoreIntegrationView;
  /** Real, live multi-carrier shipping rates (Shippo) — see
   *  ShippingRatesService's own doc comment. `not_connected` is the normal
   *  default; the store's existing flat per-zone shipping price keeps
   *  working exactly as before. `config.originAddress` is set once at
   *  connect time (see `ShippingOriginAddress`). */
  shipping: StoreIntegrationView;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** GET /api/store/:storeId/integrations — every payment provider available
 *  for this store's own currency (PKR → Safepay/JazzCash/Easypaisa/PayFast,
 *  currently only Safepay is actually connectable; USD → Stripe, synthesized
 *  live from the existing Stripe Connect status) plus WhatsApp. */
export function apiListStoreIntegrations(storeId: string) {
  return client.get<never, ApiResponse<StoreIntegrationsList>>(ENDPOINTS.STORE_INTEGRATIONS.LIST(storeId));
}

// Only `secretKey`/`clientId` are ever collected up front — Safepay only
// issues a webhookSecret once its webhook URL (built from the connected
// row's own `webhookToken`) has been registered in the Safepay dashboard,
// which is only possible AFTER this call returns. See `apiUpdateIntegration`
// for step 2, which adds the secret once the seller has it. Matches the
// backend's `StoreIntegrationsService.connectPayment` sequencing exactly.
export interface ConnectSafepayPayload {
  secretKey: string;
  clientId: string;
  mode?: IntegrationMode;
}

/** POST .../payment/jazzcash|payfast/connect — JazzCash: merchantId/password/integritySalt; PayFast: merchantId/securedKey (+ merchantName). */
export function apiConnectPkGateway(storeId: string, provider: 'jazzcash' | 'payfast', payload: Record<string, string | undefined>) {
  return client.post<never, ApiResponse<StoreIntegrationView>>(ENDPOINTS.STORE_INTEGRATIONS.CONNECT(storeId, 'payment', provider), payload);
}

/** POST /api/store/:storeId/integrations/payment/safepay/connect */
export function apiConnectSafepay(storeId: string, payload: ConnectSafepayPayload) {
  return client.post<never, ApiResponse<StoreIntegrationView>>(
    ENDPOINTS.STORE_INTEGRATIONS.CONNECT(storeId, 'payment', 'safepay'),
    payload,
  );
}

// The seller's own bank account, shown to the buyer at checkout — not a
// secret credential like every other provider here (no webhook, no API
// calls), which is why `connect` doubles as "edit" (re-submitting just
// overwrites the stored config, same upsert the backend already does).
export interface ConnectBankTransferPayload {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  jazzcashNumber?: string;
  easypaisaNumber?: string;
  instructions?: string;
}

/** POST /api/store/:storeId/integrations/payment/bank_transfer/connect */
export function apiConnectBankTransfer(storeId: string, payload: ConnectBankTransferPayload) {
  return client.post<never, ApiResponse<StoreIntegrationView>>(
    ENDPOINTS.STORE_INTEGRATIONS.CONNECT(storeId, 'payment', 'bank_transfer'),
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

/** POST /api/store/:storeId/integrations/tax/taxjar/connect — verifies the
 *  token against TaxJar's own API before saving (see TaxService.connect). */
export function apiConnectTax(storeId: string, apiToken: string) {
  return client.post<never, ApiResponse<{ status: string }>>(
    ENDPOINTS.STORE_INTEGRATIONS.CONNECT(storeId, 'tax', 'taxjar'),
    { apiToken },
  );
}

export interface ShippingOriginAddress {
  name: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string | null;
}

/** POST /api/store/:storeId/integrations/shipping/shippo/connect — the
 *  store's real ship-from address is required (see ShippingRatesService.connect). */
export function apiConnectShipping(storeId: string, apiToken: string, originAddress: ShippingOriginAddress) {
  return client.post<never, ApiResponse<{ status: string }>>(
    ENDPOINTS.STORE_INTEGRATIONS.CONNECT(storeId, 'shipping', 'shippo'),
    { apiToken, originAddress },
  );
}

export interface ShippingPackage {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
  /** Weight of the empty package in kg. */
  emptyWeight: number;
  isDefault: boolean;
}

export interface ShippingSettingsPayload {
  handlingFeeType: 'flat' | 'percent' | null;
  handlingFeeValue: number;
  /** `id` omitted for a new package. */
  packages: (Omit<ShippingPackage, 'id'> & { id?: string })[];
}

/** PUT /api/store/:storeId/integrations/shipping/settings — live-rate handling fee + saved packages
 *  (requires Shippo to be connected). */
export function apiUpdateShippingSettings(storeId: string, payload: ShippingSettingsPayload) {
  return client.put<never, ApiResponse<ShippingSettingsPayload & { packages: ShippingPackage[] }>>(
    ENDPOINTS.STORE_INTEGRATIONS.SHIPPING_SETTINGS(storeId),
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
 *  on a `mode: 'live'` integration until `/test` has succeeded at least once.
 *  `webhookSecret` is step 2 of the Safepay connect flow (see
 *  `ConnectSafepayPayload`) — merged into the existing stored credentials,
 *  never replaces `secretKey`/`clientId`. */
export function apiUpdateIntegration(storeId: string, id: string, payload: { isEnabledForCheckout?: boolean; displayName?: string; webhookSecret?: string; mode?: IntegrationMode }) {
  return client.patch<never, ApiResponse<StoreIntegrationView>>(ENDPOINTS.STORE_INTEGRATIONS.UPDATE(storeId, id), payload);
}

/** DELETE /api/store/:storeId/integrations/:id — wipes the stored credential
 *  and reverts to not_connected (row kept for audit history). */
export function apiDisconnectIntegration(storeId: string, id: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_INTEGRATIONS.DELETE(storeId, id));
}

// ── Buyer-facing checkout payment methods ──────────────────────────────────

export interface PublicPaymentMethod {
  provider: PaymentProviderKey | 'manual';
  /** Set only for provider 'manual' (a seller-defined method). */
  methodId?: string;
  instructions?: string;
  displayName: string;
  /** Real, dynamic currency code (see the Markets architecture) — a store's
   *  real `baseCurrency`, not a fixed literal union. */
  currency: string;
  logo?: string;
}

/** GET /api/checkout/:checkoutId/payment-methods — always `[]` for a
 *  checkout spanning more than one store (that keeps using the existing
 *  COD/Stripe checkout path, unaffected by this). */
export async function apiGetCheckoutPaymentMethods(checkoutId: string): Promise<ApiResponse<PublicPaymentMethod[]>> {
  // Backend returns `data: { currency, methods: [...] }`; callers want the plain array. Never hand back a non-array
  // (an object here made the checkout page crash on `.some` / `.map`).
  const res = await client.get<never, ApiResponse<PublicPaymentMethod[] | { currency?: string | null; methods?: PublicPaymentMethod[] }>>(
    ENDPOINTS.CHECKOUT.PAYMENT_METHODS(checkoutId),
  );
  const raw = res.data as any;
  const methods: PublicPaymentMethod[] = Array.isArray(raw) ? raw : Array.isArray(raw?.methods) ? raw.methods : [];
  return { ...(res as any), data: methods };
}

export interface PaymentSession {
  /** Hosted-checkout redirect (Safepay, JazzCash, Easypaisa, PayFast) — send the buyer here. */
  redirectUrl?: string;
  /** Fields to POST to `redirectUrl` (JazzCash / PayFast) — when present, submit a form instead of a plain redirect. */
  formFields?: Record<string, string>;
  /** Client-side SDK token (Stripe PaymentIntent client secret) — not used for Safepay. */
  clientToken?: string;
  /** Provider's own attempt id — stored so the return page can poll/verify status. */
  sessionId: string;
}

/** POST /api/checkout/:checkoutId/payment-methods/:provider/initiate —
 *  idempotency-key protected (same interceptor as the rest of checkout), so
 *  a retried tap never opens two payment sessions. */
export function apiInitiateCheckoutPaymentMethod(checkoutId: string, provider: PaymentProviderKey | string, returnUrl: string, cancelUrl: string) {
  return client.post<never, ApiResponse<PaymentSession>>(
    ENDPOINTS.CHECKOUT.INITIATE_PAYMENT_METHOD(checkoutId, provider),
    { returnUrl, cancelUrl },
  );
}

// ── Custom manual payment methods ──────────────────────────────────────────
/** POST api/store/:storeId/integrations/manual-methods */
export function apiCreateManualMethod(storeId: string, payload: { name: string; instructions?: string; isActive?: boolean }) {
  return client.post<never, ApiResponse<ManualPaymentMethodView>>(ENDPOINTS.STORE_INTEGRATIONS.MANUAL_METHODS(storeId), payload);
}
export function apiUpdateManualMethod(storeId: string, id: string, payload: Partial<{ name: string; instructions: string; isActive: boolean }>) {
  return client.patch<never, ApiResponse<ManualPaymentMethodView>>(ENDPOINTS.STORE_INTEGRATIONS.MANUAL_METHOD(storeId, id), payload);
}
export function apiDeleteManualMethod(storeId: string, id: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_INTEGRATIONS.MANUAL_METHOD(storeId, id));
}
/** Buyer: place the order with a seller-defined manual method (unpaid until the seller marks it paid). */
export function apiPlaceManualMethodOrder(checkoutId: string, methodId: string) {
  return client.post<never, ApiResponse<{ orders: { orderId: string; orderNumber: string; currency: string; summary: { total: number } }[] }>>(
    ENDPOINTS.CHECKOUT.PLACE_MANUAL_METHOD(checkoutId, methodId),
  );
}

// ── WhatsApp order messages ────────────────────────────────────────────────
export type WhatsAppEventKey = 'order_confirmed' | 'order_cancelled' | 'order_refunded' | 'order_shipped' | 'order_delivered';
export interface WhatsAppEventSettings { event: WhatsAppEventKey; enabled: boolean; templateName: string; languageCode: string; params: string[] }
export interface WhatsAppNotificationsView { events: WhatsAppEventSettings[]; paramTokens: string[] }
export interface WhatsAppTemplateView { id?: string; name: string; language: string; status: string; category: string; rejectedReason: string | null; bodyText: string }

export function apiGetWhatsAppNotifications(storeId: string) {
  return client.get<never, ApiResponse<WhatsAppNotificationsView>>(ENDPOINTS.STORE_INTEGRATIONS.WHATSAPP_NOTIFICATIONS(storeId));
}
export function apiUpdateWhatsAppNotification(storeId: string, payload: { event: WhatsAppEventKey } & Partial<Pick<WhatsAppEventSettings, 'enabled' | 'templateName' | 'languageCode' | 'params'>>) {
  return client.put<never, ApiResponse<WhatsAppNotificationsView>>(ENDPOINTS.STORE_INTEGRATIONS.WHATSAPP_NOTIFICATIONS(storeId), payload);
}
export function apiListWhatsAppTemplates(storeId: string) {
  return client.get<never, ApiResponse<WhatsAppTemplateView[]>>(ENDPOINTS.STORE_INTEGRATIONS.WHATSAPP_TEMPLATES(storeId));
}
export function apiCreateWhatsAppTemplate(storeId: string, payload: { name: string; language: string; category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'; bodyText: string; examples: string[] }) {
  return client.post<never, ApiResponse<{ id?: string; status: string }>>(ENDPOINTS.STORE_INTEGRATIONS.WHATSAPP_TEMPLATES(storeId), payload);
}
export function apiDeleteWhatsAppTemplate(storeId: string, name: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_INTEGRATIONS.WHATSAPP_TEMPLATE(storeId, name));
}
