/**
 * Single source of truth for the Store Dashboard's "Customize" picker —
 * mirrors Shopify's real Home-page metrics customization (add/remove/
 * reorder cards from a fixed library — confirmed against Shopify's own
 * Help Center article "Customizing the Analytics overview dashboard").
 * Every id here has a matching, real backend-computed value already
 * available from `useStoreDashboardMetrics`'s fetch (SellerOverviewData /
 * SellerTodaySummaryData / the inventory stats call) — never a metric
 * invented just to fill the list. Kept in exact 1:1 sync with the backend's
 * `store-dashboard-metrics.const.ts` (ids and the default set must match —
 * there is no shared package between the two projects to enforce this
 * automatically, so any change here must be mirrored there too).
 */
export interface DashboardMetricDefinition {
  id: string;
  label: string;
}

export const DASHBOARD_METRIC_CATALOG: DashboardMetricDefinition[] = [
  { id: 'revenue_30d', label: 'Revenue (30 days)' },
  { id: 'orders_30d', label: 'Orders (30 days)' },
  { id: 'active_products', label: 'Active Products' },
  { id: 'customers_30d', label: 'Customers (30 days)' },
  { id: 'avg_order_value_30d', label: 'Average Order Value (30 days)' },
  { id: 'refund_rate_30d', label: 'Refund Rate (30 days)' },
  { id: 'repeat_buyer_rate_30d', label: 'Repeat Buyer Rate (30 days)' },
  { id: 'today_revenue', label: "Today's Revenue" },
  { id: 'today_orders', label: "Today's Orders" },
  { id: 'today_avg_order_value', label: "Today's Average Order Value" },
];

/** Every pre-existing store's dashboard, unchanged — must never be reordered/shrunk, only grown with new non-default ids. */
export const DEFAULT_DASHBOARD_METRICS: string[] = ['revenue_30d', 'orders_30d', 'active_products', 'customers_30d'];
