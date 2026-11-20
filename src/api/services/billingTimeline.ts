import client from '../client';

// Finance record of a store's Solvexo billing: plan changes, payments, failed attempts, refunds, add-ons, fees.
const BASE = '/api/platform-plans';
interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type BillingTimelineKind = 'trial_started' | 'trial_ended' | 'plan_change' | 'credit' | 'payment' | 'payment_failed' | 'refund' | 'addon' | 'transaction_fee';
export interface BillingTimelineLineItem { kind: string; label: string; amountUSD: number }
export interface BillingTimelineEvent {
  id: string; at: string; kind: BillingTimelineKind; status: 'success' | 'failed' | 'pending' | 'info' | 'refunded';
  title: string; description: string;
  /** + = charged to the seller, − = refunded, null = not a money event. */
  amountUSD: number | null; taxUSD?: number;
  /** Account-credit movement: + added to the balance, − used against a charge. */
  creditUSD?: number;
  invoiceId?: string | null; invoiceNumber?: string | null; hostedInvoiceUrl?: string | null;
  card?: { brand: string; last4: string } | null;
  lineItems?: BillingTimelineLineItem[];
  attemptNumber?: number; reason?: string | null;
  /** Admin audience only. */
  internal?: { providerChargeId?: string | null; stripeInvoiceId?: string | null; providerRefundId?: string | null };
}
export interface BillingTimelineData {
  /** The store's name, for the printed statement header. */
  storeName?: string | null;
  summary: {
    currency: 'USD'; lifetimePaidUSD: number; refundedUSD: number; netLifetimeUSD: number; thisMonthUSD: number; taxPaidUSD: number;
    breakdown: { plans: number; addons: number; transactionFees: number; refunds: number };
    creditBalanceUSD: number; card: { brand: string; last4: string } | null; failedPaymentsLast30Days: number;
    pendingPlanChange: { planName: string; kind: string; amountUSD: number } | null; lastBillingError: string | null;
    current: { status: string; planName: string | null; interval: string; amountUSD: number; nextBillingDate: string | null; trialEndsAt: string | null } | null;
  };
  statement: { from: string | null; to: string | null; chargedUSD: number; refundedUSD: number; taxUSD: number; netUSD: number; paymentCount: number; failedCount: number };
  events: BillingTimelineEvent[];
}
export interface BillingTimelineParams { from?: string; to?: string; kinds?: BillingTimelineKind[] }

function query(p: BillingTimelineParams) {
  const qs = new URLSearchParams();
  if (p.from) qs.set('from', p.from);
  if (p.to) qs.set('to', p.to);
  if (p.kinds?.length) qs.set('kinds', p.kinds.join(','));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export function apiGetBillingTimeline(storeId: string, p: BillingTimelineParams = {}) {
  return client.get<never, ApiResponse<BillingTimelineData>>(`${BASE}/${storeId}/billing-timeline${query(p)}`);
}
export function apiExportBillingTimeline(storeId: string, p: BillingTimelineParams = {}) {
  return client.get<never, ApiResponse<{ filename: string; csv: string }>>(`${BASE}/${storeId}/billing-timeline/export${query(p)}`);
}
export function apiAdminGetBillingTimeline(storeId: string, p: BillingTimelineParams = {}) {
  return client.get<never, ApiResponse<BillingTimelineData>>(`${BASE}/admin/stores/${storeId}/billing-timeline${query(p)}`);
}
export function apiAdminExportBillingTimeline(storeId: string, p: BillingTimelineParams = {}) {
  return client.get<never, ApiResponse<{ filename: string; csv: string }>>(`${BASE}/admin/stores/${storeId}/billing-timeline/export${query(p)}`);
}
