import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ── Shared query params ────────────────────────────────────────────────────────

export type AnalyticsRangePreset = '7d' | '30d' | '90d' | '6m' | '12m' | 'custom';
export type AnalyticsGranularity = 'day' | 'week' | 'month';

export interface BaseAnalyticsParams {
  range?: AnalyticsRangePreset;
  from?: string;
  to?: string;
  compareToPreviousPeriod?: boolean;
  storeId?: string;
  sellerId?: string;
  granularity?: AnalyticsGranularity;
  // Index signature so these param objects can be passed straight into `qs()`'s
  // `Record<string, unknown>` param — plain `interface`s (unlike inline object-literal
  // types) don't get one implicitly.
  [key: string]: unknown;
}

export interface TopSellersParams extends BaseAnalyticsParams {
  limit?: number;
  sort?: 'revenue' | 'orders';
  order?: 'asc' | 'desc';
}

export interface SellerPerformanceParams extends BaseAnalyticsParams {
  page?: number;
  limit?: number;
  sort?: 'revenue' | 'orders';
  order?: 'asc' | 'desc';
}

export interface TopProductsParams extends BaseAnalyticsParams {
  limit?: number;
  sort?: 'revenue' | 'units_sold';
  categoryId?: string;
}

export interface TopCategoriesParams extends BaseAnalyticsParams {
  limit?: number;
  sort?: 'revenue' | 'units_sold';
}

export interface ProductPerformanceParams extends BaseAnalyticsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
}

export type ExportSection = 'revenue' | 'orders' | 'sellers' | 'products' | 'customers' | 'payments' | 'platform';

export interface ExportParams extends BaseAnalyticsParams {
  format: 'pdf' | 'csv';
  section?: ExportSection;
}

// ── Shared response shapes ─────────────────────────────────────────────────────

export interface AnalyticsPeriod { from: string; to: string }

export interface Pagination { page: number; limit: number; total: number; totalPages: number }

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── A. Dashboard overview ──────────────────────────────────────────────────────

export interface AdminOverviewPreviousPeriod {
  period: AnalyticsPeriod;
  totalGMV: number;
  totalRevenue: number;
  totalOrders: number;
  sellersActiveThisMonth: number;
  totalRefunds: number;
  cancelledOrders: number;
}

export interface AdminOverviewData {
  period: AnalyticsPeriod;
  totalGMV: number;
  totalRevenue: number;
  totalRevenueChangePercent: number | null;
  platformEarnings: number;
  platformCommission: number;
  subscriptionRevenue: number;
  totalOrders: number;
  totalOrdersChange: number;
  totalSellers: number;
  sellersActiveThisMonth: number;
  sellersActiveThisMonthChange: number;
  totalStores: number;
  activeStores: number;
  totalCustomers: number;
  newUsers: number;
  totalRefunds: number;
  refundRatePercent: number;
  cancelledOrders: number;
  // Phase 1 — Solvexo's OWN recurring revenue from sellers paying for their
  // platform plan (reused from the existing PlatformPlansService — a
  // distinct stream from `subscriptionRevenue` above, which is buyer-VIP
  // revenue). Platform-wide only — absent (not zero) whenever a
  // storeId/sellerId drill-down is active, since a seller's platform plan
  // isn't a per-store figure.
  sellerPlatformMRR?: number;
  sellerPlatformARR?: number;
  activePlatformSubscribers?: number;
  sellerChurnRatePercent?: number;
  // Phase 2 — present only when non-zero; see AdminRevenueBreakdownData's
  // same field for what this discloses.
  nonUsdCommissionByCurrency?: NonUsdCommissionRow[];
  note: string;
  previousPeriod?: AdminOverviewPreviousPeriod;
}

// ── B. Revenue analytics ────────────────────────────────────────────────────────

export interface RevenuePoint { date: string; grossRevenue: number; netRevenue: number }
export interface AdminRevenueOverTimeData { granularity: AnalyticsGranularity; series: RevenuePoint[] }

