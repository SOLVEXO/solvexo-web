import { LineChart } from '@/components/comman/charts';
import { useAdminFinanceRevenueOverTime, useAdminFinanceCommissionOverTime } from '@/hooks/admin/useAdminFinance';
import type { AdminFinanceParams } from '@/api/services/finance/adminFinance';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatBucketLabel } from '@/components/comman/analytics/format';

export function FinanceRevenueTab({ params }: { params: AdminFinanceParams }) {
  const revenue = useAdminFinanceRevenueOverTime(params);
  const commission = useAdminFinanceCommissionOverTime(params);

  return (
    <div className="flex flex-col gap-4">
      {revenue.loading ? (
        <ChartCardSkeleton height={280} />
      ) : revenue.error ? (
        <AnalyticsErrorState message={revenue.error} onRetry={revenue.refetch} />
      ) : (
        <LineChart
          title="Platform Revenue Over Time"
          subtitle="Gross vs. net, from the finance ledger (sale/refund transactions)"
          height={280}
          data={(revenue.data?.series ?? []).map((p) => ({
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

      {commission.loading ? (
        <ChartCardSkeleton />
      ) : commission.error ? (
        <AnalyticsErrorState message={commission.error} onRetry={commission.refetch} />
      ) : (
        <LineChart
          title="Commission & Processing Fees"
          subtitle="What the platform earns per sale, over time"
          data={(commission.data?.series ?? []).map((p) => ({
            label: formatBucketLabel(p.date, commission.data!.granularity),
            commission: p.commission,
            processingFees: p.processingFees,
          }))}
          lines={[
            { dataKey: 'commission', label: 'Platform Commission', color: '#D97757' },
            { dataKey: 'processingFees', label: 'Processing Fees', color: '#2156A8' },
          ]}
          valuePrefix="$"
        />
      )}
    </div>
  );
}
