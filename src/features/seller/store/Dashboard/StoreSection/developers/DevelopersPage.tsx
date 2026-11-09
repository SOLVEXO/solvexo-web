import { useState } from 'react';
import { Lock } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Badge, Button, Card, CopyIconButton, EmptyState, Input, TabBar, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { shortDate, useApi } from '../wholesale/wholesaleUtils';

interface Hook { _id: string; url: string; events: string[]; enabled: boolean; secretHint: string; consecutiveFailures: number; disabledReason: string | null }
interface Delivery { _id: string; event: string; status: string; attempts: number; responseStatus: number | null; error: string | null; createdAt: string }
interface Tok { _id: string; name: string; prefix: string; scopes: string[]; revokedAt: string | null; lastUsedAt: string | null }

/** Webhooks and API tokens for connecting your store to other software. Secrets and tokens are shown once. */
export default function DevelopersPage() {
  const { storeId } = useStoreWorkspace();
  const [tab, setTab] = useState('webhooks');
  return (
    <>
      <StorePageHeader title="Webhooks & API" subtitle="Connect your store to other software" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {can('settings.general.manage' as StaffPermission) ? (
          <>
            <TabBar tabs={[{ id: 'webhooks', label: 'Webhooks' }, { id: 'tokens', label: 'API tokens' }]} active={tab} onChange={setTab} />
            {tab === 'webhooks' ? <Hooks storeId={storeId} /> : <Tokens storeId={storeId} />}
          </>
        ) : <EmptyState icon={<Lock size={22} />} title="No access" description="Your role cannot manage store settings." />}
      </div>
    </>
  );
}

function Secret({ label, value, onClose }: { label: string; value: string; onClose: () => void }) {
  return (
    <Modal title={label} onClose={onClose} width={520} footer={<Button size="sm" onClick={onClose}>I have saved it</Button>}>
      <p className="mt-0 text-[13px] text-slate">Copy it now. For your safety it is shown only this once.</p>
      <div className="flex items-center gap-2 break-all rounded-lg border border-bone p-3 font-mono text-xs">{value}<CopyIconButton value={value} /></div>
    </Modal>
  );
}

