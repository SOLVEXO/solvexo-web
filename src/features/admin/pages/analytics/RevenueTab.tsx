import { MetricCard } from '@/components/comman/ui';
import { LineChart, DonutChart } from '@/components/comman/charts';
import { useAdminAnalyticsRevenueOverTime, useAdminAnalyticsRevenueBreakdown } from '@/hooks/admin/useAdminAnalytics';
import type { BaseAnalyticsParams } from '@/api/services/analytics/adminAnalytics';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatCurrency, formatBucketLabel } from '@/components/comman/analytics/format';

export function RevenueTab({ params }: { params: BaseAnalyticsParams }) {
  const revenue = useAdminAnalyticsRevenueOverTime(params);
  const breakdown = useAdminAnalyticsRevenueBreakdown(params);

  return (
    <div className="flex flex-col gap-4">
      {revenue.loading ? (
        <ChartCardSkeleton height={280} />
      ) : revenue.error ? (
        <AnalyticsErrorState message={revenue.error} onRetry={revenue.refetch} />
      ) : (
        <LineChart
          title="Revenue Over Time"
          subtitle="Gross vs. net order revenue, platform-wide"
          height={280}
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

      {breakdown.loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCardSkeleton height={200} />
          <ChartCardSkeleton height={200} />
        </div>
      ) : breakdown.error ? (
        <AnalyticsErrorState message={breakdown.error} onRetry={breakdown.refetch} />
      ) : breakdown.data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutChart
            title="Platform Revenue Composition"
            subtitle="Commission, subscriptions & processing fees"
            centerLabel="Platform"
            data={[
              { label: 'Platform Commission', value: breakdown.data.platformCommissionRevenue },
              { label: 'Subscription Revenue', value: breakdown.data.recurringSubscriptionRevenue },
              { label: 'Payment Processing Fees', value: breakdown.data.paymentProcessingFees },
            ]}
          />

          <div className="grid grid-cols-1 gap-3">
            <MetricCard label="One-Time Order Revenue" value={formatCurrency(breakdown.data.oneTimeOrderRevenue)} sub="Belongs to sellers, not the platform" />
            <MetricCard label="Total Platform Revenue" value={formatCurrency(breakdown.data.totalPlatformRevenue)} sub="Commission + subscriptions" />
            <MetricCard label="Total Marketplace Revenue" value={formatCurrency(breakdown.data.totalMarketplaceRevenue)} sub="Order revenue + subscriptions" />
          </div>
        </div>
      ) : null}

      {breakdown.data?.note && (
        <p className="text-[11px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">{breakdown.data.note}</p>
      )}
    </div>
  );
}