export interface AdminRevenueBreakdownPreviousPeriod {
  period: AnalyticsPeriod;
  oneTimeOrderRevenue: number;
  recurringSubscriptionRevenue: number;
  platformCommissionRevenue: number;
  paymentProcessingFees: number;
  totalPlatformRevenue: number;
  totalMarketplaceRevenue: number;
}

export interface NonUsdCommissionRow { currency: string; commission: number; processingFees: number }

export interface AdminRevenueBreakdownData {
  period: AnalyticsPeriod;
  oneTimeOrderRevenue: number;
  recurringSubscriptionRevenue: number;
  platformCommissionRevenue: number;
  paymentProcessingFees: number;
  totalPlatformRevenue: number;
  totalMarketplaceRevenue: number;
  // Phase 2 — present only when non-zero. A seller settled in a currency
  // other than USD has their commission/fees disclosed here rather than
  // blended into the USD figures above or silently dropped.
  nonUsdCommissionByCurrency?: NonUsdCommissionRow[];
  note: string;
  previousPeriod?: AdminRevenueBreakdownPreviousPeriod;
}

// ── C. Seller analytics ────────────────────────────────────────────────────────

export interface TopSellerRow {
  sellerId: string;
  name: string;
  email: string;
  orderCount: number;
  unitsSold: number;
  revenue: number;
}

// Phase 3 — deterministic, date-derived seller sales status. Computed from
// real Seller.createdAt + all-time last-order-date only; never arbitrary.
export type SellerSalesStatus = 'new' | 'active' | 'at_risk' | 'dormant';

export interface SellerPerformanceRow {
  sellerId: string;
  name: string;
  email: string;
  orderCount: number;
  unitsSold: number;
  revenue: number;
  refundRatePercent: number;
  storeCount: number;
  activeStoreCount: number;
  salesStatus: SellerSalesStatus;
}

export interface AdminSellerPerformanceData {
  pagination: Pagination;
  sellers: SellerPerformanceRow[];
  note?: string;
}

export interface SellerRegistrationPoint { date: string; newSellers: number; cumulativeSellers: number }
export interface AdminSellerRegistrationTrendsData { granularity: AnalyticsGranularity; series: SellerRegistrationPoint[] }

// ── D. Customer analytics ───────────────────────────────────────────────────────

export interface NewVsReturningPoint { date: string; newCustomers: number; returningCustomers: number }
export interface TopCustomerRow { userId: string; name: string; email: string; totalOrders: number; lifetimeValue: number }
export interface GeoBreakdownRow { state: string; orders: number; revenue: number }
export interface CountryBreakdownRow { country: string; orders: number; revenue: number }

export interface AdminCustomerAnalyticsData {
  granularity: AnalyticsGranularity;
  activeCustomers: number;
  repeatCustomerPercent: number;
  newVsReturning: NewVsReturningPoint[];
  averageLifetimeValue: number;
  topCustomersByLtv: TopCustomerRow[];
  geographicBreakdown: GeoBreakdownRow[];
  countryBreakdown: CountryBreakdownRow[];
  note: string;
}

// ── E. Product analytics ────────────────────────────────────────────────────────

// Phase 6 — real product-view/conversion figures from the Phase 5 tracking
// foundation. `viewToPurchaseConversionPercent` is `null` (never 0) when
// `views` is 0 — there is no tracked-view data to divide by, most often
// because the product's traffic predates the view-tracking launch date.
export interface TopProductRow {
  productId: string;
  name: string;
  orderCount: number;
  unitsSold: number;
  revenue: number;
  views: number;
  viewToPurchaseConversionPercent: number | null;
}
export interface TopCategoryRow { categoryId: string; name: string; orderCount: number; unitsSold: number; revenue: number }

export interface ProductPerformanceRow {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  refundRatePercent: number;
  currentStock: number;
  isLowPerformer: boolean;
  views: number;
  viewToPurchaseConversionPercent: number | null;
}

