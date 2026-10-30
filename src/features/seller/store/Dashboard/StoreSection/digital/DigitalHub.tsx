import { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import client from '@/api/client';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Badge, Button, Card, EmptyState, Input, MetricCard, Select, StatusBadge, TabBar, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { CoursesTab } from './CoursesTab';

type Tab = 'overview' | 'plans' | 'subscribers' | 'courses' | 'licenses' | 'reports' | 'log';
const TABS: { id: Tab; label: string; perm: string }[] = [
  { id: 'overview', label: 'Overview', perm: 'digital.view' },
  { id: 'plans', label: 'Plans', perm: 'members.manage' },
  { id: 'subscribers', label: 'Subscribers', perm: 'members.manage' },
  { id: 'courses', label: 'Courses', perm: 'courses.manage' },
  { id: 'licenses', label: 'Licenses', perm: 'licenses.manage' },
  { id: 'reports', label: 'Reports', perm: 'digital.view' },
  { id: 'log', label: 'Delivery log', perm: 'digital.view' },
];
const PAGE_SIZE = 20;

const errText = (e: any) => e?.response?.data?.message ?? e?.message ?? 'Something went wrong';

/** Loads one endpoint; keeps loading / error (with retry) state in one place. */
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let off = false;
    setError(null);
    (client.get(url) as Promise<T>).then((d) => { if (!off) setData(d); }).catch((e) => { if (!off) { setData(null); setError(errText(e)); } });
    return () => { off = true; };
  }, [url, tick]);
  return { data, error, loading: !data && !error, reload: () => setTick((t) => t + 1) };
}

interface Paged<T> { items: T[]; total: number; page: number; limit: number }
function usePaged<T>(base: string, params: Record<string, string>) {
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ ...params, page: String(page), limit: String(PAGE_SIZE) }).toString();
  const res = useApi<Paged<T>>(`${base}?${qs}`);
  const key = JSON.stringify(params);
  useEffect(() => setPage(1), [key]);
  return { ...res, page, setPage, rows: res.data?.items ?? [], total: res.data?.total ?? 0 };
}

function ErrorLine({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error">
      <span className="flex-1">{message}</span>
      <Button size="xs" variant="outline" onClick={onRetry}>Retry</Button>
    </div>
  );
}

/** Confirm dialog used instead of window.confirm. */
function Confirm({ title, text, confirmLabel, onConfirm, onClose, danger = true }: { title: string; text: string; confirmLabel: string; onConfirm: () => void; onClose: () => void; danger?: boolean }) {
  return (
    <Modal title={title} onClose={onClose} width={420} mobileSheet={false}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button></>}>
      <p className="m-0 text-[13px] text-slate">{text}</p>
    </Modal>
  );
}

// ── Download protection ────────────────────────────────────────────────────

const MODES: { id: string; label: string; hint: string }[] = [
  { id: 'soft-flag', label: 'Flag and keep serving (recommended)', hint: 'A customer who downloads from 5 or more different networks in a day is flagged for you; they can still download.' },
  { id: 'block', label: 'Block downloads for that customer', hint: 'The 5th network in a day is refused until you reset or revoke the access. Shared networks (offices, mobile data) can trigger this.' },
  { id: 'off', label: 'Off', hint: 'No checks on where downloads come from.' },
];

