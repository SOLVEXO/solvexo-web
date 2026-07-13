import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Users, AlertTriangle, Store as StoreIcon, ShieldAlert } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiAdminGetOverview, apiAdminGetStoreBreakdown, apiAdminGetStoreDetail,
  apiAdminGetPaymentFailures, apiAdminGetSubscriptionDetail, apiAdminSuspendPlan, apiAdminUnsuspendPlan,
  apiAdminGetWebhookHistory, apiAdminRetryWebhook, apiAdminGetLtv, apiAdminGetRevenueBreakdown,
  apiAdminGetChurnCohorts, apiAdminRefundInvoice,
  type StoreBreakdownRow, type PaymentAttempt, type DashboardData, type SellerPlan, type WebhookEvent,
  type LtvData, type RevenueBreakdown, type ChurnCohort, type SubscriptionInvoice,
} from '@/api/services/subscriptions';

type Tab = 'stores' | 'failures' | 'webhooks' | 'insights';

const WEBHOOK_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  processed: { bg: '#E3F4EA', color: '#1E7A3C' },
  received: { bg: '#F0EEE6', color: '#5A5852' },
  processing: { bg: '#FFF4DC', color: '#B36200' },
  failed: { bg: '#FDECEA', color: '#C0392B' },
  ignored: { bg: '#F0EEE6', color: '#8C8A82' },
};

