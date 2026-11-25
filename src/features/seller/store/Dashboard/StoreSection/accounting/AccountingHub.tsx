import { useState } from 'react';
import { Lock } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Badge, Button, Card, EmptyState, Input, Select, Table, TabBar, DateField } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';
import { AccountEditModal, EntryModal, LedgerModal, ManualEntryModal, OpeningBalancesModal } from './AccountingModals';
import { CashBookTab, ExpensesTab, ProfitTaxTab, SuppliersTab } from './AccountingBooksTabs';
import { ExcelDownload, SettlementsTab, StatementsTab } from './AccountingStatementsTabs';
import { IntegrationsTab } from './AccountingIntegrationsTab';
import {
  SKIP_LABEL, SOURCE_LABEL, TYPE_LABEL, dayIso, fmt, isDebitNormal, shortDate,
  type AccountRow, type JournalEntry, type SettingsResponse,
} from './accountingUtils';

/** The store's books (Accounting Plan, Phase 1): setup, journal, trial balance and chart of accounts. */
export default function AccountingHub() {
  const { storeId } = useStoreWorkspace();
  return (
    <>
      <StorePageHeader title="Accounting" subtitle="Your books: every sale, refund, expense and payment as journal entries" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {can('accounting.view' as StaffPermission) ? <AccountingBody storeId={storeId} /> : <EmptyState icon={<Lock size={22} />} title="No access" description="Your role cannot view the books." />}
      </div>
    </>
  );
}

function AccountingBody({ storeId }: { storeId: string }) {
  const [tick, setTick] = useState(0);
  const s = useApi<SettingsResponse>(`/api/accounting/${storeId}/settings?t=${tick}`);
  if (s.error) return <ErrorLine message={errorMessage(s.error)} onRetry={s.reload} />;
  if (!s.data) return <div className="h-40 animate-pulse rounded-xl bg-cream" />;
  if (!s.data.enabled || !s.data.settings) return <Setup storeId={storeId} currency={s.data.currency} onDone={() => setTick(t => t + 1)} />;
  return <Books storeId={storeId} settings={s.data} onSettingsChanged={() => setTick(t => t + 1)} />;
}

function Setup({ storeId, currency, onDone }: { storeId: string; currency: string; onDone: () => void }) {
  const toast = useToast();
  const manage = can('accounting.manage' as StaffPermission);
  const now = new Date();
  const [goLive, setGoLive] = useState(dayIso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))));
  const [busy, setBusy] = useState(false);
  async function start() {
    setBusy(true);
    try { await client.post(`/api/accounting/${storeId}/setup`, { goLiveDate: goLive }); toast.success('Accounting is on. Your first entries are being posted.'); onDone(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Card padding="lg">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="m-0 text-lg font-semibold text-carbon">Turn on accounting</h2>
        <p className="m-0 text-[13.5px] text-carbon">
          Solvexo will keep a full set of books for this store: every POS and online sale, refund, expense, cash movement, stock cost, supplier bill and khata payment becomes a balanced journal entry, in {currency}. You get a trial balance and a ledger for every account; your accountant can be given read-only access with the Accountant role.
        </p>
        <ul className="m-0 flex flex-col gap-1 pl-5 text-[13px] text-slate">
          <li>Pick the date your books start. Anything before it goes in once, as opening balances.</li>
          <li>Entries post automatically every 15 minutes. They are never edited; a mistake is corrected with a reversal.</li>
          <li>The go-live date can be changed only until the first entries are posted.</li>
        </ul>
        {manage ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48"><DateField label="Books start on" value={goLive} onChange={e => setGoLive(e.target.value)} /></div>
            <Button loading={busy} disabled={!goLive} onClick={() => void start()}>Turn on accounting</Button>
          </div>
        ) : <p className="m-0 text-[13px] text-slate">Ask the store owner to turn accounting on.</p>}
      </div>
    </Card>
  );
}

