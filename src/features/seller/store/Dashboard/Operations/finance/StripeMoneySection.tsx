import { useCallback, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { RefreshCw, Landmark } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { Badge } from '@/components/comman/ui/Badge';
import { SkeletonBox, Table, type TableColumn } from '@/components/comman/ui';
import type { BadgeColor } from '@/types';
import {
  apiGetStripePayouts, apiGetStripePayoutDetail, apiGetStripeBalanceTransactions,
  type StripePayoutOverview, type StripePayoutDetail, type StripeBalanceTransaction,
} from '@/api/services/stripeConnect';

const money = (amount: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—');

const PAYOUT_STATUS: Record<string, { color: BadgeColor; label: string }> = {
  paid: { color: 'green', label: 'Paid' },
  pending: { color: 'yellow', label: 'Scheduled' },
  in_transit: { color: 'blue', label: 'In transit' },
  failed: { color: 'red', label: 'Failed' },
  canceled: { color: 'gray', label: 'Canceled' },
};

// Stripe's balance-transaction types, named the way a merchant reads them (Shopify: "Charge", "Refund", "Payout"...).
const TXN_TYPE: Record<string, string> = {
  charge: 'Sale', payment: 'Sale', refund: 'Refund', payment_refund: 'Refund', adjustment: 'Adjustment',
  payout: 'Payout', payout_cancel: 'Payout canceled', payout_failure: 'Payout failed', stripe_fee: 'Stripe fee',
  application_fee: 'Platform fee', application_fee_refund: 'Platform fee refund', dispute: 'Dispute', dispute_reversal: 'Dispute reversal',
  transfer: 'Transfer', transfer_reversal: 'Transfer reversal',
};
const txnLabel = (type: string) => TXN_TYPE[type] ?? type.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

const signed = (n: number, cur: string) => `${n >= 0 ? '+' : '-'}${money(Math.abs(n), cur)}`;

function txnColumns(): TableColumn<StripeBalanceTransaction>[] {
  return [
    { key: 'created', header: 'Date', render: t => <span className="text-slate whitespace-nowrap">{day(t.created)}</span> },
    { key: 'description', header: 'Description', render: t => <span className="text-graphite">{t.description || txnLabel(t.type)}</span> },
    { key: 'type', header: 'Type', render: t => <Badge color={t.amount < 0 ? 'gray' : 'green'}>{txnLabel(t.type)}</Badge> },
    { key: 'amount', header: 'Amount', render: t => <span className={clsx('font-semibold whitespace-nowrap', t.amount >= 0 ? 'text-success' : 'text-error')}>{signed(t.amount, t.currency)}</span> },
    { key: 'fee', header: 'Fees', render: t => <span className="text-slate whitespace-nowrap">{t.fee ? money(t.fee, t.currency) : '—'}</span> },
    { key: 'net', header: 'Net', render: t => <span className="font-medium text-carbon whitespace-nowrap">{signed(t.net, t.currency)}</span> },
  ];
}

// ── Payout detail: the payout and the transactions it paid out ────────────────
function StripePayoutDetailModal({ storeId, payoutId, onClose }: { storeId: string; payoutId: string; onClose: () => void }) {
  const [data, setData] = useState<StripePayoutDetail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    apiGetStripePayoutDetail(storeId, payoutId)
      .then(res => setData(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load this payout.'));
  }, [storeId, payoutId, attempt]);

  return (
    <Modal title="Payout details" width={760} onClose={onClose}>
      {error ? (
        <div className="flex flex-col items-center gap-3 text-center py-4">
          <p className="text-[12px] text-error" role="alert">{error}</p>
          <Button size="sm" variant="outline" onClick={() => { setError(''); setAttempt(a => a + 1); }}>Try Again</Button>
        </div>
      ) : !data ? (
        <SkeletonBox height={200} rounded="8px" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[12.5px]">
            <div><p className="text-slate text-[11px]">Amount</p><p className="font-semibold text-carbon">{money(data.payout.amount, data.payout.currency)}</p></div>
            <div><p className="text-slate text-[11px]">Status</p><Badge color={(PAYOUT_STATUS[data.payout.status] ?? PAYOUT_STATUS.pending).color}>{(PAYOUT_STATUS[data.payout.status] ?? { label: data.payout.status }).label}</Badge></div>
            <div><p className="text-slate text-[11px]">Initiated</p><p className="font-semibold text-carbon">{day(data.payout.created)}</p></div>
            <div><p className="text-slate text-[11px]">{data.payout.status === 'paid' ? 'Arrived' : 'Expected'}</p><p className="font-semibold text-carbon">{day(data.payout.arrivalDate)}</p></div>
            <div><p className="text-slate text-[11px]">Method</p><p className="font-semibold text-carbon capitalize">{data.payout.method}</p></div>
            <div><p className="text-slate text-[11px]">Reference</p><p className="font-semibold text-carbon">{data.payout.id}</p></div>
          </div>
          {data.payout.failureMessage && <p className="text-[12px] text-error" role="alert">{data.payout.failureMessage}</p>}
          {data.totals.length > 0 && (
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-[12px] bg-ivory rounded-md px-3 py-2">
              {data.totals.map(t => (
                <span key={t.currency} className="text-graphite">
                  Sales {money(t.gross, t.currency)} · Fees {money(t.fees, t.currency)} · <strong className="text-carbon">Net {money(t.net, t.currency)}</strong>
                </span>
              ))}
            </div>
          )}
          <Table
            columns={txnColumns()}
            data={data.transactions}
            keyExtractor={t => t.id}
            emptyState={{ title: 'No transactions are linked to this payout.' }}
          />
          {data.hasMore && <p className="text-[11px] text-slate">Showing the first 100 transactions of this payout — open your Stripe dashboard for the full list.</p>}
        </div>
      )}
    </Modal>
  );
}

// ── Section: Stripe balance, payouts and card transactions of this store ──────
export function StripeMoneySection({ storeId }: { storeId: string }) {
  const [overview, setOverview] = useState<StripePayoutOverview | null>(null);
  const [overviewError, setOverviewError] = useState('');
  const [loading, setLoading] = useState(true);
  const [txns, setTxns] = useState<StripeBalanceTransaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [txnError, setTxnError] = useState('');
  const [txnLoading, setTxnLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<string | null>(null);

  // The fetchers only set state after the request settles; the "busy" flags are set by the click handlers below,
  // so nothing calls setState synchronously from the mount effect.
  const fetchOverview = useCallback(() => {
    apiGetStripePayouts(storeId)
      .then(res => setOverview(res.data))
      .catch(err => setOverviewError(err instanceof Error ? err.message : 'Failed to load your Stripe payouts.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  const fetchTxns = useCallback((after?: string) => {
    apiGetStripeBalanceTransactions(storeId, { limit: 20, startingAfter: after })
      .then(res => { setTxns(prev => (after ? [...prev, ...res.data.transactions] : res.data.transactions)); setCursor(res.data.nextCursor); })
      .catch(err => setTxnError(err instanceof Error ? err.message : 'Failed to load card transactions.'))
      .finally(() => setTxnLoading(false));
  }, [storeId]);

  useEffect(() => { fetchOverview(); fetchTxns(); }, [fetchOverview, fetchTxns]);

  const retryAll = () => { setLoading(true); setOverviewError(''); setTxnError(''); setTxnLoading(true); fetchOverview(); fetchTxns(); };
  const retryTxns = () => { setTxnError(''); setTxnLoading(true); fetchTxns(); };
  const loadMore = () => { setTxnError(''); setTxnLoading(true); fetchTxns(cursor ?? undefined); };

  if (loading) return <SkeletonBox height={160} rounded="10px" />;

  if (overviewError) {
    return (
      <div className="bg-white border border-bone rounded-[10px] px-5 py-4 flex items-center justify-between gap-3" role="alert">
        <p className="text-[12.5px] text-error">{overviewError}</p>
        <Button size="sm" variant="outline" icon={<RefreshCw size={12} />} onClick={retryAll}>Try Again</Button>
      </div>
    );
  }
  if (!overview) return null;

  const s = overview.schedule;
  const scheduleText = !s.interval ? 'Not available'
    : s.interval === 'manual' ? 'Manual (you trigger payouts in Stripe)'
    : s.interval === 'daily' ? `Daily${s.delayDays != null ? `, ${s.delayDays}-day delay` : ''}`
    : s.interval === 'weekly' ? `Weekly on ${s.weeklyAnchor ?? '—'}${s.delayDays != null ? `, ${s.delayDays}-day delay` : ''}`
    : `Monthly on day ${s.monthlyAnchor ?? '—'}${s.delayDays != null ? `, ${s.delayDays}-day delay` : ''}`;
  const sum = (rows: { amount: number; currency: string }[]) => (rows.length ? rows.map(b => money(b.amount, b.currency)).join(' · ') : money(0, 'USD'));

  return (
    <div className="flex flex-col gap-4">
      {overview.testMode && (
        <p className="text-[11.5px] rounded-md bg-[#FDF3E7] text-[#9A6A17] px-3 py-2">Stripe is in test mode — these are test payments and test payouts; no real money moves.</p>
      )}

      <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Landmark size={15} className="text-slate" />
          <p className="text-[14px] font-bold text-carbon">Card payments &amp; payouts</p>
        </div>
        <p className="text-[12px] text-slate -mt-2">Card sales settle straight into your own Stripe account and Stripe pays you out. Solvexo never holds this money.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-[10px] bg-ivory px-4 py-3"><p className="text-slate text-[11px]">Available for payout</p><p className="text-[18px] font-bold text-carbon">{sum(overview.balance.available)}</p></div>
          <div className="rounded-[10px] bg-ivory px-4 py-3"><p className="text-slate text-[11px]">Pending (on the way)</p><p className="text-[18px] font-bold text-carbon">{sum(overview.balance.pending)}</p></div>
          <div className="rounded-[10px] bg-ivory px-4 py-3"><p className="text-slate text-[11px]">Payout schedule</p><p className="text-[13px] font-semibold text-carbon">{scheduleText}</p></div>
        </div>

        <div>
          <p className="text-[12.5px] font-bold text-carbon mb-1.5">Payouts</p>
          {overview.payouts.length === 0 ? (
            <p className="text-[12px] text-slate">No payouts yet. Stripe pays out your card sales to your bank on the schedule above.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-bone">
              {overview.payouts.map(p => {
                const st = PAYOUT_STATUS[p.status] ?? { color: 'gray' as BadgeColor, label: p.status };
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPayout(p.id)}
                      className="w-full py-2.5 flex items-center justify-between gap-3 text-[12.5px] text-left bg-transparent border-none cursor-pointer hover:bg-ivory px-1 rounded"
                    >
                      <span className="text-charcoal w-24">{day(p.arrivalDate ?? p.created)}</span>
                      <span className="flex-1"><Badge color={st.color}>{st.label}</Badge>{p.failureMessage && <span className="text-error text-[11px] ml-2">{p.failureMessage}</span>}</span>
                      <span className="font-semibold text-carbon">{money(p.amount, p.currency)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-[11px] text-slate mt-2">To change the bank account or payout schedule, open your Stripe dashboard — Stripe controls payouts.</p>
        </div>
      </div>

      <div className="bg-white border border-bone rounded-[10px]">
        <div className="px-[18px] pt-4 pb-3"><p className="text-[14px] font-bold text-carbon">Card transactions</p></div>
        {txnError && (
          <div className="flex items-center justify-between gap-3 px-4 py-3" role="alert">
            <p className="text-[12px] text-error">{txnError}</p>
            <Button size="sm" variant="outline" onClick={retryTxns}>Try Again</Button>
          </div>
        )}
        <Table
          columns={txnColumns()}
          data={txns}
          keyExtractor={t => t.id}
          loading={txnLoading && txns.length === 0}
          emptyState={{ title: 'No card transactions yet.' }}
        />
        {cursor && (
          <div className="px-4 py-3 flex justify-center">
            <Button size="sm" variant="outline" loading={txnLoading} onClick={loadMore}>Load more</Button>
          </div>
        )}
      </div>

      {selectedPayout && <StripePayoutDetailModal storeId={storeId} payoutId={selectedPayout} onClose={() => setSelectedPayout(null)} />}
    </div>
  );
}
