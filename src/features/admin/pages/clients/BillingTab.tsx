import { useCallback, useEffect, useState } from 'react';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { useClientBilling } from '@/hooks/admin/useAdminClients';
import {
  apiAdminListPlatformPlans, apiAdminAssignPlan, apiAdminExtendSubscription,
  apiAdminLockStore, apiAdminUnlockStore, apiAdminListInvoices, apiAdminRefundPlatformInvoice,
  type PlatformPlan, type SellerPlatformOverview, type PlatformPlanInvoice,
} from '@/api/services/platformPlans';
import { Table, StatusBadge, Badge, ActionMenu, Modal, Button, SkeletonBox } from '@/components/comman/ui';
import type { TableColumn, ActionMenuItem } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatCurrency, formatDate } from '@/components/comman/analytics/format';
import { Layers, Lock, Unlock, RefreshCw, Layers as PlanIcon, Receipt, Undo2, History } from 'lucide-react';
import { BillingTimeline } from '@/components/comman/billing/BillingTimeline';
import { COMPLIMENTARY_REVIEW_OPTIONS, complimentaryReviewAt } from '@/utils/planStatus';
import { apiAdminGetBillingTimeline, apiAdminExportBillingTimeline, type BillingTimelineParams } from '@/api/services/billingTimeline';

interface BillingTabProps {
  sellerId: string;
}

type StoreBillingRow = SellerPlatformOverview['stores'][number];

type ActionKind = 'assign-plan' | 'extend' | 'lock' | 'unlock';

// ── Invoice list + refund — a separate modal from the form-based actions
// above (this one's a list with a per-row action, not a single form), opened
// from the same per-store ActionMenu. Uses the new admin-authorized
// `GET admin/stores/:storeId/invoices` route (SellerPlatformSubscriptionsService.adminListInvoices)
// — the seller-facing one 403s for an admin caller (ownership check can
// never pass), so this couldn't just reuse apiGetStoreInvoices. ────────────
// One store's complete payment history, trial → today, with failed attempts, refunds, card and provider references.
function TimelineModal({ store, onClose }: { store: StoreBillingRow; onClose: () => void }) {
  const load = useCallback((p: BillingTimelineParams) => apiAdminGetBillingTimeline(store.storeId, p), [store.storeId]);
  const exportCsv = useCallback((p: BillingTimelineParams) => apiAdminExportBillingTimeline(store.storeId, p), [store.storeId]);
  return (
    <Modal mobileSheet width={860} title={`Payment timeline — ${store.storeName}`} onClose={onClose}>
      <div className="-mx-5 -my-4"><BillingTimeline audience="admin" storeName={store.storeName} load={load} exportCsv={exportCsv} /></div>
    </Modal>
  );
}

