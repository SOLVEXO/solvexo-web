import client from '../client';

const BASE = '/api/platform-plans';

export interface PlatformPlanLimits {
  maxProducts?: number; maxStaffAccounts?: number; maxPosLocations?: number;
  aiCreditsPerMonth?: number; transactionFeeRate?: number;
  customDomainAllowed?: boolean; whiteLabelAllowed?: boolean; loyaltyProgramAllowed?: boolean;
  subscriptionProductsAllowed?: boolean; advancedAnalyticsAllowed?: boolean;
  abandonedCartRecoveryAllowed?: boolean; emailCampaignsAllowed?: boolean; apiWebhooksAllowed?: boolean;
  dedicatedAccountManager?: boolean; prioritySupport?: boolean; marketplaceFeaturedBadge?: boolean;
  slaUptimePercent?: number;
}

export interface PlatformPlan {
  _id: string; name: string; description: string | null; badge: string | null;
  sortOrder: number; isFree: boolean; isCustomPricing: boolean;
  monthlyPriceUSD: number | null; yearlyPriceUSD: number | null; trialDays: number;
  featureBullets: string[]; limits: PlatformPlanLimits;
  status: 'active' | 'archived'; createdAt: string; updatedAt: string;
  subscriberCount?: number; mrrUSD?: number;
}

export type AddonType = 'extra_ai_credits' | 'extra_staff_seat' | 'priority_marketplace_placement' | 'advanced_tax_compliance' | 'sms_notifications';

export interface AddonPurchase {
  _id: string; storeId: string; addonType: AddonType; quantity: number;
  amountUSD: number; status: string; createdAt: string;
}

export interface PlatformPlanInvoice {
  _id: string; storeId: string; sellerId: string; platformPlanId: string;
  invoiceNumber: string; type: 'initial' | 'recurring' | 'proration';
  amountUSD: number; status: 'paid' | 'failed' | 'pending' | 'refunded' | 'partially_refunded';
  paidAt: string | null; refundedAt: string | null; refundedAmountUSD: number;
  hostedInvoiceUrl: string | null; invoicePdfUrl: string | null;
  paymentMethodType: string | null; createdAt: string;
}

export interface StorePlatformSubscription {
  _id: string; storeId: string; platformPlanId: string; billingInterval: 'monthly' | 'yearly';
  amountUSD: number; status: string; trialEndsAt: string | null; currentPeriodEnd: string; nextBillingDate: string;
  plan?: PlatformPlan;
}