export interface AdminProductPerformanceData {
  pagination: Pagination;
  products: ProductPerformanceRow[];
  note?: string;
}

export interface InventoryOutOfStockRow { productId: string; name: string; unitsSoldLast30Days: number }
export interface InventoryMovingRow {
  productId: string;
  name: string;
  currentStock: number;
  unitsSoldLast30Days: number;
  sellThroughRatePercent: number;
}
export interface InventoryReorderRow { productId: string; name: string; currentStock: number; estimatedWeeksRemaining: number }

export interface AdminInventoryInsightsData {
  note: string;
  outOfStockCount: number;
  outOfStock: InventoryOutOfStockRow[];
  fastMoving: InventoryMovingRow[];
  slowMoving: InventoryMovingRow[];
  reorderSuggestions: InventoryReorderRow[];
}

// ── F. Order analytics ──────────────────────────────────────────────────────────

export interface OrdersOverTimePoint { date: string; orderCount: number; cancelledOrdersCount: number; refundedOrdersCount: number }
export interface AdminOrdersOverTimeData { granularity: AnalyticsGranularity; series: OrdersOverTimePoint[] }

export interface AdminOrderStatusBreakdownData {
  statusCounts: Record<string, number>;
  totalOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  avgOrderValue: number;
  cancellationRatePercent: number;
  refundRatePercent: number;
}

// Phase 7 — real Mongo-side (skip/limit) pagination, unlike the Sellers/
// Products tabs' in-memory-then-.slice() pagination: order volume can be far
// larger, so this must page inside the database query itself.
export interface OrdersListParams extends BaseAnalyticsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface OrderListRow {
  orderId: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  storeId: string;
  storeName: string;
  status: string;
  itemCount: number;
  // null (never 0) means this order predates USD-rate capture — see `unconvertible`.
  grossAmountUSD: number | null;
  refundedAmountUSD: number | null;
  unconvertible: boolean;
}

export interface AdminOrdersListData {
  pagination: Pagination;
  orders: OrderListRow[];
  note?: string;
}

// ── G. Payment analytics ────────────────────────────────────────────────────────

export interface PaymentMethodRow { paymentType: string; label: string; orderCount: number; revenue: number }
// Phase 8 — `amount` is now USD-normalized from each transaction's own
// fxSnapshots (previously a disclosed raw cross-currency sum); a
// transaction predating fxSnapshots capture is counted in
// `unconvertibleCount` and excluded from `amount`, never guessed at.
export interface PaymentStatusSummary { count: number; amount: number; unconvertibleCount: number }

export interface AdminPaymentBreakdownData {
  methodBreakdown: PaymentMethodRow[];
  successfulPayments: PaymentStatusSummary;
  failedPayments: PaymentStatusSummary;
  pendingPayments: PaymentStatusSummary;
  note: string;
}

// ── H. Platform analytics ───────────────────────────────────────────────────────

export interface MarketplaceGrowthPoint { date: string; newSellers: number; newStores: number; newProducts: number }

export interface AdminPlatformMetricsData {
  granularity: AnalyticsGranularity;
  marketplaceGrowth: MarketplaceGrowthPoint[];
  conversionMetrics: {
    newUsersInPeriod: number;
    newUsersWhoOrdered: number;
    signupToOrderConversionPercent: number;
    note: string;
  };
}

// Phase 9 — Merchant Acquisition Tracking. Real UTM/referrer capture at
// seller signup (see Seller.acquisitionSource on the backend) — a
// completely separate signal from buyer-side Order.attributionSource.
export interface SellerAcquisitionRow {
  source: string;
  medium: string | null;
  campaign: string | null;
  sellerCount: number;
}

export interface AdminSellerAcquisitionData {
  totalSellers: number;
  attributedCount: number;
  breakdown: SellerAcquisitionRow[];
  note: string;
}

// Phase 10 — Platform Health. Real, live infrastructure signals only
// (dependency status, webhook-processing failure rate, queue backlog) —
// never a fabricated uptime/latency/error-rate number. See
// PlatformHealthService's own header comment (backend) for why.
export interface DependencyStatus {
  mongodb: 'up' | 'down';
  redis: 'up' | 'down';
  checkedAt: string;
}

