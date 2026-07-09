import {
  DEFAULT_ANALYTICS_UI_FILTERS,
  RANGE_PRESET_OPTIONS,
  toBaseAnalyticsApiParams,
  type BaseAnalyticsUIFilters,
} from '@/components/comman/analytics/analyticsFilters';
import type { AdminFinanceParams } from '@/api/services/finance/adminFinance';

export { RANGE_PRESET_OPTIONS };

export const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

export const CSV_SECTION_OPTIONS = [
  { value: 'transactions', label: 'Transactions' },
  { value: 'payouts', label: 'Payouts' },
  { value: 'sellers', label: 'Sellers' },
  { value: 'refunds', label: 'Refunds' },
  { value: 'tax', label: 'Tax Reports' },
  { value: 'settlement', label: 'Settlement' },
];

/** Maps the active tab to a sensible default CSV section — still fully overridable via the filter bar's dropdown. */
export const TAB_TO_CSV_SECTION: Record<string, string> = {
  overview: 'transactions',
  revenue: 'transactions',
  sellers: 'sellers',
  payouts: 'payouts',
  transactions: 'transactions',
  reports: 'settlement',
};

export interface AdminFinanceFilters extends BaseAnalyticsUIFilters {
  storeId: string;
  sellerId: string;
  granularity: 'day' | 'week' | 'month' | '';
}

export const DEFAULT_ADMIN_FINANCE_FILTERS: AdminFinanceFilters = {
  ...DEFAULT_ANALYTICS_UI_FILTERS,
  storeId: '',
  sellerId: '',
  granularity: '',
};

export function toAdminFinanceParams(filters: AdminFinanceFilters): AdminFinanceParams {
  const params: AdminFinanceParams = { ...toBaseAnalyticsApiParams(filters) };
  if (filters.storeId) params.storeId = filters.storeId;
  if (filters.sellerId) params.sellerId = filters.sellerId;
  if (filters.granularity) params.granularity = filters.granularity;
  return params;
}
