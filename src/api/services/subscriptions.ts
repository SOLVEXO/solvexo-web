import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BillingInterval = 'monthly' | 'yearly';
export type PlanStatus = 'active' | 'archived' | 'suspended';
export type SubscriptionStatus = 'active' | 'paused' | 'canceled' | 'past_due';
export type BenefitType = 'discount' | 'shipping' | 'early_access' | 'loyalty_multiplier' | 'credits' | 'priority_support' | 'priority_booking';

// Structured, server-enforced benefit — mirrors PlanBenefitDto on the backend.
// Every field is optional except `type`; which fields matter depends on `type`.
export interface PlanBenefit {
  type: BenefitType;
  enabled?: boolean;
  label?: string;

  // discount
  scope?: 'store' | 'category' | 'product';
  categoryIds?: string[];
  productIds?: string[];
  discountPercent?: number;
  maxDiscountAmountUSD?: number;
  minOrderValueUSD?: number;

  // shipping
  shippingType?: 'free' | 'discounted';
  shippingDiscountPercent?: number;
  minOrderValueForShippingUSD?: number;

  // early access
  earlyAccessHours?: number;

  // loyalty multiplier
  multiplier?: number;

  // credits
  creditsPerCycle?: number;
  creditType?: 'download' | 'service';
}

export interface PlanHealthEstimate {
  avgOrderValueUSD:                     number;
  avgMonthlyOrdersPerCustomer:          number;
  estimatedMonthlyCostPerSubscriberUSD: number;
  planPriceMonthlyUSD:                  number;
  health:                               'healthy' | 'warning' | 'risky';
  message:                              string;
  lowConfidence:                        boolean;
}

export interface SubscriptionPlan {
  _id:                  string;
  storeId:              string;
  sellerId:             string;
  name:                 string;
  description:          string | null;
  monthlyPriceUSD:      number;
  yearlyPriceUSD:       number | null;
  displayCurrency:      'USD' | 'PKR';
  exchangeRateSnapshot: number | null;
  features:             string[];
  benefits:             PlanBenefit[];
  status:               PlanStatus;
  createdAt:            string;
  updatedAt:            string;
}

export interface SellerPlan extends SubscriptionPlan {
  subscriberCount:            number;
  monthlyRecurringRevenueUSD: number;
  displayMonthlyPrice:        number;
  healthEstimate:             PlanHealthEstimate | null;
}

export interface BuyerPlan {
  _id:                 string;
  name:                string;
  description:         string | null;
  monthlyPriceUSD:     number;
  yearlyPriceUSD:      number | null;
  features:            string[];
  benefits:            PlanBenefit[];
  displayCurrency:     'USD' | 'PKR';
  displayMonthlyPrice: number;
  displayYearlyPrice:  number | null;
}

export interface PlanHistoryEntry {
  fromPlanId: string; fromPlanName: string; fromBillingInterval: string; fromAmountUSD: number;
  toPlanId: string; toPlanName: string; toBillingInterval: string; toAmountUSD: number;
  proratedAmountUSD: number; changedAt: string;
}

export interface Subscription {
  _id:                    string;
  planId:                 string;
  customerId:             string;
  storeId:                string;
  sellerId:               string;
  billingInterval:        BillingInterval;
  amountUSD:              number;
  status:                 SubscriptionStatus;
  startedAt:              string;
  currentPeriodStart:     string;
  currentPeriodEnd:       string;
  nextBillingDate:        string;
  canceledAt:             string | null;
  pausedAt:               string | null;
  cancellationReason:     string | null;
  totalPaidUSD:           number;
  failedPaymentAttempts:  number;
  creditBalanceUSD:       number;
  planHistory:            PlanHistoryEntry[];
  pendingCancellation:    boolean;
}

export interface SubscriptionInvoice {
  _id:             string;
  subscriptionId:  string;
  storeId:         string;
  sellerId:        string;
  customerId:      string;
  invoiceNumber:   string;
  type:            'initial' | 'recurring' | 'proration';
  amountUSD:       number;
  status:          'paid' | 'failed' | 'pending';
  paidAt:          string | null;
  providerChargeId: string | null;
  createdAt:       string;
}

export interface PaymentAttempt {
  _id:              string;
  subscriptionId:   string;
  storeId:          string;
  sellerId:         string;
  customerId:       string;
  attemptNumber:    number;
  attemptType:      'initial' | 'renewal' | 'proration';
  outcome:          'success' | 'failed';
  amountUSD:        number;
  failureReason:    string | null;
  invoiceId:        string | null;
  providerChargeId: string | null;
  createdAt:        string;
}

