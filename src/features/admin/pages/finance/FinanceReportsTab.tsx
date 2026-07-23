import { MetricCard, Table, type TableColumn } from '@/components/comman/ui';
import { BarChart } from '@/components/comman/charts';
import {
  useAdminRefundReport,
  useAdminSettlementReport,
  useAdminMonthlyReport,
  useAdminTaxReports,
} from '@/hooks/admin/useAdminFinance';
import type { AdminFinanceParams, RefundByStoreRow, TaxReportRow } from '@/api/services/finance/adminFinance';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton, TableCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatCurrency } from '@/components/comman/analytics/format';
import { Undo2, FileText } from 'lucide-react';

export function FinanceReportsTab({ params }: { params: AdminFinanceParams }) {
  const refunds = useAdminRefundReport(params);
  const settlement = useAdminSettlementReport(params);
  const monthly = useAdminMonthlyReport({ months: 6 });
  const taxReports = useAdminTaxReports({});

  const refundColumns: TableColumn<RefundByStoreRow>[] = [
    { key: 'storeName', header: 'Store' },
    { key: 'count', header: 'Refunds', align: 'right' },
    { key: 'totalRefunded', header: 'Total Refunded', align: 'right', render: (r) => formatCurrency(r.totalRefunded) },
  ];

  const taxColumns: TableColumn<TaxReportRow>[] = [
    { key: 'storeName', header: 'Store' },
    { key: 'period', header: 'Period', render: (r) => `${r.period.toUpperCase()} ${r.year}` },
    { key: 'totalRevenue', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.totalRevenue) },
    { key: 'netRevenue', header: 'Net', align: 'right', render: (r) => formatCurrency(r.netRevenue) },
    { key: 'estimatedTax', header: 'Est. Tax', align: 'right', render: (r) => formatCurrency(r.estimatedTax) },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Settlement */}
      {settlement.loading ? (
        <TableCardSkeleton rows={4} />
      ) : settlement.error ? (
        <AnalyticsErrorState message={settlement.error} onRetry={settlement.refetch} />
      ) : settlement.data ? (
        <div className="bg-white border border-bone rounded-[10px] px-5 py-5">
          <p className="text-[14px] font-bold text-charcoal mb-4">Settlement Report</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <MetricCard label="Gross Sales" value={formatCurrency(settlement.data.grossSales)} />
            <MetricCard label="Fees Collected" value={formatCurrency(settlement.data.platformFeesCollected)} />
            <MetricCard label="Refunds Issued" value={formatCurrency(settlement.data.refundsIssued)} />
            <MetricCard label="Payouts Disbursed" value={formatCurrency(settlement.data.payoutsDisbursed)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricCard label="Available Balance Owed" value={formatCurrency(settlement.data.outstandingObligation.availableBalance)} />
            <MetricCard label="Pending Balance Owed" value={formatCurrency(settlement.data.outstandingObligation.pendingBalance)} />
          </div>
          <p className="text-[11px] text-slate mt-3">{settlement.data.note}</p>
        </div>
      ) : null}

      {/* Monthly */}
      {monthly.loading ? (
        <ChartCardSkeleton />
      ) : monthly.error ? (
        <AnalyticsErrorState message={monthly.error} onRetry={monthly.refetch} />
      ) : (
        <BarChart
          title="Monthly GMV"
          subtitle="Last 6 months"
          data={(monthly.data?.monthly ?? []).map((m) => ({ label: m.month, gmv: m.gmv }))}
          dataKey="gmv"
          valuePrefix="$"
        />
      )}

      {/* Refunds */}
      <div className="bg-white border border-bone rounded-[10px]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[14px] font-bold text-charcoal">Refund Report</p>
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
