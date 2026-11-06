import { useState } from 'react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Select, StatusBadge, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from './ErrorLine';
import type { CatalogRow } from './CompaniesTab';
import { PAGE_SIZE, shortDate, usePaged, valueToTerms } from './wholesaleUtils';

interface Application { _id: string; email: string; companyName: string; taxId: string | null; phone: string | null; message: string | null; status: string; decisionNote: string | null; createdAt: string }

export function ApplicationsTab({ storeId, catalogs }: { storeId: string; catalogs: CatalogRow[] }) {
  const base = `/api/b2b/${storeId}`;
  const canEdit = can('b2b.manage');
  const [status, setStatus] = useState('pending');
  const list = usePaged<Application>(`${base}/applications`, { status });
  const [deciding, setDeciding] = useState<{ app: Application; mode: 'approve' | 'reject' } | null>(null);

  const columns: TableColumn<Application>[] = [
    { key: 'company', header: 'Company', render: (a) => <div><div className="font-semibold text-carbon">{a.companyName}</div><div className="text-xs text-slate">{a.email}{a.phone ? ` · ${a.phone}` : ''}</div></div> },
    { key: 'tax', header: 'Tax number', render: (a) => a.taxId ?? '—' },
    { key: 'msg', header: 'Message', render: (a) => <span className="line-clamp-2 text-[13px]">{a.message ?? '—'}</span> },
    { key: 'date', header: 'Applied', render: (a) => shortDate(a.createdAt) },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} size="sm" /> },
    { key: 'a', header: 'Actions', align: 'right', render: (a) => (canEdit && a.status === 'pending' ? (
      <div className="flex justify-end gap-2">
        <Button size="xs" onClick={() => setDeciding({ app: a, mode: 'approve' })}>Approve</Button>
        <Button size="xs" variant="outline" onClick={() => setDeciding({ app: a, mode: 'reject' })}>Reject</Button>
      </div>
    ) : null) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full sm:w-52">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Waiting for review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option>
        </Select>
      </div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : (
        <Table columns={columns} data={list.rows} keyExtractor={(a) => a._id} loading={list.loading}
          pagination={{ page: list.page, total: list.total, perPage: PAGE_SIZE, onChange: list.setPage, label: 'applications' }}
          emptyState={{ title: 'No applications', description: 'Customers apply for a wholesale account from your store. They will show up here.' }} />
      )}
      {deciding && <DecisionModal base={base} catalogs={catalogs} {...deciding} onClose={() => setDeciding(null)} onDone={() => { setDeciding(null); list.reload(); }} />}
    </div>
  );
}

function DecisionModal({ base, catalogs, app, mode, onClose, onDone }: { base: string; catalogs: CatalogRow[]; app: Application; mode: 'approve' | 'reject'; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [catalogId, setCatalogId] = useState('');
  const [terms, setTerms] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await client.post(`${base}/applications/${app._id}/${mode}`, mode === 'approve' ? { note: note.trim() || undefined, catalogId: catalogId || undefined, paymentTerms: valueToTerms(terms) ?? undefined } : { note: note.trim() || undefined });
      toast.success(mode === 'approve' ? 'Company created and applicant linked' : 'Application rejected');
      onDone();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <Modal title={mode === 'approve' ? `Approve ${app.companyName}` : `Reject ${app.companyName}`} onClose={onClose} width={480}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" variant={mode === 'reject' ? 'danger' : 'primary'} loading={busy} onClick={() => void submit()}>{mode === 'approve' ? 'Approve' : 'Reject'}</Button></>}>
      <div className="flex flex-col gap-3">
        {mode === 'approve' && (
          <>
            <p className="m-0 text-[13px] text-slate">This creates the company with a main location and makes {app.email} its location admin. You can change everything later.</p>
            <Select label="Catalog (wholesale prices)" value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
              <option value="">None (retail prices)</option>
              {catalogs.filter((c) => c.status === 'active').map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Select label="Payment terms" value={terms} onChange={(e) => setTerms(e.target.value)}>
              <option value="">None (pays at checkout)</option><option value="due_on_order">Due on order</option>
              <option value="net:15">Net 15</option><option value="net:30">Net 30</option><option value="net:60">Net 60</option><option value="due_on_fulfilment">Due on fulfilment</option>
            </Select>
          </>
        )}
        <Input label={mode === 'approve' ? 'Note (internal)' : 'Reason (the applicant can see it)'} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
