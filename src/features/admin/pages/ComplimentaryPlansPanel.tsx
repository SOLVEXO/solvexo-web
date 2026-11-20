import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Gift, Trash2 } from 'lucide-react';
import { Table, Badge, ActionMenu, Modal, Button } from '@/components/comman/ui';
import type { TableColumn, ActionMenuItem } from '@/components/comman/ui';
import { formatCurrency, formatDate } from '@/components/comman/analytics/format';
import {
  apiAdminListComplimentary, apiAdminRemoveComplimentary, apiAdminSetComplimentaryReview,
  type ComplimentaryList, type ComplimentaryPlanRow,
} from '@/api/services/platformPlans';
import { complimentaryReviewAt } from '@/utils/planStatus';

const REVIEW_BADGE: Record<ComplimentaryPlanRow['reviewState'], { label: (d: number | null) => string; color: 'gray' | 'green' | 'orange' | 'red' }> = {
  none: { label: () => 'No review date', color: 'gray' },
  ok: { label: (d) => `In ${d} days`, color: 'green' },
  soon: { label: (d) => `In ${d} day${d === 1 ? '' : 's'}`, color: 'orange' },
  overdue: { label: () => 'Needs a decision', color: 'red' },
};

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: 'warn' | 'bad' }) {
  return (
    <div className="rounded-[10px] border border-bone bg-white px-4 py-3">
      <p className="text-[11.5px] text-slate">{label}</p>
      <p className={`mt-0.5 text-[18px] font-semibold ${tone === 'bad' ? 'text-error' : tone === 'warn' ? 'text-warning' : 'text-charcoal'}`}>{value}</p>
    </div>
  );
}

/**
 * Every store currently on a plan an admin gave for free: who gave it, why, when it should be reviewed, and what it
 * would have cost. Nothing here ends automatically — the admin keeps it (pushes the review date) or ends it.
 */
export function ComplimentaryPlansPanel() {
  const [data, setData] = useState<ComplimentaryList | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState<ComplimentaryPlanRow | null>(null);
  const [endReason, setEndReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    apiAdminListComplimentary()
      .then(res => { if (!cancelled) { setData(res.data); setError(''); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load complimentary plans.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [nonce]);

  async function extend(row: ComplimentaryPlanRow, optionId: string) {
    setActionError('');
    try { await apiAdminSetComplimentaryReview(row.storeId, complimentaryReviewAt(optionId)); reload(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Could not change the review date.'); }
  }

  async function endPlan() {
    if (!ending) return;
    setBusy(true); setActionError('');
    try { await apiAdminRemoveComplimentary(ending.storeId, endReason.trim() || undefined); setEnding(null); setEndReason(''); reload(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Could not end the plan.'); }
    finally { setBusy(false); }
  }

  const columns: TableColumn<ComplimentaryPlanRow>[] = [
    { key: 'storeName', header: 'Store', render: (r) => <span className="text-[12.5px] font-semibold text-charcoal">{r.storeName}</span> },
    { key: 'planName', header: 'Plan', render: (r) => (<span className="text-[12.5px] text-charcoal">{r.planName}<span className="ml-1.5 text-[11px] text-slate">worth {formatCurrency(r.planPriceUSD)}/mo</span></span>) },
    { key: 'reason', header: 'Reason', render: (r) => <span className="text-[12.5px] text-charcoal line-clamp-2 max-w-[260px]" title={r.reason}>{r.reason}</span> },
    { key: 'grantedBy', header: 'Given by', render: (r) => <span className="text-[12px] text-slate">{r.grantedBy}<br />{formatDate(r.grantedAt)}</span> },
    {
      key: 'reviewAt', header: 'Review',
      render: (r) => {
        const b = REVIEW_BADGE[r.reviewState];
        return (
          <span className="inline-flex flex-col items-start gap-1">
            <Badge size="sm" color={b.color}>{b.label(r.daysToReview)}</Badge>
            {r.reviewAt && <span className="text-[11px] text-slate">{formatDate(r.reviewAt)}</span>}
          </span>
        );
      },
    },
    {
      key: 'actions', header: 'Actions',
      render: (r) => {
        const items: ActionMenuItem[] = [
          { label: 'Keep — review again in 30 days', icon: <CalendarClock size={13} />, onClick: () => extend(r, '30') },
          { label: 'Keep — review again in 90 days', icon: <CalendarClock size={13} />, onClick: () => extend(r, '90') },
          { label: 'Keep — no review date', icon: <CalendarClock size={13} />, onClick: () => extend(r, 'none') },
          { label: 'End complimentary plan', icon: <Trash2 size={13} />, danger: true, onClick: () => { setEnding(r); setEndReason(''); setActionError(''); } },
        ];
        return <ActionMenu items={items} ariaLabel={`Complimentary plan actions for ${r.storeName}`} />;
      },
    },
  ];

  return (
    <section aria-label="Complimentary plans" className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Gift size={16} className="text-slate" aria-hidden />
        <h2 className="text-[14px] font-semibold text-charcoal">Complimentary plans <span className="font-normal text-slate">(given by admins, no billing)</span></h2>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Stores on a complimentary plan" value={data?.count ?? '—'} />
        <Stat label="Review due within 7 days" value={data?.dueSoon ?? '—'} tone={data?.dueSoon ? 'warn' : undefined} />
        <Stat label="Past their review date" value={data?.overdue ?? '—'} tone={data?.overdue ? 'bad' : undefined} />
        <Stat label="Value given away / month" value={data ? formatCurrency(data.monthlyValueUSD) : '—'} />
      </div>
      {actionError && <p role="alert" className="mb-2 text-[12px] text-error">{actionError}</p>}
      {error ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-[10px] border border-bone bg-white px-4 py-3">
          <p className="text-[13px] text-error">{error}</p>
          <Button size="sm" variant="outline" onClick={reload}>Retry</Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-bone bg-white">
          <Table
            columns={columns}
            data={data?.items ?? []}
            keyExtractor={(r) => r.storeId}
            loading={loading}
            emptyState={{ icon: <Gift size={26} className="text-slate/50" />, title: 'No complimentary plans', description: 'Plans you give from a store\'s Billing → Assign plan show up here with the reason and a review date.' }}
          />
        </div>
      )}

      {ending && (
        <Modal
          mobileSheet title={`End complimentary plan — ${ending.storeName}`} onClose={() => setEnding(null)}
          footer={<><Button variant="ghost" onClick={() => setEnding(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={endPlan}>End plan</Button></>}
        >
          <div className="flex flex-col gap-3">
            <p className="text-[13px] leading-[1.6] text-charcoal">
              "<strong>{ending.storeName}</strong>" loses its {ending.planName} plan and sees the "Select a plan" screen until it pays for one. Its data stays safe.
            </p>
            <div>
              <label htmlFor="end-comp-reason" className="mb-1.5 block text-[11.5px] font-medium text-charcoal">Reason <span className="font-normal text-slate">(optional, logged)</span></label>
              <textarea id="end-comp-reason" rows={2} value={endReason} onChange={(e) => setEndReason(e.target.value)}
                className="w-full resize-y rounded-lg border border-bone bg-white px-3 py-2 text-[13px] text-charcoal outline-none" />
            </div>
            {actionError && <p className="text-[12px] text-error">{actionError}</p>}
          </div>
        </Modal>
      )}
    </section>
  );
}