export interface EntitlementsSummary {
  currentPlanName: string;
  currentPlanId: string | null;
  maxProducts: { limit: number; used: number; allowed: boolean };
  maxStaffAccounts: { limit: number; used: number; allowed: boolean };
  maxPosLocations: { limit: number };
  aiCredits: { monthlyAllowance: number; balance: number };
  transactionFeeRate: number;
  dedicatedAccountManager: boolean;
  prioritySupport: boolean;
  marketplaceFeaturedBadge: boolean;
  slaUptimePercent: number | null;
  [featureKey: string]: unknown;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── Public ────────────────────────────────────────────────────────────────────
export function apiBrowsePlatformPlans() {
  return client.get<never, ApiResponse<PlatformPlan[]>>(`${BASE}/public`);
}

// ── Seller ────────────────────────────────────────────────────────────────────
export function apiGetSellerPlatformOverview() {
  return client.get<never, ApiResponse<{ stores: Array<{ storeId: string; storeName: string; planName: string; status: string; amountUSD: number }> }>>(`${BASE}/seller/overview`);
}

export function apiGetStorePlatformPlan(storeId: string) {
  return client.get<never, ApiResponse<StorePlatformSubscription>>(`${BASE}/${storeId}`);
}

export function apiGetStoreEntitlements(storeId: string) {
  return client.get<never, ApiResponse<EntitlementsSummary>>(`${BASE}/${storeId}/entitlements`);
}

export function apiGetStoreInvoices(storeId: string, query: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (query.page) qs.set('page', String(query.page));
  if (query.limit) qs.set('limit', String(query.limit));
  const s = qs.toString();
  return client.get<never, ApiResponse<{ invoices: PlatformPlanInvoice[]; total: number; page: number; limit: number; pages: number }>>(
    `${BASE}/${storeId}/invoices${s ? `?${s}` : ''}`,
  );
}

export function apiChangePlatformPlan(storeId: string, newPlatformPlanId: string, newBillingInterval: 'monthly' | 'yearly') {
  return client.patch<never, ApiResponse<StorePlatformSubscription>>(`${BASE}/${storeId}/change-plan`, { newPlatformPlanId, newBillingInterval });
}

export function apiPurchaseAddon(storeId: string, addonType: AddonType, quantity = 1) {
  return client.post<never, ApiResponse<AddonPurchase>>(`${BASE}/${storeId}/addons`, { addonType, quantity });
}

export function apiListStoreAddons(storeId: string) {
  return client.get<never, ApiResponse<AddonPurchase[]>>(`${BASE}/${storeId}/addons`);
}

export function apiCancelAddon(storeId: string, addonId: string) {
  return client.delete<never, ApiResponse<never>>(`${BASE}/${storeId}/addons/${addonId}`);
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface CreatePlatformPlanPayload {
  name: string; description?: string; badge?: string; sortOrder?: number;
  isFree?: boolean; isCustomPricing?: boolean; monthlyPriceUSD?: number; yearlyPriceUSD?: number;
  trialDays?: number; featureBullets?: string[]; limits: PlatformPlanLimits;
}

export function apiAdminCreatePlatformPlan(payload: CreatePlatformPlanPayload) {
  return client.post<never, ApiResponse<PlatformPlan>>(`${BASE}/admin`, payload);
}

export function apiAdminListPlatformPlans(includeArchived = false) {
  return client.get<never, ApiResponse<PlatformPlan[]>>(`${BASE}/admin?includeArchived=${includeArchived}`);
}

export function apiAdminGetPlatformPlanById(id: string) {
  return client.get<never, ApiResponse<PlatformPlan>>(`${BASE}/admin/${id}`);
}

export function apiAdminGetPlatformPlanSubscribers(id: string, query: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (query.page) qs.set('page', String(query.page));
  if (query.limit) qs.set('limit', String(query.limit));
  const s = qs.toString();
  return client.get<never, ApiResponse<{ pagination: { page: number; limit: number; total: number; pages: number }; subscribers: StorePlatformSubscription[] }>>(`${BASE}/admin/${id}/subscribers${s ? `?${s}` : ''}`);
}

export function apiAdminUpdatePlatformPlan(id: string, payload: Partial<CreatePlatformPlanPayload> & { status?: 'active' | 'archived' }) {
  return client.patch<never, ApiResponse<PlatformPlan>>(`${BASE}/admin/${id}`, payload);
}

export function apiAdminArchivePlatformPlan(id: string, force = false) {
  return client.delete<never, ApiResponse<never>>(`${BASE}/admin/${id}?force=${force}`);
}

export function apiAdminGetPlatformPlanRevenue(query: { range?: string } = {}) {
  const qs = query.range ? `?range=${query.range}` : '';
  return client.get<never, ApiResponse<{ mrr: number; arr: number; activeSubscribers: number; planBreakdown: Array<{ planName: string; subscriberCount: number; mrrUSD: number }> }>>(`${BASE}/admin/revenue${qs}`);
}

export function apiAdminListAddonPurchases(query: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (query.page) qs.set('page', String(query.page));
  if (query.limit) qs.set('limit', String(query.limit));
  const s = qs.toString();
  return client.get<never, ApiResponse<{ pagination: { page: number; limit: number; total: number; pages: number }; addons: AddonPurchase[] }>>(`${BASE}/admin/addons${s ? `?${s}` : ''}`);
}

export function apiAdminRefundPlatformInvoice(invoiceId: string, amountUSD?: number, reason?: string) {
  return client.post<never, ApiResponse<never>>(`${BASE}/admin/invoices/${invoiceId}/refund`, { amountUSD, reason });
}
