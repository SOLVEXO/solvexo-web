import { Fragment, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Card, Select, Table, TabBar, DateField } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';
import { dayIso, downloadExcel, fmt, shortDate } from './accountingUtils';

interface TabProps { storeId: string; exponent: number; currency: string; tick: number; refresh: () => void }

export function ExcelDownload({ storeId, kind, query, fileName }: { storeId: string; kind: string; query: Record<string, string>; fileName: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="outline" size="sm" loading={busy} onClick={async () => { setBusy(true); try { await downloadExcel(storeId, kind, query, fileName); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } }}>
      <Download size={14} /> Excel
    </Button>
  );
}

const yearStart = () => `${new Date().getFullYear()}-01-01`;

// ── Statements ────────────────────────────────────────────────────────────────────────────────────────────────────────

export function StatementsTab(props: TabProps) {
  const [view, setView] = useState('pnl');
  return (
    <div className="flex flex-col gap-3">
      <TabBar tabs={[{ id: 'pnl', label: 'Profit and loss' }, { id: 'bs', label: 'Balance sheet' }, { id: 'tax', label: 'Sales tax' }]} active={view} onChange={setView} />
      {view === 'pnl' && <ProfitAndLoss {...props} />}
      {view === 'bs' && <BalanceSheet {...props} />}
      {view === 'tax' && <SalesTax {...props} />}
    </div>
  );
}

interface PnlLine { key: string; code: string; name: string; values: Record<string, number>; total: number }
interface PnlSection { id: string; title: string; lines: PnlLine[]; values: Record<string, number>; total: number }
interface Pnl {
  buckets: string[]; labels: Record<string, string>; sections: PnlSection[]; grossProfit: { values: Record<string, number>; total: number };
  netProfit: { values: Record<string, number>; total: number }; locations: { id: string; name: string }[]; currency: string; exponent: number;
}

function ProfitAndLoss({ storeId, exponent, currency, tick }: TabProps) {
  const [f, setF] = useState({ from: yearStart(), to: dayIso(new Date()), groupBy: 'month', channel: '', locationId: '' });
  const query = { ...f, t: String(tick) };
  const r = useApi<Pnl>(`/api/accounting/${storeId}/statements/profit-and-loss?${new URLSearchParams(Object.fromEntries(Object.entries(query).filter(([, v]) => v)))}`);
  const p = r.data;
  const cols = p?.buckets ?? [];
  const cell = (v: number) => <td className={`px-3 py-1.5 text-right tabular-nums ${v < 0 ? 'text-error' : ''}`}>{v ? fmt(v, exponent) : '–'}</td>;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40"><DateField label="From" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></div>
        <div className="w-40"><DateField label="To" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></div>
        <div className="w-40"><Select label="Columns" value={f.groupBy} onChange={e => setF({ ...f, groupBy: e.target.value })}><option value="month">By month</option><option value="channel">By channel</option><option value="location">By branch</option></Select></div>
        <div className="w-44"><Select label="Channel" value={f.channel} onChange={e => setF({ ...f, channel: e.target.value })}><option value="">All channels</option><option value="pos">Point of sale</option><option value="online">Online store</option><option value="b2b">B2B / wholesale</option><option value="other">Not channel-specific</option></Select></div>
        {(p?.locations.length ?? 0) > 0 && <div className="w-44"><Select label="Branch" value={f.locationId} onChange={e => setF({ ...f, locationId: e.target.value })}><option value="">All branches</option>{p!.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}<option value="unassigned">Not branch-specific</option></Select></div>}
        <div className="ml-auto"><ExcelDownload storeId={storeId} kind="profit-and-loss" query={f} fileName={`profit-and-loss-${f.from}-to-${f.to}.xlsx`} /></div>
      </div>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : !p ? <div className="h-40 animate-pulse rounded-xl bg-cream" /> : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px] text-carbon">
              <thead><tr className="border-b border-bone text-left text-xs text-slate">
                <th className="px-3 py-2 font-semibold">Account ({currency})</th>
                {cols.map(b => <th key={b} className="px-3 py-2 text-right font-semibold">{p.labels[b] ?? b}</th>)}
                <th className="px-3 py-2 text-right font-semibold">Total</th>
              </tr></thead>
              <tbody>
                {p.sections.filter(s => s.lines.length).map(s => (
                  <Fragment key={s.id}>
                    <tr><td colSpan={cols.length + 2} className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate">{s.title}</td></tr>
                    {s.lines.map(l => <tr key={l.key}><td className="px-3 py-1.5">{l.code} · {l.name}</td>{cols.map(b => <Fragment key={b}>{cell(l.values[b])}</Fragment>)}{cell(l.total)}</tr>)}
                    <tr className="border-t border-bone font-semibold"><td className="px-3 py-1.5">Total {s.title.toLowerCase()}</td>{cols.map(b => <Fragment key={b}>{cell(s.values[b])}</Fragment>)}{cell(s.total)}</tr>
                    {s.id === 'cost_of_sales' && <tr className="bg-cream font-semibold"><td className="px-3 py-1.5">Gross profit</td>{cols.map(b => <Fragment key={b}>{cell(p.grossProfit.values[b])}</Fragment>)}{cell(p.grossProfit.total)}</tr>}
                  </Fragment>
                ))}
                <tr className="border-t-2 border-carbon bg-cream text-[14px] font-bold"><td className="px-3 py-2">Net profit</td>{cols.map(b => <Fragment key={b}>{cell(p.netProfit.values[b])}</Fragment>)}{cell(p.netProfit.total)}</tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <p className="m-0 text-xs text-slate">From the books, in your store's time zone. Shared costs (rent, salaries, purchasing) are "Not channel-specific" or "Not branch-specific".</p>
    </div>
  );
}