function InvoicesModal({ store, onClose }: { store: StoreBillingRow; onClose: () => void }) {
  const { data, loading, error, refetch } = useAnalyticsQuery(
    (p: { storeId: string }) => apiAdminListInvoices(p.storeId, { limit: 20 }),
    { storeId: store.storeId },
  );
  const invoices = data?.invoices ?? [];
  const [refunding, setRefunding] = useState<PlatformPlanInvoice | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refundError, setRefundError] = useState('');

  function openRefund(inv: PlatformPlanInvoice) {
    setRefunding(inv);
    setRefundAmount(String((inv.amountUSD - inv.refundedAmountUSD).toFixed(2)));
    setRefundReason('');
    setRefundError('');
  }

  async function submitRefund() {
    if (!refunding) return;
    setSubmitting(true);
    setRefundError('');
    try {
      const amt = Number(refundAmount);
      await apiAdminRefundPlatformInvoice(refunding._id, isNaN(amt) ? undefined : amt, refundReason || undefined);
      setRefunding(null);
      refetch();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : 'Refund failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: TableColumn<PlatformPlanInvoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice', render: (i) => <span className="text-[12.5px] font-semibold text-charcoal">{i.invoiceNumber}</span> },
    { key: 'createdAt', header: 'Date', render: (i) => <span className="text-[13px] text-slate whitespace-nowrap">{formatDate(i.createdAt)}</span> },
    { key: 'amountUSD', header: 'Amount', render: (i) => <span className="text-[13px] font-semibold text-charcoal">{formatCurrency(i.amountUSD)}</span> },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} size="sm" /> },
    {
      key: 'actions',
      header: '',
      render: (i) => i.status === 'paid' || i.status === 'partially_refunded'
        ? <Button size="xs" variant="outline" icon={<Undo2 size={11} />} onClick={() => openRefund(i)}>Refund</Button>
        : null,
    },
  ];

  return (
    <>
      <Modal mobileSheet title={`Invoices — ${store.storeName}`} onClose={onClose} width={680}>
        {error ? (
          <AnalyticsErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <SkeletonBox height={160} rounded="10px" />
        ) : (
          <Table
            columns={columns}
            data={invoices}
            keyExtractor={(i) => i._id}
            emptyState={{ icon: <Receipt size={28} className="text-slate/50" />, title: 'No invoices yet' }}
          />
        )}
      </Modal>

      {refunding && (
        <Modal
          mobileSheet
          title={`Refund Invoice ${refunding.invoiceNumber}`}
          onClose={() => setRefunding(null)}
          footer={<>
            <Button variant="ghost" onClick={() => setRefunding(null)}>Cancel</Button>
            <Button variant="danger" loading={submitting} onClick={submitRefund}>Refund</Button>
          </>}
        >
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-charcoal leading-[1.6]">
              Refunding real money charged for invoice "<strong>{refunding.invoiceNumber}</strong>" ({formatCurrency(refunding.amountUSD)} paid, {formatCurrency(refunding.refundedAmountUSD)} already refunded).
            </p>
            <div>
              <label htmlFor="refund-amount" className="block text-[11.5px] font-medium text-charcoal mb-1.5">Amount (USD)</label>
              <input
                id="refund-amount"
                type="number"
                min={0}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white"
              />
            </div>
            <div>
              <label htmlFor="refund-reason" className="block text-[11.5px] font-medium text-charcoal mb-1.5">Reason <span className="text-slate font-normal">(optional, logged for audit)</span></label>
              <textarea
                id="refund-reason"
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white resize-y"
              />
            </div>
            {refundError && <p className="text-[12px] text-error">{refundError}</p>}
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Per-store plan/status table — plans are store-level entities, so a
// client with 3 stores can genuinely be on 3 different plans; this is never
// collapsed into one value. Every action below already exists on the
// backend (only reachable from the global Platform Plans page before) —
// this just surfaces them in the client's own context, with the same
// confirm-modal convention the rest of the workspace uses. ──────────────────
export function BillingTab({ sellerId }: BillingTabProps) {
  const { data, loading, error, refetch } = useClientBilling(sellerId);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [action, setAction] = useState<{ kind: ActionKind; store: StoreBillingRow } | null>(null);
  const [invoicesFor, setInvoicesFor] = useState<StoreBillingRow | null>(null);
  const [timelineFor, setTimelineFor] = useState<StoreBillingRow | null>(null);
  const [planId, setPlanId] = useState('');
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState('');
  const [reviewOpt, setReviewOpt] = useState('30');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    apiAdminListPlatformPlans().then((res) => setPlans(res.data.filter((p) => p.status === 'active'))).catch(() => {});
  }, []);

  function openAction(kind: ActionKind, store: StoreBillingRow) {
    setAction({ kind, store });
    setPlanId('');
    setDays(30);
    setReason('');
    setReviewOpt('30');
    setActionError('');
  }

  async function submitAction() {
    if (!action) return;
    setSubmitting(true);
    setActionError('');
    try {
      if (action.kind === 'assign-plan') {
        if (!planId) { setActionError('Choose a plan.'); setSubmitting(false); return; }
        if (reason.trim().length < 3) { setActionError('Say why this store gets a complimentary plan.'); setSubmitting(false); return; }
        await apiAdminAssignPlan(action.store.storeId, planId, reason.trim(), complimentaryReviewAt(reviewOpt));
      } else if (action.kind === 'extend') {
        await apiAdminExtendSubscription(action.store.storeId, days, reason || undefined);
      } else if (action.kind === 'lock') {
        await apiAdminLockStore(action.store.storeId, reason || undefined);
      } else {
        await apiAdminUnlockStore(action.store.storeId, reason || undefined);
      }
      setAction(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: TableColumn<StoreBillingRow>[] = [
    { key: 'storeName', header: 'Store', render: (s) => <span className="text-[12.5px] font-semibold text-charcoal">{s.storeName}</span> },
    { key: 'storeStatus', header: 'Store Status', render: (s) => <StatusBadge status={s.storeStatus} size="sm" /> },
    {
      key: 'plan',
      header: 'Plan',
      render: (s) => s.platformPlan
        ? <Badge size="sm" color={s.platformPlan.isFree ? 'gray' : 'orange'}>{s.platformPlan.name}</Badge>
        : <span className="text-[12.5px] text-slate">No plan</span>,
    },
    { key: 'subscriptionStatus', header: 'Billing Status', render: (s) => (
      <span className="inline-flex items-center gap-1.5">
        <StatusBadge status={s.subscriptionStatus} size="sm" />
        {s.isComplimentary && <Badge size="sm" color="blue">Complimentary</Badge>}
        {s.billingSyncError && <Badge size="sm" color="red"><span title={s.billingSyncError}>Stripe sync error</span></Badge>}
      </span>
    ) },
    { key: 'nextBillingDate', header: 'Next Billing', render: (s) => <span className="text-[13px] text-slate">{s.nextBillingDate ? formatDate(s.nextBillingDate) : '—'}</span> },
    { key: 'totalPaidUSD', header: 'Lifetime Paid', render: (s) => <span className="text-[13px] font-semibold text-charcoal">{formatCurrency(s.totalPaidUSD)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => {
        const items: ActionMenuItem[] = [
          { label: 'Payment timeline', icon: <History size={13} />, onClick: () => setTimelineFor(s) },
          { label: 'View invoices', icon: <Receipt size={13} />, onClick: () => setInvoicesFor(s) },
          { label: 'Assign plan', icon: <PlanIcon size={13} />, onClick: () => openAction('assign-plan', s) },
          { label: 'Extend subscription', icon: <RefreshCw size={13} />, onClick: () => openAction('extend', s) },
          s.subscriptionStatus === 'locked'
            ? { label: 'Unlock store', icon: <Unlock size={13} />, onClick: () => openAction('unlock', s) }
            : { label: 'Lock store', icon: <Lock size={13} />, danger: true, onClick: () => openAction('lock', s) },
        ];
        return <ActionMenu items={items} ariaLabel={`Billing actions for ${s.storeName}`} />;
      },
    },
  ];

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  return (
    <>
      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <Table
          columns={columns}
          data={data?.stores ?? []}
          keyExtractor={(s) => s.storeId}
          loading={loading}
          emptyState={{ icon: <Layers size={28} className="text-slate/50" />, title: 'No stores yet', description: 'This client hasn\'t created a store yet.' }}
        />
      </div>

      {action && (
        <Modal
          mobileSheet
          title={
            action.kind === 'assign-plan' ? `Assign Plan — ${action.store.storeName}`
              : action.kind === 'extend' ? `Extend Subscription — ${action.store.storeName}`
              : action.kind === 'lock' ? `Lock Store — ${action.store.storeName}`
              : `Unlock Store — ${action.store.storeName}`
          }
          onClose={() => setAction(null)}
          footer={<>
            <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
            <Button variant={action.kind === 'lock' ? 'danger' : 'primary'} loading={submitting} onClick={submitAction}>
              Confirm
            </Button>
          </>}
        >
          <div className="flex flex-col gap-3">
            {action.kind === 'lock' && (
              <p className="text-[13px] text-charcoal leading-[1.6]">
                Locking blocks checkout on "<strong>{action.store.storeName}</strong>" immediately. The storefront stays browsable until the plan's grace period ends.
              </p>
            )}
            {action.kind === 'assign-plan' && (
              <div>
                <label htmlFor="billing-assign-plan" className="block text-[11.5px] font-medium text-charcoal mb-1.5">Plan</label>
                <select
                  id="billing-assign-plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white"
                >
                  <option value="">Select a plan…</option>
                  {plans.map((p) => <option key={p._id} value={p._id}>{p.name}{p.isFree ? ' (Free)' : ''}</option>)}
                </select>
                <p className="mt-2 text-[11.5px] leading-[1.5] text-slate">This is a <strong>complimentary</strong> plan: no charge, never renewed, never locked for payment. The store sees "Provided by Solvexo support".</p>
                <label htmlFor="billing-review" className="mt-3 block text-[11.5px] font-medium text-charcoal mb-1.5">Review date</label>
                <select id="billing-review" value={reviewOpt} onChange={(e) => setReviewOpt(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white">
                  {COMPLIMENTARY_REVIEW_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-slate">Admins get a reminder a week before this date. Nothing is removed automatically.</p>
              </div>
            )}
            {action.kind === 'extend' && (
              <div>
                <label htmlFor="billing-extend-days" className="block text-[11.5px] font-medium text-charcoal mb-1.5">Days to extend</label>
                <input
                  id="billing-extend-days"
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white"
                />
              </div>
            )}
            <div>
              <label htmlFor="billing-action-reason" className="block text-[11.5px] font-medium text-charcoal mb-1.5">Reason {action.kind === 'assign-plan' ? <span className="text-error font-normal">(required — kept on the store)</span> : <span className="text-slate font-normal">(optional, logged for audit)</span>}</label>
              <textarea
                id="billing-action-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white resize-y"
              />
            </div>
            {actionError && <p className="text-[12px] text-error">{actionError}</p>}
          </div>
        </Modal>
      )}

      {invoicesFor && <InvoicesModal store={invoicesFor} onClose={() => setInvoicesFor(null)} />}
      {timelineFor && <TimelineModal store={timelineFor} onClose={() => setTimelineFor(null)} />}
    </>
  );
}
