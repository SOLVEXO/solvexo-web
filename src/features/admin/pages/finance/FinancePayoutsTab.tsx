import { useState } from 'react';
import { FilterDropdown, Table, Button, Input, Modal, type TableColumn } from '@/components/comman/ui';
import { RefreshCw, Wallet } from 'lucide-react';
import { useAdminPayoutQueue, useAdminPayoutActions, useAdminProcessClearing } from '@/hooks/admin/useAdminFinance';
import type { PayoutRow } from '@/api/services/finance/adminFinance';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate } from '@/components/comman/analytics/format';
import { formatMoneyCompact } from '@/utils/currency';
import { FinanceStatusBadge } from '../../components/finance/FinanceStatusBadge';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'reversed', label: 'Reversed' },
];

export function FinancePayoutsTab() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const queue = useAdminPayoutQueue({ status: (status || undefined) as never, page, limit: 15 });
  const { approvePayout, rejectPayout, retryPayout, reversePayout, processingId, error } = useAdminPayoutActions();
  const clearing = useAdminProcessClearing();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState('');

  const handleApprove = async (id: string) => {
    if (await approvePayout(id)) queue.refetch();
  };
  const handleRetry = async (id: string) => {
    if (await retryPayout(id)) queue.refetch();
  };
  const confirmReject = async () => {
    if (!rejectingId || !reason) return;
    if (await rejectPayout(rejectingId, reason)) {
      setRejectingId(null);
      setReason('');
      queue.refetch();
    }
  };
  const confirmReverse = async () => {
    if (!reversingId || !reverseReason) return;
    if (await reversePayout(reversingId, reverseReason)) {
      setReversingId(null);
      setReverseReason('');
      queue.refetch();
    }
  };
  const handleTriggerClearing = async () => {
    await clearing.triggerClearing();
    queue.refetch();
  };

  const columns: TableColumn<PayoutRow>[] = [
    { key: 'storeName', header: 'Store', render: (p) => p.storeName ?? p.storeId },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => formatMoneyCompact(p.amount, p.currency) },
    { key: 'method', header: 'Method', render: (p) => p.payoutMethodSnapshot?.bankName || p.payoutMethodSnapshot?.type || '—' },
    {
      key: 'rail', header: 'Rail',
      render: (p) => p.railType === 'stripe_connect'
        ? <span className="text-[11px] font-medium text-success">Automatic (Stripe)</span>
        : <span className="text-[11px] text-slate">Manual</span>,
    },
    { key: 'status', header: 'Status', render: (p) => <FinanceStatusBadge status={p.status} /> },
    { key: 'createdAt', header: 'Requested', render: (p) => formatDate(p.createdAt) },
    { key: 'actions', header: '', align: 'right', render: (p) => (
      <div className="flex items-center justify-end gap-2">
        {/* Manual-rail payouts still need a human to actually send the money and confirm it here — this is the one honest exception to "no manual approval required" (see Payout.railType). */}
        {p.railType === 'manual' && (p.status === 'pending' || p.status === 'processing') && (
          <>
            <Button size="xs" variant="outline" onClick={() => handleApprove(p._id)} loading={processingId === p._id}>Approve</Button>
            <Button size="xs" variant="danger" onClick={() => setRejectingId(p._id)}>Reject</Button>
          </>
        )}
        {p.railType === 'manual' && p.status === 'failed' && (
          <Button size="xs" variant="outline" onClick={() => handleRetry(p._id)} loading={processingId === p._id}>Retry</Button>
        )}
        {/* Stripe Connect rail resolves itself (completed/failed) with no admin step — a failed one can still be retried (re-runs the real Transfer call), and a completed one can be reversed (fraud/dispute). */}
        {p.railType === 'stripe_connect' && p.status === 'failed' && (
          <Button size="xs" variant="outline" onClick={() => handleRetry(p._id)} loading={processingId === p._id}>Retry</Button>
        )}
        {p.railType === 'stripe_connect' && p.status === 'completed' && (
          <Button size="xs" variant="danger" onClick={() => setReversingId(p._id)}>Reverse</Button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FilterDropdown options={STATUS_OPTIONS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        <div className="flex-1" />
        <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={handleTriggerClearing} loading={clearing.processing}>
          Process Clearing Balances
        </Button>
      </div>

      {clearing.result && (
        <p className="text-[12px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">
          Cleared {clearing.result.processed} transaction(s), {clearing.result.byCurrency.length === 0
            ? 'nothing'
            : clearing.result.byCurrency.map((c) => formatMoneyCompact(c.amount, c.currency)).join(' + ')} moved to available balance.
        </p>
      )}
      {(error || clearing.error) && <p className="text-[12px] text-error">{error || clearing.error}</p>}

      {queue.error ? (
        <AnalyticsErrorState message={queue.error} onRetry={queue.refetch} />
      ) : (
        <Table
          columns={columns}
          data={queue.data?.payouts ?? []}
          keyExtractor={(p) => p._id}
          loading={queue.loading}
          emptyState={{
            icon: <Wallet size={28} className="text-slate/50" />,
            title: 'No payouts yet',
            description: 'Payout requests from sellers will appear here.',
          }}
          pagination={{ page, total: queue.data?.total ?? 0, perPage: 15, onChange: setPage, label: 'payouts' }}
        />
      )}

      {rejectingId && (
        <Modal mobileSheet
          title="Reject Payout"
          onClose={() => { setRejectingId(null); setReason(''); }}
          footer={
            <>
              <Button variant="ghost" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</Button>
              <Button variant="danger" onClick={confirmReject} disabled={!reason} loading={processingId === rejectingId}>Reject Payout</Button>
            </>
          }
        >
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this payout being rejected?" />
        </Modal>
      )}

      {reversingId && (
        <Modal mobileSheet
          title="Reverse Payout"
          onClose={() => { setReversingId(null); setReverseReason(''); }}
          footer={
            <>
              <Button variant="ghost" onClick={() => { setReversingId(null); setReverseReason(''); }}>Cancel</Button>
              <Button variant="danger" onClick={confirmReverse} disabled={!reverseReason} loading={processingId === reversingId}>Reverse Payout</Button>
            </>
          }
        >
          <p className="text-[12px] text-slate mb-3">
            This claws the money back from the seller's connected Stripe account via a real reversal — use this only for a confirmed fraud/dispute case. It fails if the seller's account no longer has enough balance to reverse against.
          </p>
          <Input label="Reason" value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} placeholder="Why is this payout being reversed?" />
        </Modal>
      )}
    </div>
  );
}
