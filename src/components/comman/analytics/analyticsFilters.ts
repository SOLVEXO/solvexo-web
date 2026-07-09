export type AnalyticsRangePreset = '7d' | '30d' | '90d' | '6m' | '12m' | 'custom';

/** The date-range filter shape shared by every analytics screen (admin platform-wide + seller store-scoped). */
export interface BaseAnalyticsUIFilters {
  range: AnalyticsRangePreset;
  from: string; // yyyy-mm-dd — only sent when range === 'custom'
  to: string;
  compareToPreviousPeriod: boolean;
}

export const DEFAULT_ANALYTICS_UI_FILTERS: BaseAnalyticsUIFilters = {
  range: '30d',
  from: '',
  to: '',
  compareToPreviousPeriod: false,
};

export const RANGE_PRESET_OPTIONS: { value: AnalyticsRangePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom range' },
];

export interface BaseAnalyticsApiParams {
  range?: AnalyticsRangePreset;
  from?: string;
  to?: string;
  compareToPreviousPeriod?: boolean;
}

/** Converts UI filter state into the base query params every backend `AnalyticsQueryDto`/`AdminAnalyticsQueryDto` expects — drops empty/default values instead of sending them explicitly. */
export function toBaseAnalyticsApiParams(filters: BaseAnalyticsUIFilters): BaseAnalyticsApiParams {
  const params: BaseAnalyticsApiParams = { range: filters.range };
  if (filters.range === 'custom') {
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
  }
  if (filters.compareToPreviousPeriod) params.compareToPreviousPeriod = true;
  return params;
}