function Protection({ base }: { base: string }) {
  const toast = useToast();
  const { data, error, loading, reload } = useApi<{ abuseMode: string; pausedByPlatform: boolean }>(`${base}/settings`);
  const [saving, setSaving] = useState(false);
  const canEdit = can('digital.manage');
  async function save(mode: string) {
    setSaving(true);
    try { await client.patch(`${base}/settings`, { abuseMode: mode }); toast.success('Download protection saved'); reload(); } catch (e) { toast.error(errText(e)); } finally { setSaving(false); }
  }
  if (error) return <ErrorLine message={error} onRetry={reload} />;
  const hint = MODES.find((m) => m.id === data?.abuseMode)?.hint;
  return (
    <Card padding="md">
      <h3 className="m-0 mb-2 text-[14px] font-semibold text-carbon">Download protection</h3>
      {data?.pausedByPlatform && <p role="alert" className="m-0 mb-2 text-[13px] text-error">Digital delivery for this store is paused by the platform. Contact support.</p>}
      <div className="max-w-md">
        <Select aria-label="When one customer downloads from many networks" disabled={loading || saving || !canEdit} value={data?.abuseMode ?? 'soft-flag'} onChange={(e) => void save(e.target.value)}>
          {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </Select>
      </div>
      {hint && <p className="m-0 mt-2 text-[12px] text-slate">{hint}</p>}
      {!canEdit && <p className="m-0 mt-2 text-[12px] text-slate">Your role can view this setting but not change it.</p>}
    </Card>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────

function Overview({ base }: { base: string }) {
  const { data, error, loading, reload } = useApi<any>(`${base}/overview`);
  if (error) return <ErrorLine message={error} onRetry={reload} />;
  const m = data?.memberships;
  const a = data?.needsAttention;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard label="Digital revenue (30 days)" value={data?.last30Days.digitalRevenue ?? 0} loading={loading} />
        <MetricCard label="Digital items sold (30 days)" value={data?.last30Days.digitalItemsSold ?? 0} loading={loading} />
        <MetricCard label="Deliveries (30 days)" value={data?.last30Days.deliveries ?? 0} sub={data ? `${data.last30Days.deniedOrFailed} denied or failed` : undefined} loading={loading} />
        <MetricCard label="Monthly recurring revenue" value={m?.mrr ?? 0} loading={loading} />
        <MetricCard label="Active members" value={m?.counts.active ?? 0} sub={m ? `${m.counts.trialing} trialing` : undefined} loading={loading} />
        <MetricCard label="Churned" value={m?.churned ?? 0} sub={m ? `${m.counts.past_due} past due` : undefined} loading={loading} />
      </div>
      <Card padding="md">
        <h3 className="m-0 mb-2 text-[14px] font-semibold text-carbon">Needs attention</h3>
        {!a ? <p className="m-0 text-[13px] text-slate">Loading...</p> : a.pastDue + a.awaitingPayment + a.flaggedAccess === 0 ? <p className="m-0 text-[13px] text-slate">All clear.</p> : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[13px] text-carbon">
            {a.pastDue > 0 && <li><Badge color="yellow">{a.pastDue}</Badge> past-due membership(s)</li>}
            {a.awaitingPayment > 0 && <li><Badge color="orange">{a.awaitingPayment}</Badge> member(s) waiting for you to confirm payment</li>}
            {a.flaggedAccess > 0 && <li><Badge color="red">{a.flaggedAccess}</Badge> download access(es) flagged for unusual activity</li>}
          </ul>
        )}
      </Card>
      <Protection base={base} />
      <p className="m-0 text-[11px] text-slate">Revenue is the sum of paid digital items in the order currency, before other refunds and discounts. It is a guide, not accounting data.</p>
    </div>
  );
}

// ── Plans ──────────────────────────────────────────────────────────────────

const BLANK_PLAN = { name: '', type: 'recurring', amount: '', interval: 'month', trialDays: '0', graceDays: '0', tier: '1', productId: '' };

function Plans({ storeId }: { storeId: string }) {
  const toast = useToast();
  const url = `/api/memberships/store/${storeId}/plans`;
  const { data, error, loading, reload } = useApi<any[]>(url);
  const [f, setF] = useState(BLANK_PLAN);
  const [busy, setBusy] = useState(false);
  const canEdit = can('members.manage');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.post(url, { ...f, productId: f.productId || null, amount: Number(f.amount) || 0, trialDays: Number(f.trialDays), graceDays: Number(f.graceDays), tier: Number(f.tier) });
      toast.success('Plan created');
      setF(BLANK_PLAN);
      reload();
    } catch (err) { toast.error(errText(err)); } finally { setBusy(false); }
  }
  async function toggle(p: any) {
    try { await client.patch(`${url}/${p._id}`, { status: p.status === 'active' ? 'archived' : 'active' }); reload(); } catch (err) { toast.error(errText(err)); }
  }
  const set = (k: keyof typeof BLANK_PLAN) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const columns: TableColumn<any>[] = [
    { key: 'name', header: 'Plan', render: (p) => <span className="font-medium text-carbon">{p.name}</span> },
    { key: 'price', header: 'Price', render: (p) => (p.type === 'free' ? 'Free' : `${p.currency} ${p.amount}${p.type === 'recurring' ? ` / ${p.interval}` : ' one-time'}`) },
    { key: 'tier', header: 'Tier' },
    { key: 'sold', header: 'Sold by', render: (p) => (p.productId ? 'Product (checkout)' : 'Manual request') },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} size="sm" /> },
    { key: 'a', header: '', align: 'right', render: (p) => (canEdit ? <Button size="xs" variant="outline" onClick={() => void toggle(p)}>{p.status === 'active' ? 'Archive' : 'Restore'}</Button> : null) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card padding="md">
        <p className="m-0 text-[13px] text-carbon"><Badge color="orange">Manual billing</Badge> Members pay you directly (your own payment method). Each period you confirm the payment with <b>Mark paid</b>, or link a product so buying it through your checkout starts and renews the plan. Automatic card renewal is not available yet.</p>
      </Card>
      {canEdit && (
        <Card padding="md">
          <form onSubmit={create} className="grid grid-cols-2 items-end gap-3 md:grid-cols-4">
            <div className="col-span-2"><Input label="Name" required maxLength={80} value={f.name} onChange={set('name')} /></div>
            <Select label="Type" value={f.type} onChange={set('type')}><option value="free">Free</option><option value="one_time">One-time</option><option value="recurring">Recurring</option></Select>
            <Input label="Price" type="number" min={0} step="0.01" disabled={f.type === 'free'} value={f.amount} onChange={set('amount')} />
            {f.type === 'recurring' && (<>
              <Select label="Every" value={f.interval} onChange={set('interval')}><option value="week">week</option><option value="month">month</option><option value="year">year</option></Select>
              <Input label="Trial days" type="number" min={0} max={365} value={f.trialDays} onChange={set('trialDays')} />
              <Input label="Grace days (0-7)" type="number" min={0} max={7} value={f.graceDays} onChange={set('graceDays')} />
            </>)}
            <Input label="Tier" type="number" min={1} max={100} value={f.tier} onChange={set('tier')} />
            <div className="col-span-2"><Input label="Product ID (optional)" value={f.productId} onChange={set('productId')} /></div>
            <Button type="submit" size="sm" loading={busy}>Create plan</Button>
          </form>
        </Card>
      )}
      {error ? <ErrorLine message={error} onRetry={reload} /> : (
        <Table columns={columns} data={data ?? []} keyExtractor={(p) => p._id} loading={loading}
          emptyState={{ title: 'No plans yet', description: 'Create a plan above to start selling memberships.' }} />
      )}
    </div>
  );
}

