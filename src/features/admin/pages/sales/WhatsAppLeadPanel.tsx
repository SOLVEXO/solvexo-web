import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { CalendarClock, Mail, Phone, Plus } from 'lucide-react';
import { Button, DateTimeField, Input, Select, Textarea } from '@/components/comman/ui';
import {
  LEAD_STAGES, STAGE_LABELS, apiChangeStage, apiCreateTask, apiGetLead, apiLogActivity, formatPKR,
  type LeadDetail, type LeadStage, type SalesOwner,
} from '@/api/services/salesOps';
import { LostReasonModal } from './parts';
import { ACTIVITY_LABEL, errMsg, isOverdue, relDay, toLocalInput, tomorrowAt10, useStableToast } from './sales.utils';
import { clock } from './whatsapp.utils';

const SECTION = 'text-[11px] font-bold uppercase tracking-wide text-slate';

/** The chat's lead beside the conversation: stage, owner, contact, next follow-up, a quick note and the latest activity. */
export function LeadPanel({ leadId, isManager, owners, version, onAssign, onChanged }: {
  leadId: string;
  isManager: boolean;
  owners: SalesOwner[];
  /** Bumped by the page when something outside the panel changed the lead (e.g. the chat was assigned). */
  version: number;
  onAssign: (adminId: string | null) => Promise<boolean>;
  onChanged: () => void;
}) {
  const toast = useStableToast();
  const [d, setD] = useState<LeadDetail | null>(null);
  const [error, setError] = useState('');
  const [losing, setLosing] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(() => toLocalInput(tomorrowAt10()));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'task' | 'note' | null>(null);

  const load = useCallback(() => apiGetLead(leadId).then(r => { setD(r.data); setError(''); }).catch(e => setError(errMsg(e, 'Could not load the lead.'))), [leadId]);
  useEffect(() => { void load(); }, [load, version]);

  const act = async (fn: () => Promise<{ data: LeadDetail }>, ok: string, fail: string) => {
    try { setD((await fn()).data); if (ok) toast.success(ok); onChanged(); return true; }
    catch (e) { toast.error(errMsg(e, fail)); return false; }
  };

  if (error) return <p className="p-4 text-[12.5px] text-slate">{error}</p>;
  if (!d) return <div className="m-4 h-40 rounded-lg bg-cream animate-pulse" />;
  const { lead } = d;
  const moveTo = (stage: LeadStage) => {
    if (stage === lead.stage) return;
    if (stage === 'lost') { setLosing(true); return; }
    void act(() => apiChangeStage(lead._id, stage), `Moved to ${STAGE_LABELS[stage]}.`, 'Could not change the stage.');
  };
  const next = d.tasks.filter(t => !t.doneAt).sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const addTask = async () => {
    if (!title.trim() || !due) return;
    setBusy('task');
    if (await act(() => apiCreateTask(lead._id, title.trim(), new Date(due).toISOString()), 'Follow-up added.', 'Could not add the follow-up.')) setTitle('');
    setBusy(null);
  };
  const saveNote = async () => {
    if (!note.trim()) return;
    setBusy('note');
    if (await act(() => apiLogActivity(lead._id, 'note', note.trim()), 'Note saved.', 'Could not save the note.')) setNote('');
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3">
        <Select label="Stage" value={lead.stage} onChange={e => moveTo(e.target.value as LeadStage)}>
          {LEAD_STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </Select>
        {isManager ? (
          <Select label="Owner" value={lead.ownerAdminId ?? ''} onChange={e => void onAssign(e.target.value || null)}>
            <option value="">Unassigned</option>{owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
          </Select>
        ) : (
          <p className="text-[12px] text-slate">Owner: <span className="text-charcoal">{lead.ownerName ?? 'Unassigned'}</span></p>
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-slate">Deal value</dt><dd className="text-charcoal font-medium text-right">{lead.dealValuePKR ? formatPKR(lead.dealValuePKR) : '—'}</dd>
        <dt className="text-slate">Last touch</dt><dd className="text-charcoal text-right">{relDay(lead.lastActivityAt) || '—'}</dd>
      </dl>
      {(lead.phone || lead.email) && (
        <div className="flex flex-col gap-1.5">
          {lead.phone && <a className="flex items-center gap-2 text-charcoal hover:text-brand-orange" href={`tel:${lead.phone}`}><Phone size={14} className="text-slate shrink-0" />{lead.phone}</a>}
          {lead.email && <a className="flex items-center gap-2 text-charcoal hover:text-brand-orange break-all" href={`mailto:${lead.email}`}><Mail size={14} className="text-slate shrink-0" />{lead.email}</a>}
        </div>
      )}

      <section className="pt-3 border-t border-bone flex flex-col gap-2" aria-label="Follow-ups">
        <p className={clsx(SECTION, 'flex items-center gap-1.5')}><CalendarClock size={12} /> Next follow-up</p>
        {next ? (
          <p className="text-charcoal">{next.title} <span className={clsx('block text-[11px]', isOverdue(next.dueAt) ? 'text-error font-semibold' : 'text-slate')}>{relDay(next.dueAt)}, {clock(next.dueAt)}</span></p>
        ) : <p className="text-[12px] text-slate">No follow-up planned.</p>}
        <Input aria-label="Follow-up" placeholder="e.g. Call back about pricing" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void addTask(); }} />
        <div className="flex gap-2">
          <DateTimeField aria-label="Due" value={due} onChange={e => setDue(e.target.value)} />
          <Button size="sm" aria-label="Add follow-up" disabled={!title.trim()} loading={busy === 'task'} onClick={addTask}><Plus size={14} /></Button>
        </div>
      </section>

      <section className="pt-3 border-t border-bone flex flex-col gap-2" aria-label="Quick note">
        <p className={SECTION}>Quick note</p>
        <Textarea aria-label="Note" rows={2} placeholder="Write a note" value={note} onChange={e => setNote(e.target.value)} />
        <div className="flex justify-end"><Button size="sm" disabled={!note.trim()} loading={busy === 'note'} onClick={saveNote}>Save note</Button></div>
      </section>

      <section className="pt-3 border-t border-bone flex flex-col gap-2" aria-label="Latest activity">
        <p className={SECTION}>Latest activity</p>
        {d.activities.length ? (
          <ol className="flex flex-col gap-2">
            {d.activities.slice(0, 5).map(a => (
              <li key={a._id} className="text-[12px]">
                <p className="text-slate"><span className="font-medium text-charcoal">{ACTIVITY_LABEL[a.type] ?? a.type}</span>{a.adminName ? ` · ${a.adminName}` : ''} · {relDay(a.createdAt)}</p>
                {a.body && <p className="text-charcoal line-clamp-2 break-words">{a.body}</p>}
              </li>
            ))}
          </ol>
        ) : <p className="text-[12px] text-slate">Nothing logged yet.</p>}
        <Link to={`/admin/sales/leads/${lead._id}`} className="text-[12px] font-medium text-brand-orange hover:underline">Open the full lead</Link>
      </section>

      {losing && <LostReasonModal name={lead.name} onClose={() => setLosing(false)} onConfirm={async (r, n) => { if (await act(() => apiChangeStage(lead._id, 'lost', r, n), 'Marked as lost.', 'Could not change the stage.')) setLosing(false); }} />}
    </div>
  );
}
