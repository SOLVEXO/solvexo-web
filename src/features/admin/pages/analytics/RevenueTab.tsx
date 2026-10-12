import { MetricCard, Table, type TableColumn } from '@/components/comman/ui';
import { LineChart, DonutChart } from '@/components/comman/charts';
import { useAdminAnalyticsRevenueOverTime, useAdminAnalyticsRevenueBreakdown } from '@/hooks/admin/useAdminAnalytics';
import type { BaseAnalyticsParams } from '@/api/services/analytics/adminAnalytics';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatCurrency, formatBucketLabel, formatDate } from '@/components/comman/analytics/format';

interface ComparisonRow { metric: string; current: string; previous: string }

export function RevenueTab({ params, compareToPreviousPeriod }: { params: BaseAnalyticsParams; compareToPreviousPeriod: boolean }) {
  const revenue = useAdminAnalyticsRevenueOverTime(params);
  const breakdown = useAdminAnalyticsRevenueBreakdown(params);

  const comparisonColumns: TableColumn<ComparisonRow>[] = [
    { key: 'metric', header: 'Metric' },
    { key: 'previous', header: 'Previous Period', align: 'right' },
    { key: 'current', header: 'Current Period', align: 'right' },
  ];

  const b = breakdown.data;
  const comparisonRows: ComparisonRow[] = b?.previousPeriod ? [
    { metric: 'One-Time Order Revenue', current: formatCurrency(b.oneTimeOrderRevenue), previous: formatCurrency(b.previousPeriod.oneTimeOrderRevenue) },
    { metric: 'Custom Commission', current: formatCurrency(b.platformCommissionRevenue), previous: formatCurrency(b.previousPeriod.platformCommissionRevenue) },
    { metric: 'Payment Processing Fees', current: formatCurrency(b.paymentProcessingFees), previous: formatCurrency(b.previousPeriod.paymentProcessingFees) },
    { metric: 'Platform Revenue (plans + add-ons + fees)', current: formatCurrency(b.totalPlatformRevenue), previous: formatCurrency(b.previousPeriod.totalPlatformRevenue) },
    { metric: 'Total Marketplace Revenue', current: formatCurrency(b.totalMarketplaceRevenue), previous: formatCurrency(b.previousPeriod.totalMarketplaceRevenue) },
  ] : [];

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
            subtitle="Seller plans, add-ons, transaction fees & custom commission"
            centerLabel="Platform"
            data={[
              { label: 'Seller Plans', value: breakdown.data.planRevenue ?? 0 },
              { label: 'Add-ons', value: breakdown.data.addonRevenue ?? 0 },
              { label: 'Transaction Fees', value: breakdown.data.transactionFeeRevenue ?? 0 },
              { label: 'Custom Commission', value: breakdown.data.platformCommissionRevenue },
            ]}
          />

          <div className="grid grid-cols-1 gap-3">
            <MetricCard label="One-Time Order Revenue" value={formatCurrency(breakdown.data.oneTimeOrderRevenue)} sub="Belongs to sellers, not the platform" />
            <MetricCard label="Platform Revenue" value={formatCurrency(breakdown.data.totalPlatformRevenue)} sub="Seller plans + add-ons + collected transaction fees (same as Finance)" />
            <MetricCard label="Custom Commission" value={formatCurrency(breakdown.data.platformCommissionRevenue)} sub="Only sellers with an admin-agreed rate" />
            <MetricCard label="Marketplace Order Revenue" value={formatCurrency(breakdown.data.totalMarketplaceRevenue)} sub="Net order revenue across all stores (minus refunds)" />
          </div>
        </div>
      ) : null}

      {breakdown.data?.note && (
        <p className="text-[11px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">{breakdown.data.note}</p>
      )}

      {/* Commission is converted to USD server-side; only currencies with no FX rate are listed (never a native amount). */}
      {breakdown.data?.unconvertedCommissionCurrencies && breakdown.data.unconvertedCommissionCurrencies.length > 0 && (
        <p className="text-[11px] text-red-600">
          No FX rate set for {breakdown.data.unconvertedCommissionCurrencies.join(', ')} — commission from those sellers is excluded from the USD totals above.
        </p>
      )}

      {compareToPreviousPeriod && b?.previousPeriod && (
        <div className="bg-white border border-bone rounded-[10px]">
          <div className="px-5 pt-4 pb-3">
            <p className="text-[14px] font-bold text-charcoal">Period Comparison</p>
            <p className="text-[12px] text-slate">
              {formatDate(b.previousPeriod.period.from)} – {formatDate(b.previousPeriod.period.to)} vs. {formatDate(b.period.from)} – {formatDate(b.period.to)}
            </p>
          </div>
          <Table columns={comparisonColumns} data={comparisonRows} keyExtractor={r => r.metric} />
        </div>
      )}
    </div>
  );
}
