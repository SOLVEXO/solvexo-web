import { LineChart } from '@/components/comman/charts';
import { useAdminFinancePlatformRevenue } from '@/hooks/admin/useAdminFinance';
import { MetricCard } from '@/components/comman/ui';
import { formatMoneyCompact } from '@/utils/currency';
import { useAdminAnalyticsRevenueOverTime } from '@/hooks/admin/useAdminAnalytics';
import type { AdminFinanceParams } from '@/api/services/finance/adminFinance';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatBucketLabel } from '@/components/comman/analytics/format';
import { currencySymbol } from '@/utils/currency';
import { FeeBillsCard } from './FeeBillsCard';

export function FinanceRevenueTab({ params }: { params: AdminFinanceParams }) {
  // Order-based (same numbers as Admin Analytics and the Overview GMV), not the ledger — one definition of sales everywhere.
  const revenue = useAdminAnalyticsRevenueOverTime(params);
  const platform = useAdminFinancePlatformRevenue(params);

  // Single USD series per chart — the API converts non-USD (PKR) stores at the
  // latest FX rate, so the platform owner reads one consistent currency.
  return (
    <div className="flex flex-col gap-4">
      {revenue.loading ? (
        <ChartCardSkeleton height={280} />
      ) : revenue.error ? (
        <AnalyticsErrorState message={revenue.error} onRetry={revenue.refetch} />
      ) : (
        <LineChart
          title="Marketplace Sales Over Time (USD)"
          subtitle="Item sales of non-cancelled store orders, before and after refunds — same numbers as Admin Analytics and the Overview GMV. Platform revenue (plans, add-ons, fees) is on the Overview card."
          height={280}
          data={(revenue.data?.series ?? []).map((p) => ({
            label: formatBucketLabel(p.date, revenue.data!.granularity),
            gross: p.grossRevenue ?? 0,
            net: p.netRevenue ?? 0,
          }))}
          lines={[
            { dataKey: 'gross', label: 'Gross Revenue', color: '#8C8A82' },
            { dataKey: 'net', label: 'Net Revenue', color: '#D97757' },
          ]}
          valuePrefix={currencySymbol('USD')}
        />
      )}

      {/* What sellers pay Solvexo (Option A): plans + add-ons + collected third-party transaction fees — not a sale commission. */}
      {platform.loading ? (
        <ChartCardSkeleton height={120} />
      ) : platform.error ? (
        <AnalyticsErrorState message={platform.error} onRetry={platform.refetch} />
      ) : platform.data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Seller plans (net)" value={formatMoneyCompact(platform.data.planRevenue.netUSD, 'USD')} sub={`${platform.data.planRevenue.invoiceCount} paid invoices`} />
          <MetricCard label="Add-ons" value={formatMoneyCompact(platform.data.addons.grossUSD, 'USD')} sub={`${platform.data.addons.chargeCount} charges`} />
          <MetricCard label="Transaction fees collected" value={formatMoneyCompact(platform.data.transactionFees.collectedUSD, 'USD')} sub={`${formatMoneyCompact(platform.data.transactionFees.invoicedUnpaidUSD, 'USD')} invoiced, unpaid`} />
          <MetricCard label="Total platform revenue" value={formatMoneyCompact(platform.data.totalRevenueUSD, 'USD')} sub="Plans + add-ons + collected fees" />
        </div>
      ) : null}

      <FeeBillsCard />
    </div>
  );
}