function Books({ storeId, settings, onSettingsChanged }: { storeId: string; settings: SettingsResponse; onSettingsChanged: () => void }) {
  const [tab, setTab] = useState('overview');
  const [tick, setTick] = useState(0);
  const accounts = useApi<AccountRow[]>(`/api/accounting/${storeId}/accounts?t=${tick}`);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<AccountRow | null>(null);
  const refresh = () => { setTick(t => t + 1); onSettingsChanged(); };
  const exp = settings.exponent;
  const rows = accounts.data ?? [];
  const ctx = { storeId, exponent: exp, currency: settings.currency, accounts: rows, tick, refresh, openEntry: setEntryId, openLedger: setLedger };
  return (
    <>
      <TabBar tabs={[
        { id: 'overview', label: 'Overview' }, { id: 'expenses', label: 'Expenses' }, { id: 'cash', label: 'Cash book' }, { id: 'suppliers', label: 'Suppliers' },
        { id: 'statements', label: 'Statements' }, { id: 'settlements', label: 'Settlements' }, { id: 'profit', label: 'POS profit & tax' },
        { id: 'journal', label: 'Journal' }, { id: 'trial', label: 'Trial balance' }, { id: 'accounts', label: 'Chart of accounts' }, { id: 'integrations', label: 'Integrations' },
      ]} active={tab} onChange={setTab} />
      {accounts.error && <ErrorLine message={errorMessage(accounts.error)} onRetry={accounts.reload} />}
      {tab === 'overview' && <Overview {...ctx} settings={settings} />}
      {tab === 'expenses' && <ExpensesTab {...ctx} />}
      {tab === 'cash' && <CashBookTab {...ctx} />}
      {tab === 'suppliers' && <SuppliersTab {...ctx} />}
      {tab === 'statements' && <StatementsTab {...ctx} />}
      {tab === 'settlements' && <SettlementsTab {...ctx} />}
      {tab === 'profit' && <ProfitTaxTab {...ctx} />}
      {tab === 'journal' && <Journal {...ctx} minDate={dayIso(new Date(settings.settings!.goLiveDate))} />}
      {tab === 'trial' && <TrialBalance {...ctx} />}
      {tab === 'accounts' && <ChartOfAccounts {...ctx} />}
      {tab === 'integrations' && <IntegrationsTab {...ctx} />}
      {entryId && <EntryModal storeId={storeId} entryId={entryId} accounts={rows} exponent={exp} canManage={can('accounting.manage' as StaffPermission)} onClose={() => setEntryId(null)} onChanged={refresh} />}
      {ledger && <LedgerModal storeId={storeId} account={ledger} exponent={exp} onClose={() => setLedger(null)} onOpenEntry={id => setEntryId(id)} />}
    </>
  );
}

interface Ctx { storeId: string; exponent: number; currency: string; accounts: AccountRow[]; tick: number; refresh: () => void; openEntry: (id: string) => void; openLedger: (a: AccountRow) => void }