export interface WebhookStatusCount { status: string; count: number }

export interface WebhookReliability {
  totalEvents: number;
  failedEvents: number;
  failureRatePercent: number;
  byStatus: WebhookStatusCount[];
  note: string;
}

export interface QueueBacklogRow {
  name: string;
  waiting: number | null;
  active: number | null;
  completed: number | null;
  failed: number | null;
  delayed: number | null;
  unavailable?: boolean;
}

export interface AdminPlatformHealthData {
  dependencyStatus: DependencyStatus;
  webhookReliability: WebhookReliability;
  queueBacklog: QueueBacklogRow[];
  note: string;
}

// Phase 11 — Alerts & Insights. Deterministic threshold rules only — see
// PlatformAlertsService's own header comment (backend). Never an AI-
// generated insight or a learned/tuned anomaly score.
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface PlatformAlert {
  id: string;
  severity: AlertSeverity;
  category: string;
  message: string;
  metricValue: number | string;
  threshold: string;
}

export interface AdminPlatformAlertsData {
  alerts: PlatformAlert[];
  note: string;
}

// ── Query-string helper (mirrors the convention in services/subscriptions.ts) ──

function qs(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

// ── A. Dashboard overview ──────────────────────────────────────────────────────

export function apiAdminAnalyticsOverview(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminOverviewData>>(`${ENDPOINTS.ANALYTICS.ADMIN.OVERVIEW}${qs(params)}`);
}

// ── B. Revenue analytics ────────────────────────────────────────────────────────

export function apiAdminAnalyticsRevenueOverTime(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminRevenueOverTimeData>>(`${ENDPOINTS.ANALYTICS.ADMIN.REVENUE_OVER_TIME}${qs(params)}`);
}

// ── Platform growth forecast (real trend+seasonality projection, or an
// honest simple-average fallback) — same technique as the seller-facing
// Sales Forecast, applied platform-wide (or scoped via storeId/sellerId). ──

export interface AdminGrowthForecastData {
  currency: string;
  method: 'trend_seasonal' | 'simple_average';
  forecastedDailyRevenue: number;
  projectedNext7Days: number;
  projectedNext30Days: number;
}

export function apiAdminAnalyticsGrowthForecast(params: Pick<BaseAnalyticsParams, 'storeId' | 'sellerId'> = {}) {
  return client.get<never, ApiResponse<AdminGrowthForecastData>>(`${ENDPOINTS.ANALYTICS.ADMIN.GROWTH_FORECAST}${qs(params)}`);
}

export function apiAdminAnalyticsRevenueBreakdown(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminRevenueBreakdownData>>(`${ENDPOINTS.ANALYTICS.ADMIN.REVENUE_BREAKDOWN}${qs(params)}`);
}

// ── C. Seller analytics ────────────────────────────────────────────────────────

export function apiAdminAnalyticsTopSellers(params: TopSellersParams = {}) {
  return client.get<never, ApiResponse<TopSellerRow[]>>(`${ENDPOINTS.ANALYTICS.ADMIN.SELLERS_TOP}${qs(params)}`);
}

export function apiAdminAnalyticsSellerPerformance(params: SellerPerformanceParams = {}) {
  return client.get<never, ApiResponse<AdminSellerPerformanceData>>(`${ENDPOINTS.ANALYTICS.ADMIN.SELLERS_PERFORMANCE}${qs(params)}`);
}

export function apiAdminAnalyticsSellerRegistrationTrends(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminSellerRegistrationTrendsData>>(`${ENDPOINTS.ANALYTICS.ADMIN.SELLERS_REGISTRATION_TRENDS}${qs(params)}`);
}

// ── D. Customer analytics ───────────────────────────────────────────────────────

export function apiAdminAnalyticsCustomers(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminCustomerAnalyticsData>>(`${ENDPOINTS.ANALYTICS.ADMIN.CUSTOMERS}${qs(params)}`);
}

// ── E. Product analytics ────────────────────────────────────────────────────────

export function apiAdminAnalyticsTopProducts(params: TopProductsParams = {}) {
  return client.get<never, ApiResponse<TopProductRow[]>>(`${ENDPOINTS.ANALYTICS.ADMIN.PRODUCTS_TOP}${qs(params)}`);
}

export function apiAdminAnalyticsTopCategories(params: TopCategoriesParams = {}) {
  return client.get<never, ApiResponse<TopCategoryRow[]>>(`${ENDPOINTS.ANALYTICS.ADMIN.CATEGORIES_TOP}${qs(params)}`);
}

export function apiAdminAnalyticsProductPerformance(params: ProductPerformanceParams = {}) {
  return client.get<never, ApiResponse<AdminProductPerformanceData>>(`${ENDPOINTS.ANALYTICS.ADMIN.PRODUCTS_PERFORMANCE}${qs(params)}`);
}

export function apiAdminAnalyticsInventoryInsights(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminInventoryInsightsData>>(`${ENDPOINTS.ANALYTICS.ADMIN.INVENTORY_INSIGHTS}${qs(params)}`);
}

// ── F. Order analytics ──────────────────────────────────────────────────────────

export function apiAdminAnalyticsOrdersOverTime(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminOrdersOverTimeData>>(`${ENDPOINTS.ANALYTICS.ADMIN.ORDERS_OVER_TIME}${qs(params)}`);
}

export function apiAdminAnalyticsOrderStatusBreakdown(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminOrderStatusBreakdownData>>(`${ENDPOINTS.ANALYTICS.ADMIN.ORDERS_STATUS_BREAKDOWN}${qs(params)}`);
}

export function apiAdminAnalyticsOrdersList(params: OrdersListParams = {}) {
  return client.get<never, ApiResponse<AdminOrdersListData>>(`${ENDPOINTS.ANALYTICS.ADMIN.ORDERS_LIST}${qs(params)}`);
}

// ── G. Payment analytics ────────────────────────────────────────────────────────

export function apiAdminAnalyticsPaymentBreakdown(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminPaymentBreakdownData>>(`${ENDPOINTS.ANALYTICS.ADMIN.PAYMENTS_BREAKDOWN}${qs(params)}`);
}

// ── H. Platform analytics ───────────────────────────────────────────────────────

export function apiAdminAnalyticsPlatformMetrics(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminPlatformMetricsData>>(`${ENDPOINTS.ANALYTICS.ADMIN.PLATFORM_METRICS}${qs(params)}`);
}

export function apiAdminAnalyticsSellerAcquisition(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminSellerAcquisitionData>>(`${ENDPOINTS.ANALYTICS.ADMIN.SELLER_ACQUISITION}${qs(params)}`);
}

export function apiAdminAnalyticsPlatformHealth(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminPlatformHealthData>>(`${ENDPOINTS.ANALYTICS.ADMIN.PLATFORM_HEALTH}${qs(params)}`);
}

export function apiAdminAnalyticsPlatformAlerts(params: BaseAnalyticsParams = {}) {
  return client.get<never, ApiResponse<AdminPlatformAlertsData>>(`${ENDPOINTS.ANALYTICS.ADMIN.PLATFORM_ALERTS}${qs(params)}`);
}

// ── I. Export ────────────────────────────────────────────────────────────────────

/** GET /api/admin/analytics/export — downloads a PDF or CSV report and triggers the browser save dialog. */
export async function apiAdminAnalyticsExport(params: ExportParams) {
  const blob = await client.get<never, Blob>(`${ENDPOINTS.ANALYTICS.ADMIN.EXPORT}${qs(params)}`, { responseType: 'blob' } as never);
  const filename = params.format === 'pdf'
    ? 'admin-analytics-report.pdf'
    : `admin-analytics-${params.section ?? 'revenue'}.csv`;

  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objUrl);
}
