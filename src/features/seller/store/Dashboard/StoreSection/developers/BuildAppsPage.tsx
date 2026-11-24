import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock } from 'lucide-react';
import { errorMessage } from '@/api/errorMessage';
import {
  apiDevCreateApp, apiDevCreateStore, apiDevDeleteApp, apiDevDeleteStore, apiDevRotateSecrets, apiDevSubmitApp, apiDevUpdateApp,
  devAppState, type AppSecrets, type DevApp, type DevAppInput, type DevStore,
} from '@/api/services/developerPortal';
import { TokenStorage } from '@/api/services/auth';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Badge, Button, Card, CopyIconButton, EmptyState, Input, TabBar, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { shortDate, useApi } from '../wholesale/wholesaleUtils';

const SCOPES = ['read_orders', 'write_orders', 'read_products', 'write_products', 'read_customers', 'write_customers', 'read_inventory', 'write_inventory'];
const EVENTS = ['order.created', 'order.paid', 'order.fulfilled', 'order.cancelled', 'refund.created', 'product.updated', 'inventory.changed', 'customer.created', 'form.submitted'];
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

type Form = { name: string; description: string; developerName: string; developerEmail: string; redirectUrls: string; scopes: string[]; webhookUrl: string; events: string[]; uninstallWebhookUrl: string; embedUrl: string; embedTitle: string };
const EMPTY: Form = { name: '', description: '', developerName: '', developerEmail: '', redirectUrls: '', scopes: ['read_orders'], webhookUrl: '', events: [], uninstallWebhookUrl: '', embedUrl: '', embedTitle: '' };
const formOf = (a: DevApp): Form => ({ name: a.name, description: a.description, developerName: a.developerName, developerEmail: a.developerEmail, redirectUrls: a.redirectUrls.join('\n'), scopes: a.requestedScopes, webhookUrl: a.webhookUrl ?? '', events: a.webhookEvents, uninstallWebhookUrl: a.uninstallWebhookUrl ?? '', embedUrl: a.embedUrl ?? '', embedTitle: a.embedTitle });
const bodyOf = (f: Form): DevAppInput => ({ name: f.name.trim(), description: f.description, developerName: f.developerName, developerEmail: f.developerEmail, redirectUrls: lines(f.redirectUrls), requestedScopes: f.scopes, webhookUrl: f.webhookUrl.trim() || null, webhookEvents: f.webhookUrl.trim() ? f.events : [], uninstallWebhookUrl: f.uninstallWebhookUrl.trim() || null, embedUrl: f.embedUrl.trim() || null, embedTitle: f.embedTitle });

/**
 * Build apps: the account's own apps and free development stores. They belong to the person (the seller login), not
 * to the store this page is opened from, so staff see a note instead.
 */
export default function BuildAppsPage() {
  const [tab, setTab] = useState('apps');
  const isStaff = TokenStorage.getUser<{ role?: string }>()?.role === 'staff';
  return (
    <>
      <StorePageHeader title="Build apps" subtitle="Your own apps and test stores. They belong to your account, not to this store." />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {isStaff ? (
          <EmptyState icon={<Lock size={22} />} title="Store owners only" description="Apps and development stores belong to a person's own Solvexo account. Sign in with your own account to build apps." />
        ) : (
          <>
            <Card padding="md">
              <p className="m-0 text-[13px] text-slate">
                A new app is private: you can install it on stores you own straight away, with no review. When it's ready for every Solvexo seller, ask for a listing and our team reviews it.{' '}
                <a href="/developers" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-orange"><BookOpen size={13} aria-hidden /> API guide</a>
              </p>
            </Card>
            <TabBar tabs={[{ id: 'apps', label: 'My apps' }, { id: 'stores', label: 'Development stores' }]} active={tab} onChange={setTab} />
            {tab === 'apps' ? <Apps /> : <Stores />}
          </>
        )}
      </div>
    </>
  );
}

