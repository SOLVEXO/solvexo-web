import { useState } from 'react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import { Badge, Button, Card, Input, Select, Table } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui/Table';
import { Modal } from '@/components/comman/ui/Modal';

interface Invoice {
  id: string; planId: string; planName: string; customerName: string | null; customerEmail: string | null;
  amount: number; currency: string; dueAt: string; status: 'awaiting' | 'submitted' | 'overdue' | 'paid' | 'void';
  reference: string | null; senderName: string | null; submittedAt: string | null; rejectionReason: string | null; hasProof: boolean; proofName: string | null;
}
interface Queue { items: Invoice[]; total: number; summary: Record<string, number> }
interface PlanOption { _id: string; name: string }

const PAGE_SIZE = 20;
const STATUS_LABEL: Record<string, string> = { awaiting: 'Awaiting payment', submitted: 'Proof submitted', overdue: 'Overdue', paid: 'Paid', void: 'Cancelled' };
const STATUS_COLOR: Record<string, 'orange' | 'yellow' | 'red' | 'green' | 'gray'> = { awaiting: 'orange', submitted: 'yellow', overdue: 'red', paid: 'green', void: 'gray' };

/** Manual billing: the queue of renewal payments the seller still has to confirm (or chase). */
export function RenewalQueue({ storeId, plans }: { storeId: string; plans: PlanOption[] }) {
  const toast = useToast();
  const base = `/api/memberships/store/${storeId}/invoices`;
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [dueBefore, setDueBefore] = useState('');
  const [pg, setPg] = useState({ key: '', page: 1 });
  const filterKey = `${status}|${planId}|${dueBefore}`;
  const page = pg.key === filterKey ? pg.page : 1; // a changed filter starts on page 1
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status) params.set('status', status);
  if (planId) params.set('planId', planId);
  if (dueBefore) params.set('dueBefore', dueBefore);
  const res = useKeyedLoad<Queue>(() => client.get(`${base}?${params.toString()}`) as Promise<Queue>, `${base}?${params.toString()}`);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<{ kind: 'approve' | 'reject' | 'void'; invoice: Invoice } | null>(null);
  const [reason, setReason] = useState('');
  const canEdit = can('members.manage');

  async function run(fn: () => Promise<unknown>, done: string) {
    setBusy(true);
    try { await fn(); toast.success(done); setSelected(new Set()); res.retry(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  async function viewProof(id: string) {
    try { window.open(((await client.get(`${base}/${id}/proof-url`)) as { url: string }).url, '_blank', 'noopener'); } catch (e) { toast.error(errorMessage(e)); }
  }
  async function bulkRemind() {
    setBusy(true);
    try {
      const r = (await client.post(`${base}/remind`, { ids: Array.from(selected) })) as { sent: number; skipped: number };
      toast.success(`${r.sent} reminder(s) sent${r.skipped ? `, ${r.skipped} skipped (reminded in the last 12 hours or already settled)` : ''}`);
      setSelected(new Set());
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  const columns: TableColumn<Invoice>[] = [
    { key: 'c', header: 'Customer', render: (i) => <div><div className="font-medium text-carbon">{i.customerName ?? 'Customer'}</div><div className="text-[11px] text-slate">{i.customerEmail ?? ''}</div></div> },
    { key: 'p', header: 'Plan', render: (i) => i.planName },
    { key: 'a', header: 'Amount', render: (i) => `${i.currency} ${i.amount}` },
    { key: 'd', header: 'Due', render: (i) => new Date(i.dueAt).toLocaleDateString() },
    { key: 's', header: 'Status', render: (i) => <div className="flex flex-col gap-1"><Badge color={STATUS_COLOR[i.status]} size="sm">{STATUS_LABEL[i.status]}</Badge>{i.reference && <span className="text-[11px] text-slate">Ref: {i.reference}</span>}{i.rejectionReason && <span className="text-[11px] text-slate">Last rejection: {i.rejectionReason}</span>}</div> },
    { key: 'x', header: 'Review', align: 'right', render: (i) => (!canEdit ? null : (
      <div className="flex flex-wrap justify-end gap-1.5">
        {i.hasProof && <Button size="xs" variant="outline" onClick={() => void viewProof(i.id)}>View receipt</Button>}
        {['awaiting', 'submitted', 'overdue'].includes(i.status) && <Button size="xs" onClick={() => setDialog({ kind: 'approve', invoice: i })}>{i.status === 'submitted' ? 'Approve' : 'Mark paid'}</Button>}
        {i.status === 'submitted' && <Button size="xs" variant="danger" onClick={() => { setReason(''); setDialog({ kind: 'reject', invoice: i }); }}>Reject</Button>}
        {['awaiting', 'overdue'].includes(i.status) && <Button size="xs" variant="ghost" onClick={() => setDialog({ kind: 'void', invoice: i })}>Cancel</Button>}
      </div>
    )) },
  ];

  const sum = res.data?.summary ?? {};
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 text-[12px]">
        <Badge color="orange">{sum.awaiting ?? 0} awaiting payment</Badge>
        <Badge color="yellow">{sum.submitted ?? 0} proof submitted</Badge>
        <Badge color="red">{sum.overdue ?? 0} overdue</Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Needs attention</option>
          {['awaiting', 'submitted', 'overdue', 'paid', 'void'].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </Select>
        <Select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">All plans</option>
          {plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
        <Input label="Due on or before" type="date" value={dueBefore} onChange={(e) => setDueBefore(e.target.value)} />
      </div>
      {res.error ? (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error"><span className="flex-1">{res.error}</span><Button size="xs" variant="outline" onClick={res.retry}>Retry</Button></div>
      ) : (
        <Table columns={columns} data={res.data?.items ?? []} keyExtractor={(i) => i.id} loading={res.loading}
          selectable={canEdit} selectedKeys={selected} onSelectionChange={setSelected}
          bulkActions={(keys) => <Button size="xs" variant="outline" loading={busy} disabled={keys.size === 0} onClick={() => void bulkRemind()}>Send reminder ({keys.size})</Button>}
          pagination={{ page, total: res.data?.total ?? 0, perPage: PAGE_SIZE, onChange: (p) => setPg({ key: filterKey, page: p }), label: 'payments' }}
          emptyState={{ title: 'Nothing to confirm', description: 'When a member sends a receipt it shows up here.' }} />
      )}

      {dialog?.kind === 'approve' && (
        <Modal title={dialog.invoice.status === 'submitted' ? 'Approve this payment?' : 'Mark as paid?'} onClose={() => setDialog(null)} width={440} mobileSheet={false}
          footer={<><Button variant="outline" size="sm" onClick={() => setDialog(null)}>Cancel</Button><Button size="sm" loading={busy} onClick={() => { const id = dialog.invoice.id; setDialog(null); void run(() => client.post(`${base}/${id}/approve`), 'Payment confirmed, access extended'); }}>Confirm</Button></>}>
          <p className="m-0 text-[13px] text-slate">{dialog.invoice.customerName ?? 'The member'} paid {dialog.invoice.currency} {dialog.invoice.amount} for {dialog.invoice.planName}. Their access is extended by one period and they get an email.</p>
        </Modal>
      )}
      {dialog?.kind === 'reject' && (
        <Modal title="Reject this payment proof" onClose={() => setDialog(null)} width={440} mobileSheet={false}
          footer={<><Button variant="outline" size="sm" onClick={() => setDialog(null)}>Cancel</Button><Button variant="danger" size="sm" disabled={!reason.trim()} loading={busy} onClick={() => { const id = dialog.invoice.id; const r = reason.trim(); setDialog(null); void run(() => client.post(`${base}/${id}/reject`, { reason: r }), 'Proof rejected, the member was emailed'); }}>Reject</Button></>}>
          <Input label="Reason (the member sees this)" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Modal>
      )}
      {dialog?.kind === 'void' && (
        <Modal title="Cancel this invoice?" onClose={() => setDialog(null)} width={420} mobileSheet={false}
          footer={<><Button variant="outline" size="sm" onClick={() => setDialog(null)}>Keep</Button><Button variant="danger" size="sm" loading={busy} onClick={() => { const id = dialog.invoice.id; setDialog(null); void run(() => client.post(`${base}/${id}/void`), 'Invoice cancelled'); }}>Cancel invoice</Button></>}>
          <p className="m-0 text-[13px] text-slate">The member is not asked to pay it any more. A new invoice is created for the next period.</p>
        </Modal>
      )}
      <Card padding="md"><p className="m-0 text-[12px] text-slate">While a proof waits for your decision the member keeps their access. After you reject it, or if no proof arrives, the normal grace days apply and then access ends.</p></Card>
    </div>
  );
}
