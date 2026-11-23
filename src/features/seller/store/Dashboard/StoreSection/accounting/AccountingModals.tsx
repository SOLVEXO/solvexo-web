import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Input, Select, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';
import {
  SOURCE_LABEL, TYPE_LABEL, dayIso, fmt, isBalanceSheet, isDebitNormal, shortDate, toMinor,
  type AccountRow, type AccountType, type JournalEntry, type JournalLine,
} from './accountingUtils';

const accountLabel = (accounts: AccountRow[], key: string) => { const a = accounts.find(x => x.key === key); return a ? `${a.code} · ${a.name}` : key; };

/** One journal entry with its lines; people who manage the books can reverse it. */
export function EntryModal({ storeId, entryId, accounts, exponent, canManage, onClose, onChanged }: {
  storeId: string; entryId: string; accounts: AccountRow[]; exponent: number; canManage: boolean; onClose: () => void; onChanged: () => void;
}) {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const r = useApi<JournalEntry>(`/api/accounting/${storeId}/journal/${entryId}?t=${tick}`);
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const e = r.data;
  async function reverse() {
    setBusy(true);
    try { await client.post(`/api/accounting/${storeId}/journal/${entryId}/reverse`, { memo }); toast.success('Entry reversed'); setTick(t => t + 1); onChanged(); }
    catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  }
  const columns: TableColumn<JournalLine>[] = [
    { key: 'a', header: 'Account', render: l => <div><div className="text-carbon">{accountLabel(accounts, l.accountKey)}</div>{l.memo && <div className="text-xs text-slate">{l.memo}</div>}</div> },
    { key: 'd', header: 'Debit', align: 'right', render: l => (l.debitMinor ? fmt(l.debitMinor, exponent) : '') },
    { key: 'c', header: 'Credit', align: 'right', render: l => (l.creditMinor ? fmt(l.creditMinor, exponent) : '') },
  ];
  return (
    <Modal title={e ? `Entry #${e.seq}` : 'Entry'} onClose={onClose} width={720}>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : !e ? <div className="h-32 animate-pulse rounded-xl bg-cream" /> : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-carbon">
            <span>{shortDate(e.date)}</span>
            <Badge size="sm" color="gray">{SOURCE_LABEL[e.sourceType] ?? e.sourceType}</Badge>
            {e.kind === 'reversal' && <Badge size="sm" color="yellow">Reversal</Badge>}
            {e.reversal && <Badge size="sm" color="red">Reversed by #{e.reversal.seq}</Badge>}
            {e.reference && <span className="text-slate">Ref {e.reference}</span>}
          </div>
          {e.memo && <p className="m-0 text-[13px] text-carbon">{e.memo}</p>}
          <Table columns={columns} data={e.lines} keyExtractor={(_, i) => i} emptyState={false} />
          <p className="m-0 text-right text-[13px] font-semibold text-carbon">Total {fmt(e.totalMinor, exponent)} {e.currency}</p>
          {canManage && e.kind !== 'reversal' && !e.reversal && (
            <div className="flex flex-wrap items-end gap-3 border-t border-bone pt-3">
              <div className="min-w-0 flex-1"><Input label="Reason for reversing (optional)" value={memo} onChange={ev => setMemo(ev.target.value)} /></div>
              <Button variant="outline" loading={busy} onClick={() => void reverse()}>Reverse entry</Button>
            </div>
          )}
          {e.kind === 'auto' && <p className="m-0 text-xs text-slate">Posted automatically from the {(SOURCE_LABEL[e.sourceType] ?? e.sourceType).toLowerCase()}. Entries are never edited: a correction is a reversal plus a new entry.</p>}
        </div>
      )}
    </Modal>
  );
}

interface DraftLine { accountKey: string; debit: string; credit: string; memo: string }
const emptyLine = (): DraftLine => ({ accountKey: '', debit: '', credit: '', memo: '' });

