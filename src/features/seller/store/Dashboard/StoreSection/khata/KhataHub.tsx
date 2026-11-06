import { useState } from 'react';
import { Lock } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Badge, Button, Card, EmptyState, Input, Select, Table, TabBar } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { money, shortDate, useApi, usePaged } from '../wholesale/wholesaleUtils';

interface Account { _id: string; name: string; phone: string | null; currency: string; balance: number; creditLimit: number | null; lastEntryAt: string | null }
interface Entry { _id: string; seq: number; type: string; amount: number; balanceAfter: number; note: string; reference: string | null; method: string | null; entryDate: string; reversed?: boolean; source: string }
interface AgingRow { accountId: string; name: string; balance: number; buckets: Record<string, number> }
const BUCKETS: [string, string][] = [['current', 'Not due'], ['d1_30', '1–30 days'], ['d31_60', '31–60'], ['d61_90', '61–90'], ['d90_plus', '90+']];
const TYPE_LABEL: Record<string, string> = { sale: 'Credit sale', payment: 'Payment', adjustment: 'Adjustment', reversal: 'Reversal' };

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** Customer credit book (khata): what each customer owes this store. Records only — Solvexo moves no money. */
export default function KhataHub() {
  const { storeId } = useStoreWorkspace();
  return (
    <>
      <StorePageHeader title="Khata" subtitle="Customer credit accounts, payments and statements" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {can('khata.view' as StaffPermission) ? <KhataBody storeId={storeId} /> : <EmptyState icon={<Lock size={22} />} title="No access" description="Your role cannot view customer accounts." />}
      </div>
    </>
  );
}

function KhataBody({ storeId }: { storeId: string }) {
  const [tab, setTab] = useState('accounts');
  return (
    <>
      <TabBar tabs={[{ id: 'accounts', label: 'Customers' }, { id: 'aging', label: 'Aging report' }]} active={tab} onChange={setTab} />
      {tab === 'accounts' ? <Accounts storeId={storeId} /> : <AgingReport storeId={storeId} />}
    </>
  );
}

function Accounts({ storeId }: { storeId: string }) {
  const [search, setSearch] = useState('');
  const [owing, setOwing] = useState('');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Account | null>(null);
  const list = usePaged<Account>(`/api/khata/${storeId}/accounts`, { search, owing });
  const totals = list.data as unknown as { totalOwed?: number; customersOwing?: number } | null;
  const columns: TableColumn<Account>[] = [
    { key: 'n', header: 'Customer', render: (a) => <div><div className="font-semibold text-carbon">{a.name}</div>{a.phone && <div className="text-xs text-slate">{a.phone}</div>}</div> },
    { key: 'b', header: 'Balance', align: 'right', render: (a) => <span className={a.balance > 0 ? 'font-semibold text-error' : 'text-carbon'}>{money(a.balance, a.currency)}</span> },
    { key: 'l', header: 'Limit', align: 'right', render: (a) => (a.creditLimit === null ? '—' : money(a.creditLimit, a.currency)) },
    { key: 'd', header: 'Last activity', render: (a) => shortDate(a.lastEntryAt) },
    { key: 'a', header: 'Actions', align: 'right', render: (a) => <Button size="xs" variant="outline" onClick={() => setOpen(a)}>Open</Button> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64"><Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or phone" /></div>
        <div className="w-full sm:w-44"><Select label="Show" value={owing} onChange={(e) => setOwing(e.target.value)}><option value="">All customers</option><option value="true">Owing money</option></Select></div>
        {can('khata.manage' as StaffPermission) && <Button onClick={() => setAdding(true)}>Add customer</Button>}
      </div>
      {totals && <p className="m-0 text-[13px] text-carbon">{(totals.customersOwing ?? 0).toLocaleString()} customer(s) owe you <strong>{money(totals.totalOwed)}</strong> in total.</p>}
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : (
        <Table columns={columns} data={list.rows} keyExtractor={(a) => a._id} loading={list.loading}
          pagination={{ page: list.page, total: list.total, perPage: 20, onChange: list.setPage, label: 'customers' }}
          emptyState={{ title: 'No customer accounts yet', description: 'Add a customer to start recording credit sales and payments.' }} />
      )}
      {adding && <AddCustomer storeId={storeId} onClose={() => setAdding(false)} onDone={() => { setAdding(false); list.reload(); }} />}
      {open && <AccountModal storeId={storeId} account={open} onClose={() => { setOpen(null); list.reload(); }} />}
    </div>
  );
}

