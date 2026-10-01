import { MetricCard, Table, type TableColumn, StatusBadge } from '@/components/comman/ui';
import { BarChart } from '@/components/comman/charts';
import {
  useAdminRefundReport,
  useAdminSettlementReport,
  useAdminMonthlyReport,
  useAdminTaxReports,
  useAdminReconciliationHistory,
  useAdminFxExposure,
} from '@/hooks/admin/useAdminFinance';
import type { AdminFinanceParams, RefundByStoreRow, TaxReportRow, ReconciliationRunRow } from '@/api/services/finance/adminFinance';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton, TableCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatMoneyCompact, currencySymbol } from '@/utils/currency';
import { Undo2, FileText, ShieldAlert } from 'lucide-react';
import { UsdAmount } from '../../components/finance/UsdAmount';

export function FinanceReportsTab({ params }: { params: AdminFinanceParams }) {
  const refunds = useAdminRefundReport(params);
  const settlement = useAdminSettlementReport(params);
  const monthly = useAdminMonthlyReport({ months: 6 });
  const taxReports = useAdminTaxReports({});
  const reconciliation = useAdminReconciliationHistory(14);
  const exposure = useAdminFxExposure();

  const reconciliationColumns: TableColumn<ReconciliationRunRow>[] = [
    { key: 'runAt', header: 'Run', render: (r) => new Date(r.runAt).toLocaleString() },
    {
      key: 'hasAnyDiscrepancy', header: 'Status', render: (r) => (
        <StatusBadge status={r.hasAnyDiscrepancy ? 'Flagged' : 'Active'} />
      ),
    },
    {
      key: 'results', header: 'Drift', render: (r) => (
        <span className="text-[12px]">
          {formatMoneyCompact(r.totalDriftUSD ?? 0, 'USD')}
        </span>
      ),
    },
  ];

  const refundColumns: TableColumn<RefundByStoreRow>[] = [
    { key: 'storeName', header: 'Store' },
    { key: 'count', header: 'Refunds', align: 'right' },
    { key: 'totalRefunded', header: 'Total Refunded', align: 'right', render: (r) => <UsdAmount usd={r.totalRefundedUSD} native={r.totalRefunded} currency={r.currency} /> },
  ];

  const taxColumns: TableColumn<TaxReportRow>[] = [
    { key: 'storeName', header: 'Store' },
    { key: 'period', header: 'Period', render: (r) => `${r.period.toUpperCase()} ${r.year}` },
    // Per-store tax report stays in the store's own currency (it's a statement for that store's tax filing).
    { key: 'totalRevenue', header: 'Revenue', align: 'right', render: (r) => formatMoneyCompact(r.totalRevenue, r.currency ?? 'USD') },
    { key: 'netRevenue', header: 'Net', align: 'right', render: (r) => formatMoneyCompact(r.netRevenue, r.currency ?? 'USD') },
    { key: 'estimatedTax', header: 'Est. Tax', align: 'right', render: (r) => formatMoneyCompact(r.estimatedTax, r.currency ?? 'USD') },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Settlement — one block per settlement currency, never blended */}
      {settlement.loading ? (
        <TableCardSkeleton rows={4} />
      ) : settlement.error ? (
        <AnalyticsErrorState message={settlement.error} onRetry={settlement.refetch} />
      ) : settlement.data ? (
        <div className="bg-white border border-bone rounded-[10px] px-5 py-5 flex flex-col gap-4">
          <p className="text-[14px] font-bold text-charcoal">Settlement Report (USD)</p>
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <MetricCard label="Gross Sales" value={formatMoneyCompact(settlement.data.consolidatedUSD.grossSales, 'USD')} />
              <MetricCard label="Fees Collected" value={formatMoneyCompact(settlement.data.consolidatedUSD.platformFeesCollected, 'USD')} />
              <MetricCard label="Refunds Issued" value={formatMoneyCompact(settlement.data.consolidatedUSD.refundsIssued, 'USD')} />
              <MetricCard label="Payouts Disbursed" value={formatMoneyCompact(settlement.data.consolidatedUSD.payoutsDisbursed, 'USD')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetricCard label="Available Balance Owed" value={formatMoneyCompact(settlement.data.consolidatedUSD.availableBalance, 'USD')} />
              <MetricCard label="Pending Balance Owed" value={formatMoneyCompact(settlement.data.consolidatedUSD.pendingBalance, 'USD')} />
            </div>
          </div>
          {settlement.data.unconvertibleCurrencies.length > 0 && (
            <p className="text-[11px] text-red-600">No FX rate set for {settlement.data.unconvertibleCurrencies.join(', ')} — excluded from the USD totals.</p>
          )}
          <p className="text-[11px] text-slate">{settlement.data.note}</p>
        </div>
      ) : null}

      {/* Monthly — one bar chart per settlement currency, never blended */}
      {monthly.loading ? (
        <ChartCardSkeleton />
      ) : monthly.error ? (
        <AnalyticsErrorState message={monthly.error} onRetry={monthly.refetch} />
      ) : (
        <BarChart
          title="Monthly GMV (USD)"
          subtitle="Last 6 months (non-USD stores converted at latest rate)"
          data={(monthly.data?.monthly ?? []).map((m) => ({
            label: m.month,
            gmv: m.usd?.gmv ?? 0,
          }))}
          dataKey="gmv"
          valuePrefix={currencySymbol('USD')}
        />
      )}

      {/* FX Exposure — platform's open non-settlement-currency position */}
      {exposure.loading ? (
        <TableCardSkeleton rows={2} />
      ) : exposure.error ? (
        <AnalyticsErrorState message={exposure.error} onRetry={exposure.refetch} />
      ) : exposure.data ? (
        <div className="bg-white border border-bone rounded-[10px] px-5 py-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-bold text-charcoal">FX Exposure</p>
            <StatusBadge status={exposure.data.breached ? 'Flagged' : 'Active'} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <MetricCard label="Pending settlement (USD)" value={formatMoneyCompact(exposure.data.totalUSDEquivalent, 'USD')} sub={`Threshold ${formatMoneyCompact(exposure.data.threshold, 'USD')}`} />
          </div>
          <p className="text-[11px] text-slate">Pending-settlement balances converted to USD at today's rate — a daily check alerts admins if this crosses the configured threshold. Visibility only, no automatic hedging.</p>
        </div>
      ) : null}

      {/* Reconciliation — daily buyer-collected vs. ledger comparison */}
      <div className="bg-white border border-bone rounded-[10px]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[14px] font-bold text-charcoal">Reconciliation Runs</p>
          <p className="text-[12px] text-slate">Daily comparison of buyer collections against the finance ledger, per currency.</p>
        </div>
        {reconciliation.error ? (
          <div className="px-5 pb-5"><AnalyticsErrorState message={reconciliation.error} onRetry={reconciliation.refetch} /></div>
        ) : (
          <Table
            columns={reconciliationColumns}
            data={reconciliation.data ?? []}
            keyExtractor={(r) => r._id}
            loading={reconciliation.loading}
            emptyState={{ icon: <ShieldAlert size={28} className="text-slate/50" />, title: 'No reconciliation runs yet', description: 'The daily reconciliation job hasn’t run yet — check back tomorrow.' }}
          />
        )}
      </div>

      {/* Refunds */}
      <div className="bg-white border border-bone rounded-[10px]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[14px] font-bold text-charcoal">Refund Report</p>
          {refunds.data && (
            <p className="text-[13px] text-charcoal mt-1">
              Total refunded: <span className="font-semibold">{formatMoneyCompact(refunds.data.totalRefundedUSD, 'USD')}</span> across {refunds.data.totalRefundCount} refund(s)
            </p>
          )}
          {refunds.data?.note && <p className="text-[12px] text-slate">{refunds.data.note}</p>}
        </div>
        {refunds.error ? (
          <div className="px-5 pb-5"><AnalyticsErrorState message={refunds.error} onRetry={refunds.refetch} /></div>
        ) : (
          <Table
            columns={refundColumns}
            data={refunds.data?.byStore ?? []}
            keyExtractor={(r) => r.storeId}
            loading={refunds.loading}
            emptyState={{ icon: <Undo2 size={28} className="text-slate/50" />, title: 'No refunds', description: 'No refund activity for this period.' }}
          />
        )}
      </div>

      {/* Tax reports */}
      <div className="bg-white border border-bone rounded-[10px]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[14px] font-bold text-charcoal">Tax Reports</p>
          <p className="text-[12px] text-slate">Generated per-store by sellers (Finance → Tax Reports).</p>
        </div>
        {taxReports.error ? (
          <div className="px-5 pb-5"><AnalyticsErrorState message={taxReports.error} onRetry={taxReports.refetch} /></div>
        ) : (
          <Table
            columns={taxColumns}
            data={taxReports.data ?? []}
            keyExtractor={(r) => r._id}
            loading={taxReports.loading}
            emptyState={{ icon: <FileText size={28} className="text-slate/50" />, title: 'No tax reports', description: 'Sellers haven\u2019t generated any tax reports yet.' }}
          />
        )}
      </div>
    </div>
  );
}