function WebhooksPanel() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiAdminGetWebhookHistory({ limit: 50 }).then(res => setEvents(res.data.events)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function retry(id: string) {
    setRetryingId(id);
    try { await apiAdminRetryWebhook(id); load(); } finally { setRetryingId(null); }
  }

  if (loading) return (
    <div className="px-5 py-4 flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonBox width="15%" height={12} />
          <SkeletonBox width="20%" height={12} />
          <SkeletonBox width={70} height={20} rounded="5px" />
          <SkeletonBox width="8%" height={12} />
          <SkeletonBox width="25%" height={12} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['RECEIVED', 'TYPE', 'STATUS', 'ATTEMPTS', 'ERROR', ''].map(h => (
              <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-slate">No webhook events yet.</td></tr>
          ) : events.map(ev => {
            const st = WEBHOOK_STATUS_STYLE[ev.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
            return (
              <tr key={ev._id} className="border-b border-[#F0EEE6]">
                <td className="px-4 py-3 text-[12px] text-slate whitespace-nowrap">{new Date(ev.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-[12.5px] text-charcoal">{ev.type}</td>
                <td className="px-4 py-3"><span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{ev.status}</span></td>
                <td className="px-4 py-3 text-[12px] text-slate">{ev.processingAttempts}</td>
                <td className="px-4 py-3 text-[12px] text-slate max-w-[220px] truncate">{ev.error ?? '—'}</td>
                <td className="px-4 py-3">
                  {ev.status === 'failed' && (
                    <button disabled={retryingId === ev._id} onClick={() => retry(ev._id)} className="px-2.5 py-1 bg-white border border-bone rounded-[6px] text-[11px] text-graphite cursor-pointer disabled:opacity-50">
                      {retryingId === ev._id ? 'Retrying…' : 'Retry'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Insights panel (LTV, revenue breakdown, churn cohorts) ───────────────────
function InsightsPanel() {
  const [ltv, setLtv] = useState<LtvData | null>(null);
  const [revenue, setRevenue] = useState<RevenueBreakdown | null>(null);
  const [cohorts, setCohorts] = useState<ChurnCohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([apiAdminGetLtv(), apiAdminGetRevenueBreakdown(), apiAdminGetChurnCohorts({ months: 6 })])
      .then(([l, r, c]) => { setLtv(l.data); setRevenue(r.data); setCohorts(c.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonBox key={i} height={70} rounded="8px" />)}
        </div>
        <SkeletonBox height={180} rounded="8px" />
      </div>
    );
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-5">
      {ltv && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cream rounded-[8px] px-4 py-3">
            <p className="text-[10px] text-slate uppercase tracking-wide mb-1">Realized LTV (churned)</p>
            <p className="text-[18px] font-bold text-carbon">${ltv.realizedLtvUSD.toFixed(2)}</p>
            <p className="text-[11px] text-slate mt-0.5">{ltv.canceledSubscriptionsSampled} sampled</p>
          </div>
          <div className="bg-cream rounded-[8px] px-4 py-3">
            <p className="text-[10px] text-slate uppercase tracking-wide mb-1">Active Revenue-to-Date</p>
            <p className="text-[18px] font-bold text-carbon">${ltv.activeAvgRevenueToDateUSD.toFixed(2)}</p>
            <p className="text-[11px] text-slate mt-0.5">{ltv.activeSubscriptionsSampled} sampled</p>
          </div>
        </div>
      )}

      {cohorts.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-charcoal mb-2">Monthly Cohort Retention</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['COHORT', 'STARTED', 'STILL ACTIVE', 'RETENTION'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10.5px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map(c => (
                  <tr key={c.cohort} className="border-b border-[#F0EEE6]">
                    <td className="px-3 py-2 text-[12px] text-charcoal">{c.cohort}</td>
                    <td className="px-3 py-2 text-[12px] text-graphite">{c.totalStarted}</td>
                    <td className="px-3 py-2 text-[12px] text-graphite">{c.stillActive}</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-[#2D8A4E]">{c.retentionPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {revenue && (
        <div>
          <p className="text-[12px] font-semibold text-charcoal mb-2">Revenue by Store (last 90 days)</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['STORE', 'TOTAL', 'INVOICES', 'SELLER PAYOUT', 'PLATFORM COMMISSION'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10.5px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {revenue.byStore.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-[12px] text-slate">No revenue in range.</td></tr>
                ) : revenue.byStore.map(r => (
                  <tr key={r.storeId} className="border-b border-[#F0EEE6]">
                    <td className="px-3 py-2 text-[12.5px] text-charcoal">{r.storeName}</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-[#2D8A4E]">${r.totalUSD.toFixed(2)}</td>
                    <td className="px-3 py-2 text-[12px] text-graphite">{r.invoiceCount}</td>
                    <td className="px-3 py-2 text-[12px] text-graphite">${r.sellerPayoutUSD.toFixed(2)}</td>
                    <td className="px-3 py-2 text-[12px] text-graphite">${r.platformCommissionUSD.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate mt-2">{revenue.note}</p>
        </div>
      )}
    </div>
  );
}

// ── Store detail modal ───────────────────────────────────────────────────────
function StoreDetailModal({ storeId, onClose }: { storeId: string; onClose: () => void }) {
  const [data, setData] = useState<(DashboardData & { store: { name: string; slug: string }; plans: SellerPlan[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiAdminGetStoreDetail(storeId).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [storeId]);
  useEffect(load, [load]);

  async function toggleSuspend(plan: SellerPlan) {
    if (plan.status === 'suspended') await apiAdminUnsuspendPlan(plan._id);
    else await apiAdminSuspendPlan(plan._id);
    load();
  }

  return (
    <Modal title={data?.store.name ?? 'Store'} width={560} onClose={onClose}>
      {loading || !data ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBox key={i} height={54} rounded="8px" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBox key={i} height={46} rounded="8px" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[['MRR', `$${data.mrr.toFixed(2)}`], ['Subscribers', String(data.activeSubscribersCount)], ['Churn', `${data.churnRate}%`]].map(([l, v]) => (
              <div key={l} className="bg-cream rounded-lg px-3 py-2.5 text-center">
                <p className="text-[10px] text-slate uppercase tracking-wide">{l}</p>
                <p className="text-[16px] font-bold text-carbon">{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[12px] font-semibold text-charcoal mb-2">Plans</p>
            <div className="flex flex-col gap-2">
              {data.plans.map(p => (
                <div key={p._id} className="flex items-center justify-between bg-cream rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-[13px] font-semibold text-charcoal">{p.name}</p>
                    <p className="text-[11px] text-slate">${p.monthlyPriceUSD}/mo · {p.subscriberCount} subscribers · status: {p.status}</p>
                  </div>
                  <Button size="xs" variant={p.status === 'suspended' ? 'outline' : 'danger'} onClick={() => toggleSuspend(p)}>
                    {p.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                  </Button>
                </div>
              ))}
              {data.plans.length === 0 && <p className="text-[12px] text-slate">No plans.</p>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Subscription detail modal (dunning/retry drill-down) ─────────────────────
function SubscriptionDetailModal({ subId, onClose }: { subId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiAdminGetSubscriptionDetail(subId).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [subId]);
  useEffect(load, [load]);

  async function refund(invoice: SubscriptionInvoice) {
    if (!window.confirm(`Refund invoice ${invoice.invoiceNumber} ($${invoice.amountUSD.toFixed(2)})?`)) return;
    setRefundingId(invoice._id);
    try {
      await apiAdminRefundInvoice(invoice._id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Refund failed.');
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <Modal title="Subscription Detail" width={600} onClose={onClose}>
      {loading || !data ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBox key={i} height={32} rounded="6px" />
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBox key={i} height={28} rounded="6px" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div><p className="text-slate">Store</p><p className="font-semibold text-charcoal">{data.store?.name ?? '—'}</p></div>
            <div><p className="text-slate">Customer</p><p className="font-semibold text-charcoal">{data.customer?.name ?? '—'} ({data.customer?.email ?? '—'})</p></div>
            <div><p className="text-slate">Plan</p><p className="font-semibold text-charcoal">{data.plan?.name ?? '—'}</p></div>
            <div><p className="text-slate">Status</p><p className="font-semibold text-charcoal">{data.status}</p></div>
            <div><p className="text-slate">Failed attempts</p><p className="font-semibold text-charcoal">{data.failedPaymentAttempts}</p></div>
            <div><p className="text-slate">Next billing</p><p className="font-semibold text-charcoal">{new Date(data.nextBillingDate).toLocaleDateString()}</p></div>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-charcoal mb-2">Payment Attempt History</p>
            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
              {data.paymentAttempts.map((a: PaymentAttempt) => (
                <div key={a._id} className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded bg-cream">
                  <span className="text-slate">#{a.attemptNumber} · {a.attemptType} · {new Date(a.createdAt).toLocaleString()}</span>
                  <span className={`font-semibold ${a.outcome === 'success' ? 'text-[#1E7A3C]' : 'text-error'}`}>
                    {a.outcome === 'failed' ? (a.failureReason ?? 'Failed') : `$${a.amountUSD.toFixed(2)}`}
                  </span>
                </div>
              ))}
              {data.paymentAttempts.length === 0 && <p className="text-[12px] text-slate">No payment attempts recorded.</p>}
            </div>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-charcoal mb-2">Invoices</p>
            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
              {(data.invoices ?? []).map((inv: SubscriptionInvoice) => (
                <div key={inv._id} className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded bg-cream">
                  <span className="text-slate">{inv.invoiceNumber} · {inv.status} · ${inv.amountUSD.toFixed(2)}</span>
                  {['paid', 'partially_refunded'].includes(inv.status) && (
                    <button disabled={refundingId === inv._id} onClick={() => refund(inv)}
                      className="px-2 py-[3px] bg-white border border-bone rounded-[5px] text-[11px] text-[#C13030] cursor-pointer disabled:opacity-50">
                      {refundingId === inv._id ? 'Refunding…' : 'Refund'}
                    </button>
                  )}
                </div>
              ))}
              {(data.invoices ?? []).length === 0 && <p className="text-[12px] text-slate">No invoices recorded.</p>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function AdminSubscriptions() {
  usePageTitle('Subscriptions');
  const [tab, setTab] = useState<Tab>('stores');
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof apiAdminGetOverview>>['data'] | null>(null);
  const [stores, setStores] = useState<StoreBreakdownRow[]>([]);
  const [failures, setFailures] = useState<Array<PaymentAttempt & { store: { name: string } | null; customer: { name: string; email: string } | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingStore, setViewingStore] = useState<string | null>(null);
  const [viewingSub, setViewingSub] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([apiAdminGetOverview(), apiAdminGetStoreBreakdown({ limit: 50 }), apiAdminGetPaymentFailures({ limit: 50 })])
      .then(([ov, sb, pf]) => {
        setOverview(ov.data);
        setStores(sb.data.stores);
        setFailures(pf.data.failures);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load subscription data.'))
      .finally(() => setLoading(false));
  }, []);

  const metrics = overview ? [
    { label: 'Platform MRR', value: `$${overview.mrr.toFixed(2)}`, Icon: TrendingUp },
    { label: 'Active Subscribers', value: String(overview.activeSubscribersCount), Icon: Users },
    { label: 'Stores with Plans', value: String(overview.storesWithActivePlans), Icon: StoreIcon },
    { label: 'Failed Payments (30d)', value: String(overview.failedPaymentsLast30Days), Icon: AlertTriangle },
    { label: 'Past Due Subs', value: String(overview.pastDueSubscriptionsCount), Icon: ShieldAlert },
  ] : [];

  return (
    <div>
      <div className="bg-white border-b border-bone px-7 py-[14px] sticky top-0 z-10">
        <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Subscriptions</h1>
        <p className="text-[12px] text-slate mt-[2px]">Platform-wide subscription revenue, store breakdown, and payment failures.</p>
      </div>

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">
        {error && <p className="text-[13px] text-error">{error}</p>}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {(loading && !overview) ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-bone rounded-[10px] px-5 py-4 h-[84px] animate-pulse" />
          )) : metrics.map(m => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[24px] font-bold text-carbon leading-[1.15]">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-[14px] border-b border-bone flex items-center gap-[10px]">
            {(['stores', 'failures', 'webhooks', 'insights'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-[14px] py-[6px] rounded-lg text-[13px] font-medium cursor-pointer border-none capitalize"
                style={{ background: tab === t ? '#141413' : 'transparent', color: tab === t ? '#fff' : '#8C8A82' }}>
                {t === 'stores' ? 'Store Breakdown' : t === 'failures' ? 'Payment Failures' : t === 'webhooks' ? 'Stripe Webhooks' : 'Insights'}
              </button>
            ))}
          </div>

          {tab === 'webhooks' ? (
            <WebhooksPanel />
          ) : tab === 'insights' ? (
            <InsightsPanel />
          ) : loading ? (
            <div className="px-5 py-4 flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonBox width="20%" height={12} />
                  <SkeletonBox width="15%" height={12} />
                  <SkeletonBox width="12%" height={12} />
                  <SkeletonBox width="10%" height={12} />
                  <SkeletonBox width="20%" height={12} />
                </div>
              ))}
            </div>
          ) : tab === 'stores' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['STORE', 'SUBSCRIBERS', 'MRR', 'PLANS', ''].map(h => (
                      <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stores.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-slate">No stores with active plans yet.</td></tr>
                  ) : stores.map(s => (
                    <tr key={s.storeId} className="border-b border-[#F0EEE6]">
                      <td className="px-4 py-3 text-[13px] font-semibold text-charcoal">{s.storeName}</td>
                      <td className="px-4 py-3 text-[13px] text-graphite">{s.subscriberCount}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#2D8A4E]">${s.mrrUSD.toFixed(2)}</td>
                      <td className="px-4 py-3 text-[13px] text-graphite">{s.planCount}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewingStore(s.storeId)} className="px-3 py-1 bg-white border border-bone rounded-[6px] text-xs text-graphite cursor-pointer">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['DATE', 'STORE', 'CUSTOMER', 'TYPE', 'AMOUNT', 'REASON', ''].map(h => (
                      <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {failures.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-slate">No payment failures. 🎉</td></tr>
                  ) : failures.map(f => (
                    <tr key={f._id} className="border-b border-[#F0EEE6]">
                      <td className="px-4 py-3 text-[12px] text-slate whitespace-nowrap">{new Date(f.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[13px] text-charcoal">{f.store?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-[13px] text-graphite">{f.customer?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-slate">{f.attemptType} #{f.attemptNumber}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-error">${f.amountUSD.toFixed(2)}</td>
                      <td className="px-4 py-3 text-[12px] text-slate max-w-[180px] truncate">{f.failureReason ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewingSub(f.subscriptionId)} className="px-3 py-1 bg-white border border-bone rounded-[6px] text-xs text-graphite cursor-pointer">Inspect</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {viewingStore && <StoreDetailModal storeId={viewingStore} onClose={() => setViewingStore(null)} />}
      {viewingSub && <SubscriptionDetailModal subId={viewingSub} onClose={() => setViewingSub(null)} />}
    </div>
  );
}