function Overview({ storeId, exponent, currency, accounts, refresh, settings }: Ctx & { settings: SettingsResponse }) {
  const toast = useToast();
  const manage = can('accounting.manage' as StaffPermission);
  const s = settings.settings!;
  const [busy, setBusy] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  async function run(key: string, url: string, ok: (r: Record<string, unknown>) => string) {
    setBusy(key);
    try { const r = (await client.post(url, {})) as unknown as Record<string, unknown>; toast.success(ok(r)); refresh(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }
  const bal = (k: string) => accounts.find(a => a.key === k)?.balanceMinor ?? 0;
  const income = accounts.filter(a => a.type === 'income').reduce((t, a) => t + a.balanceMinor, 0);
  const expenses = accounts.filter(a => a.type === 'expense').reduce((t, a) => t + a.balanceMinor, 0);
  const skipped = Object.entries(s.skippedTotals ?? {}).filter(([, n]) => n > 0);
  const tiles: [string, number][] = [
    ['Cash and bank', bal('cash') + bal('petty_cash') + bal('cash_safe') + bal('bank')],
    ['Customers owe you', bal('receivables')],
    ['You owe suppliers', bal('payables')],
    ['Sales tax payable', bal('output_tax') - bal('input_tax')],
    ['Profit since go-live', income - expenses],
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map(([label, v]) => (
          <Card key={label} padding="md"><p className="m-0 text-xs text-slate">{label}</p><p className="m-0 mt-1 text-lg font-semibold text-carbon">{fmt(v, exponent)}</p><p className="m-0 text-[11px] text-slate">{currency}</p></Card>
        ))}
      </div>
      <Card padding="md">
        <div className="flex flex-col gap-2 text-[13px] text-carbon">
          <div className="flex flex-wrap items-center gap-2">
            <span>Books started <strong>{shortDate(s.goLiveDate)}</strong> in {s.baseCurrency}.</span>
            <span className="text-slate">Last posted {s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : 'not yet'}.</span>
            {s.lastCheck && (s.lastCheck.ok ? <Badge size="sm" color="green">Books balance</Badge> : <Badge size="sm" color="red">Out of balance: contact support</Badge>)}
            {manage && <div className="ml-auto flex flex-wrap gap-2">
              <Button size="xs" variant="outline" loading={busy === 'sync'} onClick={() => void run('sync', `/api/accounting/${storeId}/sync`, r => (r.status === 'busy' ? 'Posting is already running; refresh in a minute.' : `Posted ${Object.values((r.posted ?? {}) as Record<string, number>).reduce((t, n) => t + n, 0)} new entries.`))}>Post new entries now</Button>
              <Button size="xs" variant="outline" loading={busy === 'check'} onClick={() => void run('check', `/api/accounting/${storeId}/check`, r => (r.ok ? 'Debits equal credits.' : 'The books are out of balance.'))}>Check balance</Button>
              <Button size="xs" onClick={() => setOpening(true)}>{s.openingEntryId ? 'Edit opening balances' : 'Enter opening balances'}</Button>
            </div>}
          </div>
          {!s.openingEntryId && <p className="m-0 text-[12.5px] text-slate">Next step: enter your opening balances (cash, bank, stock, what customers owe and what you owe) as they were on the go-live date.</p>}
          {skipped.length > 0 && (
            <div className="rounded-lg bg-cream p-3 text-[12.5px]">
              <p className="m-0 font-semibold">Left out of the books so far</p>
              <ul className="m-0 mt-1 pl-5">{skipped.map(([k, n]) => <li key={k}>{n.toLocaleString()} record(s) {SKIP_LABEL[k] ?? k}</li>)}</ul>
            </div>
          )}
        </div>
      </Card>
      {opening && <OpeningBalancesModal storeId={storeId} accounts={accounts} exponent={exponent} currency={currency} onClose={() => setOpening(false)} onDone={() => { setOpening(false); refresh(); }} />}
    </div>
  );
}

function Journal({ storeId, exponent, currency, accounts, tick, refresh, openEntry, minDate }: Ctx & { minDate: string }) {
  const manage = can('accounting.manage' as StaffPermission);
  const [f, setF] = useState({ from: '', to: '', sourceType: '', q: '' });
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), page: String(page), limit: '25', t: String(tick) }).toString();
  const r = useApi<{ items: JournalEntry[]; total: number }>(`/api/accounting/${storeId}/journal?${qs}`);
  const setFilter = (patch: Partial<typeof f>) => { setF({ ...f, ...patch }); setPage(1); };
  const columns: TableColumn<JournalEntry>[] = [
    { key: 'n', header: '#', render: e => e.seq },
    { key: 'd', header: 'Date', render: e => shortDate(e.date) },
    { key: 's', header: 'Source', render: e => <span className="whitespace-nowrap">{SOURCE_LABEL[e.sourceType] ?? e.sourceType}</span> },
    { key: 'm', header: 'Description', render: e => <div className={e.reversed ? 'line-through opacity-60' : ''}><div className="text-carbon">{e.memo}</div>{e.reference && <div className="text-xs text-slate">{e.reference}</div>}</div> },
    { key: 'k', header: '', render: e => (e.kind === 'reversal' ? <Badge size="sm" color="yellow">Reversal</Badge> : e.reversed ? <Badge size="sm" color="gray">Reversed</Badge> : null) },
    { key: 'a', header: `Amount (${currency})`, align: 'right', render: e => fmt(e.totalMinor, exponent) },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40"><DateField label="From" value={f.from} onChange={e => setFilter({ from: e.target.value })} /></div>
        <div className="w-40"><DateField label="To" value={f.to} onChange={e => setFilter({ to: e.target.value })} /></div>
        <div className="w-44"><Select label="Source" value={f.sourceType} onChange={e => setFilter({ sourceType: e.target.value })}>
          <option value="">All</option>
          {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select></div>
        <div className="w-full sm:w-56"><Input label="Search" value={f.q} onChange={e => setFilter({ q: e.target.value })} placeholder="Reference or description" /></div>
        {manage && <Button className="ml-auto" onClick={() => setAdding(true)}>New journal entry</Button>}
      </div>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
        <Table columns={columns} data={r.data?.items ?? []} keyExtractor={e => e._id} loading={r.loading} onRowClick={e => openEntry(e._id)}
          pagination={{ page, total: r.data?.total ?? 0, perPage: 25, onChange: setPage, label: 'entries' }}
          emptyState={{ title: 'No entries yet', description: 'Entries appear here as sales, refunds, expenses and payments are posted.' }} />
      )}
      {adding && <ManualEntryModal storeId={storeId} accounts={accounts} exponent={exponent} currency={currency} minDate={minDate} onClose={() => setAdding(false)} onDone={() => { setAdding(false); refresh(); }} />}
    </div>
  );
}

