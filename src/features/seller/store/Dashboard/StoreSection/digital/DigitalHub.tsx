import { useCallback, useEffect, useState } from 'react';
import client from '@/api/client';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';

type Tab = 'overview' | 'plans' | 'subscribers' | 'licenses' | 'log';
const TABS: { id: Tab; label: string; perm: string }[] = [
  { id: 'overview', label: 'Overview', perm: 'digital.view' },
  { id: 'plans', label: 'Plans', perm: 'members.manage' },
  { id: 'subscribers', label: 'Subscribers', perm: 'members.manage' },
  { id: 'licenses', label: 'Licenses', perm: 'licenses.manage' },
  { id: 'log', label: 'Delivery log', perm: 'digital.view' },
];

const errText = (e: any) => e?.response?.data?.message ?? e?.message ?? 'Something went wrong';
const inp = 'h-9 rounded-lg border border-line px-3 text-[13px] bg-white';
const btn = 'rounded-md border border-line px-2.5 py-1 text-[12px] disabled:opacity-50';

/** Reads one list endpoint with loading / error + retry states. */
function useList<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    setData(null);
    (client.get(url) as Promise<T>).then(setData).catch((e) => setError(errText(e)));
  }, [url]);
  useEffect(load, [load]);
  return { data, error, reload: load };
}

function State({ error, loading, empty, retry }: { error: string | null; loading: boolean; empty?: boolean; retry: () => void }) {
  if (error) return <p role="alert" className="text-[13px] text-red-600">{error} <button className="underline" onClick={retry}>Retry</button></p>;
  if (loading) return <p aria-busy="true" className="text-[13px] text-slate">Loading...</p>;
  if (empty) return <p className="text-[13px] text-slate">Nothing here yet.</p>;
  return null;
}

function Overview({ base }: { base: string }) {
  const { data, error, reload } = useList<any>(`${base}/overview`);
  if (!data) return <State error={error} loading retry={reload} />;
  const m = data.memberships;
  const cards: [string, string | number][] = [
    ['Digital revenue (30d)', data.last30Days.digitalRevenue], ['Digital items sold (30d)', data.last30Days.digitalItemsSold],
    ['Deliveries (30d)', data.last30Days.deliveries], ['Denied / failed (30d)', data.last30Days.deniedOrFailed],
    ['MRR', m.mrr], ['Active members', m.counts.active], ['Trialing', m.counts.trialing], ['Past due', m.counts.past_due], ['Churned', m.churned],
  ];
  const attention = data.needsAttention;
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map(([k, v]) => (
          <li key={k} className="rounded-xl border border-line bg-white p-3"><p className="text-[11px] text-slate">{k}</p><p className="text-[20px] font-semibold">{v}</p></li>
        ))}
      </ul>
      <section className="rounded-xl border border-line bg-white p-3 text-[13px]">
        <h3 className="font-semibold mb-1">Needs attention</h3>
        {attention.pastDue + attention.awaitingPayment + attention.flaggedAccess === 0 ? <p className="text-slate">All clear.</p> : (
          <ul className="list-disc ps-5">
            {attention.pastDue > 0 && <li>{attention.pastDue} past-due membership(s)</li>}
            {attention.awaitingPayment > 0 && <li>{attention.awaitingPayment} member(s) waiting for you to confirm payment</li>}
            {attention.flaggedAccess > 0 && <li>{attention.flaggedAccess} download access(es) flagged for unusual activity</li>}
          </ul>
        )}
      </section>
      <p className="text-[11px] text-slate">Revenue is the sum of paid digital items before refunds of other kinds and discounts shown elsewhere; it is not accounting data.</p>
    </div>
  );
}