// ── Subscribers ────────────────────────────────────────────────────────────

function Subscribers({ storeId }: { storeId: string }) {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { rows, total, page, setPage, loading, error, reload } = usePaged<any>(`/api/memberships/store/${storeId}/subscribers`, status ? { status } : {});
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);
  const canEdit = can('members.manage');

  async function act(id: string, action: 'mark-paid' | 'revoke') {
    try { await client.post(`/api/memberships/store/${storeId}/subscribers/${id}/${action}`); toast.success(action === 'revoke' ? 'Membership revoked' : 'Marked as paid'); reload(); } catch (e) { toast.error(errText(e)); }
  }
  const columns: TableColumn<any>[] = [
    { key: 'c', header: 'Customer', render: (s) => <div><div className="font-medium text-carbon">{s.customerName ?? 'Customer'}</div><div className="text-[11px] text-slate">{s.customerEmail ?? ''}</div></div> },
    { key: 'p', header: 'Plan', render: (s) => s.planName },
    { key: 's', header: 'Status', render: (s) => <div className="flex flex-wrap gap-1"><StatusBadge status={s.status} size="sm" />{s.awaitingFirstPayment && <Badge color="orange" size="sm">Awaiting first payment</Badge>}</div> },
    { key: 'e', header: 'Period ends', render: (s) => (s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—') },
    { key: 'a', header: '', align: 'right', render: (s) => (!canEdit ? null : (
      <div className="flex justify-end gap-1.5">
        {['trialing', 'active', 'past_due'].includes(s.status) && <Button size="xs" variant="outline" onClick={() => void act(s._id, 'mark-paid')}>Mark paid</Button>}
        {['trialing', 'active', 'past_due', 'paused'].includes(s.status) && <Button size="xs" variant="danger" onClick={() => setConfirm({ id: s._id })}>Revoke</Button>}
      </div>
    )) },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="w-52">
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </Select>
      </div>
      {error ? <ErrorLine message={error} onRetry={reload} /> : (
        <Table columns={columns} data={rows} keyExtractor={(s) => s._id} loading={loading}
          pagination={{ page, total, perPage: PAGE_SIZE, onChange: setPage, label: 'members' }}
          emptyState={{ title: 'No subscribers yet', description: status ? 'No memberships with this status.' : 'Members will appear here after they join a plan.' }} />
      )}
      {confirm && <Confirm title="Revoke this membership?" text="The member loses access to plan-locked content immediately." confirmLabel="Revoke" onConfirm={() => void act(confirm.id, 'revoke')} onClose={() => setConfirm(null)} />}
    </div>
  );
}

// ── Licenses ───────────────────────────────────────────────────────────────

function Licenses({ storeId }: { storeId: string }) {
  const toast = useToast();
  const base = `/api/licenses/store/${storeId}`;
  const [status, setStatus] = useState('');
  const { rows, total, page, setPage, loading, error, reload } = usePaged<any>(base, status ? { status } : {});
  const [token, setToken] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'token' | { id: string } | null>(null);

  async function newToken() {
    try { setToken(((await client.post(`${base}/api-token`)) as { token: string }).token); } catch (e) { toast.error(errText(e)); }
  }
  async function act(id: string, action: 'revoke' | 'reset-activations') {
    try { await client.post(`${base}/${id}/${action}`); toast.success(action === 'revoke' ? 'License revoked' : 'Devices reset'); reload(); } catch (e) { toast.error(errText(e)); }
  }
  const columns: TableColumn<any>[] = [
    { key: 'k', header: 'Key', render: (k) => <code className="text-[12px]">…{k.keyHint}</code> },
    { key: 'p', header: 'Product', render: (k) => k.productName },
    { key: 'd', header: 'Devices', render: (k) => `${k.activations} / ${k.activationLimit}` },
    { key: 's', header: 'Status', render: (k) => <StatusBadge status={k.status} size="sm" /> },
    { key: 'a', header: '', align: 'right', render: (k) => (
      <div className="flex justify-end gap-1.5">
        <Button size="xs" variant="outline" onClick={() => void act(k.id, 'reset-activations')}>Reset devices</Button>
        {k.status === 'active' && <Button size="xs" variant="danger" onClick={() => setConfirm({ id: k.id })}>Revoke</Button>}
      </div>
    ) },
  ];
  return (
    <div className="flex flex-col gap-3">
      <Card padding="md">
        <p className="m-0 mb-2 text-[13px] text-carbon">Your software checks a key with <code>POST /api/license/validate</code> and the header <code>x-license-token</code>.</p>
        <Button size="sm" variant="outline" onClick={() => setConfirm('token')}>Generate API token</Button>
        {token && <p className="m-0 mt-2 text-[12px] text-carbon">Copy it now, it is shown once: <code className="select-all break-all">{token}</code></p>}
      </Card>
      <div className="w-52">
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All keys</option><option value="active">Active</option><option value="revoked">Revoked</option></Select>
      </div>
      {error ? <ErrorLine message={error} onRetry={reload} /> : (
        <Table columns={columns} data={rows} keyExtractor={(k) => k.id} loading={loading}
          pagination={{ page, total, perPage: PAGE_SIZE, onChange: setPage, label: 'keys' }}
          emptyState={{ title: 'No license keys yet', description: 'Switch on "Give each buyer a license key" in a digital product to issue keys.' }} />
      )}
      {confirm === 'token' && <Confirm title="Generate a new API token?" text="The old token stops working immediately." confirmLabel="Generate" danger={false} onConfirm={() => void newToken()} onClose={() => setConfirm(null)} />}
      {confirm && confirm !== 'token' && <Confirm title="Revoke this license?" text="The key stops validating." confirmLabel="Revoke" onConfirm={() => void act(confirm.id, 'revoke')} onClose={() => setConfirm(null)} />}
    </div>
  );
}

// ── Reports ────────────────────────────────────────────────────────────────

function Reports({ base }: { base: string }) {
  const { data, error, loading, reload } = useApi<{ topProducts: { productId: string; name: string; deliveries: number; customers: number }[]; perDay: { day: string; outcome: string; count: number }[] }>(`${base}/reports`);
  if (error) return <ErrorLine message={error} onRetry={reload} />;
  const days = Array.from(new Set((data?.perDay ?? []).map((d) => d.day))).map((day) => ({ day }));
  const count = (day: string, o: string) => data?.perDay.find((d) => d.day === day && d.outcome === o)?.count ?? 0;
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-[14px] font-semibold text-carbon">Most downloaded (30 days)</h3>
        <Table columns={[{ key: 'n', header: 'Product', render: (p: any) => p.name }, { key: 'd', header: 'Downloads', render: (p: any) => p.deliveries }, { key: 'c', header: 'Customers', render: (p: any) => p.customers }]}
          data={data?.topProducts ?? []} keyExtractor={(p: any) => p.productId} loading={loading} emptyState={{ title: 'No downloads yet' }} />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-[14px] font-semibold text-carbon">Deliveries per day</h3>
        <Table columns={[{ key: 'day', header: 'Day', render: (d: any) => d.day }, { key: 'ok', header: 'Delivered', render: (d: any) => count(d.day, 'ok') }, { key: 'dn', header: 'Denied', render: (d: any) => count(d.day, 'denied') }, { key: 'f', header: 'Failed', render: (d: any) => count(d.day, 'failed') }]}
          data={days} keyExtractor={(d: any) => d.day} loading={loading} emptyState={{ title: 'Nothing to show yet' }} />
      </section>
    </div>
  );
}