interface BsLine { key: string; code: string; name: string; balanceMinor: number }
interface Bs { assets: BsLine[]; liabilities: BsLine[]; equity: BsLine[]; currentProfitMinor: number; totals: { assetsMinor: number; liabilitiesMinor: number; equityMinor: number; balanced: boolean } }

function BalanceSheet({ storeId, exponent, currency, tick }: TabProps) {
  const [asOf, setAsOf] = useState(dayIso(new Date()));
  const r = useApi<Bs>(`/api/accounting/${storeId}/statements/balance-sheet?asOf=${asOf}&t=${tick}`);
  const b = r.data;
  const block = (title: string, lines: BsLine[], total: number, extra?: [string, number]) => (
    <section className="flex flex-col">
      <h3 className="m-0 mb-1 text-[13px] font-semibold uppercase tracking-wide text-slate">{title}</h3>
      {lines.map(l => <div key={l.key} className="flex justify-between py-1 text-[13px]"><span>{l.code} · {l.name}</span><span className="tabular-nums">{fmt(l.balanceMinor, exponent)}</span></div>)}
      {extra && <div className="flex justify-between py-1 text-[13px]"><span>{extra[0]}</span><span className="tabular-nums">{fmt(extra[1], exponent)}</span></div>}
      <div className="mt-1 flex justify-between border-t border-bone pt-1 text-[13px] font-semibold"><span>Total {title.toLowerCase()}</span><span className="tabular-nums">{fmt(total, exponent)}</span></div>
    </section>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44"><DateField label="As of" value={asOf} onChange={e => setAsOf(e.target.value)} /></div>
        {b && (b.totals.balanced ? <Badge color="green">Assets = liabilities + equity</Badge> : <Badge color="red">Does not balance</Badge>)}
        <div className="ml-auto"><ExcelDownload storeId={storeId} kind="balance-sheet" query={{ asOf }} fileName={`balance-sheet-${asOf}.xlsx`} /></div>
      </div>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : !b ? <div className="h-40 animate-pulse rounded-xl bg-cream" /> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card padding="md">{block('Assets', b.assets, b.totals.assetsMinor)}</Card>
          <Card padding="md"><div className="flex flex-col gap-4">
            {block('Liabilities', b.liabilities, b.totals.liabilitiesMinor)}
            {block('Equity', b.equity, b.totals.equityMinor, ['Profit for the period (not yet closed)', b.currentProfitMinor])}
            <div className="flex justify-between border-t-2 border-carbon pt-1 text-[14px] font-bold"><span>Liabilities and equity ({currency})</span><span className="tabular-nums">{fmt(b.totals.liabilitiesMinor + b.totals.equityMinor, exponent)}</span></div>
          </div></Card>
        </div>
      )}
    </div>
  );
}

