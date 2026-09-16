import { useCallback, useState } from 'react';
import {
  apiAdminAnalyticsOverview,
  apiAdminAnalyticsRevenueOverTime,
  apiAdminAnalyticsRevenueBreakdown,
  apiAdminAnalyticsTopSellers,
  apiAdminAnalyticsSellerPerformance,
  apiAdminAnalyticsSellerRegistrationTrends,
  apiAdminAnalyticsCustomers,
  apiAdminAnalyticsTopProducts,
  apiAdminAnalyticsTopCategories,
  apiAdminAnalyticsProductPerformance,
  apiAdminAnalyticsInventoryInsights,
  apiAdminAnalyticsOrdersOverTime,
  apiAdminAnalyticsOrderStatusBreakdown,
  apiAdminAnalyticsOrdersList,
  apiAdminAnalyticsPaymentBreakdown,
  apiAdminAnalyticsPlatformMetrics,
  apiAdminAnalyticsSellerAcquisition,
  apiAdminAnalyticsPlatformHealth,
  apiAdminAnalyticsPlatformAlerts,
  apiAdminAnalyticsExport,
  type BaseAnalyticsParams,
  type TopSellersParams,
  type SellerPerformanceParams,
  type TopProductsParams,
  type TopCategoriesParams,
  type ProductPerformanceParams,
  type OrdersListParams,
  type ExportParams,
} from '@/api/services/analytics/adminAnalytics';
import { useAnalyticsQuery as useAdminAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

// ── A. Dashboard overview ──────────────────────────────────────────────────────

export function useAdminAnalyticsOverview(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsOverview, params);
}

// ── B. Revenue analytics ────────────────────────────────────────────────────────

export function useAdminAnalyticsRevenueOverTime(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsRevenueOverTime, params);
}

export function useAdminAnalyticsRevenueBreakdown(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsRevenueBreakdown, params);
}

// ── C. Seller analytics ────────────────────────────────────────────────────────

export function useAdminAnalyticsTopSellers(params: TopSellersParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsTopSellers, params);
}

export function useAdminAnalyticsSellerPerformance(params: SellerPerformanceParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsSellerPerformance, params);
}

export function useAdminAnalyticsSellerRegistrationTrends(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsSellerRegistrationTrends, params);
}

// ── D. Customer analytics ───────────────────────────────────────────────────────

export function useAdminAnalyticsCustomers(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsCustomers, params);
}

// ── E. Product analytics ────────────────────────────────────────────────────────

export function useAdminAnalyticsTopProducts(params: TopProductsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsTopProducts, params);
}

export function useAdminAnalyticsTopCategories(params: TopCategoriesParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsTopCategories, params);
}

export function useAdminAnalyticsProductPerformance(params: ProductPerformanceParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsProductPerformance, params);
}

export function useAdminAnalyticsInventoryInsights(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsInventoryInsights, params);
}

// ── F. Order analytics ──────────────────────────────────────────────────────────

export function useAdminAnalyticsOrdersOverTime(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsOrdersOverTime, params);
}

export function useAdminAnalyticsOrderStatusBreakdown(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsOrderStatusBreakdown, params);
}

export function useAdminAnalyticsOrdersList(params: OrdersListParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsOrdersList, params);
}

// ── G. Payment analytics ────────────────────────────────────────────────────────

export function useAdminAnalyticsPaymentBreakdown(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsPaymentBreakdown, params);
}

// ── H. Platform analytics ───────────────────────────────────────────────────────

export function useAdminAnalyticsPlatformMetrics(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsPlatformMetrics, params);
}

// Phase 9 — Merchant Acquisition Tracking.
export function useAdminAnalyticsSellerAcquisition(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsSellerAcquisition, params);
}

// Phase 10 — Platform Health (real, live infrastructure data only).
export function useAdminAnalyticsPlatformHealth(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsPlatformHealth, params);
}

// Phase 11 — Alerts & Insights (deterministic threshold rules only).
export function useAdminAnalyticsPlatformAlerts(params: BaseAnalyticsParams) {
  return useAdminAnalyticsQuery(apiAdminAnalyticsPlatformAlerts, params);
}

// ── I. Export ────────────────────────────────────────────────────────────────────

export function useAdminAnalyticsExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const exportReport = useCallback(async (params: ExportParams) => {
    setExporting(true);
    setError('');
    try {
      await apiAdminAnalyticsExport(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportReport, exporting, error };
}
