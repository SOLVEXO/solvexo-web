import type { AnalyticsGranularity, BaseAnalyticsParams } from '@/api/services/analytics/adminAnalytics';
import {
  DEFAULT_ANALYTICS_UI_FILTERS,
  RANGE_PRESET_OPTIONS,
  toBaseAnalyticsApiParams,
  type BaseAnalyticsUIFilters,
} from '@/components/comman/analytics/analyticsFilters';

export { RANGE_PRESET_OPTIONS };

export const GRANULARITY_OPTIONS: { value: AnalyticsGranularity; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

export const CSV_SECTION_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'orders', label: 'Orders' },
  { value: 'sellers', label: 'Sellers' },
  { value: 'products', label: 'Products' },
  { value: 'customers', label: 'Customers' },
  { value: 'payments', label: 'Payments' },
  { value: 'platform', label: 'Platform' },
];

/** Maps the active tab to a sensible default CSV section — still fully overridable by the user via the filter bar's dropdown. */
export const TAB_TO_CSV_SECTION: Record<string, string> = {
  overview: 'revenue',
  revenue: 'revenue',
  sellers: 'sellers',
  customers: 'customers',
  products: 'products',
  orders: 'orders',
  payments: 'payments',
  platform: 'platform',
};

/** Admin-specific UI filter shape — adds the optional storeId/sellerId drill-down and the granularity override on top of the shared date-range fields. */
export interface AnalyticsFilters extends BaseAnalyticsUIFilters {
  storeId: string;
  sellerId: string;
  granularity: AnalyticsGranularity | '';
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilters = {
  ...DEFAULT_ANALYTICS_UI_FILTERS,
  storeId: '',
  sellerId: '',
  granularity: '',
};

/** Converts UI filter state into the query params the backend `AdminAnalyticsQueryDto` expects. */
export function toBaseAnalyticsParams(filters: AnalyticsFilters): BaseAnalyticsParams {
  const params: BaseAnalyticsParams = { ...toBaseAnalyticsApiParams(filters) };
  if (filters.storeId) params.storeId = filters.storeId;
  if (filters.sellerId) params.sellerId = filters.sellerId;
  if (filters.granularity) params.granularity = filters.granularity;
  return params;
}
