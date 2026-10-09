import { DollarSign, Wallet, Clock, RotateCcw, ShoppingCart, Percent } from 'lucide-react';
import { MetricCard } from '@/components/comman/ui';
import { LineChart } from '@/components/comman/charts';
import { useAdminFinanceOverview, useAdminFinanceRevenueOverTime, useAdminFinancePlatformRevenue } from '@/hooks/admin/useAdminFinance';
import type { AdminFinanceParams, PayoutStatus } from '@/api/services/finance/adminFinance';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatNumber, formatBucketLabel } from '@/components/comman/analytics/format';
import { formatMoneyCompact, currencySymbol } from '@/utils/currency';

const PAYOUT_STATUSES: PayoutStatus[] = ['pending', 'processing', 'completed', 'failed'];

/** Solvexo's own revenue = what sellers pay it (plans + third-party transaction fees), USD only. */
function PlatformRevenueSection({ params }: { params: AdminFinanceParams }) {
  const rev = useAdminFinancePlatformRevenue(params);
  const d = rev.data;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-semibold text-slate uppercase tracking-[0.06em]">Solvexo revenue — paid by sellers (USD)</p>
      {rev.error ? (
        <AnalyticsErrorState message={rev.error} onRetry={rev.refetch} />
      ) : rev.loading || !d ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <MetricCard label="Total revenue" value={formatMoneyCompact(d.totalRevenueUSD, 'USD')} icon={<DollarSign size={18} />} sub="Plans + add-ons + collected transaction fees" />
            <MetricCard label="Plans & subscriptions" value={formatMoneyCompact(d.planRevenue.netUSD, 'USD')} icon={<Wallet size={16} />} sub={`${formatNumber(d.planRevenue.invoiceCount)} paid invoice(s), net of ${formatMoneyCompact(d.planRevenue.refundedUSD, 'USD')} refunds`} />
            <MetricCard label="Add-ons" value={formatMoneyCompact(d.addons?.grossUSD ?? 0, 'USD')} icon={<ShoppingCart size={16} />} sub={`${formatNumber(d.addons?.chargeCount ?? 0)} charge(s)`} />
            <MetricCard label="Transaction fees collected" value={formatMoneyCompact(d.transactionFees.collectedUSD, 'USD')} icon={<Percent size={16} />} sub={`${formatNumber(d.transactionFees.billCount)} paid monthly bill(s)`} />
            <MetricCard label="Fees not yet collected" value={formatMoneyCompact(d.transactionFees.invoicedUnpaidUSD + d.transactionFees.accruedUnbilledUSD, 'USD')} icon={<Clock size={16} />} sub={`Invoiced ${formatMoneyCompact(d.transactionFees.invoicedUnpaidUSD, 'USD')} · accrued ${formatMoneyCompact(d.transactionFees.accruedUnbilledUSD, 'USD')}`} />
          </div>
          {d.transactionFees.unconvertibleCurrencies && d.transactionFees.unconvertibleCurrencies.length > 0 && (
            <p className="text-[11px] text-red-600">
              No FX rate set for {d.transactionFees.unconvertibleCurrencies.join(', ')} — their accrued fees are excluded from the figure above. Set a rate in FX Settings.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function FinanceOverviewTab({ params }: { params: AdminFinanceParams }) {
  const overview = useAdminFinanceOverview(params);
  const revenue = useAdminFinanceRevenueOverTime(params);

  const d = overview.data;
  const loading = overview.loading;

  return (
    <div className="flex flex-col gap-4">
      <PlatformRevenueSection params={params} />

      {/* Each section fails independently — an overview-metrics error no
          longer blanks the whole tab, including the separately-fetched
          revenue chart below. */}
      {overview.error ? (
        <AnalyticsErrorState message={overview.error} onRetry={overview.refetch} />
      ) : loading || !d || !d.consolidatedUSD ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)}
        </div>
      ) : (
        <>
          {/* Platform owner sees USD only (Stripe). Non-USD store figures are
              converted at the latest FX rate by the API. */}
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-slate uppercase tracking-[0.06em]">Platform total (USD)</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetricCard label="GMV" value={formatMoneyCompact(d.consolidatedUSD.gmv, 'USD')} icon={<DollarSign size={18} />} sub={d.consolidatedUSD.pkrShare.gmv > 0 ? `incl. ${formatMoneyCompact(d.consolidatedUSD.pkrShare.gmv, 'USD')} from local-currency stores` : undefined} />
              <MetricCard label="Platform Earnings" value={formatMoneyCompact(d.consolidatedUSD.platformEarnings, 'USD')} icon={<Percent size={18} />} sub={`Commission ${formatMoneyCompact(d.consolidatedUSD.platformCommission, 'USD')}`} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard label="Net Revenue" value={formatMoneyCompact(d.consolidatedUSD.netRevenue, 'USD')} icon={<DollarSign size={16} />} />
              <MetricCard label="Refunds" value={formatMoneyCompact(d.consolidatedUSD.refunds, 'USD')} icon={<RotateCcw size={16} />} />
              <MetricCard label="Available (owed)" value={formatMoneyCompact(d.consolidatedUSD.sellerBalances.totalAvailable, 'USD')} icon={<Wallet size={16} />} />
              <MetricCard label="Pending (owed)" value={formatMoneyCompact(d.consolidatedUSD.sellerBalances.totalPending, 'USD')} icon={<Clock size={16} />} sub="In clearing window" />
              <MetricCard label="Total Orders" value={formatNumber(d.consolidatedUSD.totalOrders)} icon={<ShoppingCart size={16} />} />
              <MetricCard label="Processing Fees" value={formatMoneyCompact(d.consolidatedUSD.paymentProcessingFees, 'USD')} icon={<DollarSign size={16} />} />
            </div>

            {d.unconvertibleCurrencies.length > 0 && (
              <p className="text-[11px] text-red-600">
                No FX rate set for {d.unconvertibleCurrencies.join(', ')} — those sales are excluded from the USD total. Set a rate in FX Settings.
              </p>
            )}
          </div>
        </>
      )}

      {d && (
        <p className="text-[11px] text-slate">{formatNumber(d.sellersWithBalance)} sellers with a balance on file.</p>
      )}

      {d && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PAYOUT_STATUSES.map((status) => (
            <div key={status} className="bg-white border border-bone rounded-[10px] px-4 py-3">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{status} payouts</p>
              <p className="text-[20px] font-bold text-charcoal">{d.payoutQueue[status].count}</p>
              <p className="text-[12px] text-slate">{formatMoneyCompact(d.payoutQueue[status].amount, 'USD')}</p>
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
        // One USD chart — non-USD stores are converted at the latest FX rate
        // by the API, so the platform owner reads a single consistent series.
        <LineChart
          title="Platform Revenue (USD)"
          subtitle="Gross vs. net, from the finance ledger (non-USD stores converted at latest rate)"
          data={(revenue.data?.series ?? []).map((p) => ({
            label: formatBucketLabel(p.date, revenue.data!.granularity),
            gross: p.usd?.grossRevenue ?? 0,
            net: p.usd?.netRevenue ?? 0,
          }))}
          lines={[
            { dataKey: 'gross', label: 'Gross Revenue', color: '#8C8A82' },
            { dataKey: 'net', label: 'Net Revenue', color: '#D97757' },
          ]}
          valuePrefix={currencySymbol('USD')}
        />
      )}
    </div>
  );
}