// ── Delivery log ───────────────────────────────────────────────────────────

function DeliveryLog({ base }: { base: string }) {
  const [outcome, setOutcome] = useState('');
  const { rows, total, page, setPage, loading, error, reload } = usePaged<any>(`${base}/delivery-log`, outcome ? { outcome } : {});
  const columns: TableColumn<any>[] = [
    { key: 'at', header: 'When', render: (l) => new Date(l.at).toLocaleString() },
    { key: 'o', header: 'Result', render: (l) => <div className="flex gap-1"><Badge color={l.outcome === 'ok' ? 'green' : l.outcome === 'denied' ? 'yellow' : 'red'} size="sm">{l.outcome === 'ok' ? 'Delivered' : l.outcome === 'denied' ? 'Denied' : 'Failed'}</Badge>{l.flagged && <Badge color="red" size="sm">Flagged</Badge>}</div> },
    { key: 'r', header: 'Reason', render: (l) => (l.reason ? String(l.reason).replace(/_/g, ' ') : '—') },
    { key: 'ip', header: 'IP', render: (l) => l.ip },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="w-52">
        <Select aria-label="Filter by result" value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="">All results</option><option value="ok">Delivered</option><option value="denied">Denied</option><option value="failed">Failed</option></Select>
      </div>
      {error ? <ErrorLine message={error} onRetry={reload} /> : (
        <Table columns={columns} data={rows} keyExtractor={(l) => l._id} loading={loading}
          pagination={{ page, total, perPage: PAGE_SIZE, onChange: setPage, label: 'events' }}
          emptyState={{ title: 'No deliveries yet', description: 'Every download attempt is logged here.' }} />
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DigitalHub() {
  const { storeId } = useStoreWorkspace();
  const visible = TABS.filter((t) => can(t.perm as any));
  const [tab, setTab] = useState<Tab>(visible[0]?.id ?? 'overview');
  const base = `/api/digital/${storeId}`;
  const change = useCallback((id: string) => setTab(id as Tab), []);
  return (
    <>
      <StorePageHeader title="Digital" subtitle="Downloads, memberships, courses and license keys" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {visible.length === 0 ? <EmptyState icon={<Lock size={22} />} title="No access" description="Your role does not include any digital permission." /> : (
          <>
            <TabBar tabs={visible.map((t) => ({ id: t.id, label: t.label }))} active={tab} onChange={change} />
            {tab === 'overview' && <Overview base={base} />}
            {tab === 'plans' && <Plans storeId={storeId} />}
            {tab === 'subscribers' && <Subscribers storeId={storeId} />}
            {tab === 'courses' && <CoursesTab storeId={storeId} />}
            {tab === 'licenses' && <Licenses storeId={storeId} />}
            {tab === 'reports' && <Reports base={base} />}
            {tab === 'log' && <DeliveryLog base={base} />}
          </>
        )}
      </div>
    </>
  );
}
