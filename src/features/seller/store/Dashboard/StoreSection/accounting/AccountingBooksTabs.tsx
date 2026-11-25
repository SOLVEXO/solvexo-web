import { useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Card, Input, Select, Table, DateField } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';
import { EXPENSE_CATEGORY_LABEL, dayIso, fmt, monthStartIso, shortDate, toMinor, type AccountRow } from './accountingUtils';

/** The POS services answer `{ success, data }`. */
type Wrapped<T> = { success: boolean; data: T };
interface TabProps { storeId: string; exponent: number; currency: string; accounts: AccountRow[]; tick: number; refresh: () => void; openLedger: (a: AccountRow) => void }

const STATUS_COLOR: Record<string, 'gray' | 'green' | 'red'> = { recorded: 'gray', approved: 'green', rejected: 'red' };
const STATUS_LABEL: Record<string, string> = { recorded: 'Awaiting approval', approved: 'Approved', rejected: 'Rejected' };
const METHOD_LABEL: Record<string, string> = { cash: 'Cash', bank: 'Bank', other: 'Other (owner paid)' };

// ── Expenses ──────────────────────────────────────────────────────────────────────────────────────────────────────────

interface Expense {
  id: string; number: string; category: string; amountMinor: number; payee: string | null; method: string; note: string | null; occurredAt: string;
  sessionId: string | null; status: string; decisionNote: string | null; hasReceipt: boolean; employeeName: string | null;
}

export function ExpensesTab({ storeId, exponent, currency, accounts, tick, refresh }: TabProps) {
  const manage = can('accounting.manage' as StaffPermission);
  const [f, setF] = useState({ from: monthStartIso(), to: '', status: 'all' });
  const [adding, setAdding] = useState(false);
  const [mapping, setMapping] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const toIso = f.to ? new Date(new Date(f.to).getTime() + 86_400_000).toISOString().slice(0, 10) : '';
  const qs = new URLSearchParams({ ...(f.from ? { from: f.from } : {}), ...(toIso ? { to: toIso } : {}), status: f.status, limit: '300', t: String(tick) }).toString();
  const r = useApi<Wrapped<{ expenses: Expense[]; totalsByCategoryMinor: Record<string, number> }>>(`/api/accounting/${storeId}/expenses?${qs}`);
  const list = r.data?.data.expenses ?? [];
  const byCat = Object.entries(r.data?.data.totalsByCategoryMinor ?? {}).sort((a, b) => b[1] - a[1]);
  const total = byCat.reduce((t, [, v]) => t + v, 0);
  const columns: TableColumn<Expense>[] = [
    { key: 'n', header: 'Number', render: e => <span className="whitespace-nowrap">{e.number}</span> },
    { key: 'd', header: 'Date', render: e => shortDate(e.occurredAt) },
    { key: 'c', header: 'Category', render: e => <div><div className="text-carbon">{EXPENSE_CATEGORY_LABEL[e.category] ?? e.category}</div>{e.payee && <div className="text-xs text-slate">{e.payee}</div>}</div> },
    { key: 'm', header: 'Paid by', render: e => <span>{METHOD_LABEL[e.method] ?? e.method}{e.sessionId ? ' (till)' : ''}</span> },
    { key: 's', header: 'Status', render: e => <span className="inline-flex items-center gap-1.5"><Badge size="sm" color={STATUS_COLOR[e.status] ?? 'gray'}>{STATUS_LABEL[e.status] ?? e.status}</Badge>{e.hasReceipt && <Paperclip size={13} aria-label="Receipt attached" />}</span> },
    { key: 'a', header: `Amount (${currency})`, align: 'right', render: e => <span className={e.status === 'rejected' ? 'line-through opacity-60' : ''}>{fmt(e.amountMinor, exponent)}</span> },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40"><DateField label="From" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></div>
        <div className="w-40"><DateField label="To" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></div>
        <div className="w-44"><Select label="Status" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
          <option value="all">All</option><option value="recorded">Awaiting approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </Select></div>
        {manage && <div className="ml-auto flex gap-2"><Button variant="outline" onClick={() => setMapping(true)}>Accounts used</Button><Button onClick={() => setAdding(true)}>Record expense</Button></div>}
      </div>
      {byCat.length > 0 && (
        <Card padding="md">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-carbon">
            <strong>Total {fmt(total, exponent)} {currency}</strong>
            {byCat.map(([k, v]) => <span key={k} className="text-slate">{EXPENSE_CATEGORY_LABEL[k] ?? k}: {fmt(v, exponent)}</span>)}
          </div>
        </Card>
      )}
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
        <Table columns={columns} data={list} keyExtractor={e => e.id} loading={r.loading} onRowClick={e => setOpen(e.id)}
          emptyState={{ title: 'No expenses in this period', description: 'Expenses recorded here or in the POS app appear here and post to the books.' }} />
      )}
      {adding && <ExpenseFormModal storeId={storeId} exponent={exponent} currency={currency} onClose={() => setAdding(false)} onDone={() => { setAdding(false); refresh(); }} />}
      {open && <ExpenseModal storeId={storeId} id={open} exponent={exponent} currency={currency} canManage={manage} onClose={() => setOpen(null)} onChanged={refresh} />}
      {mapping && <ExpenseAccountsModal storeId={storeId} accounts={accounts} onClose={() => setMapping(false)} onDone={() => { setMapping(false); refresh(); }} />}
    </div>
  );
}

