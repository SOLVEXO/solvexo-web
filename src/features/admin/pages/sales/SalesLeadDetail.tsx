import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ArrowLeft, CalendarClock, Mail, MessageCircle, NotebookPen, Pencil, Phone, Plus, Store, Trash2, Users, ArrowRightLeft, Bot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Input, Modal, Select, Textarea } from '@/components/comman/ui';
import { can } from '@/hooks/auth/useCan';
import { TokenStorage } from '@/api/services/auth';
import {
  LEAD_STAGES, LOST_REASON_LABELS, SOURCE_LABELS, STAGE_LABELS, apiChangeStage, apiCreateTask, apiDeleteLead, apiDeleteTask,
  apiGetLead, apiListTemplates, apiLogActivity, apiSalesOwners, apiSendLeadEmail, apiUpdateLead, apiUpdateTask, fillTemplate, formatPKR,
  type LeadDetail, type LeadStage, type LogType, type SalesActivity, type SalesOwner, type SalesTemplate,
} from '@/api/services/salesOps';
import { LeadFormModal, LostReasonModal, StageBadge } from './parts';
import { errMsg, isOverdue, relDay, useStableToast } from './sales.utils';

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  note: NotebookPen, call: Phone, whatsapp: MessageCircle, meeting: Users, email: Mail,
  stage_change: ArrowRightLeft, owner_change: ArrowRightLeft, system: Bot,
};
const ACTIVITY_LABEL: Record<string, string> = {
  note: 'Note', call: 'Call', whatsapp: 'WhatsApp', meeting: 'Meeting', email: 'Email sent', stage_change: 'Stage', owner_change: 'Owner', system: 'Update',
};
const LOG_OUTCOMES: Record<Exclude<LogType, 'note'>, string[]> = {
  call: ['Talked', 'No answer', 'Busy', 'Call back later', 'Wrong number'],
  whatsapp: ['Replied', 'Seen, no reply', 'Sent'],
  meeting: ['Demo done', 'Interested', 'Needs time', 'Not interested'],
};
const MERCHANT_STATE: Record<string, string> = { signed_up: 'Signed up, no plan yet', trial: 'On a free trial', paying: 'Paying customer', not_paying: 'Plan lapsed' };

