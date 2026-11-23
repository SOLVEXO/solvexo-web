import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Card, Input, Select, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';
import { dayIso, fmt, monthStartIso, shortDate } from './accountingUtils';

interface TabProps { storeId: string; exponent: number; currency: string; tick: number; refresh: () => void }
type App = 'odoo' | 'erpnext';
interface Connection {
  app: App; baseUrl: string; database: string | null; login: string | null; company: string | null; journalCode: string; secretHint: string;
  mode: 'detail' | 'summary'; enabled: boolean; cursorSeq: number; cursorDay: string | null; lastSyncAt: string | null;
  lastCheck: { at: string; ok: boolean; message: string } | null;
}
interface Card { app: App; connected: boolean; connection: Connection | null; log: { sent: number; failed: number } }
const APP_LABEL: Record<App, string> = { odoo: 'Odoo', erpnext: 'ERPNext' };
const APP_HELP: Record<App, string> = {
  odoo: 'Entries are created in your Odoo journal (Miscellaneous Operations by default) and posted. In the chart of accounts, set each account’s "Code in your accounting app" to its Odoo account code.',
  erpnext: 'Entries are created as submitted Journal Entries for your company. In the chart of accounts, set each account’s "Code in your accounting app" to its full ERPNext account name, e.g. "Cash - ABC".',
};

export function IntegrationsTab({ storeId, exponent, tick, refresh }: TabProps) {
  const r = useApi<Card[]>(`/api/accounting/${storeId}/integrations?t=${tick}`);
  const [editing, setEditing] = useState<App | null>(null);
  const [logFor, setLogFor] = useState<App | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <TallyCard storeId={storeId} />
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(r.data ?? []).map(c => <AppCard key={c.app} storeId={storeId} card={c} onEdit={() => setEditing(c.app)} onLog={() => setLogFor(c.app)} onChanged={refresh} />)}
        </div>
      )}
      <p className="m-0 text-xs text-slate">QuickBooks, Xero and Zoho Books come later. Every integration sends the same journal you see here, so the books in your app match Solvexo.</p>
      {editing && <ConnectModal storeId={storeId} app={editing} existing={r.data?.find(c => c.app === editing)?.connection ?? null} onClose={() => setEditing(null)} onDone={() => { setEditing(null); refresh(); }} />}
      {logFor && <SyncLogModal storeId={storeId} app={logFor} exponent={exponent} onClose={() => { setLogFor(null); refresh(); }} />}
    </div>
  );
}

function TallyCard({ storeId }: { storeId: string }) {
  const toast = useToast();
  const [f, setF] = useState({ from: monthStartIso(), to: dayIso(new Date()), mode: 'summary', company: '' });
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v))).toString();
      const blob = (await client.get(`/api/accounting/${storeId}/integrations/tally?${qs}`, { responseType: 'blob' })) as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `solvexo-tally-${f.from}-to-${f.to}.xml`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Card padding="md">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="m-0 text-[15px] font-semibold text-carbon">Tally</h3>
          <p className="m-0 mt-1 text-[13px] text-slate">Download a file your accountant imports in TallyPrime (Gateway of Tally → Import → Vouchers). Ledgers are created under Tally's groups; importing the same file again does not duplicate vouchers. Set "Code in your accounting app" on an account to use your Tally ledger name.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40"><Input label="From" type="date" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></div>
          <div className="w-40"><Input label="To" type="date" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></div>
          <div className="w-52"><Select label="Vouchers" value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}><option value="summary">One per day (recommended)</option><option value="detail">One per transaction</option></Select></div>
          <div className="w-52"><Input label="Tally company (optional)" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} /></div>
          <Button loading={busy} disabled={!f.from || !f.to} onClick={() => void download()}><Download size={14} /> Download for Tally</Button>
        </div>
      </div>
    </Card>
  );
}

