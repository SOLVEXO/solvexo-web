import { useMemo, useState, type ReactNode } from 'react';
import { MessageCircle, Eye, Trash2, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { can } from '@/hooks/auth/useCan';
import { apiAddContactToPipeline } from '@/api/services/salesOps';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminContact } from '@/hooks/admin/useAdminContact';
import { apiUpdateContactStatus, apiDeleteContactSubmission, apiReplyContactSubmission, type ContactSubmission, type ContactSubmissionStatus } from '@/api/services/contact';
import { Button, Modal, StatusBadge, ActionMenu, Table, AdminPageHeader, Textarea, type TableColumn } from '@/components/comman/ui';
import { SupportTierBadge } from '@/components/comman/SupportTierBadge';

const STATUS_LABEL: Record<ContactSubmissionStatus, string> = {
  new: 'New', read: 'Read', resolved: 'Resolved',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// ── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ submission, onClose, onAddToSales, onReplied }: { submission: ContactSubmission; onClose: () => void; onAddToSales?: () => void; onReplied?: () => void }) {
  const [replies, setReplies] = useState(submission.replies ?? []);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function sendReply() {
    if (!text.trim()) { setError('Write your reply.'); return; }
    setBusy(true); setError('');
    try {
      const res = await apiReplyContactSubmission(submission._id, text.trim());
      setReplies(res.data?.replies ?? [...replies, { message: text.trim(), sentAt: new Date().toISOString(), sentBy: 'You' }]);
      setText('');
      onReplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The reply could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal mobileSheet title={submission.topic} width={520} onClose={onClose}
      footer={<div className="flex justify-end gap-2">{onAddToSales && <Button variant="outline" onClick={onAddToSales}><Target size={14} /> Add to Sales Ops</Button>}<Button variant="outline" onClick={onClose}>Close</Button></div>}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-charcoal">{submission.name}</p>
            <p className="text-[12px] text-slate">{submission.email}</p>
            {submission.source === 'seller' && <p className="text-[12px] text-slate">Store: {submission.storeName ?? 'Unknown store'}{submission.category ? ` · ${submission.category}` : ''}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {submission.source === 'seller' && <SupportTierBadge tier={submission.tier} />}
            <StatusBadge status={STATUS_LABEL[submission.status]} />
          </div>
        </div>
        <p className="text-[11px] text-slate">{formatDate(submission.createdAt)}</p>
        <p className="text-[13px] text-charcoal leading-[1.6] whitespace-pre-wrap">{submission.message}</p>
        {replies.map((r, i) => (
          <div key={i} className="rounded-lg bg-cream px-3 py-2.5">
            <p className="text-[11.5px] text-slate mb-1">{r.sentBy} · {formatDate(r.sentAt)}</p>
            <p className="text-[13px] text-charcoal leading-[1.6] whitespace-pre-wrap">{r.message}</p>
          </div>
        ))}
        <div className="flex flex-col gap-2 border-t border-bone pt-3">
          <Textarea label={`Reply to ${submission.email} by email`} rows={4} value={text} maxLength={4000} onChange={e => setText(e.target.value)} />
          {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
          <div><Button onClick={sendReply} loading={busy}>Send reply</Button></div>
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminContactMessages({ tabs }: { tabs?: ReactNode } = {}) {
  usePageTitle('Contact Messages');
  const { submissions, stats, loading, error, refetch } = useAdminContact();
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [viewing, setViewing] = useState<ContactSubmission | null>(null);
  const [deleting, setDeleting] = useState<ContactSubmission | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  // Sales conversations ("Selling on Solvexo") go to Sales Ops on their own; any other message can be added here.
  const canSales = can(['sales.access', 'sales.manage']);

  async function addToSales(submission: ContactSubmission) {
    setActionError('');
    try {
      const r = await apiAddContactToPipeline(submission._id);
      if (r.data.visible) navigate(`/admin/sales/leads/${r.data.leadId}`);
      else setActionError(r.message ?? 'Already in the pipeline.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not add to Sales Ops.');
    }
  }

  // The API already returns the inbox ordered (open first by tier, oldest first); filtering keeps that order.
  const filtered = useMemo(
    () => submissions.filter(s =>
      (!statusFilter || s.status === statusFilter) &&
      (!tierFilter || (s.tier ?? 'standard') === tierFilter) &&
      (!sourceFilter || (s.source ?? 'public') === sourceFilter)),
    [submissions, statusFilter, tierFilter, sourceFilter],
  );

  async function handleStatusChange(submission: ContactSubmission, status: ContactSubmissionStatus) {
    setActionError('');
    try {
      await apiUpdateContactStatus(submission._id, status);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  }

  function openDetail(submission: ContactSubmission) {
    setViewing(submission);
    if (submission.status === 'new') handleStatusChange(submission, 'read');
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError('');
    try {
      await apiDeleteContactSubmission(deleting._id);
      setDeleting(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete submission.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns: TableColumn<ContactSubmission>[] = [
    {
      key: 'name', header: 'From',
      render: s => (
        <div className="max-w-[180px]">
          <p className="font-semibold truncate">{s.name}</p>
          <p className="text-[11px] text-slate truncate">{s.email}</p>
          {s.source === 'seller' && <p className="text-[11px] text-brand-deep-orange truncate">Store: {s.storeName ?? 'Unknown store'}</p>}
        </div>
      ),
    },
    {
      key: 'tier', header: 'Support',
      render: s => s.source === 'seller' ? <SupportTierBadge tier={s.tier} size="sm" /> : <span className="text-[11px] text-slate">Public form</span>,
    },
    { key: 'topic', header: 'Topic', render: s => <span className="text-graphite max-w-[160px] truncate block">{s.topic}</span> },
    { key: 'message', header: 'Message', render: s => <span className="text-slate max-w-[280px] truncate block">{s.message}</span> },
    { key: 'createdAt', header: 'Received', render: s => <span className="text-slate whitespace-nowrap">{formatDate(s.createdAt)}</span> },
    { key: 'status', header: 'Status', render: s => <StatusBadge status={STATUS_LABEL[s.status]} /> },
    {
      key: 'actions', header: 'Actions',
      render: s => (
        <div onClick={e => e.stopPropagation()}>
          <ActionMenu
            align="right"
            items={[
              { label: 'View', icon: <Eye size={13} />, onClick: () => openDetail(s) },
              ...(canSales ? [{ label: 'Add to Sales Ops', icon: <Target size={13} />, onClick: () => void addToSales(s) }] : []),
              ...(s.status !== 'resolved' ? [{ label: 'Mark Resolved', icon: <MessageCircle size={13} />, onClick: () => handleStatusChange(s, 'resolved' as ContactSubmissionStatus) }] : []),
              { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => { setDeleting(s); setActionError(''); } },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Contact Messages"
        subtitle={`${stats.new} new · ${stats.read} read · ${stats.resolved} resolved`}
      />
      {tabs}

      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
        {actionError && (
          <div className="bg-error-bg border border-error-border rounded-lg px-4 py-2.5 text-[12.5px] text-error">
            {actionError}
          </div>
        )}
        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          <div className="px-5 py-[14px] border-b border-bone flex items-center gap-[10px] flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
              <option value="">All Statuses</option>
              {(['new', 'read', 'resolved'] as const).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select aria-label="Filter by support tier" value={tierFilter} onChange={e => setTierFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
              <option value="">All tiers</option>
              <option value="dedicated">Dedicated manager</option>
              <option value="priority">Priority</option>
              <option value="standard">Standard</option>
            </select>
            <select aria-label="Filter by source" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
              <option value="">All sources</option>
              <option value="seller">Store help requests</option>
              <option value="public">Public contact form</option>
            </select>
          </div>

          {error ? (
            <p className="px-4 py-6 text-center text-[13px] text-error">{error}</p>
          ) : (
            <Table
              columns={columns}
              data={filtered}
              keyExtractor={s => s._id}
              loading={loading}
              onRowClick={openDetail}
              emptyState={{ icon: <MessageCircle size={28} className="text-slate" />, title: 'No contact messages found' }}
            />
          )}
        </div>
      </div>

      {viewing && <DetailModal submission={viewing} onClose={() => setViewing(null)} onReplied={refetch} onAddToSales={canSales ? () => { const v = viewing; setViewing(null); void addToSales(v); } : undefined} />}

      {deleting && (
        <Modal mobileSheet
          title="Delete Submission"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteBusy}>Delete</Button>
            </>
          }
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            Delete the message from "<strong>{deleting.name}</strong>"? This cannot be undone.
          </p>
          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}
    </div>
  );
}
