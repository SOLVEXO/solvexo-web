import { useEffect, useState, useCallback } from 'react';
import { Loader2, TrendingUp, Users, AlertTriangle, Store as StoreIcon, ShieldAlert } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import {
  apiAdminGetOverview, apiAdminGetStoreBreakdown, apiAdminGetStoreDetail,
  apiAdminGetPaymentFailures, apiAdminGetSubscriptionDetail, apiAdminSuspendPlan, apiAdminUnsuspendPlan,
  type StoreBreakdownRow, type PaymentAttempt, type DashboardData, type SellerPlan,
} from '@/api/services/subscriptions';

type Tab = 'stores' | 'failures';

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
      {loading || !data ? <Loader2 size={18} className="animate-spin text-brand-orange" /> : (
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

  useEffect(() => {
    apiAdminGetSubscriptionDetail(subId).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [subId]);

  return (
    <Modal title="Subscription Detail" width={600} onClose={onClose}>
      {loading || !data ? <Loader2 size={18} className="animate-spin text-brand-orange" /> : (
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
            {(['stores', 'failures'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-[14px] py-[6px] rounded-lg text-[13px] font-medium cursor-pointer border-none capitalize"
                style={{ background: tab === t ? '#141413' : 'transparent', color: tab === t ? '#fff' : '#8C8A82' }}>
                {t === 'stores' ? 'Store Breakdown' : 'Payment Failures'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center"><Loader2 size={18} className="animate-spin text-brand-orange inline" /></div>
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