interface TbRow extends AccountRow { debitMinor: number; creditMinor: number; balanceMinor: number }

function TrialBalance({ storeId, exponent, currency, tick, openLedger }: Ctx) {
  const [asOf, setAsOf] = useState(dayIso(new Date()));
  const r = useApi<{ rows: TbRow[]; totals: { debitMinor: number; creditMinor: number; balanced: boolean } }>(`/api/accounting/${storeId}/trial-balance?asOf=${asOf}&t=${tick}`);
  // A balance on its normal side shows in that column; an unusual (negative) balance shows on the other side.
  const side = (row: TbRow) => { const debit = isDebitNormal(row.type) ? row.balanceMinor >= 0 : row.balanceMinor < 0; return { debit, amount: Math.abs(row.balanceMinor) }; };
  const totals = (r.data?.rows ?? []).reduce((t, row) => { const s = side(row); return s.debit ? { ...t, d: t.d + s.amount } : { ...t, c: t.c + s.amount }; }, { d: 0, c: 0 });
  const columns: TableColumn<TbRow>[] = [
    { key: 'c', header: 'Code', render: row => row.code },
    { key: 'n', header: 'Account', render: row => <div><div className="text-carbon">{row.name}</div><div className="text-xs text-slate">{TYPE_LABEL[row.type]}</div></div> },
    { key: 'd', header: `Debit (${currency})`, align: 'right', render: row => { const s = side(row); return s.debit && s.amount ? fmt(s.amount, exponent) : ''; } },
    { key: 'k', header: `Credit (${currency})`, align: 'right', render: row => { const s = side(row); return !s.debit && s.amount ? fmt(s.amount, exponent) : ''; } },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44"><DateField label="As of" value={asOf} onChange={e => setAsOf(e.target.value)} /></div>
        {r.data && (r.data.totals.balanced ? <Badge color="green">Debits equal credits</Badge> : <Badge color="red">Out of balance</Badge>)}
        <div className="ml-auto"><ExcelDownload storeId={storeId} kind="trial-balance" query={{ asOf }} fileName={`trial-balance-${asOf}.xlsx`} /></div>
      </div>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
        <Table columns={columns} data={(r.data?.rows ?? []).filter(row => row.balanceMinor !== 0)} keyExtractor={row => row.key} loading={r.loading} onRowClick={row => openLedger(row)}
          emptyState={{ title: 'Nothing posted yet', description: 'The trial balance fills in as entries are posted.' }} />
      )}
      {r.data && <p className="m-0 text-right text-[13px] font-semibold text-carbon">Totals: debit {fmt(totals.d, exponent)} · credit {fmt(totals.c, exponent)}</p>}
    </div>
  );
}

function ChartOfAccounts({ storeId, exponent, currency, accounts, refresh, openLedger }: Ctx) {
  const manage = can('accounting.manage' as StaffPermission);
  const [edit, setEdit] = useState<AccountRow | 'new' | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const columns: TableColumn<AccountRow>[] = [
    { key: 'c', header: 'Code', render: a => a.code },
    { key: 'n', header: 'Account', render: a => <div><div className={a.archived ? 'text-slate line-through' : 'text-carbon'}>{a.name}</div><div className="text-xs text-slate">{a.group}{a.externalCode ? ` · In your app: ${a.externalCode}` : ''}</div></div> },
    { key: 't', header: 'Type', render: a => TYPE_LABEL[a.type] },
    { key: 'b', header: `Balance (${currency})`, align: 'right', render: a => fmt(a.balanceMinor, exponent) },
    { key: 'x', header: 'Actions', align: 'right', render: a => (
      <div className="flex justify-end gap-2">
        <Button size="xs" variant="outline" onClick={() => openLedger(a)}>Ledger</Button>
        {manage && <Button size="xs" variant="outline" onClick={() => setEdit(a)}>Edit</Button>}
      </div>
    ) },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[13px] text-carbon"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} /> Show archived</label>
        {manage && <Button className="ml-auto" onClick={() => setEdit('new')}>Add account</Button>}
      </div>
      <Table columns={columns} data={accounts.filter(a => showArchived || !a.archived)} keyExtractor={a => a.key} emptyState={{ title: 'No accounts', description: 'The default chart is created when accounting is turned on.' }} />
      {edit && <AccountEditModal storeId={storeId} account={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); refresh(); }} />}
    </div>
  );
}
