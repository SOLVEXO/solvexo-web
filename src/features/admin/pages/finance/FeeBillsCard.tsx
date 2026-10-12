import { useState } from 'react';
import { ExternalLink, Receipt } from 'lucide-react';
import { Badge, FilterDropdown, Table, type TableColumn } from '@/components/comman/ui';
import { useAdminTransactionFeeBills } from '@/hooks/admin/useAdminFinance';
import type { FeeBillFilter, TransactionFeeBillRow } from '@/api/services/finance/adminFinance';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate } from '@/components/comman/analytics/format';
import { formatMoneyCompact } from '@/utils/currency';

const FILTERS: { value: FeeBillFilter; label: string }[] = [
  { value: 'open', label: 'Unpaid (needs attention)' },
  { value: 'payment_failed', label: 'Payment failed' },
  { value: 'invoiced', label: 'Invoiced, awaiting payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'all', label: 'All bills' },
];

const STATUS: Record<string, { label: string; color: 'green' | 'yellow' | 'red' | 'gray' }> = {
  paid: { label: 'Paid', color: 'green' },
  invoiced: { label: 'Awaiting payment', color: 'yellow' },
  payment_failed: { label: 'Payment failed', color: 'red' },
  failed: { label: 'Invoice not created', color: 'red' },
  creating: { label: 'Creating', color: 'gray' },
};

/**
 * Monthly third-party transaction-fee bills (what sellers owe Solvexo), so the platform owner can see exactly who has not
 * paid and why, and open the Stripe invoice — not only a total.
 */
export function FeeBillsCard() {
  const [status, setStatus] = useState<FeeBillFilter>('open');
  const [page, setPage] = useState(1);
  const bills = useAdminTransactionFeeBills({ status, page, limit: 15 });

  const columns: TableColumn<TransactionFeeBillRow>[] = [
    { key: 'periodKey', header: 'Month' },
    { key: 'storeName', header: 'Store', render: (b) => (<div><p className="text-[13px] text-charcoal">{b.storeName}</p><p className="text-[11px] text-slate">{b.sellerName}{b.sellerEmail ? ` · ${b.sellerEmail}` : ''}</p></div>) },
    { key: 'amountUSD', header: 'Amount', align: 'right', render: (b) => formatMoneyCompact(b.amountUSD, 'USD') },
    { key: 'saleCount', header: 'Sales', align: 'right' },
    {
      key: 'status', header: 'Status', render: (b) => {
        const s = STATUS[b.status] ?? { label: b.status, color: 'gray' as const };
        return (
          <div>
            <Badge color={s.color}>{s.label}</Badge>
            {b.failureReason && b.status !== 'paid' && <p className="text-[11px] text-slate mt-1 max-w-[220px]">{b.failureReason}</p>}
          </div>
        );
      },
    },
    { key: 'createdAt', header: 'Billed', render: (b) => formatDate(b.createdAt) },
    {
      key: 'hostedInvoiceUrl', header: 'Invoice', render: (b) => (b.hostedInvoiceUrl
        ? <a href={b.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-brand-orange"><ExternalLink size={12} /> Open</a>
        : <span className="text-[12px] text-slate">—</span>),
    },
  ];

  return (
    <div className="bg-white border border-bone rounded-[10px]">
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <p className="text-[14px] font-bold text-charcoal">Transaction fee bills</p>
          <p className="text-[12px] text-slate">
            Third-party gateway fees invoiced to sellers each month.
            {bills.data && bills.data.outstanding.count > 0
              ? ` ${bills.data.outstanding.count} unpaid, ${formatMoneyCompact(bills.data.outstanding.amountUSD, 'USD')} outstanding.`
              : ' Nothing outstanding.'}
          </p>
        </div>
        <FilterDropdown options={FILTERS} value={status} onChange={(v) => { setStatus(v as FeeBillFilter); setPage(1); }} />
      </div>
      {bills.error ? (
        <div className="px-5 pb-5"><AnalyticsErrorState message={bills.error} onRetry={bills.refetch} /></div>
      ) : (
        <Table
          columns={columns}
          data={bills.data?.bills ?? []}
          keyExtractor={(b) => b.billId}
          loading={bills.loading}
          emptyState={{ icon: <Receipt size={28} className="text-slate/50" />, title: 'No bills here', description: 'Monthly fee bills appear after the first billing run (1st of each month).' }}
          pagination={{ page, total: bills.data?.pagination.total ?? 0, perPage: 15, onChange: setPage, label: 'bills' }}
        />
      )}
    </div>
  );
}
