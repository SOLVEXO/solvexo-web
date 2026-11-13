import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Download, Inbox, Mail, Paperclip, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import {
  apiListContactMessages, apiSetContactMessageStatus, apiDeleteContactMessage, apiReplyContactMessage, apiListContactForms, apiExportContactMessages, apiContactFileLink,
  type ContactMessage, type ContactMessageStatus,
} from '@/api/services/storeContact';
import { downloadBlob } from '@/utils/downloadBlob';
import { FormReportModal } from './FormReportModal';

const FILTERS: { value: ContactMessageStatus | ''; label: string }[] = [
  { value: '', label: 'All' }, { value: 'new', label: 'New' }, { value: 'read', label: 'Read' }, { value: 'archived', label: 'Archived' }, { value: 'spam', label: 'Spam' },
];

/** Who sent it: the form may have no Name field, so fall back to the email, the phone or a plain word. */
const who = (m: ContactMessage) => m.name || m.email || m.phone || 'Visitor';

/** Online Store → Contact Messages: what visitors sent through the storefront contact form. */
export default function ContactMessages() {
  const { storeId, store } = useStoreWorkspace();
  const toast = useToast();
  const [filter, setFilter] = useState<ContactMessageStatus | ''>('');
  const [form, setForm] = useState('');
  const [source, setSource] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [forms, setForms] = useState<{ name: string; total: number; unread: number }[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [spam, setSpam] = useState(0);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ContactMessage[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const noContactEmail = !String((store as { contactEmail?: string | null } | null)?.contactEmail ?? '').trim();

  const load = useCallback(() => {
    setError('');
    setRows(null);
    apiListContactMessages(storeId, { page, status: filter, form, q: query, source })
      .then(res => { setRows(res.data); setTotalPages(res.pagination.totalPages); setUnread(res.unread); setSpam(res.spam ?? 0); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load messages.'));
    // The forms that have messages: the filter only appears when there is more than one kind.
    apiListContactForms(storeId).then(res => setForms(res.data)).catch(() => undefined);
  }, [storeId, page, filter, form, query, source]);
  useEffect(() => { load(); }, [load]);

  // Search as the seller types, without a request per key.
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  /** Attached files are private: ask for a 2-minute link and open it. */
  async function openFile(m: ContactMessage, fileId: string) {
    try {
      const res = await apiContactFileLink(storeId, m._id, fileId);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open the file.');
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await apiExportContactMessages(storeId, { status: filter, form, q: query, source });
      downloadBlob(blob, 'contact-messages.csv');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not export the messages.');
    } finally {
      setExporting(false);
    }
  }

  async function setStatus(m: ContactMessage, status: ContactMessageStatus) {
    try {
      await apiSetContactMessageStatus(storeId, m._id, status);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update this message.');
    }
  }

  function startReply(m: ContactMessage) {
    setReplyingId(m._id); setReplyText(''); setReplyError('');
    if (m.status === 'new') void setStatus(m, 'read');
  }

  async function sendReply(m: ContactMessage) {
    setSending(true); setReplyError('');
    try {
      await apiReplyContactMessage(storeId, m._id, replyText.trim());
      toast.success(`Reply sent to ${m.email}`);
      setReplyingId(null); setReplyText('');
      load();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'The reply could not be sent.');
    } finally {
      setSending(false);
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
              {f.label}{f.value === 'spam' && spam > 0 ? ` (${spam})` : ''}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate" aria-hidden />
            <input type="search" aria-label="Search messages" placeholder="Search name, email or any answer" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-bone bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-brand-orange" />
          </div>
          {forms.length > 1 && (
            <select aria-label="Filter by form" value={form} onChange={e => { setForm(e.target.value); setPage(1); }}
              className="rounded-lg border border-bone bg-white px-3 py-2 text-[13px] text-charcoal outline-none focus:border-brand-orange">
              <option value="">All forms</option>
              {forms.map(f => <option key={f.name || '__unnamed'} value={f.name || '__unnamed'}>{f.name || 'Unnamed form'} ({f.total})</option>)}
            </select>
          )}
          <select aria-label="Filter by source" value={source} onChange={e => { setSource(e.target.value); setPage(1); }}
            className="rounded-lg border border-bone bg-white px-3 py-2 text-[13px] text-charcoal outline-none focus:border-brand-orange">
            <option value="">All sources</option>
            {['direct', 'search', 'social', 'email', 'paid', 'referral'].map(k => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={() => setShowReport(true)}>Form report</Button>
          <Button size="sm" variant="outline" onClick={() => void exportCsv()} loading={exporting}><Download size={13} className="mr-1" /> Export CSV</Button>
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
                    <p className="text-[13.5px] font-semibold text-charcoal m-0">{who(m)}{m.status === 'new' && <span className="ml-2 text-[10px] font-bold uppercase text-brand-orange">New</span>}</p>
                    {m.status === 'spam' && <p className="m-0 text-[11px] font-semibold uppercase text-error">Spam: {m.spamReason === 'links' ? 'too many links' : m.spamReason === 'honeypot' ? 'a robot filled the hidden field' : 'looks like spam'}</p>}
                    <p className="text-[12px] text-slate m-0">{[m.formName, m.email, m.phone, new Date(m.createdAt).toLocaleString()].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.email ? <button type="button" onClick={() => startReply(m)} aria-expanded={replyingId === m._id} className="px-2.5 py-1.5 rounded-md text-[12px] font-medium text-charcoal bg-cream border border-bone cursor-pointer flex items-center gap-1"><Mail size={12} /> Reply</button> : <span className="px-2 text-[11px] text-slate">No email: contact by phone</span>}
                    {m.status === 'spam'
                      ? <button type="button" onClick={() => setStatus(m, 'read')} className="px-2.5 py-1.5 rounded-md text-[12px] font-medium text-charcoal bg-cream border border-bone cursor-pointer">Not spam</button>
                      : <button type="button" onClick={() => setStatus(m, 'spam')} aria-label="Mark as spam" title="Mark as spam" className="p-1.5 text-slate bg-transparent border-0 cursor-pointer"><ShieldAlert size={14} /></button>}
                    {m.status !== 'read' && m.status !== 'spam' && <button type="button" onClick={() => setStatus(m, 'read')} className="px-2.5 py-1.5 rounded-md text-[12px] text-slate bg-transparent border border-bone cursor-pointer">Mark read</button>}
                    {m.status !== 'archived' && m.status !== 'spam' && <button type="button" onClick={() => setStatus(m, 'archived')} aria-label="Archive" title="Archive" className="p-1.5 text-slate bg-transparent border-0 cursor-pointer"><Archive size={14} /></button>}
                    <button type="button" onClick={() => setPendingDelete(m)} aria-label="Delete" title="Delete" className="p-1.5 text-error bg-transparent border-0 cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
                {(m.customerId || m.source || m.pageUrl) && (
                  <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate">
                    {m.customerId && <Link to={`/store/${storeId}/customer/list?search=${encodeURIComponent(m.email)}`} className="rounded-full bg-success-bg px-2 py-0.5 font-semibold text-success no-underline">Existing customer · {m.customerOrders ?? 0} order{m.customerOrders === 1 ? '' : 's'} · View</Link>}
                    {m.source?.trafficSource && <span>From: {m.source.trafficSource}{m.source.referrerHost ? ` (${m.source.referrerHost})` : ''}{m.source.utmCampaign ? ` · campaign ${m.source.utmCampaign}` : ''}</span>}
                    {m.source?.deviceType && <span>{m.source.deviceType}{m.source.country ? ` · ${m.source.country}` : ''}</span>}
                    {m.pageUrl && <a href={m.pageUrl} target="_blank" rel="noopener noreferrer" className="max-w-[260px] truncate underline">{m.pageUrl.replace(/^https?:\/\//, '')}</a>}
                  </p>
                )}
                {m.message && <p className="text-[13px] text-charcoal m-0 whitespace-pre-line">{m.message}</p>}
                {(m.fields ?? []).some(f => !['name', 'email', 'phone'].includes(f.type) && f.value !== m.message) && (
                  <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-lg bg-cream px-3 py-2.5 sm:grid-cols-[minmax(120px,auto)_1fr]">
                    {(m.fields ?? []).filter(f => !['name', 'email', 'phone'].includes(f.type) && f.value !== m.message).map(f => (
                      <div key={f.id} className="contents">
                        <dt className="text-[12px] font-medium text-slate">{f.label}</dt>
                        <dd className="m-0 whitespace-pre-line break-words text-[13px] text-charcoal">{f.fileId
                          ? <button type="button" onClick={() => void openFile(m, f.fileId as string)} className="inline-flex items-center gap-1.5 rounded-md border border-bone bg-white px-2 py-1 text-[12px] text-charcoal cursor-pointer"><Paperclip size={12} /> {f.value}</button>
                          : f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {(m.replies ?? []).map((r, i) => (
                  <div key={i} className="ml-4 pl-3 border-l-2 border-brand-orange/50">
                    <p className="text-[11px] text-slate m-0">You replied · {new Date(r.sentAt).toLocaleString()}{r.sentBy ? ` · ${r.sentBy}` : ''}</p>
                    <p className="text-[13px] text-charcoal m-0 whitespace-pre-line">{r.message}</p>
                  </div>
                ))}
                {replyingId === m._id && (
                  <div className="flex flex-col gap-2 border-t border-bone pt-3">
                    {noContactEmail && <p role="alert" className="m-0 text-[12px] text-error">Your store has no contact email, so {who(m)} cannot reply to this mail. Add one in Settings → Basic information.</p>}
                    <label htmlFor={`reply-${m._id}`} className="text-[12px] font-medium text-charcoal">Reply to {who(m)} ({m.email})</label>
                    <textarea id={`reply-${m._id}`} value={replyText} onChange={e => setReplyText(e.target.value)} rows={5} maxLength={5000}
                      className="w-full border border-bone rounded-lg px-3 py-2 text-[16px] sm:text-[13px] outline-none focus:border-brand-orange" />
                    {replyError && <p role="alert" className="m-0 text-[12px] text-error">{replyError}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => void sendReply(m)} loading={sending} disabled={!replyText.trim()}>Send reply</Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingId(null)}>Cancel</Button>
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`} className="text-[12px] text-slate underline ml-auto">Open in my email app instead</a>
                    </div>
                  </div>
                )}
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
        <ConfirmDialog title="Delete message" message={`Delete the message from ${who(pendingDelete)}? This cannot be undone.`} confirmLabel="Delete" onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete)} />
      )}
      {showReport && <FormReportModal storeId={storeId} onClose={() => setShowReport(false)} />}
    </>
  );
}
