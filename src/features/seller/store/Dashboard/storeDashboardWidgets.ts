import type { DashboardPreset, DashboardWidgetDef, LayoutWidget } from '@/components/comman/dashboard/dashboardTypes';
import { widgetFromDef } from '@/components/comman/dashboard/useDashboardLayout';
import { DEFAULT_DASHBOARD_METRICS } from './dashboardMetrics.const';

/**
 * Widgets a merchant can place on the Store Dashboard. Ids, allowed sizes and settings are validated on the server
 * (`solvexo-api/src/dashboard-layouts/dashboard-widgets.const.ts`): keep both lists identical. `perm` is the staff
 * permission whose data the widget shows (UI filter only, the data endpoints enforce it again).
 */
export interface StoreWidgetDef extends DashboardWidgetDef { perm: string | string[] }

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' }, { value: '12m', label: 'Last 12 months' },
];
const LIMIT_OPTIONS = [3, 5, 8, 10, 15, 20].map(n => ({ value: n, label: `${n} rows` }));
const KPI_SIZES: StoreWidgetDef['sizes'] = ['small', 'medium'];

const kpi = (id: string, title: string, description: string, category: string, perm = 'analytics.view'): StoreWidgetDef =>
  ({ id: `metric.${id}`, title, description, category, sizes: KPI_SIZES, defaultSize: 'small', perm });

export const STORE_WIDGET_DEFS: StoreWidgetDef[] = [
  kpi('revenue_30d', 'Total sales (30 days)', 'Sales over the last 30 days, with the change against the 30 days before.', 'Business metrics'),
  kpi('orders_30d', 'Total orders (30 days)', 'Orders placed in the last 30 days.', 'Business metrics'),
  kpi('avg_order_value_30d', 'Average order value (30 days)', 'Average sales per order.', 'Business metrics'),
  kpi('conversion_rate', 'Conversion rate (30 days)', 'Share of store sessions that ended in an order. Counts visitors who accepted cookies.', 'Business metrics'),
  kpi('today_revenue', "Today's sales", 'Sales so far today (store time zone).', 'Business metrics'),
  kpi('today_orders', "Today's orders", 'Orders so far today.', 'Business metrics'),
  kpi('today_avg_order_value', "Today's average order value", 'Average sales per order today.', 'Business metrics'),
  kpi('refund_rate_30d', 'Refund rate (30 days)', 'Refunded share of orders.', 'Business metrics'),
  kpi('customers_30d', 'Customers (30 days)', 'Unique buyers in the last 30 days.', 'Customers'),
  kpi('repeat_buyer_rate_30d', 'Repeat buyer rate (30 days)', 'Share of orders from returning customers.', 'Customers'),
  kpi('active_products', 'Active products', 'Products in your catalog.', 'Products and inventory', 'inventory.view'),
  {
    id: 'sales_chart', title: 'Sales over time', category: 'Sales analytics', perm: 'analytics.view',
    description: 'Sales trend for the period you choose.', sizes: ['medium', 'large', 'full'], defaultSize: 'large',
    settings: [{ key: 'range', label: 'Period', options: RANGE_OPTIONS }], defaultSettings: { range: '30d' },
  },
  { id: 'insights', title: 'Insights', category: 'Sales analytics', perm: 'analytics.view', description: 'Plain-language highlights from your recent sales and a short forecast.', sizes: ['large', 'full'], defaultSize: 'full' },
  { id: 'balance', title: 'Available balance', category: 'Business metrics', perm: 'finance.payouts.view', description: 'Money held on the platform for payout. Only shows when there is a balance.', sizes: ['large', 'full'], defaultSize: 'full' },
  { id: 'needs_attention', title: 'Needs attention', category: 'Orders', perm: ['orders.capture_payment', 'orders.view', 'orders.disputes_manage', 'inventory.view', 'orders.return'], description: 'Orders to fulfil, disputes, returns and low-stock products that need action.', sizes: ['third', 'medium', 'large'], defaultSize: 'third' },
  {
    id: 'recent_orders', title: 'Recent orders', category: 'Orders', perm: 'orders.view', description: 'Your latest orders.', sizes: ['third', 'medium', 'large'], defaultSize: 'medium',
    settings: [{ key: 'limit', label: 'Orders shown', options: LIMIT_OPTIONS }], defaultSettings: { limit: 5 },
  },
  {
    id: 'top_products', title: 'Top-selling products', category: 'Products and inventory', perm: 'inventory.view', description: 'Your best-performing products.', sizes: ['third', 'medium', 'large'], defaultSize: 'medium',
    settings: [{ key: 'limit', label: 'Products shown', options: LIMIT_OPTIONS }], defaultSettings: { limit: 5 },
  },
  {
    id: 'traffic_sources', title: 'Traffic sources', category: 'Marketing', perm: 'analytics.view', description: 'Where your orders come from: search, social, email, paid and more.', sizes: ['third', 'medium', 'large'], defaultSize: 'medium',
    settings: [{ key: 'range', label: 'Period', options: RANGE_OPTIONS }], defaultSettings: { range: '30d' },
  },
  { id: 'setup_guide', title: 'Store setup checklist', category: 'Store setup', perm: [], description: 'Steps to finish setting up your store. Hides itself once everything is done.', sizes: ['medium', 'large', 'full'], defaultSize: 'medium' },
  {
    id: 'recent_activity', title: 'Recent activity', category: 'Activity', perm: [], description: 'Latest changes made in your store.', sizes: ['third', 'medium', 'large'], defaultSize: 'medium',
    settings: [{ key: 'limit', label: 'Entries shown', options: LIMIT_OPTIONS }], defaultSettings: { limit: 5 },
  },
];

