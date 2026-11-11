import { useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronDown, LifeBuoy } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button, EmptyState, Input, Select, SkeletonBox, StatusBadge, Textarea } from '@/components/comman/ui';
import { SupportTierBadge } from '@/components/comman/SupportTierBadge';
import { errorMessage } from '@/api/errorMessage';
import { useSupportRequests } from '@/hooks/seller/useSupportRequests';
import {
  apiCreateSupportRequest, SUPPORT_CATEGORY_LABEL,
  type SupportCategory, type SupportRequest, type SupportStatus,
} from '@/api/services/support';

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 4000;
const CATEGORIES = Object.keys(SUPPORT_CATEGORY_LABEL) as SupportCategory[];
const STATUS_LABEL: Record<SupportStatus, string> = { new: 'Sent', read: 'Seen', resolved: 'Resolved' };

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function RequestRow({ r }: { r: SupportRequest }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border border-bone rounded-lg bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 text-left px-4 py-3 cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-charcoal truncate">{r.subject}</p>
          <p className="text-[11.5px] text-slate mt-0.5">
            {SUPPORT_CATEGORY_LABEL[r.category] ?? 'Other'} · {fmt(r.createdAt)}
            {r.replies.length > 0 && ` · ${r.replies.length} ${r.replies.length === 1 ? 'reply' : 'replies'}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SupportTierBadge tier={r.tier} size="sm" />
          <StatusBadge status={STATUS_LABEL[r.status] ?? r.status} size="sm" />
          <ChevronDown size={15} className={`text-slate transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-bone px-4 py-3 flex flex-col gap-3">
          <p className="text-[13px] text-charcoal leading-[1.6] whitespace-pre-wrap">{r.message}</p>
          {r.replies.length === 0 ? (
            <p className="text-[12px] text-slate">No reply yet. We reply by email.</p>
          ) : r.replies.map((x, i) => (
            <div key={i} className="rounded-lg bg-cream px-3 py-2.5">
              <p className="text-[11.5px] text-slate mb-1">{x.sentBy} · {fmt(x.sentAt)}</p>
              <p className="text-[13px] text-charcoal leading-[1.6] whitespace-pre-wrap">{x.message}</p>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

/** Settings → Help: send a help request to Solvexo and read the answers. */
export default function Help() {
  const { storeId } = useStoreWorkspace();
  const list = useSupportRequests(storeId);
  const [category, setCategory] = useState<SupportCategory>('other');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const subjectError = !subject.trim() ? 'Write a short subject.' : subject.length > SUBJECT_MAX ? `Keep it under ${SUBJECT_MAX} characters.` : '';
  const messageError = !message.trim() ? 'Tell us what is going on.' : message.length > MESSAGE_MAX ? `Keep it under ${MESSAGE_MAX} characters.` : '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setSubmitError('');
    if (subjectError || messageError) return;
    setBusy(true);
    try {
      await apiCreateSupportRequest(storeId, { category, subject: subject.trim(), message: message.trim() });
      setSent(true);
      setSubject(''); setMessage(''); setTouched(false);
      list.goToPage(1);
      list.reload();
    } catch (err) {
      setSubmitError(errorMessage(err, 'Your request could not be sent. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <>
      <StorePageHeader title="Help" subtitle="Send a request to the Solvexo team" />
      <div className="px-4 lg:px-7 pt-5 pb-10 w-full grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] items-start">
        <section className="border border-bone rounded-[10px] bg-white p-5 flex flex-col gap-4" aria-labelledby="help-new">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 id="help-new" className="text-[15px] font-bold text-carbon">New request</h2>
            <div className="flex items-center gap-2 text-[12px] text-slate">
              Your support level <SupportTierBadge tier={list.tier} />
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col items-start gap-3" role="status">
              <div className="flex items-center gap-2 text-success text-[13px] font-semibold"><CheckCircle2 size={18} /> Request sent</div>
              <p className="text-[13px] text-charcoal leading-[1.6]">We reply by email. You will also see the answer below.</p>
              <Button variant="outline" onClick={() => setSent(false)}>Send another request</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
              <Select label="Topic" value={category} onChange={e => setCategory(e.target.value as SupportCategory)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{SUPPORT_CATEGORY_LABEL[c]}</option>)}
              </Select>
              <Input
                label="Subject" value={subject} maxLength={SUBJECT_MAX + 20}
                onChange={e => setSubject(e.target.value)} error={touched ? subjectError : ''}
              />
              <Textarea
                label="Message" rows={6} value={message}
                onChange={e => setMessage(e.target.value)} error={touched ? messageError : ''}
              />
              <p className="text-[11.5px] text-slate -mt-2">{message.length}/{MESSAGE_MAX} · We reply by email.</p>
              {submitError && <p role="alert" className="text-[12.5px] text-error">{submitError}</p>}
              <div><Button type="submit" loading={busy}>Send request</Button></div>
            </form>
          )}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="help-mine">
          <h2 id="help-mine" className="text-[15px] font-bold text-carbon">My requests</h2>
          {list.error ? (
            <div role="alert" className="border border-error-border bg-error-bg rounded-lg px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-[12.5px] text-error">{list.error}</p>
              <Button variant="outline" size="sm" onClick={list.reload}>Retry</Button>
            </div>
          ) : list.loading ? (
            <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading your requests">
              {[0, 1, 2].map(i => <SkeletonBox key={i} height={58} rounded="8px" />)}
            </div>
          ) : list.items && list.items.length === 0 ? (
            <EmptyState icon={<LifeBuoy size={28} className="text-slate" />} title="No requests yet" description="When you send a request, it and our reply will show up here." className="py-10" />
          ) : (
            <>
              <ul className="flex flex-col gap-2">{list.items?.map(r => <RequestRow key={r._id} r={r} />)}</ul>
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-[12px] text-slate">
                  <Button variant="outline" size="sm" disabled={list.page <= 1} onClick={() => list.goToPage(list.page - 1)}>Previous</Button>
                  <span>Page {list.page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={list.page >= totalPages} onClick={() => list.goToPage(list.page + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
