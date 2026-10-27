import type { DashboardPreset, DashboardWidgetDef, LayoutWidget } from '@/components/comman/dashboard/dashboardTypes';
import { widgetFromDef } from '@/components/comman/dashboard/useDashboardLayout';

/**
 * Widgets for the Super Admin Home. Ids, sizes and settings are validated on the server
 * (`solvexo-api/src/dashboard-layouts/dashboard-widgets.const.ts`): keep both lists identical. `perm` is the admin
 * team permission whose data the widget shows (UI filter only; every data endpoint enforces it again).
 */
export interface AdminWidgetDef extends DashboardWidgetDef { perm: string | null }

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' }, { value: '12m', label: 'Last 12 months' },
];
const LIMIT_OPTIONS = [3, 5, 8, 10, 15, 20].map(n => ({ value: n, label: `${n} rows` }));

const kpi = (id: string, title: string, description: string, category: string, perm: string | null = 'analytics.view', locked = false): AdminWidgetDef =>
  ({ id: `kpi.${id}`, title, description, category, perm, locked, sizes: ['small', 'medium'], defaultSize: 'small' });

export const ADMIN_WIDGET_DEFS: AdminWidgetDef[] = [
  kpi('total_stores', 'Total stores', 'Every store created on the platform.', 'Platform overview'),
  kpi('active_stores', 'Active stores', 'Stores that are live and not suspended.', 'Platform overview'),
  kpi('mrr', 'Subscription MRR', "Solvexo's own monthly recurring revenue from sellers' plans. Not merchants' sales.", 'Subscription revenue'),
  // A critical indicator: it can be resized but never hidden or removed.
  kpi('critical_alerts', 'Critical incidents', 'Open critical alerts (database, cache and similar). Always visible.', 'System health', 'analytics.view', true),
  kpi('total_sellers', 'Seller accounts', 'Registered sellers.', 'Merchant growth'),
  kpi('active_sellers', 'Active sellers (30 days)', 'Sellers with activity in the last 30 days.', 'Merchant growth'),
  kpi('new_users', 'New users (30 days)', 'New buyer and seller accounts.', 'Merchant growth'),
  kpi('paid_subscribers', 'Paid subscribers', 'Stores paying for a platform plan.', 'Subscription revenue'),
  kpi('plan_arr', 'Annual recurring revenue', 'MRR x 12.', 'Subscription revenue'),
  kpi('churn', 'Seller churn', 'Share of paying sellers lost in the period.', 'Subscription revenue'),
  kpi('gmv', 'Merchant sales volume (30 days)', "What merchants sold through their stores. This is NOT Solvexo's revenue.", 'Platform overview'),
  {
    id: 'merchant_growth', title: 'New merchants over time', category: 'Merchant growth', perm: 'analytics.view',
    description: 'New seller registrations per period.', sizes: ['medium', 'large', 'full'], defaultSize: 'large',
    settings: [{ key: 'range', label: 'Period', options: RANGE_OPTIONS }], defaultSettings: { range: '6m' },
  },
  {
    id: 'platform_revenue', title: 'Solvexo revenue', category: 'Subscription revenue', perm: 'finance.view',
    description: 'Plan fees, add-ons and transaction fees collected, with plan tax shown separately.', sizes: ['third', 'medium', 'large'], defaultSize: 'third',
    settings: [{ key: 'range', label: 'Period', options: RANGE_OPTIONS }], defaultSettings: { range: '30d' },
  },
  { id: 'plan_distribution', title: 'Plan distribution', category: 'Subscription revenue', perm: 'billing.manage', description: 'Paying stores and MRR per platform plan.', sizes: ['third', 'medium', 'large'], defaultSize: 'third' },
  { id: 'platform_alerts', title: 'Platform alerts', category: 'System health', perm: 'analytics.view', description: 'Failed jobs, integration and payment problems and other rule-based alerts.', sizes: ['third', 'medium', 'large', 'full'], defaultSize: 'medium' },
  { id: 'system_health', title: 'System health', category: 'System health', perm: 'analytics.view', description: 'Database and cache status, webhook failures and background queue backlog.', sizes: ['third', 'medium', 'large'], defaultSize: 'medium' },
  {
    id: 'recent_activity', title: 'Recent platform activity', category: 'Security and audit', perm: 'activity.view', description: 'Latest administrative and security events.', sizes: ['third', 'medium', 'large'], defaultSize: 'medium',
    settings: [{ key: 'limit', label: 'Entries shown', options: LIMIT_OPTIONS }], defaultSettings: { limit: 8 },
  },
  { id: 'top_categories', title: 'Top categories by revenue', category: 'Merchant growth', perm: 'analytics.view', description: 'Best-selling product categories across the platform (30 days).', sizes: ['third', 'medium', 'large'], defaultSize: 'medium' },
  { id: 'growth_forecast', title: 'Platform growth forecast', category: 'Platform overview', perm: 'analytics.view', description: 'Projected net order revenue for the next 7 and 30 days.', sizes: ['large', 'full'], defaultSize: 'full' },
  { id: 'quick_links', title: 'Quick access', category: 'Platform overview', perm: null, description: 'Shortcuts to clients, finance and site content.', sizes: ['small', 'third', 'medium'], defaultSize: 'third' },
];

const sized = (entries: (string | { id: string; size?: LayoutWidget['size'] })[]): LayoutWidget[] =>
  entries.map(e => { const id = typeof e === 'string' ? e : e.id; const d = ADMIN_WIDGET_DEFS.find(x => x.id === id)!; return widgetFromDef(d, typeof e === 'string' ? undefined : e.size); });

/** Never customized: the platform's key numbers, growth, revenue, then alerts and health. */
export const ADMIN_DEFAULT_WIDGETS: LayoutWidget[] = sized([
  'kpi.total_stores', 'kpi.active_stores', 'kpi.mrr', 'kpi.critical_alerts',
  'merchant_growth', { id: 'platform_revenue', size: 'third' },
  { id: 'platform_alerts', size: 'medium' }, { id: 'system_health', size: 'medium' },
  'plan_distribution', 'top_categories', { id: 'recent_activity', size: 'third' },
  'growth_forecast', 'quick_links',
]);

export const ADMIN_PRESETS: DashboardPreset[] = [
  { id: 'default', label: 'Default', description: 'Key numbers, growth and revenue, then alerts and system health.', widgets: ADMIN_DEFAULT_WIDGETS.map(w => ({ id: w.id, size: w.size })) },
  { id: 'operations', label: 'Operations', description: 'Alerts, system health and activity first.',
    widgets: ['kpi.critical_alerts', 'kpi.active_stores', 'kpi.total_stores', 'kpi.new_users', { id: 'platform_alerts', size: 'large' }, { id: 'system_health', size: 'third' }, { id: 'recent_activity', size: 'medium' }, 'quick_links'] },
  { id: 'finance', label: 'Finance', description: 'Subscription revenue, plans and churn.',
    widgets: ['kpi.mrr', 'kpi.plan_arr', 'kpi.paid_subscribers', 'kpi.churn', { id: 'platform_revenue', size: 'medium' }, { id: 'plan_distribution', size: 'medium' }, 'kpi.critical_alerts', 'kpi.gmv'] },
  { id: 'growth', label: 'Growth', description: 'Merchant growth and categories.',
    widgets: ['kpi.total_sellers', 'kpi.active_sellers', 'kpi.new_users', 'kpi.critical_alerts', { id: 'merchant_growth', size: 'full' }, { id: 'top_categories', size: 'third' }, { id: 'growth_forecast', size: 'large' }] },
];
