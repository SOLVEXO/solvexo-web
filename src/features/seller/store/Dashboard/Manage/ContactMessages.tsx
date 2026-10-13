import { useCallback, useEffect, useState } from 'react';
import { Archive, Inbox, Mail, Trash2 } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import {
  apiListContactMessages, apiSetContactMessageStatus, apiDeleteContactMessage,
  type ContactMessage, type ContactMessageStatus,
} from '@/api/services/storeContact';

const FILTERS: { value: ContactMessageStatus | ''; label: string }[] = [
  { value: '', label: 'All' }, { value: 'new', label: 'New' }, { value: 'read', label: 'Read' }, { value: 'archived', label: 'Archived' },
];

/** Online Store → Contact Messages: what visitors sent through the storefront contact form. */
export default function ContactMessages() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const [filter, setFilter] = useState<ContactMessageStatus | ''>('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ContactMessage[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);

  const load = useCallback(() => {
    setError('');
    setRows(null);
    apiListContactMessages(storeId, { page, status: filter })
      .then(res => { setRows(res.data); setTotalPages(res.pagination.totalPages); setUnread(res.unread); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load messages.'));
  }, [storeId, page, filter]);
  useEffect(() => { load(); }, [load]);

  async function setStatus(m: ContactMessage, status: ContactMessageStatus) {
    try {
      await apiSetContactMessageStatus(storeId, m._id, status);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update this message.');
    }
  }

  async function remove(m: ContactMessage) {
    try {
      await apiDeleteContactMessage(storeId, m._id);
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete this message.');
    }
  }

  return (
    <>
      <StorePageHeader title="Contact Messages" subtitle={`Messages sent through your storefront's contact form.${unread ? ` ${unread} new.` : ''}`} />
      <div className="px-4 md:px-7 py-5 flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filter messages">
          {FILTERS.map(f => (
            <button key={f.value || 'all'} type="button" role="tab" aria-selected={filter === f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border cursor-pointer ${filter === f.value ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-bone'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center"><p className="text-[13px] text-slate">{error}</p><Button onClick={load}>Retry</Button></div>
        ) : rows === null ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={96} rounded="10px" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<Inbox size={28} />} title="No messages" description="Add a Contact form section to a page (Online Store → Pages) and messages will arrive here." />
        ) : (
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {rows.map(m => (
              <li key={m._id} className={`bg-white border rounded-[10px] p-4 flex flex-col gap-2 ${m.status === 'new' ? 'border-brand-orange/50' : 'border-bone'}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-charcoal m-0">{m.name}{m.status === 'new' && <span className="ml-2 text-[10px] font-bold uppercase text-brand-orange">New</span>}</p>
                    <p className="text-[12px] text-slate m-0">{m.email}{m.phone ? ` · ${m.phone}` : ''} · {new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`} onClick={() => m.status === 'new' && setStatus(m, 'read')}
                      className="px-2.5 py-1.5 rounded-md text-[12px] font-medium text-charcoal bg-cream border border-bone no-underline flex items-center gap-1"><Mail size={12} /> Reply</a>
                    {m.status !== 'read' && <button type="button" onClick={() => setStatus(m, 'read')} className="px-2.5 py-1.5 rounded-md text-[12px] text-slate bg-transparent border border-bone cursor-pointer">Mark read</button>}
                    {m.status !== 'archived' && <button type="button" onClick={() => setStatus(m, 'archived')} aria-label="Archive" title="Archive" className="p-1.5 text-slate bg-transparent border-0 cursor-pointer"><Archive size={14} /></button>}
                    <button type="button" onClick={() => setPendingDelete(m)} aria-label="Delete" title="Delete" className="p-1.5 text-error bg-transparent border-0 cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-[13px] text-charcoal m-0 whitespace-pre-line">{m.message}</p>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-[12px] text-slate">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
      {pendingDelete && (
        <ConfirmDialog title="Delete message" message={`Delete the message from ${pendingDelete.name}? This cannot be undone.`} confirmLabel="Delete" onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete)} />
      )}
    </>
  );
}