interface TaxMonth { month: string; outputMinor: number; inputMinor: number; payableMinor: number }

function SalesTax({ storeId, exponent, currency, tick }: TabProps) {
  const [f, setF] = useState({ from: yearStart(), to: dayIso(new Date()) });
  const r = useApi<{ months: TaxMonth[]; totals: Omit<TaxMonth, 'month'>; note: string }>(`/api/accounting/${storeId}/statements/sales-tax?from=${f.from}&to=${f.to}&t=${tick}`);
  const columns: TableColumn<TaxMonth>[] = [
    { key: 'm', header: 'Month', render: m => m.month },
    { key: 'o', header: 'Output tax (on sales)', align: 'right', render: m => fmt(m.outputMinor, exponent) },
    { key: 'i', header: 'Input tax (on purchases)', align: 'right', render: m => fmt(m.inputMinor, exponent) },
    { key: 'p', header: `Payable (${currency})`, align: 'right', render: m => <strong>{fmt(m.payableMinor, exponent)}</strong> },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40"><DateField label="From" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></div>
        <div className="w-40"><DateField label="To" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></div>
        <div className="ml-auto"><ExcelDownload storeId={storeId} kind="sales-tax" query={f} fileName={`sales-tax-${f.from}-to-${f.to}.xlsx`} /></div>
      </div>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
        <>
          {r.data && <p className="m-0 text-[13px] text-carbon">Sales tax payable for the period: <strong>{fmt(r.data.totals.payableMinor, exponent)} {currency}</strong></p>}
          <Table columns={columns} data={r.data?.months ?? []} keyExtractor={m => m.month} loading={r.loading} emptyState={false} />
          {r.data && <p className="m-0 text-xs text-slate">{r.data.note}</p>}
        </>
      )}
    </div>
  );
}

// ── Gateway settlements ───────────────────────────────────────────────────────────────────────────────────────────────

interface SettlementLine { row: number; date: string | null; reference: string; grossMinor: number; feeMinor: number; netMinor: number; match: { status: string; orderNumbers: string[]; expectedMinor: number | null } }
interface Settlement {
  _id: string; gateway: string; fileName: string; settledOn: string; status: 'draft' | 'posted' | 'discarded'; createdAt: string;
  totals: { grossMinor: number; feeMinor: number; netMinor: number; matched: number; unmatched: number }; lines?: SettlementLine[];
}
const MATCH: Record<string, { label: string; color: 'green' | 'yellow' | 'red' | 'gray' }> = {
  matched: { label: 'Matched', color: 'green' }, amount_differs: { label: 'Amount differs', color: 'yellow' }, unmatched: { label: 'Not found', color: 'red' }, duplicate: { label: 'Already posted', color: 'gray' },
};
const STATUS: Record<string, { label: string; color: 'green' | 'yellow' | 'gray' }> = { draft: { label: 'To review', color: 'yellow' }, posted: { label: 'Posted', color: 'green' }, discarded: { label: 'Discarded', color: 'gray' } };