export interface SellerSubscriber extends Subscription {
  customer: { name: string; email: string; profileImage?: string | null };
  planName: string;
}

export interface DashboardData {
  mrr: number;
  arr: number;
  activeSubscribersCount: number;
  totalRevenue: number;
  newSubscribersThisMonth: number;
  canceledThisMonth: number;
  churnRate: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercent: number;
  planBreakdown: Array<{ planId: string; planName: string; subscriberCount: number; mrrContributionUSD: number }>;
  recentInvoices: SubscriptionInvoice[];
  cancellationReasons: Array<{ reason: string; count: number }>;
  subscriberEconomics: {
    subscriberRevenue: number; regularRevenue: number;
    subscriberOrderCount: number; regularOrderCount: number;
    avgOrdersPerSubscriber: number; avgOrdersPerRegularCustomer: number;
    totalCustomerSavingsUSD: number;
  } | null;
}

export interface Pagination { page: number; limit: number; total: number; pages: number }

interface ApiResponse<T> { success: boolean; message?: string; data: T }

const qs = (query: Record<string, unknown> = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, String(v)); });
  const s = params.toString();
  return s ? `?${s}` : '';
};

async function downloadCsv(url: string, filename: string) {
  const csv = await client.get<never, string>(url, { responseType: 'text' } as never);
  const blob = new Blob([csv], { type: 'text/csv' });
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objUrl);
}

// ═══════════════════════════════════════════════════════════════════════════
// BUYER
// ═══════════════════════════════════════════════════════════════════════════

export function apiBrowseStorePlans(storeId: string) {
  return client.get<never, ApiResponse<BuyerPlan[]>>(ENDPOINTS.SUBSCRIPTIONS.BROWSE_PLANS(storeId));
}

export function apiSubscribeToPlan(planId: string, billingInterval: BillingInterval) {
  return client.post<never, ApiResponse<{ subscription: Subscription; invoice: SubscriptionInvoice }>>(
    ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBE, { planId, billingInterval },
  );
}

export function apiGetMySubscriptions(query: { page?: number; limit?: number; status?: SubscriptionStatus } = {}) {
  return client.get<never, ApiResponse<{ pagination: Pagination; subscriptions: Array<Subscription & {
    store: { _id: string; name: string; logo: string | null; slug: string } | null;
    plan: { _id: string; name: string; features: string[] } | null;
  }> }>>(`${ENDPOINTS.SUBSCRIPTIONS.MY}${qs(query)}`);
}

export function apiGetMySubscriptionById(id: string) {
  return client.get<never, ApiResponse<Subscription & {
    store: { _id: string; name: string; logo: string | null; slug: string } | null;
    plan: { _id: string; name: string; monthlyPriceUSD: number; yearlyPriceUSD: number | null; features: string[] } | null;
    invoices: SubscriptionInvoice[];
  }>>(ENDPOINTS.SUBSCRIPTIONS.MY_BY_ID(id));
}

export function apiPauseMySubscription(id: string) {
  return client.patch<never, ApiResponse<Subscription>>(ENDPOINTS.SUBSCRIPTIONS.MY_PAUSE(id));
}

export function apiResumeMySubscription(id: string) {
  return client.patch<never, ApiResponse<Subscription>>(ENDPOINTS.SUBSCRIPTIONS.MY_RESUME(id));
}

export function apiCancelMySubscription(id: string, atPeriodEnd: boolean, reason?: string) {
  return client.patch<never, ApiResponse<Subscription>>(`${ENDPOINTS.SUBSCRIPTIONS.MY_CANCEL(id)}?atPeriodEnd=${atPeriodEnd}`, { reason });
}

export function apiChangeMyPlan(id: string, newPlanId: string, newBillingInterval: BillingInterval) {
  return client.patch<never, ApiResponse<{ subscription: Subscription; invoice: SubscriptionInvoice | null }>>(
    ENDPOINTS.SUBSCRIPTIONS.MY_CHANGE_PLAN(id), { newPlanId, newBillingInterval },
  );
}

export interface SubscriptionTimelineEvent {
  _id: string; action: string; description: string; actorRole: string; createdAt: string;
}
export function apiGetSubscriptionTimeline(id: string) {
  return client.get<never, ApiResponse<SubscriptionTimelineEvent[]>>(ENDPOINTS.SUBSCRIPTIONS.MY_TIMELINE(id));
}

