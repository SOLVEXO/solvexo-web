import {
  DEFAULT_ANALYTICS_UI_FILTERS,
  RANGE_PRESET_OPTIONS,
  toBaseAnalyticsApiParams,
  type BaseAnalyticsUIFilters,
} from '@/components/comman/analytics/analyticsFilters';
import type { SellerAnalyticsParams } from '@/api/services/analytics/analytics';

export { RANGE_PRESET_OPTIONS };

export const CSV_SECTION_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'orders', label: 'Orders' },
  { value: 'products', label: 'Products' },
  { value: 'customers', label: 'Customers' },
];

/** Maps the active tab to a sensible default CSV section — still fully overridable via the filter bar's dropdown. */
export const TAB_TO_CSV_SECTION: Record<string, string> = {
  overview: 'revenue',
  revenue: 'revenue',
  products: 'products',
  customers: 'customers',
  traffic: 'orders',
};

/** Seller analytics has no admin-style storeId/sellerId drill-down — the store is already fixed by context, so the UI filter shape is just the shared date-range fields. */
export type SellerAnalyticsFilters = BaseAnalyticsUIFilters;

export const DEFAULT_SELLER_ANALYTICS_FILTERS: SellerAnalyticsFilters = { ...DEFAULT_ANALYTICS_UI_FILTERS };

export function toSellerAnalyticsParams(filters: SellerAnalyticsFilters, storeId: string): SellerAnalyticsParams {
  return { ...toBaseAnalyticsApiParams(filters), storeId };
}
