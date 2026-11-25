import { Fragment, useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  AlarmClock, ArrowLeft, Check, CheckCheck, CircleCheck, Clock, FileText, MessageSquareText, PanelRightClose, PanelRightOpen, Phone, RefreshCw, RotateCcw, Send, Sparkles, TriangleAlert, UserRound,
} from 'lucide-react';
import { ActionMenu, Avatar, Button, CopyIconButton, DateTimePickerModal, Select, Textarea } from '@/components/comman/ui';
import { DateDivider } from '@/components/comman/messaging';
import {
  apiWaConversation, apiWaDiscardDraft, apiWaRedraft, apiWaSend, apiWaSendTemplate, apiWaSetStatus,
  type SalesOwner, type WaConversation, type WaConversationRow, type WaQuickReply,
} from '@/api/services/salesOps';
import { StageBadge } from './parts';
import { errMsg, toLocalInput, useStableToast } from './sales.utils';
import { clock, dayKey, dayLabel, firstName, isOpenAt, snoozeAt, timeLeft, useNow } from './whatsapp.utils';
import { TemplatePicker } from './WhatsAppModals';

/** Delivery of our own message: sent ✓, delivered ✓✓, read ✓✓ (blue), failed ⚠. */
export function StatusTick({ status, error }: { status: string | null | undefined; error?: string | null }) {
  if (status === 'failed') return <span className="text-error inline-flex" title={error ?? 'Not delivered'} aria-label="Not delivered"><TriangleAlert size={12} /></span>;
  if (status === 'read') return <CheckCheck size={13} className="text-info shrink-0" aria-label="Read" />;
  if (status === 'delivered') return <CheckCheck size={13} className="text-slate shrink-0" aria-label="Delivered" />;
  if (status === 'sent') return <Check size={13} className="text-slate shrink-0" aria-label="Sent" />;
  return null;
}

/** What the thread keeps locally after an action, until the list's next load carries it. */
interface Local { row: WaConversationRow | undefined; done?: boolean; snoozedUntil?: string | null }