export function apiCreateSetupIntent() {
  return client.post<never, ApiResponse<{ clientSecret: string }>>(ENDPOINTS.SUBSCRIPTIONS.MY_SETUP_INTENT);
}

export function apiCreateBillingPortalSession(returnUrl: string) {
  return client.post<never, ApiResponse<{ url: string }>>(ENDPOINTS.SUBSCRIPTIONS.MY_BILLING_PORTAL, { returnUrl });
}

export interface BenefitsSummary {
  subscribed: boolean;
  planName?: string;
  discount?: { scope: string; discountPercent: number; label: string | null } | null;
  shipping?: { free: boolean; discountPercent?: number } | null;
  loyaltyMultiplier?: number | null;
  earlyAccessHours?: number | null;
  hasPrioritySupport?: boolean;
  hasPriorityBooking?: boolean;
  credits?: Array<{ creditType: string; balance: number; totalGranted: number }>;
}
export function apiGetBenefitsSummary(storeId: string) {
  return client.get<never, ApiResponse<BenefitsSummary>>(ENDPOINTS.SUBSCRIPTIONS.MY_BENEFITS(storeId));
}

export interface CreditWallet {
  _id: string; customerId: string; storeId: string; creditType: 'download' | 'service';
  balance: number; totalGranted: number; totalSpent: number;
  store: { name: string; logo: string | null; slug: string } | null;
}
export function apiGetCreditWallets() {
  return client.get<never, ApiResponse<CreditWallet[]>>(ENDPOINTS.SUBSCRIPTIONS.MY_CREDITS);
}

export function apiSpendCredit(storeId: string, creditType: 'download' | 'service', amount: number, reason: string) {
  return client.post<never, ApiResponse<CreditWallet>>(ENDPOINTS.SUBSCRIPTIONS.MY_CREDITS_SPEND(storeId), { creditType, amount, reason });
}

export interface NotificationPreferences {
  renewalReminders: boolean; paymentFailedAlerts: boolean; prorationReceipts: boolean;
  cancellationConfirmations: boolean; planChangeUpdates: boolean; marketingTips: boolean;
}
export function apiGetNotificationPreferences() {
  return client.get<never, ApiResponse<NotificationPreferences>>(ENDPOINTS.SUBSCRIPTIONS.MY_NOTIFICATION_PREFS);
}

export function apiUpdateNotificationPreferences(prefs: Partial<NotificationPreferences>) {
  return client.patch<never, ApiResponse<NotificationPreferences>>(ENDPOINTS.SUBSCRIPTIONS.MY_NOTIFICATION_PREFS, prefs);
}

// ═══════════════════════════════════════════════════════════════════════════
// SELLER (store-scoped)
// ═══════════════════════════════════════════════════════════════════════════

export interface CreatePlanPayload {
  name: string;
  description?: string;
  monthlyPriceUSD: number;
  yearlyPriceUSD?: number;
  displayCurrency?: 'USD' | 'PKR';
  features?: string[];
  benefits?: PlanBenefit[];
}
export type UpdatePlanPayload = Partial<CreatePlanPayload> & { status?: PlanStatus };

export function apiEstimatePlanHealth(storeId: string, benefits: PlanBenefit[], monthlyPriceUSD: number) {
  return client.post<never, ApiResponse<PlanHealthEstimate>>(
    ENDPOINTS.SUBSCRIPTIONS.PLANS.ESTIMATE_HEALTH(storeId),
    { benefits, monthlyPriceUSD },
  );
}

export function apiCreatePlan(storeId: string, payload: CreatePlanPayload) {
  return client.post<never, ApiResponse<SubscriptionPlan>>(ENDPOINTS.SUBSCRIPTIONS.PLANS.CREATE(storeId), payload);
}

export function apiListPlans(storeId: string) {
  return client.get<never, ApiResponse<SellerPlan[]>>(ENDPOINTS.SUBSCRIPTIONS.PLANS.LIST(storeId));
}

export function apiGetPlanById(storeId: string, id: string) {
  return client.get<never, ApiResponse<SellerPlan>>(ENDPOINTS.SUBSCRIPTIONS.PLANS.GET_BY_ID(storeId, id));
}

export function apiUpdatePlan(storeId: string, id: string, payload: UpdatePlanPayload) {
  return client.patch<never, ApiResponse<SubscriptionPlan>>(ENDPOINTS.SUBSCRIPTIONS.PLANS.UPDATE(storeId, id), payload);
}