/** A journal entry written by hand. Debits must equal credits before it can be saved. */
export function ManualEntryModal({ storeId, accounts, exponent, currency, minDate, onClose, onDone }: {
  storeId: string; accounts: AccountRow[]; exponent: number; currency: string; minDate: string; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState(dayIso(new Date()));
  const [memo, setMemo] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(), emptyLine()]);
  const [busy, setBusy] = useState(false);
  const active = accounts.filter(a => !a.archived);
  const parsed = lines.map(l => ({ ...l, d: toMinor(l.debit, exponent), c: toMinor(l.credit, exponent) }));
  const debit = parsed.reduce((t, l) => t + (l.d ?? 0), 0), credit = parsed.reduce((t, l) => t + (l.c ?? 0), 0);
  const filled = parsed.filter(l => l.accountKey && ((l.d ?? 0) > 0 || (l.c ?? 0) > 0));
  const invalid = parsed.some(l => l.d === null || l.c === null || ((l.d ?? 0) > 0 && (l.c ?? 0) > 0));
  const ok = !invalid && filled.length >= 2 && debit === credit && debit > 0 && date >= minDate;
  const set = (i: number, patch: Partial<DraftLine>) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  async function save() {
    setBusy(true);
    try {
      await client.post(`/api/accounting/${storeId}/journal`, { date, memo, reference, lines: filled.map(l => ({ accountKey: l.accountKey, debitMinor: l.d ?? 0, creditMinor: l.c ?? 0, memo: l.memo })) });
      toast.success('Entry posted'); onDone();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title="New journal entry" onClose={onClose} width={860}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={!ok} onClick={() => void save()}>Post entry</Button></>}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Date" type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} />
          <Input label="Reference" value={reference} onChange={e => setReference(e.target.value)} placeholder="Voucher or bill number" />
          <Input label="Description" value={memo} onChange={e => setMemo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_1fr_1.5fr_auto] sm:items-end">
              <Select label={i === 0 ? 'Account' : undefined} aria-label={`Line ${i + 1} account`} value={l.accountKey} onChange={e => set(i, { accountKey: e.target.value })}>
                <option value="">Choose an account</option>
                {active.map(a => <option key={a.key} value={a.key}>{a.code} · {a.name}</option>)}
              </Select>
              <Input label={i === 0 ? `Debit (${currency})` : undefined} aria-label={`Line ${i + 1} debit`} inputMode="decimal" value={l.debit} onChange={e => set(i, { debit: e.target.value, credit: e.target.value ? '' : l.credit })} />
              <Input label={i === 0 ? `Credit (${currency})` : undefined} aria-label={`Line ${i + 1} credit`} inputMode="decimal" value={l.credit} onChange={e => set(i, { credit: e.target.value, debit: e.target.value ? '' : l.debit })} />
              <Input label={i === 0 ? 'Line note' : undefined} aria-label={`Line ${i + 1} note`} value={l.memo} onChange={e => set(i, { memo: e.target.value })} />
              <Button variant="ghost" size="sm" aria-label={`Remove line ${i + 1}`} disabled={lines.length <= 2} onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}><Trash2 size={14} /></Button>
            </div>
          ))}
          <div><Button variant="outline" size="xs" onClick={() => setLines(ls => [...ls, emptyLine()])}><Plus size={13} /> Add line</Button></div>
        </div>
        <p className={`m-0 text-[13px] ${debit === credit ? 'text-carbon' : 'text-error'}`} role="status">
          Debits {fmt(debit, exponent)} · Credits {fmt(credit, exponent)}{debit !== credit ? ` · Difference ${fmt(Math.abs(debit - credit), exponent)}` : ''}
        </p>
        {invalid && <p className="m-0 text-[12.5px] text-error">Each line takes a positive amount on one side only.</p>}
      </div>
    </Modal>
  );
}