function Hooks({ storeId }: { storeId: string }) {
  const toast = useToast();
  const base = `/api/merchant-api/${storeId}`;
  const list = useApi<{ events: string[]; items: Hook[] }>(`${base}/webhooks`);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<{ url: string; events: string[] }>({ url: '', events: [] });
  const [secret, setSecret] = useState<string | null>(null);
  const [log, setLog] = useState<Hook | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<unknown>, ok: string) { setBusy(true); try { await fn(); toast.success(ok); list.reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } }
  async function create() {
    setBusy(true);
    try { const r = (await client.post(`${base}/webhooks`, form)) as unknown as { secret: string }; setAdding(false); setForm({ url: '', events: [] }); setSecret(r.secret); list.reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  const columns: TableColumn<Hook>[] = [
    { key: 'u', header: 'Address', render: (h) => <div><div className="break-all font-semibold text-carbon">{h.url}</div><div className="text-xs text-slate">{h.events.join(', ')}</div>{h.disabledReason && <div className="text-xs text-error">{h.disabledReason}</div>}</div> },
    { key: 's', header: 'Status', render: (h) => (h.enabled ? <Badge color="green" size="sm">On</Badge> : <Badge color="red" size="sm">Off</Badge>) },
    { key: 'a', header: 'Actions', align: 'right', render: (h) => (
      <div className="flex flex-wrap justify-end gap-1">
        <Button size="xs" variant="outline" onClick={() => setLog(h)}>Deliveries</Button>
        <Button size="xs" variant="outline" disabled={busy} onClick={() => void run(() => client.patch(`${base}/webhooks/${h._id}`, { enabled: !h.enabled }), h.enabled ? 'Switched off' : 'Switched on')}>{h.enabled ? 'Switch off' : 'Switch on'}</Button>
        <Button size="xs" variant="outline" disabled={busy} onClick={() => void (async () => { try { const r = (await client.post(`${base}/webhooks/${h._id}/rotate-secret`, {})) as unknown as { secret: string }; setSecret(r.secret); list.reload(); } catch (e) { toast.error(errorMessage(e)); } })()}>New secret</Button>
        <Button size="xs" variant="outline" disabled={busy} onClick={() => void run(() => client.delete(`${base}/webhooks/${h._id}`), 'Deleted')}>Delete</Button>
      </div>) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[13px] text-slate">We send a signed HTTPS POST to your address when something happens. Check the <code>X-Solvexo-Signature</code> header (t=time,v1=HMAC-SHA256 of "time.body" with your secret) and reject old timestamps. Failed deliveries are retried; a webhook that keeps failing is switched off.</p>
      <div><Button onClick={() => setAdding(true)}>Add webhook</Button></div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : <Table columns={columns} data={list.data?.items ?? []} keyExtractor={(h) => h._id} loading={list.loading} emptyState={{ title: 'No webhooks yet', description: 'Add an address to receive order and product events.' }} />}
      {adding && (
        <Modal title="Add webhook" onClose={() => setAdding(false)} width={520} footer={<><Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button><Button size="sm" loading={busy} disabled={!form.url || form.events.length === 0} onClick={() => void create()}>Create</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="Address (https)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/hooks/solvexo" />
            <fieldset className="m-0 flex flex-col gap-1 border-0 p-0 text-[13px]"><legend className="mb-1 font-semibold text-carbon">Events</legend>
              {(list.data?.events ?? []).map((ev) => <label key={ev} className="flex items-center gap-2"><input type="checkbox" checked={form.events.includes(ev)} onChange={(e) => setForm({ ...form, events: e.target.checked ? [...form.events, ev] : form.events.filter((x) => x !== ev) })} />{ev}</label>)}
            </fieldset>
          </div>
        </Modal>
      )}
      {secret && <Secret label="Signing secret" value={secret} onClose={() => setSecret(null)} />}
      {log && <DeliveryLog storeId={storeId} hook={log} onClose={() => setLog(null)} />}
    </div>
  );
}

function DeliveryLog({ storeId, hook, onClose }: { storeId: string; hook: Hook; onClose: () => void }) {
  const toast = useToast();
  const base = `/api/merchant-api/${storeId}`;
  const [page, setPage] = useState(1);
  const r = useApi<{ items: Delivery[]; total: number }>(`${base}/webhooks/${hook._id}/deliveries?page=${page}&limit=10`);
  const columns: TableColumn<Delivery>[] = [
    { key: 'e', header: 'Event', render: (d) => <div>{d.event}<div className="text-xs text-slate">{shortDate(d.createdAt)}</div></div> },
    { key: 's', header: 'Result', render: (d) => <div><Badge color={d.status === 'success' ? 'green' : d.status === 'failed' ? 'red' : 'yellow'} size="sm">{d.status}</Badge> <span className="text-xs text-slate">{d.attempts} attempt(s){d.responseStatus ? ` · HTTP ${d.responseStatus}` : ''}</span>{d.error && <div className="text-xs text-error">{d.error}</div>}</div> },
    { key: 'a', header: 'Actions', align: 'right', render: (d) => <Button size="xs" variant="outline" onClick={() => void (async () => { try { await client.post(`${base}/deliveries/${d._id}/redeliver`, {}); toast.success('Queued again'); r.reload(); } catch (e) { toast.error(errorMessage(e)); } })()}>Resend</Button> },
  ];
  return (
    <Modal title="Deliveries" onClose={onClose} width={720}>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : <Table columns={columns} data={r.data?.items ?? []} keyExtractor={(d) => d._id} loading={r.loading} pagination={{ page, total: r.data?.total ?? 0, perPage: 10, onChange: setPage, label: 'deliveries' }} emptyState={{ title: 'Nothing sent yet', description: 'Deliveries appear here as events happen.' }} />}
    </Modal>
  );
}

function Tokens({ storeId }: { storeId: string }) {
  const toast = useToast();
  const base = `/api/merchant-api/${storeId}`;
  const list = useApi<{ scopes: string[]; items: Tok[] }>(`${base}/tokens`);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<{ name: string; scopes: string[] }>({ name: '', scopes: [] });
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    try { const r = (await client.post(`${base}/tokens`, form)) as unknown as { token: string }; setAdding(false); setForm({ name: '', scopes: [] }); setToken(r.token); list.reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  const columns: TableColumn<Tok>[] = [
    { key: 'n', header: 'Token', render: (t) => <div><div className="font-semibold text-carbon">{t.name} <span className="font-mono text-xs font-normal text-slate">{t.prefix}…</span></div><div className="text-xs text-slate">{t.scopes.join(', ')}</div></div> },
    { key: 'u', header: 'Last used', render: (t) => shortDate(t.lastUsedAt) },
    { key: 's', header: 'Status', render: (t) => (t.revokedAt ? <Badge color="red" size="sm">Revoked</Badge> : <Badge color="green" size="sm">Active</Badge>) },
    { key: 'a', header: 'Actions', align: 'right', render: (t) => (t.revokedAt ? null : <Button size="xs" variant="outline" onClick={() => void (async () => { try { await client.delete(`${base}/tokens/${t._id}`); toast.success('Revoked'); list.reload(); } catch (e) { toast.error(errorMessage(e)); } })()}>Revoke</Button>) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <Card padding="md"><p className="m-0 text-[13px] text-slate">Send the token as <code>Authorization: Bearer sxk_…</code> to <code>/api/merchant/v1/orders</code> or <code>/products</code> (read only today). A token only sees this store and only what you allow.</p></Card>
      <div><Button onClick={() => setAdding(true)}>Create token</Button></div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : <Table columns={columns} data={list.data?.items ?? []} keyExtractor={(t) => t._id} loading={list.loading} emptyState={{ title: 'No tokens yet', description: 'Create a token for software that reads your store data.' }} />}
      {adding && (
        <Modal title="Create API token" onClose={() => setAdding(false)} width={480} footer={<><Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button><Button size="sm" loading={busy} disabled={!form.name.trim() || form.scopes.length === 0} onClick={() => void create()}>Create</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Accounting software" />
            <fieldset className="m-0 flex flex-col gap-1 border-0 p-0 text-[13px]"><legend className="mb-1 font-semibold text-carbon">Permissions</legend>
              {(list.data?.scopes ?? []).map((s) => <label key={s} className="flex items-center gap-2"><input type="checkbox" checked={form.scopes.includes(s)} onChange={(e) => setForm({ ...form, scopes: e.target.checked ? [...form.scopes, s] : form.scopes.filter((x) => x !== s) })} />{s}</label>)}
            </fieldset>
          </div>
        </Modal>
      )}
      {token && <Secret label="Your API token" value={token} onClose={() => setToken(null)} />}
    </div>
  );
}
