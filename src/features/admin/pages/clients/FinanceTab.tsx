import { useState } from 'react';
import { useClientFinance, useClientTransactions } from '@/hooks/admin/useAdminClients';
import { MetricCard, Table, SkeletonBox } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatCurrency, formatDate } from '@/components/comman/analytics/format';
import type { TransactionRow, PayoutRow } from '@/api/services/finance/adminFinance';
import { Wallet, Receipt } from 'lucide-react';

interface FinanceTabProps {
  sellerId: string;
}

// ── Cross-store finance rollup — a SINGLE `sellerId`-indexed query for both
// the balance summary and the transaction list (see FinanceService's own
// comment on adminGetSellerFinancialRollup/adminGetSellerTransactionsBySeller)
// — never a per-store loop, regardless of how many stores this client owns.
export function FinanceTab({ sellerId }: FinanceTabProps) {
  const { data: rollup, loading: rollupLoading, error: rollupError, refetch: refetchRollup } = useClientFinance(sellerId);
  const [page, setPage] = useState(1);
  const { data: txData, loading: txLoading, error: txError, refetch: refetchTx } = useClientTransactions(sellerId, { page, limit: 10 });

  const txColumns: TableColumn<TransactionRow>[] = [
    { key: 'createdAt', header: 'Date', render: (t) => <span className="text-[13px] text-slate whitespace-nowrap">{formatDate(t.createdAt)}</span> },
    { key: 'storeName', header: 'Store', render: (t) => <span className="text-[13px] text-graphite">{t.storeName ?? '—'}</span> },
    { key: 'type', header: 'Type', render: (t) => <span className="text-[12.5px] text-charcoal capitalize">{t.type}</span> },
    { key: 'description', header: 'Description', render: (t) => <span className="text-[12.5px] text-slate">{t.description}</span> },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => (
        <span className={`text-[13px] font-semibold ${t.amount >= 0 ? 'text-success' : 'text-error'}`}>
          {t.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
        </span>
      ),
    },
  ];

  const payoutColumns: TableColumn<PayoutRow>[] = [
    { key: 'createdAt', header: 'Date', render: (p) => <span className="text-[13px] text-slate whitespace-nowrap">{formatDate(p.createdAt)}</span> },
    { key: 'amount', header: 'Amount', render: (p) => <span className="text-[13px] font-semibold text-charcoal">{formatCurrency(p.amount)}</span> },
    { key: 'status', header: 'Status', render: (p) => <span className="text-[12.5px] text-charcoal capitalize">{p.status}</span> },
  ];

  if (rollupError) return <AnalyticsErrorState message={rollupError} onRetry={refetchRollup} />;

  if (rollupLoading && !rollup) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonBox height={92} rounded="10px" />
        <SkeletonBox height={220} rounded="10px" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(rollup?.balances ?? []).length === 0 ? (
          <MetricCard label="Available Balance" value={formatCurrency(0)} />
        ) : (
          rollup!.balances.flatMap((b) => [
            <MetricCard key={`${b.currency}-available`} label={`Available (${b.currency})`} value={formatCurrency(b.availableBalance)} icon={<Wallet size={16} />} />,
            <MetricCard key={`${b.currency}-pending`} label={`Pending (${b.currency})`} value={formatCurrency(b.pendingBalance)} />,
            <MetricCard key={`${b.currency}-revenue`} label={`Lifetime Revenue (${b.currency})`} value={formatCurrency(b.totalRevenue)} />,
            <MetricCard key={`${b.currency}-payouts`} label={`Lifetime Payouts (${b.currency})`} value={formatCurrency(b.totalPayouts)} />,
          ])
        )}
      </div>

      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <div className="px-5 py-[14px] border-b border-bone">
          <p className="text-[13px] font-semibold text-charcoal">Recent Payouts</p>
        </div>
        <Table
          columns={payoutColumns}
          data={rollup?.recentPayouts ?? []}
          keyExtractor={(p) => p._id}
          emptyState={{ icon: <Receipt size={28} className="text-slate/50" />, title: 'No payouts yet' }}
        />
      </div>

      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <div className="px-5 py-[14px] border-b border-bone">
          <p className="text-[13px] font-semibold text-charcoal">Transactions</p>
        </div>
        {txError ? (
          <div className="p-5"><AnalyticsErrorState message={txError} onRetry={refetchTx} /></div>
        ) : (
          <Table
            columns={txColumns}
            data={txData?.transactions ?? []}
            keyExtractor={(t) => t._id}
            loading={txLoading}
            emptyState={{ icon: <Receipt size={28} className="text-slate/50" />, title: 'No transactions yet' }}
            pagination={{ page, total: txData?.total ?? 0, perPage: 10, onChange: setPage, label: 'transactions' }}
          />
        )}
      </div>
    </div>
  );
}