export function SettlementsTab({ storeId, exponent, currency, tick, refresh }: TabProps) {
  const manage = can('accounting.manage' as StaffPermission);
  const r = useApi<{ sources: { key: string; label: string }[]; items: Settlement[] }>(`/api/accounting/${storeId}/settlements?t=${tick}`);
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const label = (k: string) => r.data?.sources.find(s => s.key === k)?.label ?? k;
  const columns: TableColumn<Settlement>[] = [
    { key: 'd', header: 'Paid in', render: s => shortDate(s.settledOn) },
    { key: 'g', header: 'From', render: s => <div><div className="text-carbon">{label(s.gateway)}</div>{s.fileName && <div className="text-xs text-slate">{s.fileName}</div>}</div> },
    { key: 'm', header: 'Lines', render: s => `${s.totals.matched} matched, ${s.totals.unmatched} to check` },
    { key: 's', header: 'Status', render: s => <Badge size="sm" color={STATUS[s.status].color}>{STATUS[s.status].label}</Badge> },
    { key: 'n', header: `Net to bank (${currency})`, align: 'right', render: s => fmt(s.totals.netMinor, exponent) },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 max-w-2xl text-[13px] text-slate">Upload the settlement report from JazzCash, Easypaisa, Safepay or your courier. Each payment is matched to its order; posting moves it from the clearing account into your bank, with the gateway's fees as an expense.</p>
        {manage && <Button className="ml-auto" onClick={() => setImporting(true)}><Upload size={14} /> Upload settlement</Button>}
      </div>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : (
        <Table columns={columns} data={r.data?.items ?? []} keyExtractor={s => s._id} loading={r.loading} onRowClick={s => setOpen(s._id)}
          emptyState={{ title: 'No settlements yet', description: 'Upload a gateway or courier settlement file to match it to your orders.' }} />
      )}
      {importing && r.data && <ImportModal storeId={storeId} sources={r.data.sources} onClose={() => setImporting(false)} onDone={id => { setImporting(false); refresh(); setOpen(id); }} />}
      {open && <SettlementModal storeId={storeId} id={open} exponent={exponent} currency={currency} canManage={manage} label={label} onClose={() => setOpen(null)} onChanged={refresh} />}
    </div>
  );
}

type ColumnChoice = Partial<Record<'date' | 'reference' | 'gross' | 'fee' | 'net', number>>;

function ImportModal({ storeId, sources, onClose, onDone }: { storeId: string; sources: { key: string; label: string }[]; onClose: () => void; onDone: (id: string) => void }) {
  const toast = useToast();
  const [gateway, setGateway] = useState(sources[0]?.key ?? 'jazzcash');
  const [settledOn, setSettledOn] = useState(dayIso(new Date()));
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [columns, setColumns] = useState<ColumnChoice>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function pick(f: File | undefined) {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setMessage('The file is larger than 2 MB; split it by date.'); return; }
    setFile({ name: f.name, text: await f.text() }); setHeaders(null); setColumns({}); setMessage('');
  }
  async function send() {
    if (!file) return;
    setBusy(true); setMessage('');
    try {
      const res = (await client.post(`/api/accounting/${storeId}/settlements`, { gateway, settledOn, csv: file.text, fileName: file.name, ...(headers ? { columns } : {}) }, { toast: false })) as unknown as { settlement: { _id: string }; skippedRows: number };
      toast.success(res.skippedRows ? `Imported; ${res.skippedRows} row(s) without a reference or amount were left out.` : 'Imported: review and post it.');
      onDone(res.settlement._id);
    } catch (e) {
      const data = (e as { response?: { data?: { headers?: string[]; columns?: ColumnChoice; message?: string } } }).response?.data;
      if (data?.headers) { setHeaders(data.headers); setColumns(data.columns ?? {}); }
      setMessage(data?.message ?? errorMessage(e));
    } finally { setBusy(false); }
  }
  const fields: [keyof ColumnChoice, string][] = [['reference', 'Transaction reference or order number'], ['gross', 'Gross amount'], ['fee', 'Fee'], ['net', 'Net amount'], ['date', 'Date']];
  return (
    <Modal title="Upload settlement" onClose={onClose} width={600}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} disabled={!file} onClick={() => void send()}>Import</Button></>}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="From" value={gateway} onChange={e => setGateway(e.target.value)}>{sources.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</Select>
          <DateField label="Date it reached your bank" value={settledOn} onChange={e => setSettledOn(e.target.value)} />
        </div>
        <label className="flex flex-col gap-1 text-[13px] text-carbon">
          Settlement file (CSV)
          <input type="file" accept=".csv,text/csv" aria-label="Settlement file" onChange={e => void pick(e.target.files?.[0])} />
        </label>
        {headers && (
          <div className="flex flex-col gap-2 rounded-lg bg-cream p-3">
            <p className="m-0 text-[13px] font-semibold text-carbon">Which column is which?</p>
            {fields.map(([k, l]) => (
              <div key={k} className="grid grid-cols-[1fr_1fr] items-center gap-2">
                <label htmlFor={`col-${k}`} className="text-[13px] text-carbon">{l}</label>
                <Select id={`col-${k}`} value={columns[k] ?? ''} onChange={e => setColumns(c => ({ ...c, [k]: e.target.value === '' ? undefined : Number(e.target.value) }))}>
                  <option value="">Not in the file</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </Select>
              </div>
            ))}
          </div>
        )}
        {message && <p className="m-0 text-[13px] text-error" role="alert">{message}</p>}
        <p className="m-0 text-xs text-slate">Columns are found from the file's headings (for example pp_TxnRefNo, Transaction Amount, Fee, Net Amount). Two of gross, fee and net are enough.</p>
      </div>
    </Modal>
  );
}

