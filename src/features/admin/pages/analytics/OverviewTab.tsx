import type { JSX } from 'react';
import { DollarSign, ShoppingCart, Store, Users, UserPlus, RotateCcw, CreditCard, TrendingDown, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { MetricCard, Table, type TableColumn } from '@/components/comman/ui';
import { LineChart, BarChart } from '@/components/comman/charts';
import { useAdminAnalyticsOverview, useAdminAnalyticsRevenueOverTime, useAdminAnalyticsOrdersOverTime, useAdminAnalyticsPlatformAlerts } from '@/hooks/admin/useAdminAnalytics';
import type { BaseAnalyticsParams, AlertSeverity } from '@/api/services/analytics/adminAnalytics';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatCurrency, formatNumber, formatPercent, formatBucketLabel, formatDate } from '@/components/comman/analytics/format';

interface ComparisonRow { metric: string; current: string; previous: string }

// Phase 11 — Alerts & Insights. Purely presentational: severity → icon/style.
// The alerts themselves are deterministic threshold checks computed on the
// backend (see PlatformAlertsService) — this component never decides what
// counts as an alert, it only renders what the API already decided.
const ALERT_STYLE: Record<AlertSeverity, { row: string; icon: JSX.Element }> = {
  critical: { row: 'bg-red-50 border-red-200 text-red-800', icon: <AlertCircle size={16} className="text-red-600 shrink-0" /> },
  warning: { row: 'bg-amber-50 border-amber-200 text-amber-800', icon: <AlertTriangle size={16} className="text-amber-600 shrink-0" /> },
  info: { row: 'bg-blue-50 border-blue-200 text-blue-800', icon: <Info size={16} className="text-blue-600 shrink-0" /> },
};