function ExpenseFormModal({ storeId, exponent, currency, onClose, onDone }: { storeId: string; exponent: number; currency: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ category: 'rent', amount: '', method: 'bank', payee: '', date: dayIso(new Date()), note: '' });
  const [busy, setBusy] = useState(false);
  const [requestId] = useState(() => `web:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`);
  const amountMinor = toMinor(f.amount, exponent);
  const ok = amountMinor !== null && amountMinor > 0 && !!f.date && (f.category !== 'other' || f.note.trim());
  async function save() {
    setBusy(true);
    try {
      await client.post(`/api/accounting/${storeId}/expenses`, { category: f.category, amountMinor, method: f.method, payee: f.payee || undefined, occurredAt: f.date, note: f.note || undefined, requestId });
      toast.success('Expense recorded'); onDone();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title="Record expense" onClose={onClose} width={560}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={!ok} onClick={() => void save()}>Record</Button></>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Category" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
          {Object.entries(EXPENSE_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input label={`Amount (${currency})`} inputMode="decimal" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
        <Select label="Paid by" value={f.method} onChange={e => setF({ ...f, method: e.target.value })}>
          <option value="bank">Bank</option><option value="cash">Cash (not from a till)</option><option value="other">Other (owner paid personally)</option>
        </Select>
        <DateField label="Date" max={dayIso(new Date())} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
        <Input label="Paid to (optional)" value={f.payee} onChange={e => setF({ ...f, payee: e.target.value })} />
        <Input label={f.category === 'other' ? 'Note (required)' : 'Note'} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        <p className="m-0 text-xs text-slate sm:col-span-2">Money paid from a till drawer is recorded in the POS app, so the shift's cash stays right. Expenses you record here are approved at once and post to the books.</p>
      </div>
    </Modal>
  );
}

function ExpenseModal({ storeId, id, exponent, currency, canManage, onClose, onChanged }: { storeId: string; id: string; exponent: number; currency: string; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const r = useApi<Wrapped<{ expense: Expense }>>(`/api/accounting/${storeId}/expenses/${id}?t=${tick}`);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const e = r.data?.data.expense;
  const changed = () => { setTick(t => t + 1); onChanged(); };
  async function decide(decision: 'approve' | 'reject') {
    setBusy(decision);
    try { await client.post(`/api/accounting/${storeId}/expenses/${id}/decision`, { decision, note: note || undefined }); toast.success(decision === 'approve' ? 'Expense approved' : 'Expense rejected; its entry is reversed in the books'); changed(); }
    catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
  }
  async function upload(file: File) {
    setBusy('upload');
    try { const fd = new FormData(); fd.append('file', file); await client.post(`/api/accounting/${storeId}/expenses/${id}/receipt`, fd); toast.success('Receipt attached'); changed(); }
    catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
  }
  async function view() {
    setBusy('view');
    try { const res = (await client.get(`/api/accounting/${storeId}/expenses/${id}/receipt`)) as unknown as Wrapped<{ url: string }>; window.open(res.data.url, '_blank', 'noopener'); }
    catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
  }
  return (
    <Modal title={e ? `Expense ${e.number}` : 'Expense'} onClose={onClose} width={560}>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : !e ? <div className="h-32 animate-pulse rounded-xl bg-cream" /> : (
        <div className="flex flex-col gap-3 text-[13px] text-carbon">
          <div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{fmt(e.amountMinor, exponent)} {currency}</strong><Badge size="sm" color={STATUS_COLOR[e.status] ?? 'gray'}>{STATUS_LABEL[e.status] ?? e.status}</Badge></div>
          <dl className="m-0 grid grid-cols-[120px_1fr] gap-y-1">
            <dt className="text-slate">Category</dt><dd className="m-0">{EXPENSE_CATEGORY_LABEL[e.category] ?? e.category}</dd>
            <dt className="text-slate">Date</dt><dd className="m-0">{shortDate(e.occurredAt)}</dd>
            <dt className="text-slate">Paid by</dt><dd className="m-0">{METHOD_LABEL[e.method] ?? e.method}{e.sessionId ? ', from a till shift' : ''}</dd>
            {e.payee && <><dt className="text-slate">Paid to</dt><dd className="m-0">{e.payee}</dd></>}
            {e.employeeName && <><dt className="text-slate">Recorded by</dt><dd className="m-0">{e.employeeName}</dd></>}
            {e.note && <><dt className="text-slate">Note</dt><dd className="m-0">{e.note}</dd></>}
            {e.decisionNote && <><dt className="text-slate">Decision note</dt><dd className="m-0">{e.decisionNote}</dd></>}
          </dl>
          <div className="flex flex-wrap gap-2">
            {e.hasReceipt && <Button size="sm" variant="outline" loading={busy === 'view'} onClick={() => void view()}>View receipt</Button>}
            {canManage && <>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" aria-label="Receipt file" onChange={ev => { const file = ev.target.files?.[0]; if (file) void upload(file); ev.target.value = ''; }} />
              <Button size="sm" variant="outline" loading={busy === 'upload'} onClick={() => fileRef.current?.click()}>{e.hasReceipt ? 'Replace receipt' : 'Attach receipt'}</Button>
            </>}
          </div>
          {canManage && e.status === 'recorded' && (
            <div className="flex flex-wrap items-end gap-2 border-t border-bone pt-3">
              <div className="min-w-0 flex-1"><Input label="Note (required to reject)" value={note} onChange={ev => setNote(ev.target.value)} /></div>
              <Button size="sm" variant="outline" loading={busy === 'reject'} disabled={!note.trim()} onClick={() => void decide('reject')}>Reject</Button>
              <Button size="sm" loading={busy === 'approve'} onClick={() => void decide('approve')}>Approve</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function ExpenseAccountsModal({ storeId, accounts, onClose, onDone }: { storeId: string; accounts: AccountRow[]; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const r = useApi<{ categories: { category: string; accountKey: string; defaultAccountKey: string }[] }>(`/api/accounting/${storeId}/expense-accounts`);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const options = accounts.filter(a => a.type === 'expense' && !a.archived);
  const valueOf = (c: { category: string; accountKey: string }) => chosen[c.category] ?? c.accountKey;
  async function save() {
    setBusy(true);
    try { await client.put(`/api/accounting/${storeId}/expense-accounts`, { accounts: Object.fromEntries((r.data?.categories ?? []).map(c => [c.category, valueOf(c)])) }); toast.success('Saved: new expenses post to these accounts'); onDone(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title="Accounts used for expenses" onClose={onClose} width={600}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={!r.data} onClick={() => void save()}>Save</Button></>}>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[13px] text-slate">Each expense category posts to this account from now on. Entries already in the books stay as they are. Add your own expense accounts in the chart of accounts.</p>
          {(r.data?.categories ?? []).map(c => (
            <div key={c.category} className="grid grid-cols-[160px_1fr] items-center gap-3">
              <label htmlFor={`ea-${c.category}`} className="text-[13px] text-carbon">{EXPENSE_CATEGORY_LABEL[c.category] ?? c.category}</label>
              <Select id={`ea-${c.category}`} value={valueOf(c)} onChange={e => setChosen(v => ({ ...v, [c.category]: e.target.value }))}>
                {options.map(a => <option key={a.key} value={a.key}>{a.code} · {a.name}</option>)}
              </Select>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── Cash book ─────────────────────────────────────────────────────────────────────────────────────────────────────────

interface DaybookLine { at: string; type: string; label: string; amountMinor: number; runningMinor: number; employeeName: string | null }
interface DaybookShift {
  sessionId: string; registerName: string | null; employeeName: string | null; status: string; openedAt: string; closedAt: string | null;
  expectedCashMinor: number; countedMinor: number | null; varianceMinor: number | null; reconciled: boolean; unreconciledMinor: number; lines: DaybookLine[];
}

export function CashBookTab({ storeId, exponent, currency, accounts, openLedger }: TabProps) {
  const cashAccounts = accounts.filter(a => a.type === 'asset' && (a.group === 'Cash and bank' || ['cash', 'petty_cash', 'cash_safe', 'bank'].includes(a.key)) && !a.archived);
  const [date, setDate] = useState(dayIso(new Date()));
  const r = useApi<Wrapped<{ shifts: DaybookShift[] }>>(`/api/accounting/${storeId}/daybook?date=${date}`);
  const lineCols: TableColumn<DaybookLine>[] = [
    { key: 't', header: 'Time', render: l => new Date(l.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { key: 'l', header: 'Entry', render: l => <div><div className="text-carbon">{l.label}</div>{l.employeeName && <div className="text-xs text-slate">{l.employeeName}</div>}</div> },
    { key: 'a', header: 'In / out', align: 'right', render: l => <span className={l.amountMinor < 0 ? 'text-error' : 'text-carbon'}>{l.amountMinor > 0 ? '+' : ''}{fmt(l.amountMinor, exponent)}</span> },
    { key: 'b', header: 'Drawer', align: 'right', render: l => fmt(l.runningMinor, exponent) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-[14px] font-semibold text-carbon">Cash and bank accounts</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cashAccounts.map(a => (
            <button key={a.key} type="button" onClick={() => openLedger(a)} className="cursor-pointer rounded-xl border border-bone bg-white p-3 text-left hover:border-brand-orange">
              <p className="m-0 text-xs text-slate">{a.code} · {a.name}</p>
              <p className="m-0 mt-1 text-lg font-semibold text-carbon">{fmt(a.balanceMinor, exponent)}</p>
              <p className="m-0 text-[11px] text-slate">{currency} · open the ledger</p>
            </button>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end gap-3">
          <h3 className="m-0 text-[14px] font-semibold text-carbon">Till daybook</h3>
          <div className="ml-auto w-44"><DateField label="Day" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : r.loading && !r.data ? <div className="h-24 animate-pulse rounded-xl bg-cream" /> : (r.data?.data.shifts ?? []).length === 0 ? (
          <p className="m-0 text-[13px] text-slate">No till shifts opened on this day.</p>
        ) : (r.data?.data.shifts ?? []).map(s => (
          <Card key={s.sessionId} padding="md">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-carbon">
              <strong>{s.registerName ?? 'Register'}</strong>
              {s.employeeName && <span className="text-slate">{s.employeeName}</span>}
              <span className="text-slate">{new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{s.closedAt ? `–${new Date(s.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (open)'}</span>
              <span className="ml-auto">Expected {fmt(s.expectedCashMinor, exponent)}{s.countedMinor != null ? ` · Counted ${fmt(s.countedMinor, exponent)}` : ''}</span>
              {s.varianceMinor ? <Badge size="sm" color="red">{s.varianceMinor > 0 ? 'Over' : 'Short'} {fmt(Math.abs(s.varianceMinor), exponent)}</Badge> : s.status === 'closed' ? <Badge size="sm" color="green">Balanced</Badge> : null}
              {!s.reconciled && <Badge size="sm" color="yellow">Unreconciled {fmt(s.unreconciledMinor, exponent)}</Badge>}
            </div>
            <Table columns={lineCols} data={s.lines} keyExtractor={(_, i) => i} emptyState={false} />
          </Card>
        ))}
      </section>
    </div>
  );
}

// ── Supplier balances ─────────────────────────────────────────────────────────────────────────────────────────────────

interface PayableRow { supplierId: string; supplierName: string; balanceMinor: number; currentMinor: number; d30Minor: number; d60Minor: number; d90Minor: number }

export function SuppliersTab({ storeId, exponent, currency, tick }: TabProps) {
  const r = useApi<Wrapped<{ suppliers: PayableRow[]; totals: Omit<PayableRow, 'supplierId' | 'supplierName'> }>>(`/api/accounting/${storeId}/payables?t=${tick}`);
  const [open, setOpen] = useState<PayableRow | null>(null);
  const t = r.data?.data.totals;
  const columns: TableColumn<PayableRow>[] = [
    { key: 'n', header: 'Supplier', render: s => s.supplierName },
    { key: 'c', header: 'Under 30 days', align: 'right', render: s => fmt(s.currentMinor, exponent) },
    { key: 'd30', header: '30–59', align: 'right', render: s => fmt(s.d30Minor, exponent) },
    { key: 'd60', header: '60–89', align: 'right', render: s => fmt(s.d60Minor, exponent) },
    { key: 'd90', header: '90+', align: 'right', render: s => <span className={s.d90Minor ? 'font-semibold text-error' : ''}>{fmt(s.d90Minor, exponent)}</span> },
    { key: 'b', header: `You owe (${currency})`, align: 'right', render: s => <strong>{fmt(s.balanceMinor, exponent)}</strong> },
  ];
  return (
    <div className="flex flex-col gap-3">
      {t && <p className="m-0 text-[13px] text-carbon">You owe suppliers <strong>{fmt(t.balanceMinor, exponent)} {currency}</strong> in total; {fmt(t.d60Minor + t.d90Minor, exponent)} of it is 60 days old or more.</p>}
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
        <Table columns={columns} data={r.data?.data.suppliers ?? []} keyExtractor={s => s.supplierId} loading={r.loading} onRowClick={setOpen}
          emptyState={{ title: 'You owe no supplier anything', description: 'Supplier bills from goods received appear here until they are paid.' }} />
      )}
      {open && <SupplierLedgerModal storeId={storeId} supplier={open} exponent={exponent} currency={currency} onClose={() => setOpen(null)} />}
    </div>
  );
}

interface SupplierEntry { id: string; type: string; amountMinor: number; balanceAfterMinor: number; refNumber?: string | null; reference?: string | null; supplierInvoiceNumber?: string | null; note?: string | null; createdAt: string }
const SUPPLIER_TYPE: Record<string, string> = { bill: 'Bill', payment: 'Payment', credit: 'Credit (return)', adjustment: 'Adjustment' };

function SupplierLedgerModal({ storeId, supplier, exponent, currency, onClose }: { storeId: string; supplier: PayableRow; exponent: number; currency: string; onClose: () => void }) {
  const r = useApi<Wrapped<{ entries: SupplierEntry[] }>>(`/api/accounting/${storeId}/payables/${supplier.supplierId}`);
  const columns: TableColumn<SupplierEntry>[] = [
    { key: 'd', header: 'Date', render: e => shortDate(e.createdAt) },
    { key: 't', header: 'Entry', render: e => <div><div className="text-carbon">{SUPPLIER_TYPE[e.type] ?? e.type}</div><div className="text-xs text-slate">{[e.refNumber, e.supplierInvoiceNumber, e.reference, e.note].filter(Boolean).join(' · ')}</div></div> },
    { key: 'a', header: 'Amount', align: 'right', render: e => fmt(e.amountMinor, exponent) },
    { key: 'b', header: 'Balance', align: 'right', render: e => fmt(e.balanceAfterMinor, exponent) },
  ];
  return (
    <Modal title={supplier.supplierName} onClose={onClose} width={760}>
      <div className="flex flex-col gap-3">
        <p className="m-0 text-[13px] text-carbon">You owe <strong>{fmt(supplier.balanceMinor, exponent)} {currency}</strong>. Bills add to it; payments and returns reduce it.</p>
        {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
          <Table columns={columns} data={r.data?.data.entries ?? []} keyExtractor={e => e.id} loading={r.loading} emptyState={{ title: 'No entries', description: 'Nothing recorded with this supplier yet.' }} />
        )}
      </div>
    </Modal>
  );
}

// ── Profit and tax (POS) ──────────────────────────────────────────────────────────────────────────────────────────────

interface ProfitTotals {
  netSalesMinor: number; costOfGoodsSoldMinor: number; grossMarginMinor: number; marginPercent: number | null; costCoveragePercent: number | null;
  expensesMinor: number; expensesByCategoryMinor: Record<string, number>; afterExpensesMinor: number; supplierPaymentsMinor: number;
}
interface TaxRow { taxCategory: string; hsCode: string | null; salesNetMinor: number; salesTaxMinor: number; returnsNetMinor: number; returnsTaxMinor: number; netMinor: number; taxMinor: number }

export function ProfitTaxTab({ storeId, exponent, currency }: TabProps) {
  const [from, setFrom] = useState(monthStartIso());
  const [to, setTo] = useState(dayIso(new Date()));
  const q = `from=${from}&to=${to}`;
  const p = useApi<Wrapped<{ totals: ProfitTotals }>>(`/api/accounting/${storeId}/reports/profit?${q}`);
  const t = useApi<Wrapped<{ rows: TaxRow[]; totals: { salesTaxMinor: number; returnsTaxMinor: number; netTaxMinor: number; invoices: number; creditNotes: number } }>>(`/api/accounting/${storeId}/reports/tax?${q}`);
  const pt = p.data?.data.totals;
  const tiles: [string, number, string?][] = pt ? [
    ['Net sales', pt.netSalesMinor], ['Cost of goods sold', pt.costOfGoodsSoldMinor],
    ['Gross margin', pt.grossMarginMinor, pt.marginPercent != null ? `${pt.marginPercent}%` : undefined],
    ['Expenses', pt.expensesMinor], ['After expenses', pt.afterExpensesMinor],
  ] : [];
  const taxCols: TableColumn<TaxRow>[] = [
    { key: 'c', header: 'Tax category', render: r => <div><div className="text-carbon">{r.taxCategory === 'exempt' ? 'Exempt' : 'Standard'}</div>{r.hsCode && <div className="text-xs text-slate">HS {r.hsCode}</div>}</div> },
    { key: 'sn', header: 'Sales (net)', align: 'right', render: r => fmt(r.salesNetMinor, exponent) },
    { key: 'st', header: 'Tax on sales', align: 'right', render: r => fmt(r.salesTaxMinor, exponent) },
    { key: 'rt', header: 'Tax on returns', align: 'right', render: r => fmt(r.returnsTaxMinor, exponent) },
    { key: 'nt', header: `Net tax (${currency})`, align: 'right', render: r => <strong>{fmt(r.taxMinor, exponent)}</strong> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40"><DateField label="From" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div className="w-40"><DateField label="To" value={to} onChange={e => setTo(e.target.value)} /></div>
        <p className="m-0 text-xs text-slate">Point-of-sale figures, by the store's time zone; up to a year at a time.</p>
      </div>
      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-[14px] font-semibold text-carbon">Profit</h3>
        {p.error ? <ErrorLine message={errorMessage(p.error)} onRetry={p.reload} /> : !pt ? <div className="h-24 animate-pulse rounded-xl bg-cream" /> : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {tiles.map(([label, v, sub]) => (
                <Card key={label} padding="md"><p className="m-0 text-xs text-slate">{label}</p><p className="m-0 mt-1 text-lg font-semibold text-carbon">{fmt(v, exponent)}</p><p className="m-0 text-[11px] text-slate">{sub ?? currency}</p></Card>
              ))}
            </div>
            {pt.costCoveragePercent != null && pt.costCoveragePercent < 100 && <p className="m-0 text-xs text-slate">Cost prices are known for {pt.costCoveragePercent}% of sales; the margin covers those sales only. Add cost prices to products to complete it.</p>}
            {Object.keys(pt.expensesByCategoryMinor).length > 0 && <p className="m-0 text-xs text-slate">Expenses: {Object.entries(pt.expensesByCategoryMinor).map(([k, v]) => `${EXPENSE_CATEGORY_LABEL[k] ?? k} ${fmt(v, exponent)}`).join(' · ')}</p>}
            <p className="m-0 text-xs text-slate">Supplier payments in the period ({fmt(pt.supplierPaymentsMinor, exponent)}) are not expenses: the goods' cost is counted when they are sold.</p>
          </>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-[14px] font-semibold text-carbon">Sales tax</h3>
        {t.error ? <ErrorLine message={errorMessage(t.error)} onRetry={t.reload} /> : (
          <>
            {t.data && <p className="m-0 text-[13px] text-carbon">Net sales tax <strong>{fmt(t.data.data.totals.netTaxMinor, exponent)} {currency}</strong> from {t.data.data.totals.invoices} invoice(s) and {t.data.data.totals.creditNotes} credit note(s).</p>}
            <Table columns={taxCols} data={t.data?.data.rows ?? []} keyExtractor={r => `${r.taxCategory}|${r.hsCode ?? ''}`} loading={t.loading} emptyState={{ title: 'No POS sales in this period', description: 'Tax collected at the till appears here by category and HS code.' }} />
          </>
        )}
      </section>
    </div>
  );
}