function SettlementModal({ storeId, id, exponent, currency, canManage, label, onClose, onChanged }: {
  storeId: string; id: string; exponent: number; currency: string; canManage: boolean; label: (k: string) => string; onClose: () => void; onChanged: () => void;
}) {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const r = useApi<Settlement>(`/api/accounting/${storeId}/settlements/${id}?t=${tick}`);
  const [busy, setBusy] = useState<string | null>(null);
  const s = r.data;
  async function act(kind: 'post' | 'discard') {
    setBusy(kind);
    try { await client.post(`/api/accounting/${storeId}/settlements/${id}/${kind}`, {}); toast.success(kind === 'post' ? 'Posted to the books' : 'Discarded'); setTick(t => t + 1); onChanged(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }
  const columns: TableColumn<SettlementLine>[] = [
    { key: 'r', header: 'Reference', render: l => <div><div className="text-carbon">{l.reference}</div>{l.date && <div className="text-xs text-slate">{l.date}</div>}</div> },
    { key: 'o', header: 'Order', render: l => l.match.orderNumbers.join(', ') || '—' },
    { key: 'm', header: 'Match', render: l => <div><Badge size="sm" color={MATCH[l.match.status]?.color ?? 'gray'}>{MATCH[l.match.status]?.label ?? l.match.status}</Badge>{l.match.status === 'amount_differs' && l.match.expectedMinor != null && <div className="text-xs text-slate">Order: {fmt(l.match.expectedMinor, exponent)}</div>}</div> },
    { key: 'g', header: 'Gross', align: 'right', render: l => fmt(l.grossMinor, exponent) },
    { key: 'f', header: 'Fee', align: 'right', render: l => fmt(l.feeMinor, exponent) },
    { key: 'n', header: 'Net', align: 'right', render: l => fmt(l.netMinor, exponent) },
  ];
  return (
    <Modal title={s ? `${label(s.gateway)} settlement` : 'Settlement'} onClose={onClose} width={900}>
      {r.error ? <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} /> : !s ? <div className="h-40 animate-pulse rounded-xl bg-cream" /> : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-carbon">
            <Badge size="sm" color={STATUS[s.status].color}>{STATUS[s.status].label}</Badge>
            <span>Paid in {shortDate(s.settledOn)}</span>
            <span className="text-slate">Gross {fmt(s.totals.grossMinor, exponent)} · fees {fmt(s.totals.feeMinor, exponent)} · net <strong className="text-carbon">{fmt(s.totals.netMinor, exponent)} {currency}</strong></span>
          </div>
          {s.status === 'draft' && s.totals.unmatched > 0 && <p className="m-0 rounded-lg bg-cream p-3 text-[12.5px] text-carbon">{s.totals.unmatched} line(s) need a look: not found, a different amount, or already posted. Lines already posted are left out; the rest are posted, and any difference stays in the clearing account until you correct it.</p>}
          <Table columns={columns} data={s.lines ?? []} keyExtractor={l => l.row} emptyState={false} />
          {canManage && s.status === 'draft' && (
            <div className="flex justify-end gap-2 border-t border-bone pt-3">
              <Button variant="outline" size="sm" loading={busy === 'discard'} onClick={() => void act('discard')}>Discard</Button>
              <Button size="sm" loading={busy === 'post'} onClick={() => void act('post')}>Post to the books</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