function Plans({ storeId }: { storeId: string }) {
  const toast = useToast();
  const url = `/api/memberships/store/${storeId}/plans`;
  const { data, error, reload } = useList<any[]>(url);
  const [f, setF] = useState({ name: '', type: 'recurring', amount: '', interval: 'month', trialDays: '0', graceDays: '0', tier: '1' });
  const [busy, setBusy] = useState(false);
  const canEdit = can('members.manage');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.post(url, { ...f, amount: Number(f.amount) || 0, trialDays: Number(f.trialDays), graceDays: Number(f.graceDays), tier: Number(f.tier) });
      toast.success('Plan created');
      setF({ ...f, name: '', amount: '' });
      reload();
    } catch (err) { toast.error(errText(err)); } finally { setBusy(false); }
  }
  async function archive(p: any) {
    try { await client.patch(`${url}/${p._id}`, { status: p.status === 'active' ? 'archived' : 'active' }); reload(); } catch (err) { toast.error(errText(err)); }
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <form onSubmit={create} className="rounded-xl border border-line bg-white p-3 grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
          <label className="text-[12px] col-span-2">Name<input required maxLength={80} className={`${inp} w-full`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="text-[12px]">Type
            <select className={`${inp} w-full`} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option value="free">Free</option><option value="one_time">One-time</option><option value="recurring">Recurring</option>
            </select>
          </label>
          <label className="text-[12px]">Price<input type="number" min={0} step="0.01" disabled={f.type === 'free'} className={`${inp} w-full`} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></label>
          {f.type === 'recurring' && (
            <>
              <label className="text-[12px]">Every
                <select className={`${inp} w-full`} value={f.interval} onChange={(e) => setF({ ...f, interval: e.target.value })}><option value="week">week</option><option value="month">month</option><option value="year">year</option></select>
              </label>
              <label className="text-[12px]">Trial days<input type="number" min={0} max={365} className={`${inp} w-full`} value={f.trialDays} onChange={(e) => setF({ ...f, trialDays: e.target.value })} /></label>
              <label className="text-[12px]">Grace days (0-7)<input type="number" min={0} max={7} className={`${inp} w-full`} value={f.graceDays} onChange={(e) => setF({ ...f, graceDays: e.target.value })} /></label>
            </>
          )}
          <label className="text-[12px]">Tier<input type="number" min={1} max={100} className={`${inp} w-full`} value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value })} /></label>
          <button type="submit" disabled={busy} className={`${btn} h-9`}>Create plan</button>
        </form>
      )}
      <State error={error} loading={!data} empty={data?.length === 0} retry={reload} />
      <ul className="flex flex-col gap-2">
        {data?.map((p) => (
          <li key={p._id} className="rounded-xl border border-line bg-white p-3 flex items-center gap-3 text-[13px]">
            <span className="flex-1"><b>{p.name}</b> · {p.type === 'free' ? 'Free' : `${p.currency} ${p.amount}${p.type === 'recurring' ? ` / ${p.interval}` : ''}`} · tier {p.tier} · {p.status}</span>
            {canEdit && <button className={btn} onClick={() => void archive(p)}>{p.status === 'active' ? 'Archive' : 'Restore'}</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Subscribers({ storeId }: { storeId: string }) {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const url = `/api/memberships/store/${storeId}/subscribers${status ? `?status=${status}` : ''}`;
  const { data, error, reload } = useList<any[]>(url);
  async function act(id: string, action: 'mark-paid' | 'revoke') {
    try { await client.post(`/api/memberships/store/${storeId}/subscribers/${id}/${action}`); toast.success(action === 'revoke' ? 'Revoked' : 'Marked as paid'); reload(); } catch (e) { toast.error(errText(e)); }
  }
  return (
    <div className="flex flex-col gap-3">
      <select aria-label="Status filter" className={`${inp} w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {['trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>
      <State error={error} loading={!data} empty={data?.length === 0} retry={reload} />
      <ul className="flex flex-col gap-2">
        {data?.map((s) => (
          <li key={s._id} className="rounded-xl border border-line bg-white p-3 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="flex-1">Customer {String(s.customerId).slice(-6)} · <b>{s.status.replace('_', ' ')}</b>{s.awaitingFirstPayment ? ' · awaiting first payment' : ''}{s.currentPeriodEnd ? ` · until ${new Date(s.currentPeriodEnd).toLocaleDateString()}` : ''}</span>
            {['trialing', 'active', 'past_due'].includes(s.status) && <button className={btn} onClick={() => void act(s._id, 'mark-paid')}>Mark paid</button>}
            {['trialing', 'active', 'past_due', 'paused'].includes(s.status) && <button className={`${btn} text-red-600`} onClick={() => void act(s._id, 'revoke')}>Revoke</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Licenses({ storeId }: { storeId: string }) {
  const toast = useToast();
  const url = `/api/licenses/store/${storeId}`;
  const { data, error, reload } = useList<any[]>(url);
  const [token, setToken] = useState<string | null>(null);
  async function newToken() {
    if (!window.confirm('Create a new API token? The old one stops working.')) return;
    try { setToken(((await client.post(`${url}/api-token`)) as { token: string }).token); } catch (e) { toast.error(errText(e)); }
  }
  async function act(id: string, action: 'revoke' | 'reset-activations') {
    try { await client.post(`${url}/${id}/${action}`); reload(); } catch (e) { toast.error(errText(e)); }
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-line bg-white p-3 text-[13px] flex flex-col gap-2">
        <p>Your software checks keys with <code>POST /api/license/validate</code> and the header <code>x-license-token</code>.</p>
        <button className={`${btn} self-start`} onClick={() => void newToken()}>Generate API token</button>
        {token && <p>Copy it now, it is shown once: <code className="select-all break-all">{token}</code></p>}
      </div>
      <State error={error} loading={!data} empty={data?.length === 0} retry={reload} />
      <ul className="flex flex-col gap-2">
        {data?.map((k) => (
          <li key={k.id} className="rounded-xl border border-line bg-white p-3 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="flex-1">…{k.keyHint} · {k.status} · {k.activations}/{k.activationLimit} devices</span>
            <button className={btn} onClick={() => void act(k.id, 'reset-activations')}>Reset devices</button>
            {k.status === 'active' && <button className={`${btn} text-red-600`} onClick={() => void act(k.id, 'revoke')}>Revoke</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeliveryLog({ base }: { base: string }) {
  const { data, error, reload } = useList<any[]>(`${base}/delivery-log?limit=100`);
  return (
    <div>
      <State error={error} loading={!data} empty={data?.length === 0} retry={reload} />
      <ul className="flex flex-col gap-1 text-[12px]">
        {data?.map((l) => <li key={l._id} className="rounded-lg border border-line bg-white px-3 py-2">{new Date(l.at).toLocaleString()} · <b>{l.outcome}</b>{l.reason ? ` (${l.reason})` : ''}{l.flagged ? ' · flagged' : ''} · {l.ip}</li>)}
      </ul>
    </div>
  );
}

export default function DigitalHub() {
  const { storeId } = useStoreWorkspace();
  const visible = TABS.filter((t) => can(t.perm as any));
  const [tab, setTab] = useState<Tab>(visible[0]?.id ?? 'overview');
  const base = `/api/digital/${storeId}`;
  return (
    <>
      <StorePageHeader title="Digital" subtitle="Downloads, memberships and license keys" />
      <div className="px-4 lg:px-7 pt-5 pb-8 w-full flex flex-col gap-4">
        <div role="tablist" className="flex gap-1 flex-wrap">
          {visible.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg px-3 py-1.5 text-[13px] border ${tab === t.id ? 'bg-black text-white border-black' : 'border-line bg-white'}`}>{t.label}</button>
          ))}
        </div>
        {tab === 'overview' && <Overview base={base} />}
        {tab === 'plans' && <Plans storeId={storeId} />}
        {tab === 'subscribers' && <Subscribers storeId={storeId} />}
        {tab === 'licenses' && <Licenses storeId={storeId} />}
        {tab === 'log' && <DeliveryLog base={base} />}
        <p className="text-[11px] text-slate">Courses and reports are not available yet.</p>
      </div>
    </>
  );
}
