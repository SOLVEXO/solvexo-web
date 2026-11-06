import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Input, Select, StatusBadge, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from './ErrorLine';
import { PAGE_SIZE, money, shortDate, useApi, usePaged } from './wholesaleUtils';

interface Payment { _id: string; amount: number; method: string; reference: string | null; date: string; voided?: boolean }
interface OrderRow {
  _id: string; orderNumber: string; createdAt: string; orderStatus: string; isPaid: boolean; currency: string;
  b2b: { companyName: string; poNumber: string | null; payments: Payment[] } | null;
  receivable: { total: number; paid: number; outstanding: number; status: 'unpaid' | 'partial' | 'paid'; dueDate: string | null; overdue: boolean; depositRequired: number; depositMet: boolean } | null;
}
interface ReportRow { companyId: string; companyName: string; currency: string; orders: number; outstanding: number; overdue: number; oldestDue: string | null }

export function OrdersTab({ storeId }: { storeId: string }) {
  const base = `/api/b2b/${storeId}`;
  const [status, setStatus] = useState('');
  const [overdue, setOverdue] = useState('');
  const list = usePaged<OrderRow>(`${base}/orders`, { status, overdue });
  const report = useApi<{ items: ReportRow[] }>(`${base}/reports/outstanding`);
  const [paying, setPaying] = useState<OrderRow | null>(null);
  const toast = useToast();
  const canEdit = can('b2b.manage');

  async function downloadCsv() {
    try {
      const blob = (await client.get(`${base}/reports/outstanding.csv`, { responseType: 'blob' })) as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'outstanding-balances.csv'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { toast.error(errorMessage(e)); }
  }

  const columns: TableColumn<OrderRow>[] = [
    { key: 'o', header: 'Order', render: (o) => <Link to={`../orders/${o._id}`} className="font-semibold text-carbon underline-offset-2 hover:underline">#{o.orderNumber}</Link> },
    { key: 'c', header: 'Company', render: (o) => <div><div>{o.b2b?.companyName}</div>{o.b2b?.poNumber && <div className="text-xs text-slate">PO {o.b2b.poNumber}</div>}</div> },
    { key: 'st', header: 'Order', render: (o) => <StatusBadge status={o.orderStatus} size="sm" /> },
    { key: 'tot', header: 'Total', render: (o) => (o.receivable ? money(o.receivable.total, o.currency) : '—') },
    { key: 'out', header: 'Outstanding', render: (o) => (o.receivable ? money(o.receivable.outstanding, o.currency) : 'Paid at checkout') },
    { key: 'due', header: 'Due', render: (o) => (o.receivable ? <span>{shortDate(o.receivable.dueDate)} {o.receivable.overdue && <Badge color="red" size="sm">Overdue</Badge>}</span> : '—') },
    { key: 'pay', header: 'Payment', render: (o) => (o.receivable ? <StatusBadge status={o.receivable.status} size="sm" /> : null) },
    { key: 'a', header: 'Actions', align: 'right', render: (o) => (canEdit && o.receivable && o.receivable.outstanding > 0 && !['cancelled', 'refunded'].includes(o.orderStatus) ? <Button size="xs" onClick={() => setPaying(o)}>Record payment</Button> : null) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="m-0 flex-1 text-[15px] font-semibold text-carbon">Outstanding balances</h2>
          <Button size="xs" variant="outline" onClick={() => void downloadCsv()}>Export CSV</Button>
        </div>
        {report.error ? <ErrorLine message={errorMessage(report.error)} onRetry={report.reload} /> : (
          <Table columns={[
            { key: 'c', header: 'Company', render: (r: ReportRow) => r.companyName },
            { key: 'n', header: 'Open orders', render: (r: ReportRow) => String(r.orders) },
            { key: 'o', header: 'Outstanding', render: (r: ReportRow) => money(r.outstanding, r.currency) },
            { key: 'v', header: 'Overdue', render: (r: ReportRow) => (r.overdue > 0 ? <span className="font-semibold text-error">{money(r.overdue, r.currency)}</span> : '—') },
            { key: 'd', header: 'Oldest due', render: (r: ReportRow) => shortDate(r.oldestDue) },
          ]} data={report.data?.items ?? []} keyExtractor={(r) => `${r.companyId}-${r.currency}`} loading={report.loading}
          emptyState={{ title: 'Nothing outstanding', description: 'Orders placed on payment terms that are not fully paid appear here.' }} />
        )}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-[15px] font-semibold text-carbon">Wholesale orders</h2>
        <div className="flex flex-wrap gap-3">
          <div className="w-full sm:w-48"><Select label="Payment" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option value="unpaid">Unpaid</option><option value="partial">Partly paid</option><option value="paid">Paid</option></Select></div>
          <div className="w-full sm:w-48"><Select label="Due" value={overdue} onChange={(e) => setOverdue(e.target.value)}><option value="">Any</option><option value="true">Overdue only</option></Select></div>
        </div>
        {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : (
          <Table columns={columns} data={list.rows} keyExtractor={(o) => o._id} loading={list.loading}
            pagination={{ page: list.page, total: list.total, perPage: PAGE_SIZE, onChange: list.setPage, label: 'orders' }}
            emptyState={{ title: 'No wholesale orders', description: 'Orders placed by approved companies appear here, with their PO number and payment terms.' }} />
        )}
      </section>
      {paying && <PaymentModal base={base} order={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); list.reload(); report.reload(); }} />}
    </div>
  );
}

function PaymentModal({ base, order, onClose, onDone }: { base: string; order: OrderRow; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const r = order.receivable!;
  const [amount, setAmount] = useState(String(r.outstanding));
  const [method, setMethod] = useState('Bank transfer');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const live = (order.b2b?.payments ?? []).filter((p) => !p.voided);

  async function save() {
    setBusy(true);
    try {
      const res = (await client.post(`${base}/orders/${order._id}/payments`, { amount: Number(amount), method, reference: reference.trim() || undefined, date })) as { status: string; markedPaid: boolean; markError?: string };
      toast.success(res.status === 'paid' ? (res.markedPaid ? 'Fully paid: the order is marked paid' : 'Fully paid, but the order could not be marked paid automatically') : 'Payment recorded');
      onDone();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  async function voidPayment(id: string) {
    try { await client.post(`${base}/orders/${order._id}/payments/${id}/void`); toast.success('Payment voided'); onDone(); } catch (e) { toast.error(errorMessage(e)); }
  }

  return (
    <Modal title={`Record payment · #${order.orderNumber}`} onClose={onClose} width={480}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={() => void save()}>Record payment</Button></>}>
      <div className="flex flex-col gap-3">
        <p className="m-0 text-[13px] text-slate">Total {money(r.total, order.currency)} · paid {money(r.paid, order.currency)} · outstanding <strong className="text-carbon">{money(r.outstanding, order.currency)}</strong>. Solvexo does not move this money: record what the company paid you.</p>
        {r.depositRequired > 0 && !r.depositMet && <p role="status" className="m-0 text-[13px] text-warning">A deposit of {money(r.depositRequired, order.currency)} must be recorded before this order can ship.</p>}
        <Input label="Amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input label="Method (bank transfer, cash, cheque…)" maxLength={40} value={method} onChange={(e) => setMethod(e.target.value)} />
        <Input label="Reference (optional)" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} />
        <Input label="Date received" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        {live.length > 0 && (
          <div>
            <strong className="text-[13px] text-carbon">Recorded so far</strong>
            <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
              {live.map((p) => (
                <li key={p._id} className="flex items-center gap-2 text-[13px] text-carbon">
                  <span className="flex-1">{money(p.amount, order.currency)} · {p.method}{p.reference ? ` · ${p.reference}` : ''} · {shortDate(p.date)}</span>
                  {!order.isPaid && <Button size="xs" variant="outline" onClick={() => void voidPayment(p._id)}>Void</Button>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
