import { useCallback, useState } from 'react';
import {
  apiSellerAnalyticsOverview,
  apiSellerAnalyticsRevenueOverTime,
  apiSellerAnalyticsOrdersOverTime,
  apiSellerAnalyticsTrafficSources,
  apiSellerAnalyticsTopProducts,
  apiSellerAnalyticsCustomers,
  apiSellerAnalyticsProductPerformance,
  apiSellerAnalyticsInventoryInsights,
  apiSellerAnalyticsPaymentMethods,
  apiSellerAnalyticsRevenueBreakdown,
  apiSellerAnalyticsExport,
  type SellerAnalyticsParams,
  type SellerTopProductsParams,
  type SellerProductPerformanceParams,
  type SellerExportParams,
} from '@/api/services/analytics/analytics';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

// ── A. Overview ──────────────────────────────────────────────────────────────────

export function useSellerAnalyticsOverview(params: SellerAnalyticsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsOverview, params);
}

// ── B. Revenue over time ─────────────────────────────────────────────────────────

export function useSellerAnalyticsRevenueOverTime(params: SellerAnalyticsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsRevenueOverTime, params);
}

// ── C. Orders over time ──────────────────────────────────────────────────────────

export function useSellerAnalyticsOrdersOverTime(params: SellerAnalyticsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsOrdersOverTime, params);
}

// ── D. Traffic sources ───────────────────────────────────────────────────────────

export function useSellerAnalyticsTrafficSources(params: SellerAnalyticsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsTrafficSources, params);
}

// ── E. Top products ───────────────────────────────────────────────────────────────

export function useSellerAnalyticsTopProducts(params: SellerTopProductsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsTopProducts, params);
}

// ── F. Customer analytics ────────────────────────────────────────────────────────

export function useSellerAnalyticsCustomers(params: SellerAnalyticsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsCustomers, params);
}

// ── F2. Product performance ──────────────────────────────────────────────────────

export function useSellerAnalyticsProductPerformance(params: SellerProductPerformanceParams) {
  return useAnalyticsQuery(apiSellerAnalyticsProductPerformance, params);
}

// ── F3. Inventory insights ────────────────────────────────────────────────────────

export function useSellerAnalyticsInventoryInsights(params: SellerAnalyticsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsInventoryInsights, params);
}

// ── F4. Payment methods ───────────────────────────────────────────────────────────

export function useSellerAnalyticsPaymentMethods(params: SellerAnalyticsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsPaymentMethods, params);
}

// ── F5. Revenue breakdown ────────────────────────────────────────────────────────

export function useSellerAnalyticsRevenueBreakdown(params: SellerAnalyticsParams) {
  return useAnalyticsQuery(apiSellerAnalyticsRevenueBreakdown, params);
}

// ── G. Export ────────────────────────────────────────────────────────────────────

export function useSellerAnalyticsExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const exportReport = useCallback(async (params: SellerExportParams) => {
    setExporting(true);
    setError('');
    try {
      await apiSellerAnalyticsExport(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportReport, exporting, error };
}