function AddCustomer({ storeId, onClose, onDone }: { storeId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', phone: '', creditLimit: '' }); const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try { await client.post(`/api/khata/${storeId}/accounts`, { name: f.name, phone: f.phone || undefined, creditLimit: f.creditLimit === '' ? null : Number(f.creditLimit) }); toast.success('Customer added'); onDone(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title="Add customer" onClose={onClose} width={460} footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={!f.name.trim()} onClick={() => void save()}>Add</Button></>}>
      <div className="flex flex-col gap-3">
        <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input label="Phone (optional)" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <Input label="Credit limit (optional)" type="number" min={0} value={f.creditLimit} onChange={(e) => setF({ ...f, creditLimit: e.target.value })} />
      </div>
    </Modal>
  );
}

function AccountModal({ storeId, account, onClose }: { storeId: string; account: Account; onClose: () => void }) {
  const toast = useToast();
  const base = `/api/khata/${storeId}`;
  const manage = can('khata.manage' as StaffPermission);
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const acc = useApi<Account>(`${base}/accounts/${account._id}?t=${tick}`);
  const entries = useApi<{ items: Entry[]; total: number }>(`${base}/accounts/${account._id}/entries?page=${page}&limit=15&t=${tick}`);
  const aging = useApi<{ buckets: Record<string, number> }>(`${base}/accounts/${account._id}/aging?t=${tick}`);
  const [form, setForm] = useState({ type: 'payment', amount: '', method: 'cash', note: '' });
  const [busy, setBusy] = useState<string | null>(null);
  const [limit, setLimit] = useState('');
  const cur = acc.data ?? account;
  const refresh = () => setTick((x) => x + 1);

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try { await fn(); toast.success(ok); refresh(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }
  const submit = () => run('post', async () => { await client.post(`${base}/accounts/${account._id}/entries`, { type: form.type, amount: Number(form.amount), method: form.method || undefined, note: form.note || undefined }); setForm({ ...form, amount: '', note: '' }); }, 'Saved');
  async function csv() {
    try {
      const blob = (await client.get(`${base}/accounts/${account._id}/statement.csv`, { responseType: 'blob' })) as unknown as Blob;
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `statement-${cur.name}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { toast.error(errorMessage(e)); }
  }
  async function print() {
    try {
      const s = (await client.get(`${base}/accounts/${account._id}/statement`)) as unknown as { openingBalance: number; closingBalance: number; items: Entry[] };
      const w = window.open('', '_blank'); if (!w) { toast.error('Allow pop-ups to print'); return; }
      const rows = s.items.map((e) => `<tr><td>${esc(shortDate(e.entryDate))}</td><td>${esc(TYPE_LABEL[e.type] ?? e.type)}</td><td>${esc(e.note)}</td><td style="text-align:right">${e.amount > 0 ? esc(money(e.amount)) : ''}</td><td style="text-align:right">${e.amount < 0 ? esc(money(-e.amount)) : ''}</td><td style="text-align:right">${esc(money(e.balanceAfter))}</td></tr>`).join('');
      w.document.write(`<!doctype html><meta charset="utf-8"><title>Statement</title><style>body{font:14px sans-serif;padding:24px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}th{background:#f5f5f5}</style><h2>Statement: ${esc(cur.name)}</h2><p>Opening balance ${esc(money(s.openingBalance, cur.currency))} · Closing balance <b>${esc(money(s.closingBalance, cur.currency))}</b></p><table><tr><th>Date</th><th>Type</th><th>Note</th><th>Debit</th><th>Credit</th><th>Balance</th></tr>${rows}</table>`);
      w.document.close(); w.focus(); w.print();
    } catch (e) { toast.error(errorMessage(e)); }
  }

  const columns: TableColumn<Entry>[] = [
    { key: 'n', header: '#', render: (e) => e.seq },
    { key: 'd', header: 'Date', render: (e) => shortDate(e.entryDate) },
    { key: 't', header: 'Entry', render: (e) => <div><span className={e.reversed ? 'line-through opacity-60' : ''}>{TYPE_LABEL[e.type] ?? e.type}</span>{e.note && <div className="text-xs text-slate">{e.note}</div>}</div> },
    { key: 'a', header: 'Amount', align: 'right', render: (e) => <span className={e.amount > 0 ? 'text-error' : 'text-success'}>{e.amount > 0 ? '+' : ''}{money(e.amount)}</span> },
    { key: 'b', header: 'Balance', align: 'right', render: (e) => money(e.balanceAfter) },
    { key: 'x', header: 'Actions', align: 'right', render: (e) => (manage && e.type !== 'reversal' && !e.reversed ? <Button size="xs" variant="outline" onClick={() => void run(`rev${e._id}`, () => client.post(`${base}/entries/${e._id}/reverse`, {}), 'Entry reversed')}>Reverse</Button> : e.reversed ? <Badge color="gray" size="sm">Reversed</Badge> : null) },
  ];

  return (
    <Modal title={cur.name} onClose={onClose} width={820}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <span>Balance: <strong className={cur.balance > 0 ? 'text-error' : ''}>{money(cur.balance, cur.currency)}</strong></span>
          <span>Limit: {cur.creditLimit === null ? 'none' : money(cur.creditLimit, cur.currency)}</span>
          <div className="ml-auto flex gap-2">
            <Button size="xs" variant="outline" onClick={() => void csv()}>CSV</Button>
            <Button size="xs" variant="outline" onClick={() => void print()}>Print statement</Button>
            {manage && cur.balance > 0 && <Button size="xs" variant="outline" loading={busy === 'remind'} onClick={() => void run('remind', () => client.post(`${base}/accounts/${account._id}/remind`, {}), 'Reminder sent')}>SMS reminder</Button>}
          </div>
        </div>
        {aging.data && <div className="flex flex-wrap gap-2 text-xs">{BUCKETS.map(([k, label]) => <Badge key={k} color={k === 'current' ? 'gray' : k === 'd1_30' ? 'yellow' : 'red'} size="sm">{label}: {money(aging.data?.buckets[k])}</Badge>)}</div>}
        {manage && (
          <Card padding="md">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Select label="Entry" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="payment">Payment received</option><option value="sale">Credit sale</option><option value="adjustment">Adjustment (+/−)</option></Select>
              <Input label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              {form.type === 'payment' ? <Select label="Method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option><option value="cheque">Cheque</option></Select> : <div />}
              <Input label={form.type === 'adjustment' ? 'Note (required)' : 'Note'} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <Button size="sm" loading={busy === 'post'} disabled={!form.amount || (form.type === 'adjustment' && !form.note.trim())} onClick={() => void submit()}>Save entry</Button>
              <div className="ml-auto flex items-end gap-2">
                <div className="w-36"><Input label="Credit limit" type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder={cur.creditLimit === null ? 'none' : String(cur.creditLimit)} /></div>
                <Button size="sm" variant="outline" loading={busy === 'limit'} onClick={() => void run('limit', () => client.patch(`${base}/accounts/${account._id}/limit`, { creditLimit: limit === '' ? null : Number(limit) }), 'Limit saved')}>Set</Button>
              </div>
            </div>
          </Card>
        )}
        {entries.error ? <ErrorLine message={errorMessage(entries.error)} onRetry={entries.reload} /> : (
          <Table columns={columns} data={entries.data?.items ?? []} keyExtractor={(e) => e._id} loading={entries.loading}
            pagination={{ page, total: entries.data?.total ?? 0, perPage: 15, onChange: setPage, label: 'entries' }} emptyState={{ title: 'No entries yet', description: 'Record a credit sale or a payment above.' }} />
        )}
      </div>
    </Modal>
  );
}

function AgingReport({ storeId }: { storeId: string }) {
  const r = useApi<{ accounts: AgingRow[]; totals: Record<string, number>; currency: string | null }>(`/api/khata/${storeId}/report/aging`);
  if (r.error) return <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} />;
  const columns: TableColumn<AgingRow>[] = [
    { key: 'n', header: 'Customer', render: (a) => a.name },
    ...BUCKETS.map(([k, label]): TableColumn<AgingRow> => ({ key: k, header: label, align: 'right', render: (a) => money(a.buckets[k]) })),
    { key: 'b', header: 'Total', align: 'right', render: (a) => <strong>{money(a.balance)}</strong> },
  ];
  return (
    <div className="flex flex-col gap-3">
      {r.data && <p className="m-0 text-[13px] text-carbon">Totals: {BUCKETS.map(([k, label]) => `${label} ${money(r.data?.totals[k], r.data?.currency)}`).join(' · ')}</p>}
      <Table columns={columns} data={r.data?.accounts ?? []} keyExtractor={(a) => a.accountId} loading={r.loading} emptyState={{ title: 'Nobody owes you anything', description: 'Customers with a balance appear here, grouped by how late they are.' }} />
    </div>
  );
}