/** Balances on the go-live date for the balance sheet accounts; the difference goes to the opening suspense account. */
export function OpeningBalancesModal({ storeId, accounts, exponent, currency, onClose, onDone }: {
  storeId: string; accounts: AccountRow[]; exponent: number; currency: string; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const rows = useMemo(() => accounts.filter(a => isBalanceSheet(a.type) && !a.archived && a.key !== 'opening_suspense'), [accounts]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const minor = (k: string) => toMinor(values[k] ?? '', exponent);
  const invalid = rows.some(a => minor(a.key) === null);
  const lines = rows.map(a => ({ a, m: minor(a.key) ?? 0 })).filter(x => x.m > 0)
    .map(({ a, m }) => (isDebitNormal(a.type) ? { accountKey: a.key, debitMinor: m, creditMinor: 0 } : { accountKey: a.key, debitMinor: 0, creditMinor: m }));
  const diff = lines.reduce((t, l) => t + l.debitMinor - l.creditMinor, 0);
  async function save() {
    setBusy(true);
    try { await client.put(`/api/accounting/${storeId}/opening-balances`, { lines }); toast.success('Opening balances saved'); onDone(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  const groups: AccountType[] = ['asset', 'liability', 'equity'];
  return (
    <Modal title="Opening balances" onClose={onClose} width={720}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={invalid || !lines.length} onClick={() => void save()}>Save opening balances</Button></>}>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-[13px] text-slate">
          Enter what each account held on the go-live date, as positive amounts in {currency}: cash and bank counted, stock at cost, what customers owe you, what you owe suppliers. Saving again replaces the previous opening balances.
        </p>
        {groups.map(g => (
          <section key={g} className="flex flex-col gap-2">
            <h3 className="m-0 text-[13px] font-semibold text-carbon">{TYPE_LABEL[g]}s</h3>
            {rows.filter(a => a.type === g).map(a => (
              <div key={a.key} className="grid grid-cols-[1fr_160px] items-center gap-3">
                <label htmlFor={`ob-${a.key}`} className="text-[13px] text-carbon">{a.code} · {a.name}</label>
                <Input id={`ob-${a.key}`} inputMode="decimal" value={values[a.key] ?? ''} placeholder="0" onChange={e => setValues(v => ({ ...v, [a.key]: e.target.value }))} />
              </div>
            ))}
          </section>
        ))}
        <p className="m-0 text-[13px] text-carbon" role="status">
          {diff === 0 ? 'Assets equal liabilities plus equity.' : `The difference of ${fmt(Math.abs(diff), exponent)} ${currency} goes to Opening balance suspense until you find where it belongs.`}
        </p>
      </div>
    </Modal>
  );
}

interface LedgerLine { entryId: string; seq: number; date: string; sourceType: string; reference: string; memo: string; debitMinor: number; creditMinor: number; balanceMinor: number }

/** One account's movements with a running balance. */
export function LedgerModal({ storeId, account, exponent, onClose, onOpenEntry }: {
  storeId: string; account: AccountRow; exponent: number; onClose: () => void; onOpenEntry: (id: string) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const qs = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  const r = useApi<{ opening: number; closing: number; lines: LedgerLine[]; truncated: boolean; currency: string }>(`/api/accounting/${storeId}/ledger/${account.key}?${qs}`);
  const columns: TableColumn<LedgerLine>[] = [
    { key: 'd', header: 'Date', render: l => shortDate(l.date) },
    { key: 'n', header: '#', render: l => l.seq },
    { key: 'm', header: 'Description', render: l => <div><div className="text-carbon">{l.memo}</div><div className="text-xs text-slate">{SOURCE_LABEL[l.sourceType] ?? l.sourceType}{l.reference ? ` · ${l.reference}` : ''}</div></div> },
    { key: 'dr', header: 'Debit', align: 'right', render: l => (l.debitMinor ? fmt(l.debitMinor, exponent) : '') },
    { key: 'cr', header: 'Credit', align: 'right', render: l => (l.creditMinor ? fmt(l.creditMinor, exponent) : '') },
    { key: 'b', header: 'Balance', align: 'right', render: l => fmt(l.balanceMinor, exponent) },
  ];
  return (
    <Modal title={`${account.code} · ${account.name}`} onClose={onClose} width={900}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40"><Input label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div className="w-40"><Input label="To" type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
          {r.data && <p className="m-0 ml-auto text-[13px] text-carbon">Opening {fmt(r.data.opening, exponent)} · Closing <strong>{fmt(r.data.closing, exponent)}</strong> {r.data.currency}</p>}
        </div>
        {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
          <Table columns={columns} data={r.data?.lines ?? []} keyExtractor={(l, i) => `${l.entryId}-${i}`} loading={r.loading} onRowClick={l => onOpenEntry(l.entryId)}
            emptyState={{ title: 'No movements', description: 'Nothing was posted to this account in this period.' }} />
        )}
        {r.data?.truncated && <p className="m-0 text-xs text-slate">Showing the first 500 entries; narrow the dates to see the rest.</p>}
      </div>
    </Modal>
  );
}

/** Rename, recode, map to the accountant's code, or archive an account; also used to add a new one. */
export function AccountEditModal({ storeId, account, onClose, onDone }: { storeId: string; account: AccountRow | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const isNew = !account;
  const [f, setF] = useState({ code: account?.code ?? '', name: account?.name ?? '', type: (account?.type ?? 'expense') as AccountType, group: account?.group ?? '', externalCode: account?.externalCode ?? '' });
  const [busy, setBusy] = useState<string | null>(null);
  async function save(archived?: boolean) {
    setBusy(archived === undefined ? 'save' : 'archive');
    try {
      if (isNew) await client.post(`/api/accounting/${storeId}/accounts`, f);
      else await client.patch(`/api/accounting/${storeId}/accounts/${account.key}`, archived === undefined ? { code: f.code, name: f.name, group: f.group, externalCode: f.externalCode, ...(account.system ? {} : { type: f.type }) } : { archived });
      toast.success(isNew ? 'Account added' : 'Account saved'); onDone();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }
  return (
    <Modal title={isNew ? 'Add account' : `Edit ${account.name}`} onClose={onClose} width={520}
      footer={<>
        {!isNew && !account.system && <Button variant="outline" size="sm" loading={busy === 'archive'} onClick={() => void save(!account.archived)}>{account.archived ? 'Restore' : 'Archive'}</Button>}
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" loading={busy === 'save'} disabled={!f.code.trim() || !f.name.trim()} onClick={() => void save()}>{isNew ? 'Add' : 'Save'}</Button>
      </>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Code" value={f.code} onChange={e => setF({ ...f, code: e.target.value })} />
        <Select label="Type" value={f.type} disabled={!!account?.system} onChange={e => setF({ ...f, type: e.target.value as AccountType })}>
          {(Object.keys(TYPE_LABEL) as AccountType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </Select>
        <div className="sm:col-span-2"><Input label="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <Input label="Group" value={f.group} onChange={e => setF({ ...f, group: e.target.value })} placeholder="e.g. Operating expenses" />
        <Input label="Code in your accounting app" value={f.externalCode} onChange={e => setF({ ...f, externalCode: e.target.value })} placeholder="Tally ledger or Odoo account" />
        {account?.system && <p className="m-0 text-xs text-slate sm:col-span-2">A default account: its type is fixed and automatic entries use it, so it cannot be archived. You can still rename it and change its code.</p>}
      </div>
    </Modal>
  );
}