const def = (id: string) => STORE_WIDGET_DEFS.find(d => d.id === id)!;
const sized = (ids: string[]): LayoutWidget[] => ids.map(id => widgetFromDef(def(id)));

/** What a merchant who never customized sees: the same cards as before this feature (their chosen metrics, else the four classics). */
export function buildDefaultWidgets(legacyMetrics?: string[] | null): LayoutWidget[] {
  const metricIds = (legacyMetrics && legacyMetrics.length > 0 ? legacyMetrics : DEFAULT_DASHBOARD_METRICS)
    .map(id => `metric.${id}`).filter(id => STORE_WIDGET_DEFS.some(d => d.id === id));
  return sized([...metricIds, 'sales_chart', 'needs_attention', 'balance', 'insights', 'setup_guide', 'recent_activity', 'recent_orders', 'top_products']);
}

export const STORE_PRESETS: DashboardPreset[] = [
  { id: 'default', label: 'Default', description: 'Sales, orders, average order value and conversion, then the chart and what needs attention.',
    widgets: ['metric.revenue_30d', 'metric.orders_30d', 'metric.avg_order_value_30d', 'metric.conversion_rate', 'sales_chart', 'needs_attention', 'recent_orders', 'top_products', 'setup_guide', 'recent_activity'] },
  { id: 'sales_focus', label: 'Sales Focus', description: 'Revenue, conversion and charts first.',
    widgets: ['metric.revenue_30d', 'metric.avg_order_value_30d', 'metric.conversion_rate', 'metric.today_revenue', { id: 'sales_chart', size: 'full' }, 'insights', 'top_products', 'traffic_sources'] },
  { id: 'operations', label: 'Operations', description: 'Orders to fulfil, recent orders and stock.',
    widgets: ['metric.today_orders', 'metric.orders_30d', 'metric.refund_rate_30d', 'metric.active_products', { id: 'needs_attention', size: 'medium' }, { id: 'recent_orders', size: 'medium' }, 'top_products', 'recent_activity'] },
  { id: 'marketing', label: 'Marketing', description: 'Traffic sources, customers and conversion.',
    widgets: ['metric.conversion_rate', 'metric.customers_30d', 'metric.repeat_buyer_rate_30d', 'metric.revenue_30d', { id: 'traffic_sources', size: 'medium' }, { id: 'sales_chart', size: 'medium' }, 'top_products'] },
];