export function OverviewTab({ params, compareToPreviousPeriod }: { params: BaseAnalyticsParams; compareToPreviousPeriod: boolean }) {
  const overview = useAdminAnalyticsOverview(params);
  const revenue = useAdminAnalyticsRevenueOverTime(params);
  const orders = useAdminAnalyticsOrdersOverTime(params);
  // Phase 11 — a separate query from overview above; alerts compose real
  // data from several other endpoints (health, payments, inventory,
  // sellers) via fixed threshold rules, never an AI-generated summary.
  const alerts = useAdminAnalyticsPlatformAlerts(params);

  if (overview.error) {
    return <AnalyticsErrorState message={overview.error} onRetry={overview.refetch} />;
  }

  const d = overview.data;
  const loading = overview.loading;

  const metrics = d && [
    { label: 'Total GMV', value: formatCurrency(d.totalGMV), icon: <DollarSign size={16} /> },
    {
      label: 'Total Revenue (net)', value: formatCurrency(d.totalRevenue), icon: <DollarSign size={16} />,
      trend: d.totalRevenueChangePercent != null ? formatPercent(d.totalRevenueChangePercent, { signed: true }) : undefined,
      trendUp: (d.totalRevenueChangePercent ?? 0) >= 0,
    },
    { label: 'Platform Earnings', value: formatCurrency(d.platformEarnings), icon: <DollarSign size={16} />, sub: `Commission ${formatCurrency(d.platformCommission)} + Subs ${formatCurrency(d.subscriptionRevenue)}` },
    {
      label: 'Total Orders', value: formatNumber(d.totalOrders), icon: <ShoppingCart size={16} />,
      trend: `${d.totalOrdersChange >= 0 ? '+' : ''}${d.totalOrdersChange} vs prev.`, trendUp: d.totalOrdersChange >= 0,
    },
    { label: 'Seller Accounts', value: formatNumber(d.totalSellers), icon: <Users size={16} /> },
    {
      label: 'Sellers Active This Month', value: formatNumber(d.sellersActiveThisMonth), icon: <Users size={16} />,
      trend: `${d.sellersActiveThisMonthChange >= 0 ? '+' : ''}${d.sellersActiveThisMonthChange} vs prev.`, trendUp: d.sellersActiveThisMonthChange >= 0,
    },
    { label: 'Total Stores', value: formatNumber(d.totalStores), icon: <Store size={16} /> },
    { label: 'Active Stores', value: formatNumber(d.activeStores), icon: <Store size={16} /> },
    { label: 'Total Customers', value: formatNumber(d.totalCustomers), icon: <Users size={16} /> },
    { label: 'New Users', value: formatNumber(d.newUsers), icon: <UserPlus size={16} /> },
    { label: 'Refunds', value: formatCurrency(d.totalRefunds), icon: <RotateCcw size={16} />, sub: `${formatPercent(d.refundRatePercent)} of GMV` },
    { label: 'Cancelled Orders', value: formatNumber(d.cancelledOrders), icon: <ShoppingCart size={16} /> },
    // Phase 1 — Solvexo's own recurring revenue from sellers on a platform
    // plan (distinct from "Platform Earnings" above, which is order
    // commission + buyer-VIP revenue). Platform-wide only — the backend
    // omits these fields entirely for a storeId/sellerId drill-down, so
    // they simply don't render rather than showing a stale/wrong figure.
    ...(d.sellerPlatformMRR != null ? [{ label: 'Seller Platform MRR', value: formatCurrency(d.sellerPlatformMRR), icon: <CreditCard size={16} />, sub: `ARR ${formatCurrency(d.sellerPlatformARR ?? 0)}` }] : []),
    ...(d.activePlatformSubscribers != null ? [{ label: 'Active Platform Subscribers', value: formatNumber(d.activePlatformSubscribers), icon: <Users size={16} /> }] : []),
    ...(d.sellerChurnRatePercent != null ? [{ label: 'Seller Churn Rate', value: formatPercent(d.sellerChurnRatePercent), icon: <TrendingDown size={16} />, sub: 'Sellers canceling their platform plan' }] : []),
  ];

  const comparisonColumns: TableColumn<ComparisonRow>[] = [
    { key: 'metric', header: 'Metric' },
    { key: 'previous', header: 'Previous Period', align: 'right' },
    { key: 'current', header: 'Current Period', align: 'right' },
  ];

  const comparisonRows: ComparisonRow[] = d?.previousPeriod ? [
    { metric: 'Total GMV', current: formatCurrency(d.totalGMV), previous: formatCurrency(d.previousPeriod.totalGMV) },
    { metric: 'Total Revenue (net)', current: formatCurrency(d.totalRevenue), previous: formatCurrency(d.previousPeriod.totalRevenue) },
    { metric: 'Total Orders', current: formatNumber(d.totalOrders), previous: formatNumber(d.previousPeriod.totalOrders) },
    { metric: 'Sellers Active This Month', current: formatNumber(d.sellersActiveThisMonth), previous: formatNumber(d.previousPeriod.sellersActiveThisMonth) },
    { metric: 'Refunds', current: formatCurrency(d.totalRefunds), previous: formatCurrency(d.previousPeriod.totalRefunds) },
    { metric: 'Cancelled Orders', current: formatNumber(d.cancelledOrders), previous: formatNumber(d.previousPeriod.cancelledOrders) },
  ] : [];

  return (
    <div className="flex flex-col gap-4">
      {!alerts.loading && alerts.data && (
        <div className="bg-white border border-bone rounded-[10px] px-5 py-4">
          <p className="text-[14px] font-bold text-charcoal mb-3">Alerts & Insights</p>
          {alerts.data.alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-[13px] text-slate">
              <CheckCircle2 size={16} className="text-green-600" />
              No alerts — every real, monitored signal is within its normal range.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.data.alerts.map(a => (
                <div key={a.id} className={`flex items-start gap-2 text-[13px] border rounded-lg px-3 py-2 ${ALERT_STYLE[a.severity].row}`}>
                  {ALERT_STYLE[a.severity].icon}
                  <div>
                    <span className="font-medium">{a.category}:</span> {a.message}
                  </div>
                </div>
              ))}
            </div>
          )}
          {alerts.data.note && (
            <p className="text-[11px] text-slate mt-3">{alerts.data.note}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {loading || !metrics
          ? Array.from({ length: 10 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)
          : metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {d?.note && (
        <p className="text-[11px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">{d.note}</p>
      )}

      {compareToPreviousPeriod && d?.previousPeriod && (
        <div className="bg-white border border-bone rounded-[10px]">
          <div className="px-5 pt-4 pb-3">
            <p className="text-[14px] font-bold text-charcoal">Period Comparison</p>
            <p className="text-[12px] text-slate">
              {formatDate(d.previousPeriod.period.from)} – {formatDate(d.previousPeriod.period.to)} vs. {formatDate(d.period.from)} – {formatDate(d.period.to)}
            </p>
          </div>
          <Table columns={comparisonColumns} data={comparisonRows} keyExtractor={r => r.metric} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {revenue.loading ? (
          <ChartCardSkeleton height={220} />
        ) : revenue.error ? (
          <AnalyticsErrorState message={revenue.error} onRetry={revenue.refetch} />
        ) : (
          <LineChart
            title="Revenue Over Time"
            subtitle="Gross vs. net, platform-wide"
            data={(revenue.data?.series ?? []).map(p => ({
              label: formatBucketLabel(p.date, revenue.data!.granularity),
              gross: p.grossRevenue,
              net: p.netRevenue,
            }))}
            lines={[
              { dataKey: 'gross', label: 'Gross Revenue', color: '#8C8A82' },
              { dataKey: 'net', label: 'Net Revenue', color: '#D97757' },
            ]}
            valuePrefix="$"
          />
        )}

        {orders.loading ? (
          <ChartCardSkeleton height={220} />
        ) : orders.error ? (
          <AnalyticsErrorState message={orders.error} onRetry={orders.refetch} />
        ) : (
          <BarChart
            title="Orders Over Time"
            subtitle="Non-cancelled orders, platform-wide"
            data={(orders.data?.series ?? []).map(p => ({
              label: formatBucketLabel(p.date, orders.data!.granularity),
              orders: p.orderCount,
            }))}
            dataKey="orders"
            color="#D97757"
          />
        )}
      </div>
    </div>
  );
}