function SecretsModal({ title, secrets, onClose }: { title: string; secrets: AppSecrets; onClose: () => void }) {
  const rows: [string, string][] = [
    ...(secrets.clientId ? [['Client id', secrets.clientId] as [string, string]] : []),
    ['Client secret', secrets.clientSecret],
    ['Session secret (checks the dashboard page token and the uninstall webhook)', secrets.sessionSecret],
  ];
  return (
    <Modal title={title} onClose={onClose} width={560} footer={<Button size="sm" onClick={onClose}>I have saved them</Button>}>
      <p className="mt-0 text-[13px] text-slate">Copy them now. For your safety the secrets are shown only this once.</p>
      <div className="flex flex-col gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-bone p-3">
            <p className="m-0 mb-1 text-[12px] font-semibold text-carbon">{label}</p>
            <div className="flex items-center gap-2 break-all font-mono text-xs">{value}<CopyIconButton value={value} title={`Copy ${label}`} /></div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function Apps() {
  const toast = useToast();
  const list = useApi<{ items: DevApp[]; max: number }>('/api/developer/apps');
  const [editing, setEditing] = useState<DevApp | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState('');
  const [secrets, setSecrets] = useState<{ title: string; secrets: AppSecrets } | null>(null);
  const [deleting, setDeleting] = useState<DevApp | null>(null);
  const [busy, setBusy] = useState('');
  const items = list.data?.items ?? [];
  const atLimit = !!list.data && items.length >= list.data.max;

  const open = (a: DevApp | 'new') => { setFormError(''); setEditing(a); setForm(a === 'new' ? EMPTY : formOf(a)); };
  async function save() {
    setBusy('save'); setFormError('');
    try {
      if (editing === 'new') {
        const r = await apiDevCreateApp(bodyOf(form));
        setSecrets({ title: `${form.name.trim()}: your app's keys`, secrets: r });
      } else if (editing) {
        const r = await apiDevUpdateApp(editing.id, bodyOf(form));
        toast.success(r.relisting ? 'Saved. The new permission needs a review, so the app is unlisted until then.' : 'App saved');
      }
      setEditing(null); list.reload();
    } catch (e) { setFormError(errorMessage(e)); } finally { setBusy(''); }
  }
  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try { await fn(); toast.success(ok); list.reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(''); }
  }

  const columns: TableColumn<DevApp>[] = [
    { key: 'n', header: 'App', render: (a) => (
      <div>
        <div className="font-semibold text-carbon">{a.name}</div>
        <div className="font-mono text-xs text-slate break-all">{a.clientId}</div>
        {a.reviewStatus === 'rejected' && a.reviewNote && <div className="mt-1 text-xs text-error">Review: {a.reviewNote}</div>}
      </div>) },
    { key: 's', header: 'Status', render: (a) => { const s = devAppState(a); return <Badge color={s.color} size="sm">{s.label}</Badge>; } },
    { key: 'i', header: 'Installs', render: (a) => <span className="tabular-nums">{a.installs}</span> },
    { key: 'a', header: 'Actions', align: 'right', render: (a) => (
      <div className="flex flex-wrap justify-end gap-1">
        {a.status !== 'suspended' && <Button size="xs" variant="outline" onClick={() => open(a)}>Edit</Button>}
        {a.status !== 'suspended' && <Button size="xs" variant="outline" loading={busy === `r${a.id}`} onClick={() => void run(`r${a.id}`, async () => { const r = await apiDevRotateSecrets(a.id); setSecrets({ title: `${a.name}: new secrets`, secrets: r }); }, 'New secrets made. The old ones stop working now.')}>New secrets</Button>}
        {a.status === 'draft' && a.reviewStatus !== 'submitted' && <Button size="xs" loading={busy === `s${a.id}`} onClick={() => void run(`s${a.id}`, () => apiDevSubmitApp(a.id), 'Sent for review')}>Ask for a listing</Button>}
        {a.status !== 'approved' && <Button size="xs" variant="outline" onClick={() => setDeleting(a)}>Delete</Button>}
      </div>) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={atLimit} onClick={() => open('new')}>Create app</Button>
        {atLimit && <span className="text-[13px] text-slate">You have the most apps an account can have ({list.data?.max}). Delete one to make another.</span>}
      </div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} />
        : <Table columns={columns} data={items} keyExtractor={(a) => a.id} loading={list.loading} emptyState={{ title: 'No apps yet', description: 'Create an app to get its keys, then install it on a development store to try it.' }} />}

      {editing && (
        <Modal title={editing === 'new' ? 'Create an app' : `Edit ${editing.name}`} onClose={() => setEditing(null)} width={680} mobileSheet
          footer={<><Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button><Button size="sm" loading={busy === 'save'} disabled={!form.name.trim() || form.scopes.length === 0 || !lines(form.redirectUrls).length} onClick={() => void save()}>Save</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="App name" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="What it does (shown to store owners)" value={form.description} maxLength={500} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Your name or company" value={form.developerName} maxLength={120} onChange={(e) => setForm({ ...form, developerName: e.target.value })} />
              <Input label="Support email" type="email" value={form.developerEmail} maxLength={160} onChange={(e) => setForm({ ...form, developerEmail: e.target.value })} />
            </div>
            <label className="flex flex-col gap-1 text-[13px] text-carbon">Redirect addresses (https, one per line, exact match)
              <textarea className="min-h-[70px] rounded-lg border border-bone p-2 text-[13px]" value={form.redirectUrls} onChange={(e) => setForm({ ...form, redirectUrls: e.target.value })} placeholder="https://yourapp.com/oauth/callback" />
            </label>
            <fieldset className="m-0 border-0 p-0 text-[13px]"><legend className="mb-1 font-semibold text-carbon">Permissions the app may ask for</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">{SCOPES.map((s) => <label key={s} className="flex items-center gap-2"><input type="checkbox" checked={form.scopes.includes(s)} onChange={() => setForm({ ...form, scopes: toggle(form.scopes, s) })} />{s}</label>)}</div>
            </fieldset>
            {editing !== 'new' && editing.listed && <p className="m-0 text-[12.5px] text-slate">Adding a permission to a listed app sends it back for review. Stores that already installed it keep working.</p>}
            <Input label="Webhook address (https, optional)" value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} />
            {form.webhookUrl.trim() && (
              <fieldset className="m-0 border-0 p-0 text-[13px]"><legend className="mb-1 font-semibold text-carbon">Events</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-1">{EVENTS.map((ev) => <label key={ev} className="flex items-center gap-2"><input type="checkbox" checked={form.events.includes(ev)} onChange={() => setForm({ ...form, events: toggle(form.events, ev) })} />{ev}</label>)}</div>
              </fieldset>
            )}
            <Input label="Uninstall webhook address (https, optional)" value={form.uninstallWebhookUrl} onChange={(e) => setForm({ ...form, uninstallWebhookUrl: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Dashboard page address (https, optional)" value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} />
              <Input label="Dashboard page title" value={form.embedTitle} maxLength={60} onChange={(e) => setForm({ ...form, embedTitle: e.target.value })} />
            </div>
            {formError && <p role="alert" className="m-0 text-[12.5px] text-error">{formError}</p>}
          </div>
        </Modal>
      )}
      {secrets && <SecretsModal title={secrets.title} secrets={secrets.secrets} onClose={() => setSecrets(null)} />}
      {deleting && (
        <Modal title={`Delete ${deleting.name}?`} onClose={() => setDeleting(null)} width={460}
          footer={<><Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button><Button size="sm" loading={busy === `d${deleting.id}`} onClick={() => { const a = deleting; void run(`d${a.id}`, async () => { await apiDevDeleteApp(a.id); setDeleting(null); }, 'App deleted'); }}>Delete app</Button></>}>
          <p className="m-0 text-[13px]">The app is removed from {deleting.installs === 1 ? 'the 1 store' : `the ${deleting.installs} stores`} it's installed on: its access stops and its webhooks are deleted. This can't be undone.</p>
        </Modal>
      )}
    </div>
  );
}

function Stores() {
  const toast = useToast();
  const navigate = useNavigate();
  const { storeId } = useStoreWorkspace();
  const list = useApi<{ items: DevStore[]; max: number }>('/api/developer/stores');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [made, setMade] = useState<{ id: string; name: string; password: string } | null>(null);
  const [deleting, setDeleting] = useState<DevStore | null>(null);
  const [busy, setBusy] = useState(false);
  const items = list.data?.items ?? [];
  const atLimit = !!list.data && items.length >= list.data.max;

  async function create() {
    setBusy(true);
    try { const r = await apiDevCreateStore({ name: name.trim() }); setAdding(false); setName(''); setMade(r); list.reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  async function remove(s: DevStore) {
    setBusy(true);
    try {
      await apiDevDeleteStore(s.id); setDeleting(null); toast.success('Development store deleted');
      // Deleted the store this page was opened in: go to another of the seller's stores.
      if (s.id === storeId) { navigate('/seller'); return; }
      list.reload();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  const columns: TableColumn<DevStore>[] = [
    { key: 'n', header: 'Store', render: (s) => <div><div className="font-semibold text-carbon">{s.name}</div><div className="text-xs text-slate">{s.slug} · {s.currency} · made {shortDate(s.createdAt)}</div></div> },
    { key: 'a', header: 'Actions', align: 'right', render: (s) => (
      <div className="flex flex-wrap justify-end gap-1">
        {s.id !== storeId && <Button size="xs" variant="outline" onClick={() => navigate(`/store/${s.id}/dashboard`)}>Open</Button>}
        <Button size="xs" variant="outline" onClick={() => setDeleting(s)}>Delete</Button>
      </div>) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[13px] text-slate">Free test stores with every feature on and sample products. They're hidden behind a password, can't take real payments and can't go live. Make test orders with Draft orders.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={atLimit} onClick={() => setAdding(true)}>Create development store</Button>
        {atLimit && <span className="text-[13px] text-slate">You have the most development stores an account can have ({list.data?.max}). Delete one to make another.</span>}
      </div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} />
        : <Table columns={columns} data={items} keyExtractor={(s) => s.id} loading={list.loading} emptyState={{ title: 'No development stores yet', description: 'Create one to install and test your app without touching a real store.' }} />}

      {adding && (
        <Modal title="Create a development store" onClose={() => setAdding(false)} width={460}
          footer={<><Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button><Button size="sm" loading={busy} disabled={!name.trim()} onClick={() => void create()}>Create</Button></>}>
          <Input label="Store name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="My app test store" />
        </Modal>
      )}
      {made && (
        <Modal title={`${made.name} is ready`} onClose={() => setMade(null)} width={520}
          footer={<><Button variant="outline" size="sm" onClick={() => setMade(null)}>Done</Button><Button size="sm" onClick={() => navigate(`/store/${made.id}/dashboard`)}>Open the store</Button></>}>
          <p className="mt-0 text-[13px] text-slate">The storefront is password-protected. Here's the password for you and your testers. It's shown only this once; you can set a new one in the store's settings.</p>
          <div className="flex items-center gap-2 break-all rounded-lg border border-bone p-3 font-mono text-xs">{made.password}<CopyIconButton value={made.password} title="Copy the password" /></div>
        </Modal>
      )}
      {deleting && (
        <Modal title={`Delete ${deleting.name}?`} onClose={() => setDeleting(null)} width={460}
          footer={<><Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button><Button size="sm" loading={busy} onClick={() => void remove(deleting)}>Delete store</Button></>}>
          <p className="m-0 text-[13px]">The test store and its sample data are removed. This can't be undone.</p>
        </Modal>
      )}
    </div>
  );
}