export function apiArchivePlan(storeId: string, id: string, force = false) {
  return client.delete<never, ApiResponse<never>>(`${ENDPOINTS.SUBSCRIPTIONS.PLANS.ARCHIVE(storeId, id)}?force=${force}`);
}

export function apiGetSubscriptionDashboard(storeId: string) {
  return client.get<never, ApiResponse<DashboardData>>(ENDPOINTS.SUBSCRIPTIONS.DASHBOARD(storeId));
}

export function apiExportSubscribersCsv(storeId: string, storeName: string) {
  return downloadCsv(ENDPOINTS.SUBSCRIPTIONS.EXPORT(storeId), `subscribers-${storeName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function apiListStoreSubscribers(storeId: string, query: { page?: number; limit?: number; status?: SubscriptionStatus; planId?: string } = {}) {
  return client.get<never, ApiResponse<{ pagination: Pagination; subscriptions: SellerSubscriber[] }>>(
    `${ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBERS.LIST(storeId)}${qs(query)}`,
  );
}

export function apiGetStoreSubscriberById(storeId: string, id: string) {
  return client.get<never, ApiResponse<Subscription & {
    customer: { name: string; email: string; phone?: string; profileImage?: string | null };
    plan: { _id: string; name: string; monthlyPriceUSD: number; yearlyPriceUSD: number | null; features: string[] } | null;
    invoices: SubscriptionInvoice[];
  }>>(ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBERS.GET_BY_ID(storeId, id));
}

export function apiPauseSubscriber(storeId: string, id: string) {
  return client.patch<never, ApiResponse<Subscription>>(ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBERS.PAUSE(storeId, id));
}

export function apiResumeSubscriber(storeId: string, id: string) {
  return client.patch<never, ApiResponse<Subscription>>(ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBERS.RESUME(storeId, id));
}

export function apiCancelSubscriber(storeId: string, id: string, atPeriodEnd: boolean, reason?: string) {
  return client.patch<never, ApiResponse<Subscription>>(`${ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBERS.CANCEL(storeId, id)}?atPeriodEnd=${atPeriodEnd}`, { reason });
}

export function apiRefundSubscriberInvoice(storeId: string, id: string, invoiceId: string, amountUSD?: number, reason?: string) {
  return client.post<never, ApiResponse<SubscriptionInvoice>>(
    ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBERS.REFUND_INVOICE(storeId, id, invoiceId), { amountUSD, reason },
  );
}

export interface AdvancedSellerAnalytics {
  conversionRatePercent: number; retention30dPercent: number;
  realizedLtvUSD: number; realizedLtvSampleSize: number;
  activeAvgRevenueToDateUSD: number; activeSampleSize: number;
  upgradeCount: number; downgradeCount: number;
  recommendations: string[];
}

export function apiGetAdvancedAnalytics(storeId: string) {
  return client.get<never, ApiResponse<AdvancedSellerAnalytics>>(ENDPOINTS.SUBSCRIPTIONS.ANALYTICS_ADVANCED(storeId));
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════════════════════

export interface StoreBreakdownRow {
  storeId: string; storeName: string; storeSlug: string | null; sellerId: string | null;
  subscriberCount: number; mrrUSD: number; planCount: number;
}

export function apiAdminGetOverview() {
  return client.get<never, ApiResponse<DashboardData & {
    activePlanCount: number; storesWithActivePlans: number;
    failedPaymentsLast30Days: number; pastDueSubscriptionsCount: number;
  }>>(ENDPOINTS.SUBSCRIPTIONS.ADMIN.OVERVIEW);
}

export function apiAdminGetStoreBreakdown(query: { page?: number; limit?: number } = {}) {
  return client.get<never, ApiResponse<{ pagination: Pagination; stores: StoreBreakdownRow[] }>>(
    `${ENDPOINTS.SUBSCRIPTIONS.ADMIN.STORES}${qs(query)}`,
  );
}

export function apiAdminGetStoreDetail(storeId: string) {
  return client.get<never, ApiResponse<DashboardData & {
    store: { _id: string; name: string; slug: string; sellerId: string };
    plans: SellerPlan[];
  }>>(ENDPOINTS.SUBSCRIPTIONS.ADMIN.STORE_DETAIL(storeId));
}

export function apiAdminSuspendPlan(id: string) {
  return client.patch<never, ApiResponse<SubscriptionPlan>>(ENDPOINTS.SUBSCRIPTIONS.ADMIN.SUSPEND_PLAN(id));
}

export function apiAdminUnsuspendPlan(id: string) {
  return client.patch<never, ApiResponse<SubscriptionPlan>>(ENDPOINTS.SUBSCRIPTIONS.ADMIN.UNSUSPEND_PLAN(id));
}

export function apiAdminGetPaymentFailures(query: { page?: number; limit?: number; storeId?: string; attemptType?: string; from?: string; to?: string } = {}) {
  return client.get<never, ApiResponse<{ pagination: Pagination; failures: Array<PaymentAttempt & {
    store: { name: string; slug: string } | null;
    customer: { name: string; email: string } | null;
  }> }>>(`${ENDPOINTS.SUBSCRIPTIONS.ADMIN.PAYMENT_FAILURES}${qs(query)}`);
}

export function apiAdminGetSubscriptionDetail(id: string) {
  return client.get<never, ApiResponse<Subscription & {
    store: { name: string; slug: string; sellerId: string } | null;
    customer: { name: string; email: string; phone?: string } | null;
    plan: { name: string; monthlyPriceUSD: number; yearlyPriceUSD: number | null } | null;
    invoices: SubscriptionInvoice[];
    paymentAttempts: PaymentAttempt[];
  }>>(ENDPOINTS.SUBSCRIPTIONS.ADMIN.SUB_DETAIL(id));
}

export function apiAdminGetSubscriptionPaymentAttempts(id: string, query: { page?: number; limit?: number; outcome?: 'success' | 'failed' } = {}) {
  return client.get<never, ApiResponse<{ pagination: Pagination; attempts: PaymentAttempt[] }>>(
    `${ENDPOINTS.SUBSCRIPTIONS.ADMIN.SUB_PAYMENT_ATTEMPTS(id)}${qs(query)}`,
  );
}

export interface LtvData {
  realizedLtvUSD: number; canceledSubscriptionsSampled: number;
  activeAvgRevenueToDateUSD: number; activeSubscriptionsSampled: number; note: string;
}
export function apiAdminGetLtv() {
  return client.get<never, ApiResponse<LtvData>>(ENDPOINTS.SUBSCRIPTIONS.ADMIN.LTV);
}

export interface RevenueBreakdown {
  byStore: Array<{ storeId: string; storeName: string; sellerId: string | null; totalUSD: number; invoiceCount: number; sellerPayoutUSD: number; platformCommissionUSD: number }>;
  byCountry: Array<{ country: string; totalUSD: number; invoiceCount: number }>;
  byPaymentMethod: Array<{ paymentMethodType: string; totalUSD: number; invoiceCount: number }>;
  note: string;
}
export function apiAdminGetRevenueBreakdown(query: { from?: string; to?: string } = {}) {
  return client.get<never, ApiResponse<RevenueBreakdown>>(`${ENDPOINTS.SUBSCRIPTIONS.ADMIN.REVENUE_BREAKDOWN}${qs(query)}`);
}

export interface ChurnCohort { cohort: string; totalStarted: number; stillActive: number; retentionPercent: number }
export function apiAdminGetChurnCohorts(query: { months?: number } = {}) {
  return client.get<never, ApiResponse<ChurnCohort[]>>(`${ENDPOINTS.SUBSCRIPTIONS.ADMIN.CHURN_COHORTS}${qs(query)}`);
}

export function apiAdminRefundInvoice(invoiceId: string, amountUSD?: number, reason?: string) {
  return client.post<never, ApiResponse<SubscriptionInvoice>>(ENDPOINTS.SUBSCRIPTIONS.ADMIN.INVOICE_REFUND(invoiceId), { amountUSD, reason });
}

export interface WebhookEvent {
  _id: string; provider: string; providerEventId: string; type: string;
  status: 'received' | 'processing' | 'processed' | 'failed' | 'ignored';
  error: string | null; processingAttempts: number; processedAt: string | null; createdAt: string;
}
export function apiAdminGetWebhookHistory(query: { page?: number; limit?: number; status?: string; type?: string } = {}) {
  return client.get<never, ApiResponse<{ pagination: Pagination; events: WebhookEvent[] }>>(
    `${ENDPOINTS.SUBSCRIPTIONS.ADMIN.WEBHOOKS}${qs(query)}`,
  );
}
export function apiAdminRetryWebhook(id: string) {
  return client.post<never, ApiResponse<never>>(ENDPOINTS.SUBSCRIPTIONS.ADMIN.WEBHOOK_RETRY(id));
}
