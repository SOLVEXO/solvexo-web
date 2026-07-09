import { DollarSign, Wallet, Clock, RotateCcw, ShoppingCart, Percent } from 'lucide-react';
import { MetricCard } from '@/components/comman/ui';
import { LineChart } from '@/components/comman/charts';
import { useAdminFinanceOverview, useAdminFinanceRevenueOverTime } from '@/hooks/admin/useAdminFinance';
import type { AdminFinanceParams, PayoutStatus } from '@/api/services/finance/adminFinance';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatCurrency, formatNumber, formatBucketLabel } from '@/components/comman/analytics/format';

const PAYOUT_STATUSES: PayoutStatus[] = ['pending', 'processing', 'completed', 'failed'];

export function FinanceOverviewTab({ params }: { params: AdminFinanceParams }) {
  const overview = useAdminFinanceOverview(params);
  const revenue = useAdminFinanceRevenueOverTime(params);

  if (overview.error) {
    return <AnalyticsErrorState message={overview.error} onRetry={overview.refetch} />;
  }

  const d = overview.data;
  const loading = overview.loading;

  const metrics = d && [
    { label: 'GMV', value: formatCurrency(d.gmv), icon: <DollarSign size={16} /> },
    { label: 'Net Revenue', value: formatCurrency(d.netRevenue), icon: <DollarSign size={16} /> },
    { label: 'Platform Earnings', value: formatCurrency(d.platformEarnings), icon: <Percent size={16} />, sub: `Commission ${formatCurrency(d.platformCommission)} + Subs ${formatCurrency(d.subscriptionRevenue)}` },
    { label: 'Refunds', value: formatCurrency(d.refunds), icon: <RotateCcw size={16} /> },
    { label: 'Available (owed)', value: formatCurrency(d.sellerBalances.totalAvailable), icon: <Wallet size={16} />, sub: `${formatNumber(d.sellerBalances.sellersWithBalance)} sellers` },
    { label: 'Pending (owed)', value: formatCurrency(d.sellerBalances.totalPending), icon: <Clock size={16} />, sub: 'In clearing window' },
    { label: 'Total Orders', value: formatNumber(d.totalOrders), icon: <ShoppingCart size={16} /> },
    { label: 'Processing Fees', value: formatCurrency(d.paymentProcessingFees), icon: <DollarSign size={16} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading || !metrics
          ? Array.from({ length: 8 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)
          : metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {d && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PAYOUT_STATUSES.map((status) => (
            <div key={status} className="bg-white border border-bone rounded-[10px] px-4 py-3">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{status} payouts</p>
              <p className="text-[20px] font-bold text-charcoal">{d.payoutQueue[status].count}</p>
              <p className="text-[12px] text-slate">{formatCurrency(d.payoutQueue[status].amount)}</p>
            </div>
          ))}
        </div>
      )}

      {d?.note && (
        <p className="text-[11px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">{d.note}</p>
      )}

      {revenue.loading ? (
        <ChartCardSkeleton />
      ) : revenue.error ? (
        <AnalyticsErrorState message={revenue.error} onRetry={revenue.refetch} />
      ) : (
        <LineChart
          title="Platform Revenue"
          subtitle="Gross vs. net, from the finance ledger"
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
    </div>
  );
}