/** One lead: who they are, where they are in the pipeline, every touch so far, and what’s next. */
export function SalesLeadDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useStableToast();
  const isManager = can('sales.manage');
  const [d, setD] = useState<LeadDetail | null>(null);
  const [error, setError] = useState('');
  const [owners, setOwners] = useState<SalesOwner[]>([]);
  const [editing, setEditing] = useState(false);
  const [losing, setLosing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => apiGetLead(id).then(r => setD(r.data)).catch(e => setError(errMsg(e, 'Could not load this lead.'))), [id]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (isManager) apiSalesOwners().then(r => setOwners(r.data)).catch(() => setOwners([])); }, [isManager]);

  /** Run an action that returns the refreshed lead, toast, and keep the page in step. */
  const act = async (fn: () => Promise<{ data: LeadDetail }>, ok: string, fail: string) => {
    try { setD((await fn()).data); if (ok) toast.success(ok); return true; }
    catch (e) { toast.error(errMsg(e, fail)); return false; }
  };

  if (error) return <div className="px-4 sm:px-7 py-16 text-center"><p className="text-[13px] text-slate mb-3">{error}</p><Button onClick={() => navigate('/admin/sales')}>Back to pipeline</Button></div>;
  if (!d) return <div className="px-4 sm:px-7 py-6"><div className="h-48 rounded-xl bg-cream animate-pulse" /></div>;
  const { lead } = d;

  const moveTo = (stage: LeadStage) => {
    if (stage === lead.stage) return;
    if (stage === 'lost') { setLosing(true); return; }
    void act(() => apiChangeStage(lead._id, stage), `Moved to ${STAGE_LABELS[stage]}.`, 'Could not change the stage.');
  };
  const wa = lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '').replace(/^0/, '92')}` : null;

  return (
    <>
      <div className="bg-white border-b border-bone px-4 sm:px-7 py-4 sticky top-0 z-10">
        <Link to="/admin/sales" className="inline-flex items-center gap-1 text-[12px] text-slate hover:text-charcoal mb-2"><ArrowLeft size={13} /> Pipeline</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap"><h1 className="text-[20px] font-semibold text-carbon truncate">{lead.name}</h1><StageBadge stage={lead.stage} /></div>
            <p className="text-[13px] text-slate">{[lead.businessName, lead.businessType, lead.city].filter(Boolean).join(' · ') || SOURCE_LABELS[lead.source]}</p>
          </div>
          <div className="flex items-center gap-2">
            {isManager && (
              <div className="w-44"><Select aria-label="Owner" value={lead.ownerAdminId ?? ''} onChange={e => void act(() => apiUpdateLead(lead._id, { ownerAdminId: e.target.value || null }), 'Owner updated.', 'Could not reassign.')}>
                <option value="">Unassigned</option>{owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
              </Select></div>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil size={13} /> Edit</Button>
            <Button variant="ghost" size="sm" aria-label="Delete lead" onClick={() => setDeleting(true)}><Trash2 size={14} /></Button>
          </div>
        </div>
        {/* Stage stepper: click any stage to move the lead there. */}
        <ol className="flex gap-1 mt-3 overflow-x-auto" aria-label="Stage">
          {LEAD_STAGES.map(s => {
            const reached = LEAD_STAGES.indexOf(s) <= LEAD_STAGES.indexOf(lead.stage === 'lost' ? 'new' : lead.stage);
            return (
              <li key={s} className="flex-1 min-w-[78px]">
                <button aria-current={s === lead.stage ? 'step' : undefined} onClick={() => moveTo(s)}
                  className={clsx('w-full py-1.5 text-[12px] font-medium rounded-md border cursor-pointer transition-colors',
                    s === lead.stage ? (s === 'lost' ? 'bg-error text-white border-error' : 'bg-brand-orange text-white border-brand-orange')
                      : reached && lead.stage !== 'lost' && s !== 'lost' ? 'bg-brand-pale-orange text-brand-deep-orange border-transparent'
                        : 'bg-white text-slate border-bone hover:border-brand-orange/50')}>
                  {STAGE_LABELS[s]}
                </button>
              </li>
            );
          })}
        </ol>
        {lead.stage === 'lost' && lead.lostReason && <p className="text-[12px] text-error mt-2">Lost: {LOST_REASON_LABELS[lead.lostReason as keyof typeof LOST_REASON_LABELS] ?? lead.lostReason}{lead.lostNote ? `. ${lead.lostNote}` : ''}</p>}
      </div>

      <div className="px-4 sm:px-7 py-5 grid lg:grid-cols-[280px_1fr_300px] gap-5 items-start">
        {/* Who they are */}
        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-bone bg-white p-4 text-[13px]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-3">Contact</p>
            {lead.email && <a className="flex items-center gap-2 text-charcoal hover:text-brand-orange mb-2 break-all" href={`mailto:${lead.email}`}><Mail size={14} className="text-slate shrink-0" />{lead.email}</a>}
            {lead.phone && <a className="flex items-center gap-2 text-charcoal hover:text-brand-orange mb-2" href={`tel:${lead.phone}`}><Phone size={14} className="text-slate shrink-0" />{lead.phone}</a>}
            {wa && <a className="flex items-center gap-2 text-charcoal hover:text-brand-orange" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={14} className="text-slate shrink-0" />Open WhatsApp</a>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 mt-4 pt-3 border-t border-bone text-[12px]">
              <dt className="text-slate">Deal value</dt><dd className="text-charcoal font-medium text-right">{lead.dealValuePKR ? formatPKR(lead.dealValuePKR) : '—'}</dd>
              <dt className="text-slate">Source</dt><dd className="text-charcoal text-right">{SOURCE_LABELS[lead.source]}{lead.sourceDetail ? ` · ${lead.sourceDetail}` : ''}</dd>
              {isManager && <><dt className="text-slate">Owner</dt><dd className="text-charcoal text-right">{lead.ownerName ?? 'Unassigned'}</dd></>}
              <dt className="text-slate">Added</dt><dd className="text-charcoal text-right">{new Date(lead.createdAt).toLocaleDateString()}</dd>
              <dt className="text-slate">Last touch</dt><dd className="text-charcoal text-right">{relDay(lead.lastActivityAt) || '—'}</dd>
            </dl>
          </section>
          <section className="rounded-xl border border-bone bg-white p-4 text-[13px]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2 flex items-center gap-1.5"><Store size={12} /> Solvexo account</p>
            {d.merchant ? (
              <>
                <p className="font-medium text-charcoal">{MERCHANT_STATE[d.merchant.state] ?? d.merchant.state}</p>
                <p className="text-[12px] text-slate">Signed up {new Date(d.merchant.signedUpAt).toLocaleDateString()}{d.merchant.stores.length ? ` · ${d.merchant.stores.map(s => s.name).join(', ')}` : ''}</p>
                <Link to={`/admin/clients/${d.merchant.sellerId}`} className="inline-block mt-2 text-[12px] font-medium text-brand-orange hover:underline">Open client workspace</Link>
              </>
            ) : <p className="text-[12px] text-slate">Not signed up yet. When they create an account with this email or phone, it links here and the stage moves on its own.</p>}
          </section>
        </aside>

        {/* What happened */}
        <main className="flex flex-col gap-4 min-w-0">
          <Composer leadId={lead._id} leadName={lead.name} businessName={lead.businessName} hasEmail={!!lead.email} act={act} />
          <Timeline items={d.activities} />
        </main>

        {/* What's next */}
        <Tasks leadId={lead._id} tasks={d.tasks} act={act} reload={load} />
      </div>

      {editing && <LeadFormModal lead={lead} owners={owners} canAssign={isManager} onClose={() => setEditing(false)} onSave={async input => { setD((await apiUpdateLead(lead._id, input)).data); setEditing(false); toast.success('Lead saved.'); }} />}
      {losing && <LostReasonModal name={lead.name} onClose={() => setLosing(false)} onConfirm={async (r, n) => { if (await act(() => apiChangeStage(lead._id, 'lost', r, n), 'Marked as lost.', 'Could not change the stage.')) setLosing(false); }} />}
      {deleting && (
        <Modal title="Delete this lead?" onClose={() => setDeleting(false)} mobileSheet={false}
          footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleting(false)}>Cancel</Button><Button variant="danger" onClick={async () => { try { await apiDeleteLead(lead._id); toast.success('Lead deleted.'); navigate('/admin/sales'); } catch (e) { toast.error(errMsg(e, 'Could not delete.')); } }}>Delete</Button></div>}>
          <p className="text-[13px] text-charcoal">{lead.name} and their history will be removed from the pipeline.</p>
        </Modal>
      )}
    </>
  );
}

type Act = (fn: () => Promise<{ data: LeadDetail }>, ok: string, fail: string) => Promise<boolean>;

/** Log a touch in one click, or send an email from a template. */
function Composer({ leadId, leadName, businessName, hasEmail, act }: { leadId: string; leadName: string; businessName: string | null; hasEmail: boolean; act: Act }) {
  const [mode, setMode] = useState<LogType | 'email'>('call');
  const [body, setBody] = useState('');
  const [outcome, setOutcome] = useState('');
  const [subject, setSubject] = useState('');
  const [templates, setTemplates] = useState<SalesTemplate[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (mode === 'email' && !templates.length) apiListTemplates().then(r => setTemplates(r.data)).catch(() => undefined); }, [mode, templates.length]);
  const senderName = useMemo(() => TokenStorage.getUser<{ name?: string }>()?.name ?? '', []);
  const vars = { name: leadName, businessName, senderName };

  const modes: { id: LogType | 'email'; label: string; Icon: LucideIcon }[] = [
    { id: 'call', label: 'Call', Icon: Phone }, { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
    { id: 'meeting', label: 'Meeting', Icon: Users }, { id: 'note', label: 'Note', Icon: NotebookPen }, { id: 'email', label: 'Email', Icon: Mail },
  ];
  const quickLog = async (o: string) => {
    if (mode === 'email' || mode === 'note') return;
    setBusy(true);
    if (await act(() => apiLogActivity(leadId, mode, body.trim() || o, o), `${modes.find(m => m.id === mode)?.label} logged.`, 'Could not log it.')) { setBody(''); setOutcome(''); }
    setBusy(false);
  };
  const submit = async () => {
    setBusy(true);
    const ok = mode === 'email'
      ? await act(() => apiSendLeadEmail(leadId, subject, body), 'Email sent.', 'Could not send the email.')
      : await act(() => apiLogActivity(leadId, mode, body.trim() || outcome, outcome || undefined), 'Logged.', 'Could not log it.');
    if (ok) { setBody(''); setSubject(''); setOutcome(''); }
    setBusy(false);
  };
  const canSubmit = mode === 'email' ? hasEmail && subject.trim() && body.trim() : !!(body.trim() || outcome);

  return (
    <section className="rounded-xl border border-bone bg-white">
      <div className="flex border-b border-bone overflow-x-auto" role="tablist">
        {modes.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => { setMode(m.id); setOutcome(''); }}
            className={clsx('flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-medium border-0 border-b-2 bg-transparent cursor-pointer whitespace-nowrap', mode === m.id ? 'border-brand-orange text-brand-deep-orange' : 'border-transparent text-slate hover:text-charcoal')}>
            <m.Icon size={13} />{m.label}
          </button>
        ))}
      </div>
      <div className="p-4 flex flex-col gap-3">
        {mode === 'email' ? (
          !hasEmail ? <p className="text-[13px] text-slate">Add an email address to this lead to send email.</p> : (
            <>
              {templates.length > 0 && (
                <Select aria-label="Template" value="" onChange={e => { const t = templates.find(x => x._id === e.target.value); if (t) { setSubject(fillTemplate(t.subject, vars)); setBody(fillTemplate(t.body, vars)); } }}>
                  <option value="">Start from a template…</option>{templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </Select>
              )}
              <Input aria-label="Subject" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
              <Textarea aria-label="Message" rows={7} placeholder="Write your message" value={body} onChange={e => setBody(e.target.value)} />
              <p className="text-[11px] text-slate">Sent from Solvexo with your email as the reply-to address, and saved to this timeline.</p>
            </>
          )
        ) : (
          <>
            {mode !== 'note' && (
              <div className="flex flex-wrap gap-1.5" aria-label="Outcome">
                {LOG_OUTCOMES[mode].map(o => (
                  <button key={o} disabled={busy} onClick={() => (body.trim() ? setOutcome(outcome === o ? '' : o) : void quickLog(o))}
                    aria-pressed={outcome === o}
                    className={clsx('px-2.5 py-1 rounded-full text-[12px] border cursor-pointer', outcome === o ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-charcoal border-bone hover:border-brand-orange/50')}>
                    {o}
                  </button>
                ))}
              </div>
            )}
            <Textarea aria-label="Details" rows={3} placeholder={mode === 'note' ? 'Write a note' : 'What was said? (optional — or just tap an outcome above to log it)'} value={body} onChange={e => setBody(e.target.value)} />
          </>
        )}
        {(mode === 'email' ? hasEmail : true) && (
          <div className="flex justify-end"><Button size="sm" disabled={!canSubmit} loading={busy} onClick={submit}>{mode === 'email' ? 'Send email' : 'Save'}</Button></div>
        )}
      </div>
    </section>
  );
}

function Timeline({ items }: { items: SalesActivity[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-bone bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-3">Timeline</p>
      <ol className="flex flex-col">
        {items.map((a, i) => {
          const Icon = ACTIVITY_ICON[a.type] ?? Bot;
          const auto = a.type === 'stage_change' || a.type === 'owner_change' || a.type === 'system';
          return (
            <li key={a._id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={clsx('size-7 rounded-full flex items-center justify-center shrink-0', auto ? 'bg-mist text-slate' : 'bg-brand-pale-orange text-brand-orange')}><Icon size={13} /></span>
                {i < items.length - 1 && <span className="w-px flex-1 bg-bone my-1" />}
              </div>
              <div className="pb-4 min-w-0 flex-1">
                <p className="text-[12px] text-slate">
                  <span className="font-medium text-charcoal">{ACTIVITY_LABEL[a.type] ?? a.type}</span>
                  {a.outcome && <> · {a.outcome}</>}
                  {a.adminName && <> · {a.adminName}</>}
                  {' · '}<time dateTime={a.createdAt} title={new Date(a.createdAt).toLocaleString()}>{relDay(a.createdAt)}, {new Date(a.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
                </p>
                {a.subject && <p className="text-[13px] font-medium text-charcoal mt-0.5">{a.subject}</p>}
                {a.body && a.body !== a.outcome && <p className={clsx('text-[13px] whitespace-pre-line mt-0.5 break-words', auto ? 'text-slate' : 'text-charcoal')}>{a.body}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const tomorrowAt10 = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d; };
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

function Tasks({ leadId, tasks, act, reload }: { leadId: string; tasks: LeadDetail['tasks']; act: Act; reload: () => Promise<unknown> }) {
  const toast = useStableToast();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(() => toLocalInput(tomorrowAt10()));
  const [busy, setBusy] = useState(false);
  const open = tasks.filter(t => !t.doneAt);
  const done = tasks.filter(t => t.doneAt);

  const add = async () => {
    if (!title.trim() || !due) return;
    setBusy(true);
    if (await act(() => apiCreateTask(leadId, title.trim(), new Date(due).toISOString()), 'Follow-up added.', 'Could not add the follow-up.')) setTitle('');
    setBusy(false);
  };
  const run = async (fn: () => Promise<unknown>, fail: string) => { try { await fn(); await reload(); } catch (e) { toast.error(errMsg(e, fail)); } };

  return (
    <aside className="rounded-xl border border-bone bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-3 flex items-center gap-1.5"><CalendarClock size={12} /> Follow-ups</p>
      <div className="flex flex-col gap-2 mb-3">
        <Input aria-label="Follow-up" placeholder="e.g. Call back about pricing" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void add(); }} />
        <div className="flex gap-2">
          <Input aria-label="Due" type="datetime-local" value={due} onChange={e => setDue(e.target.value)} />
          <Button size="sm" aria-label="Add follow-up" disabled={!title.trim()} loading={busy} onClick={add}><Plus size={14} /></Button>
        </div>
      </div>
      {!open.length && <p className="text-[12px] text-slate">No follow-up planned. Leads without a next step go cold.</p>}
      <ul className="flex flex-col gap-1.5">
        {open.map(t => (
          <li key={t._id} className="flex items-start gap-2 group">
            <input type="checkbox" aria-label={`Mark "${t.title}" done`} className="mt-0.5 size-4 accent-brand-orange cursor-pointer" onChange={() => void run(() => apiUpdateTask(t._id, { done: true }), 'Could not update.')} />
            <div className="flex-1 min-w-0"><p className="text-[13px] text-charcoal">{t.title}</p><p className={clsx('text-[11px]', isOverdue(t.dueAt) ? 'text-error font-semibold' : 'text-slate')}>{relDay(t.dueAt)}, {new Date(t.dueAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></div>
            <button aria-label={`Delete "${t.title}"`} onClick={() => void run(() => apiDeleteTask(t._id), 'Could not delete.')} className="opacity-0 group-hover:opacity-100 focus:opacity-100 bg-transparent border-0 text-slate hover:text-error cursor-pointer"><Trash2 size={13} /></button>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <details className="mt-3 text-[12px]"><summary className="text-slate cursor-pointer">{done.length} done</summary>
          <ul className="mt-1.5 flex flex-col gap-1">{done.map(t => <li key={t._id} className="text-slate line-through">{t.title}</li>)}</ul>
        </details>
      )}
    </aside>
  );
}