function AppCard({ storeId, card, onEdit, onLog, onChanged }: { storeId: string; card: Card; onEdit: () => void; onLog: () => void; onChanged: () => void }) {
  const toast = useToast();
  const manage = can('accounting.manage' as StaffPermission);
  const [busy, setBusy] = useState<string | null>(null);
  const c = card.connection;
  async function act(kind: 'sync' | 'test' | 'disconnect') {
    setBusy(kind);
    try {
      const res = (await client.post(`/api/accounting/${storeId}/integrations/${card.app}/${kind}`, {})) as unknown as { sent?: number; failed?: number; stopped?: string; lastCheck?: { ok: boolean; message: string } };
      if (kind === 'sync') { if (res.stopped) toast.error(res.stopped); else toast.success(`Sent ${res.sent ?? 0}; ${res.failed ?? 0} failed.`); }
      else if (kind === 'test') { if (res.lastCheck?.ok) toast.success(res.lastCheck.message); else toast.error(res.lastCheck?.message ?? 'Connection failed'); }
      else toast.success(`${APP_LABEL[card.app]} disconnected`);
      onChanged();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }
  return (
    <Card padding="md">
      <div className="flex flex-col gap-3 text-[13px] text-carbon">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 text-[15px] font-semibold">{APP_LABEL[card.app]}</h3>
          {!card.connected ? <Badge size="sm" color="gray">Not connected</Badge> : c?.lastCheck?.ok === false ? <Badge size="sm" color="red">Needs attention</Badge> : <Badge size="sm" color="green">Connected</Badge>}
        </div>
        <p className="m-0 text-slate">{APP_HELP[card.app]}</p>
        {c && (
          <div className="flex flex-col gap-1">
            <span className="break-all">{c.baseUrl}{c.database ? ` · ${c.database}` : ''}{c.company ? ` · ${c.company}` : ''}</span>
            <span className="text-slate">{c.mode === 'summary' ? 'One entry per day' : 'One entry per transaction'} · key {c.secretHint}{c.lastSyncAt ? ` · last sync ${new Date(c.lastSyncAt).toLocaleString()}` : ''}</span>
            {c.lastCheck && <span className={c.lastCheck.ok ? 'text-slate' : 'text-error'} role={c.lastCheck.ok ? undefined : 'alert'}>{c.lastCheck.message}</span>}
            <span>{card.log.sent.toLocaleString()} sent{card.log.failed ? <>, <strong className="text-error">{card.log.failed.toLocaleString()} failed</strong></> : ''}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {manage && <Button size="sm" variant={card.connected ? 'outline' : 'primary'} onClick={onEdit}>{card.connected ? 'Settings' : `Connect ${APP_LABEL[card.app]}`}</Button>}
          {card.connected && <Button size="sm" variant="outline" onClick={onLog}>Sync log</Button>}
          {card.connected && manage && <>
            <Button size="sm" variant="outline" loading={busy === 'sync'} onClick={() => void act('sync')}><RefreshCw size={13} /> Sync now</Button>
            <Button size="sm" variant="outline" loading={busy === 'test'} onClick={() => void act('test')}>Test</Button>
            <Button size="sm" variant="outline" loading={busy === 'disconnect'} onClick={() => void act('disconnect')}>Disconnect</Button>
          </>}
        </div>
      </div>
    </Card>
  );
}

function ConnectModal({ storeId, app, existing, onClose, onDone }: { storeId: string; app: App; existing: Connection | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    baseUrl: existing?.baseUrl ?? '', database: existing?.database ?? '', login: existing?.login ?? '', journalCode: existing?.journalCode ?? 'MISC',
    company: existing?.company ?? '', secret: '', apiKey: '', apiSecret: '', mode: existing?.mode ?? 'detail', from: 'now',
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const needSecret = !existing;
  const ok = f.baseUrl.trim().startsWith('https://') && (app === 'odoo' ? f.database.trim() && f.login.trim() && (!needSecret || f.secret.trim()) : f.company.trim() && (!needSecret || (f.apiKey.trim() && f.apiSecret.trim())));
  async function save() {
    setBusy(true); setMessage('');
    try {
      const body = app === 'odoo'
        ? { baseUrl: f.baseUrl, database: f.database, login: f.login, journalCode: f.journalCode, mode: f.mode, ...(f.secret ? { secret: f.secret } : {}), ...(existing ? {} : { from: f.from }) }
        : { baseUrl: f.baseUrl, company: f.company, mode: f.mode, ...(f.apiKey || f.apiSecret ? { apiKey: f.apiKey, apiSecret: f.apiSecret } : {}), ...(existing ? {} : { from: f.from }) };
      const res = (await client.put(`/api/accounting/${storeId}/integrations/${app}`, body)) as unknown as { lastCheck?: { ok: boolean; message: string } };
      if (res.lastCheck && !res.lastCheck.ok) { setMessage(`Saved, but the test failed: ${res.lastCheck.message}`); return; }
      toast.success(res.lastCheck?.message ?? 'Connected'); onDone();
    } catch (e) { setMessage(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title={`${existing ? 'Settings' : 'Connect'}: ${APP_LABEL[app]}`} onClose={onClose} width={560}
      footer={<><Button variant="outline" size="sm" onClick={message ? onDone : onClose}>{message ? 'Close' : 'Cancel'}</Button><Button size="sm" loading={busy} disabled={!ok} onClick={() => void save()}>Save and test</Button></>}>
      <div className="flex flex-col gap-3">
        <Input label={app === 'odoo' ? 'Odoo address' : 'ERPNext address'} placeholder={app === 'odoo' ? 'https://mycompany.odoo.com' : 'https://erp.mycompany.com'} value={f.baseUrl} onChange={e => setF({ ...f, baseUrl: e.target.value })} />
        {app === 'odoo' ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Database" value={f.database} onChange={e => setF({ ...f, database: e.target.value })} />
              <Input label="Login (e-mail)" value={f.login} onChange={e => setF({ ...f, login: e.target.value })} />
              <Input label={existing ? `API key (leave empty to keep ${existing.secretHint})` : 'API key'} type="password" autoComplete="off" value={f.secret} onChange={e => setF({ ...f, secret: e.target.value })} />
              <Input label="Journal code" value={f.journalCode} onChange={e => setF({ ...f, journalCode: e.target.value })} />
            </div>
            <p className="m-0 text-xs text-slate">Create the API key in Odoo under your user → Preferences → Account Security → New API Key.</p>
          </>
        ) : (
          <>
            <Input label="Company" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label={existing ? 'API key (leave empty to keep)' : 'API key'} autoComplete="off" value={f.apiKey} onChange={e => setF({ ...f, apiKey: e.target.value })} />
              <Input label="API secret" type="password" autoComplete="off" value={f.apiSecret} onChange={e => setF({ ...f, apiSecret: e.target.value })} />
            </div>
            <p className="m-0 text-xs text-slate">Generate the key and secret in ERPNext under User → API Access, for a user allowed to create Journal Entries.</p>
          </>
        )}
        <Select label="Send" value={f.mode} onChange={e => setF({ ...f, mode: e.target.value as 'detail' | 'summary' })}>
          <option value="detail">One entry per transaction (recommended)</option><option value="summary">One summary entry per day</option>
        </Select>
        {!existing && (
          <Select label="Start with" value={f.from} onChange={e => setF({ ...f, from: e.target.value })}>
            <option value="now">New entries from now on</option><option value="go_live">Everything since the books started</option>
          </Select>
        )}
        {message && <p className="m-0 text-[13px] text-error" role="alert">{message}</p>}
        <p className="m-0 text-xs text-slate">The key is stored encrypted and never shown again. Entries carry the reference SOLVEXO-&lt;number&gt;, so a retry never posts the same entry twice.</p>
      </div>
    </Modal>
  );
}

interface LogRow { _id: string; itemKey: string; status: 'sent' | 'failed' | 'skipped'; attempts: number; externalId: string | null; error: string | null; label: string; amountMinor: number; lastTriedAt: string | null }
const LOG_COLOR: Record<string, 'green' | 'red' | 'gray'> = { sent: 'green', failed: 'red', skipped: 'gray' };

function SyncLogModal({ storeId, app, exponent, onClose }: { storeId: string; app: App; exponent: number; onClose: () => void }) {
  const toast = useToast();
  const manage = can('accounting.manage' as StaffPermission);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const r = useApi<{ items: LogRow[]; total: number }>(`/api/accounting/${storeId}/integrations/${app}/log?page=${page}&limit=25${status ? `&status=${status}` : ''}&t=${tick}`);
  const [busy, setBusy] = useState<string | null>(null);
  async function retry(key: string) {
    setBusy(key);
    try { await client.post(`/api/accounting/${storeId}/integrations/${app}/log/${encodeURIComponent(key)}/retry`, {}); toast.success('Tried again'); setTick(t => t + 1); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }
  const columns: TableColumn<LogRow>[] = [
    { key: 'i', header: 'Item', render: l => <div><div className="text-carbon">{l.itemKey.startsWith('entry:') ? `Entry #${l.itemKey.slice(6)}` : `Day ${l.itemKey.slice(4)}`}</div><div className="text-xs text-slate">{l.label}</div></div> },
    { key: 'a', header: 'Amount', align: 'right', render: l => fmt(l.amountMinor, exponent) },
    { key: 's', header: 'Status', render: l => <div><Badge size="sm" color={LOG_COLOR[l.status]}>{l.status === 'sent' ? 'Sent' : l.status === 'failed' ? `Failed (${l.attempts} tries)` : 'Skipped'}</Badge>{l.error && <div className="mt-1 max-w-[340px] text-xs text-error">{l.error}</div>}{l.externalId && <div className="text-xs text-slate">In {APP_LABEL[app]}: {l.externalId}</div>}</div> },
    { key: 't', header: 'Last try', render: l => shortDate(l.lastTriedAt) },
    { key: 'x', header: '', align: 'right', render: l => (manage && l.status === 'failed' ? <Button size="xs" variant="outline" loading={busy === l.itemKey} onClick={() => void retry(l.itemKey)}>Retry</Button> : null) },
  ];
  return (
    <Modal title={`${APP_LABEL[app]} sync log`} onClose={onClose} width={880}>
      <div className="flex flex-col gap-3">
        <div className="w-44"><Select label="Show" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All</option><option value="failed">Failed</option><option value="sent">Sent</option><option value="skipped">Skipped</option></Select></div>
        {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
          <Table columns={columns} data={r.data?.items ?? []} keyExtractor={l => l._id} loading={r.loading}
            pagination={{ page, total: r.data?.total ?? 0, perPage: 25, onChange: setPage, label: 'items' }}
            emptyState={{ title: 'Nothing sent yet', description: 'Entries are sent every 30 minutes, or press Sync now.' }} />
        )}
        <p className="m-0 text-xs text-slate">A failed item is tried again on each sync, up to 5 times. Fix the reason (often an account without its code in your app) and press Retry.</p>
      </div>
    </Modal>
  );
}