export function Thread({ id, row, isManager, owners, quickReplies, leadPanelOpen, onBack, onChanged, onAssign, onToggleLeadPanel, onShowLead, onLoaded }: {
  id: string;
  /** This chat's row in the list (status, owner); undefined when the current view or search hides it. */
  row: WaConversationRow | undefined;
  isManager: boolean;
  owners: SalesOwner[];
  quickReplies: WaQuickReply[];
  leadPanelOpen: boolean;
  onBack: () => void;
  onChanged: () => void;
  onAssign: (adminId: string | null) => Promise<boolean>;
  onToggleLeadPanel: () => void;
  /** Phones and tablets: the lead opens as a sheet. */
  onShowLead: () => void;
  /** Each load: the parent keeps the templates (reps have no other way to read theirs) and the lead for its panel. */
  onLoaded: (c: WaConversation) => void;
}) {
  const toast = useStableToast();
  const now = useNow();
  const [c, setC] = useState<WaConversation | null>(null);
  const [text, setText] = useState('');
  const [fromDraft, setFromDraft] = useState(false);
  const [busy, setBusy] = useState<'send' | 'template' | 'redraft' | 'status' | null>(null);
  const [picking, setPicking] = useState(false);
  const [customSnooze, setCustomSnooze] = useState(false);
  const [local, setLocal] = useState<Local | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  // The reply box grows with what is typed (wrapped lines included), up to about six lines, then scrolls.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  // The parent re-creates these on every render; keep the latest in refs so loading doesn't re-run because of them.
  const changedRef = useRef(onChanged);
  const loadedRef = useRef(onLoaded);
  useEffect(() => { changedRef.current = onChanged; loadedRef.current = onLoaded; });
  const got = useCallback((x: WaConversation) => { setC(x); loadedRef.current(x); }, []);
  const load = useCallback(() => apiWaConversation(id).then(r => { got(r.data); changedRef.current(); }).catch(e => toast.error(errMsg(e, 'Could not open the chat.'))), [id, toast, got]);
  useEffect(() => { void load(); const t = setInterval(() => void apiWaConversation(id).then(r => got(r.data)).catch(() => undefined), 15_000); return () => clearInterval(t); }, [id, load, got]);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [c?.messages.length]);

  if (!c) return <div className="m-4 h-40 rounded-lg bg-cream animate-pulse" />;

  // The list's row is the source of the chat's status; right after an action the thread's own copy wins until the list reloads.
  const mine = local && local.row === row ? local : null;
  const done = mine?.done ?? row?.done ?? false;
  const snoozedUntil = mine?.snoozedUntil !== undefined ? mine.snoozedUntil : row?.snoozedUntil ?? null;
  const snoozed = isOpenAt(snoozedUntil, now);
  const windowOpen = c.windowOpen && (!c.windowClosesAt || isOpenAt(c.windowClosesAt, now));
  const canWrite = windowOpen && c.canWriteText !== false;
  const name = c.lead?.name ?? c.profileName ?? `+${c.waId}`;
  const templates = c.templates ?? [];

  const run = async (kind: 'send' | 'template' | 'redraft', fn: () => Promise<{ data: WaConversation }>, ok: string) => {
    setBusy(kind);
    let ok2 = false;
    try { got((await fn()).data); changedRef.current(); if (ok) toast.success(ok); if (kind === 'send') { setText(''); setFromDraft(false); } ok2 = true; }
    catch (e) { toast.error(errMsg(e, 'Could not send.')); }
    setBusy(null);
    return ok2;
  };
  const setStatus = async (body: { done?: boolean; snoozeUntil?: string | null }, ok: string) => {
    setBusy('status');
    try {
      got((await apiWaSetStatus(c._id, body)).data);
      setLocal({ row, done: body.done ?? done, snoozedUntil: body.snoozeUntil !== undefined ? body.snoozeUntil : snoozedUntil });
      toast.success(ok); changedRef.current();
    } catch (e) { toast.error(errMsg(e, 'Could not update the chat.')); }
    setBusy(null);
  };
  const snooze = (at: Date) => void setStatus({ snoozeUntil: at.toISOString() }, `Snoozed until ${at.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.`);
  const send = () => { if (text.trim()) void run('send', () => apiWaSend(c._id, text.trim(), fromDraft), ''); };
  const insert = (qr: WaQuickReply) => {
    setText(t => (t.trim() ? `${t.replace(/\s+$/, '')}\n${qr.text}` : qr.text));
    boxRef.current?.focus();
  };

  return (
    <>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 border-b border-bone">
        <button onClick={onBack} className="md:hidden bg-transparent border-0 text-slate cursor-pointer p-0" aria-label="Back to chats"><ArrowLeft size={18} /></button>
        <Avatar name={name} size={36} />
        <div className="flex-1 min-w-[160px]">
          <p className="flex items-center gap-2 min-w-0">
            <span className="text-[14px] font-semibold text-charcoal truncate">{name}</span>
            {c.lead && <StageBadge stage={c.lead.stage} />}
          </p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-slate">
            <span className="inline-flex items-center gap-1">+{c.waId}<CopyIconButton value={`+${c.waId}`} title="Copy number" size={12} /></span>
            {[c.lead?.businessName, c.lead?.city].filter(Boolean).map(v => <span key={v}>· {v}</span>)}
            {row?.ownerName && <span>· {row.ownerName}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {c.lead && <Link to={`/admin/sales/leads/${c.lead._id}`} className="text-[12px] font-medium text-brand-orange hover:underline">Open lead</Link>}
          <a href={`tel:+${c.waId}`} aria-label={`Call +${c.waId}`} className="inline-flex items-center gap-1 rounded-md px-2 py-[7px] text-[12px] font-medium text-slate hover:bg-cream no-underline"><Phone size={13} /> Call</a>
          {done
            ? <Button size="sm" variant="ghost" loading={busy === 'status'} onClick={() => void setStatus({ done: false }, 'Chat reopened.')}><RotateCcw size={13} /> Reopen</Button>
            : <Button size="sm" variant="ghost" loading={busy === 'status'} onClick={() => void setStatus({ done: true }, 'Marked as done.')}><CircleCheck size={13} /> Mark done</Button>}
          <ActionMenu ariaLabel={snoozed ? 'Snoozed: change' : 'Snooze'} align="right"
            triggerClassName="inline-flex items-center gap-1 rounded-md px-2 py-[7px] text-[12px] font-medium text-slate bg-transparent border-0 hover:bg-cream cursor-pointer"
            trigger={<><AlarmClock size={13} /> {snoozed ? 'Snoozed' : 'Snooze'}</>}
            items={[
              { label: 'For 1 hour', onClick: () => snooze(snoozeAt('hour')) },
              { label: 'Until tomorrow 9:00', onClick: () => snooze(snoozeAt('tomorrow')) },
              { label: 'Until next week', onClick: () => snooze(snoozeAt('week')) },
              { label: 'Pick a time…', onClick: () => setCustomSnooze(true) },
              ...(snoozed ? [{ label: 'Stop snoozing', onClick: () => void setStatus({ snoozeUntil: null }, 'Snooze removed.') }] : []),
            ]} />
          {isManager && c.lead && (
            <div className="w-40"><Select aria-label="Assign to" value={row?.ownerId ?? ''} onChange={e => void onAssign(e.target.value || null)}>
              <option value="">Unassigned</option>{owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
            </Select></div>
          )}
          {c.lead && <>
            <Button size="sm" variant="ghost" className="lg:hidden" onClick={onShowLead}><UserRound size={13} /> Lead</Button>
            <Button size="sm" variant="ghost" className="hidden lg:inline-flex" aria-label={leadPanelOpen ? 'Hide lead details' : 'Show lead details'} aria-expanded={leadPanelOpen} onClick={onToggleLeadPanel}>
              {leadPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            </Button>
          </>}
        </div>
      </header>

      {/* The 24-hour window: free text while it is open, approved templates only after it closes. */}
      {windowOpen && c.windowClosesAt ? (
        <p className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] text-success bg-success-bg border-b border-bone"><Clock size={13} /> You can reply freely for {timeLeft(c.windowClosesAt, now)}</p>
      ) : !windowOpen && (
        <p className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] text-warning bg-warning-bg border-b border-bone"><Clock size={13} /> 24 hours passed — send an approved template to restart the chat</p>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 bg-[#efeae2]/60" aria-live="polite">
        {c.messages.map((m, i) => (
          <Fragment key={m._id}>
            {(i === 0 || dayKey(c.messages[i - 1].at) !== dayKey(m.at)) && <DateDivider label={dayLabel(m.at)} />}
            <div className={clsx('max-w-[78%] rounded-lg px-3 py-1.5 text-[13px] shadow-sm', m.direction === 'in' ? 'self-start bg-white' : 'self-end bg-[#d9fdd3]')}>
              {m.type === 'template' && <p className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate"><FileText size={10} /> Template</p>}
              <p dir="auto" className="whitespace-pre-line break-words text-charcoal">{m.text}</p>
              <p className="flex items-center justify-end gap-1 text-[10.5px] text-slate mt-0.5">
                {m.fromAiDraft && <span title="Sent from the AI draft"><Sparkles size={10} className="text-brand-orange" /></span>}
                {clock(m.at)} {m.direction === 'out' && <StatusTick status={m.status} error={m.error} />}
              </p>
              {m.status === 'failed' && m.error && <p className="text-[11px] text-error">{m.error}</p>}
            </div>
          </Fragment>
        ))}
      </div>

      {c.aiDraft && canWrite && (
        <div className="mx-3 mt-2 rounded-lg border border-brand-orange/40 bg-brand-pale-orange/30 p-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep-orange flex items-center gap-1"><Sparkles size={11} /> AI draft</p>
          <p dir="auto" className="text-[13px] text-charcoal whitespace-pre-line mt-1">{c.aiDraft.text}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button size="xs" onClick={() => { setText(c.aiDraft!.text); setFromDraft(true); }}>Use draft</Button>
            <Button size="xs" variant="ghost" loading={busy === 'redraft'} onClick={() => void run('redraft', () => apiWaRedraft(c._id), '')}><RefreshCw size={12} /> Rewrite</Button>
            <Button size="xs" variant="ghost" onClick={() => void run('redraft', () => apiWaDiscardDraft(c._id), '')}>Discard</Button>
          </div>
        </div>
      )}

      {canWrite ? (
        <div className="p-3 border-t border-bone mt-2 flex flex-col gap-1.5">
          <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); send(); }}>
            <div className="flex-1">
              <Textarea ref={boxRef} aria-label="Reply" dir="auto" placeholder="Write a reply…" value={text} maxLength={4000}
                rows={2}
                onChange={e => setText(e.target.value)}
                // Enter sends, Shift+Enter is a new line; never while a keyboard (Urdu, Arabic…) is still composing a word.
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
            </div>
            <Button type="submit" aria-label="Send reply" loading={busy === 'send'} disabled={!text.trim()}><Send size={15} /></Button>
          </form>
          <div className="flex flex-wrap items-center gap-1">
            {quickReplies.length > 0 && (
              <ActionMenu ariaLabel="Quick replies" align="left" searchable={quickReplies.length > 6} searchPlaceholder="Find a quick reply"
                triggerClassName="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-slate bg-transparent border-0 hover:bg-cream cursor-pointer"
                trigger={<><MessageSquareText size={13} /> Quick replies</>}
                items={quickReplies.map(qr => ({ label: qr.title, title: qr.text, searchText: `${qr.title} ${qr.text}`, onClick: () => insert(qr) }))} />
            )}
            {templates.length > 0 && <Button size="xs" variant="ghost" onClick={() => setPicking(true)}><FileText size={12} /> Send a template</Button>}
            <span className="ml-auto text-[11px] text-slate max-sm:hidden">Enter sends · Shift+Enter for a new line</span>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-bone mt-2 text-[12.5px] text-charcoal flex flex-wrap items-center justify-between gap-2">
          {windowOpen
            ? <p className="flex items-center gap-1.5"><FileText size={14} className="text-slate" /> You can send approved templates only.</p>
            : <p className="flex items-center gap-1.5"><Clock size={14} className="text-slate" /> WhatsApp only allows an approved template now.</p>}
          {templates.length === 1 ? <Button size="sm" loading={busy === 'template'} onClick={() => void run('template', () => apiWaSendTemplate(c._id, templates[0].key), 'Template sent.')}>Send template “{templates[0].label}”</Button>
            : templates.length > 1 ? <Button size="sm" onClick={() => setPicking(true)}>Choose a template</Button>
            : <span className="text-slate">No approved templates are available to you. Ask a manager.</span>}
        </div>
      )}
      {picking && <TemplatePicker templates={templates} name={firstName(c.lead?.name ?? c.profileName)} busy={busy === 'template'}
        onClose={() => setPicking(false)} onSend={key => void run('template', () => apiWaSendTemplate(c._id, key), 'Template sent.').then(ok => { if (ok) setPicking(false); })} />}
      {customSnooze && (
        <DateTimePickerModal title="Snooze until" confirmLabel="Snooze" previewLabel="Back in Needs reply on" value={toLocalInput(snoozeAt('tomorrow'))}
          onClose={() => setCustomSnooze(false)} onChange={v => { if (v) snooze(new Date(v)); }} />
      )}
    </>
  );
}
