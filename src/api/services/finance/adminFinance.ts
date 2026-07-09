import client from '../../client';
import { ENDPOINTS } from '../../endpoints';
import type { AnalyticsRangePreset } from '@/components/comman/analytics/analyticsFilters';
import type { AnalyticsGranularity } from '@/components/comman/analytics/format';

// ── Shared query params ─────────────────────────────────────────────────────────
// Mirrors `adminAnalytics.ts`'s `BaseAnalyticsParams` — the backend reuses the
// exact same `AdminAnalyticsQueryDto` for every date-range-based Finance endpoint.

export interface AdminFinanceParams {
  range?: AnalyticsRangePreset;
  from?: string;
  to?: string;
  compareToPreviousPeriod?: boolean;
  storeId?: string;
  sellerId?: string;
  granularity?: AnalyticsGranularity;
  [key: string]: unknown;
}

export type TransactionType = 'sale' | 'payout' | 'fee' | 'refund' | 'adjustment';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AdminTransactionsParams extends AdminFinanceParams {
  type?: TransactionType;
  status?: TransactionStatus;
  page?: number;
  limit?: number;
}

export interface PayoutQueueParams {
  status?: PayoutStatus;
  storeId?: string;
  sellerId?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface SellerBalancesParams {
  search?: string;
  sort?: 'availableBalance' | 'pendingBalance' | 'totalRevenue' | 'totalPayouts';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export type AdminFinanceExportSection = 'transactions' | 'payouts' | 'sellers' | 'refunds' | 'tax' | 'settlement';

export interface AdminFinanceExportParams extends AdminFinanceParams {
  format: 'pdf' | 'csv';
  section?: AdminFinanceExportSection;
}

// ── Shared response shapes ──────────────────────────────────────────────────────

export interface FinancePeriod { from: string; to: string }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── A. Dashboard overview ───────────────────────────────────────────────────────

export interface AdminFinanceOverviewData {
  period: FinancePeriod;
  gmv: number;
  netRevenue: number;
  refunds: number;
  totalOrders: number;
  platformEarnings: number;
  platformCommission: number;
  subscriptionRevenue: number;
  paymentProcessingFees: number;
  sellerBalances: { totalAvailable: number; totalPending: number; sellersWithBalance: number };
  lifetimeTotals: { totalRevenue: number; totalFees: number; totalRefunds: number; totalPayouts: number };
  payoutQueue: Record<PayoutStatus, { count: number; amount: number }>;
  note: string;
}

// ── B. Revenue / commission trends ──────────────────────────────────────────────

export interface RevenuePoint { date: string; grossRevenue: number; netRevenue: number }
export interface AdminFinanceRevenueOverTimeData { granularity: AnalyticsGranularity; series: RevenuePoint[] }

export interface CommissionPoint { date: string; commission: number; processingFees: number }
export interface AdminFinanceCommissionOverTimeData { granularity: AnalyticsGranularity; series: CommissionPoint[] }

// ── C. Seller balances ───────────────────────────────────────────────────────────

export interface SellerBalanceRow {
  storeId: string;
  storeName: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  availableBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  totalFees: number;
  totalRefunds: number;
  totalPayouts: number;
  currency: string;
}

export interface AdminSellerBalancesData {
  pagination: Pagination;
  sellers: SellerBalanceRow[];
}

// ── D. Seller financial details ─────────────────────────────────────────────────

export interface PayoutMethodRow {
  _id: string;
  storeId: string;
  sellerId: string;
  type: 'bank_transfer' | 'paypal' | 'stripe';
  isDefault: boolean;
  bankName: string | null;
  accountHolder: string | null;
  accountLast4: string | null;
  routingNumber: string | null;
  externalAccountId: string | null;
  status: 'active' | 'inactive' | 'pending_verification';
}

export interface PayoutRow {
  _id: string;
  storeId: string;
  /** Present on platform-wide listings (payout queue, platform transactions) — absent on a seller's own `recentPayouts`, which doesn't need it. */
  storeName?: string;
  sellerId: string;
  amount: number;
  currency: string;
  payoutMethodId: string;
  payoutMethodSnapshot: { type: string; bankName: string | null; accountLast4: string } | null;
  status: PayoutStatus;
  scheduledAt: string | null;
  processedAt: string | null;
  failureReason: string | null;
  notes: string | null;
  transactionId: string | null;
  createdAt: string;
}

export interface AdminSellerFinancialDetailsData {
  store: { storeId: string; name: string; sellerId: string };
  seller: { name: string; email: string } | null;
  balance: {
    availableBalance: number; pendingBalance: number;
    totalRevenue: number; totalFees: number; totalRefunds: number; totalPayouts: number;
    currency: string;
  };
  payoutSchedule: { frequency: string; isEnabled: boolean; minimumAmount: number; nextPayoutAt: string | null };
  payoutMethods: PayoutMethodRow[];
  recentPayouts: PayoutRow[];
}

// ── E/F. Transactions ────────────────────────────────────────────────────────────

export interface TransactionRow {
  _id: string;
  storeId: string;
  /** Present on the platform-wide transaction listing — absent on a seller's own transactions. */
  storeName?: string;
  sellerId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId: string | null;
  referenceType: 'order' | 'payout' | 'manual' | null;
  status: TransactionStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminTransactionsData {
  transactions: TransactionRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── G. Payout queue ──────────────────────────────────────────────────────────────

export interface AdminPayoutQueueData {
  payouts: PayoutRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  statusCounts: Record<PayoutStatus, { count: number; amount: number }>;
}

export interface ClearingResultData { processed: number; totalAmount: number }

// ── H. Reports ────────────────────────────────────────────────────────────────────

export interface RefundByStoreRow { storeId: string; storeName: string; totalRefunded: number; count: number }
export interface AdminRefundReportData {
  period: FinancePeriod;
  totalRefunded: number;
  totalRefundCount: number;
  byStore: RefundByStoreRow[];
  note: string;
}

export interface TaxReportRow {
  _id: string;
  storeId: string;
  storeName: string;
  sellerId: string;
  period: 'q1' | 'q2' | 'q3' | 'q4' | 'annual';
  year: number;
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalFees: number;
  totalRefunds: number;
  totalPayouts: number;
  netRevenue: number;
  estimatedTax: number;
  transactionCount: number;
  pdfUrl: string | null;
  generatedAt: string | null;
}

export interface AdminSettlementReportData {
  period: FinancePeriod;
  grossSales: number;
  platformFeesCollected: number;
  refundsIssued: number;
  payoutsDisbursed: number;
  adjustments: number;
  outstandingObligation: { availableBalance: number; pendingBalance: number; totalOwedToSellers: number };
  note: string;
}

export interface MonthlyReportRow {
  month: string;
  gmv: number;
  refunds: number;
  payouts: number;
  platformCommission: number;
  subscriptionRevenue: number;
  platformEarnings: number;
}

export interface AdminMonthlyReportData { monthly: MonthlyReportRow[] }

// ── Query-string helper (mirrors the convention in services/analytics/*) ────────

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

// ── A. Dashboard overview ───────────────────────────────────────────────────────

export function apiAdminFinanceOverview(params: AdminFinanceParams = {}) {
  return client.get<never, ApiResponse<AdminFinanceOverviewData>>(`${ENDPOINTS.FINANCE.ADMIN.OVERVIEW}${qs(params)}`);
}

export function apiAdminFinanceRevenueOverTime(params: AdminFinanceParams = {}) {
  return client.get<never, ApiResponse<AdminFinanceRevenueOverTimeData>>(`${ENDPOINTS.FINANCE.ADMIN.REVENUE_OVER_TIME}${qs(params)}`);
}

export function apiAdminFinanceCommissionOverTime(params: AdminFinanceParams = {}) {
  return client.get<never, ApiResponse<AdminFinanceCommissionOverTimeData>>(`${ENDPOINTS.FINANCE.ADMIN.COMMISSION_OVER_TIME}${qs(params)}`);
}

// ── C/D. Sellers ──────────────────────────────────────────────────────────────────

export function apiAdminSellerBalances(params: SellerBalancesParams = {}) {
  return client.get<never, ApiResponse<AdminSellerBalancesData>>(`${ENDPOINTS.FINANCE.ADMIN.SELLER_BALANCES}${qs(params)}`);
}

export function apiAdminSellerFinancialDetails(storeId: string) {
  return client.get<never, ApiResponse<AdminSellerFinancialDetailsData>>(ENDPOINTS.FINANCE.ADMIN.SELLER_DETAIL(storeId));
}

export function apiAdminSellerTransactions(storeId: string, params: AdminTransactionsParams = {}) {
  return client.get<never, ApiResponse<AdminTransactionsData>>(`${ENDPOINTS.FINANCE.ADMIN.SELLER_TRANSACTIONS(storeId)}${qs(params)}`);
}

export interface ManualPayoutPayload { amount: number; payoutMethodId?: string; notes?: string }

export function apiAdminCreateManualPayout(storeId: string, payload: ManualPayoutPayload) {
  return client.post<never, ApiResponse<PayoutRow>>(ENDPOINTS.FINANCE.ADMIN.MANUAL_PAYOUT(storeId), payload);
}

// ── E. Platform transactions ──────────────────────────────────────────────────────

export function apiAdminPlatformTransactions(params: AdminTransactionsParams = {}) {
  return client.get<never, ApiResponse<AdminTransactionsData>>(`${ENDPOINTS.FINANCE.ADMIN.TRANSACTIONS}${qs(params)}`);
}

// ── F. Payout queue & lifecycle ───────────────────────────────────────────────────

export function apiAdminPayoutQueue(params: PayoutQueueParams = {}) {
  return client.get<never, ApiResponse<AdminPayoutQueueData>>(`${ENDPOINTS.FINANCE.ADMIN.PAYOUT_QUEUE}${qs(params)}`);
}

export function apiAdminApprovePayout(payoutId: string) {
  return client.patch<never, ApiResponse<PayoutRow>>(ENDPOINTS.FINANCE.ADMIN.APPROVE_PAYOUT(payoutId));
}

export function apiAdminRejectPayout(payoutId: string, reason: string) {
  return client.patch<never, ApiResponse<PayoutRow>>(ENDPOINTS.FINANCE.ADMIN.REJECT_PAYOUT(payoutId), { reason });
}

export function apiAdminRetryPayout(payoutId: string) {
  return client.patch<never, ApiResponse<PayoutRow>>(ENDPOINTS.FINANCE.ADMIN.RETRY_PAYOUT(payoutId));
}

export function apiAdminProcessClearing() {
  return client.post<never, ApiResponse<ClearingResultData>>(ENDPOINTS.FINANCE.ADMIN.PROCESS_CLEARING);
}

// ── G. Reports ────────────────────────────────────────────────────────────────────

export function apiAdminRefundReport(params: AdminFinanceParams = {}) {
  return client.get<never, ApiResponse<AdminRefundReportData>>(`${ENDPOINTS.FINANCE.ADMIN.REFUND_REPORT}${qs(params)}`);
}

export function apiAdminTaxReports(params: { storeId?: string; year?: number } = {}) {
  return client.get<never, ApiResponse<TaxReportRow[]>>(`${ENDPOINTS.FINANCE.ADMIN.TAX_REPORTS}${qs(params)}`);
}

export function apiAdminSettlementReport(params: AdminFinanceParams = {}) {
  return client.get<never, ApiResponse<AdminSettlementReportData>>(`${ENDPOINTS.FINANCE.ADMIN.SETTLEMENT_REPORT}${qs(params)}`);
}

export function apiAdminMonthlyReport(params: { months?: number } = {}) {
  return client.get<never, ApiResponse<AdminMonthlyReportData>>(`${ENDPOINTS.FINANCE.ADMIN.MONTHLY_REPORT}${qs(params)}`);
}

// ── H. Export ─────────────────────────────────────────────────────────────────────

/** GET /api/admin/finance/export — downloads a PDF or CSV report and triggers the browser save dialog. */
export async function apiAdminFinanceExport(params: AdminFinanceExportParams) {
  const blob = await client.get<never, Blob>(`${ENDPOINTS.FINANCE.ADMIN.EXPORT}${qs(params)}`, { responseType: 'blob' } as never);
  const filename = params.format === 'pdf'
    ? 'admin-finance-report.pdf'
    : `admin-finance-${params.section ?? 'transactions'}.csv`;

  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objUrl);
}
