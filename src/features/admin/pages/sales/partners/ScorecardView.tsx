import { useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Circle, MinusCircle, XCircle } from 'lucide-react';
import { Badge, Button, Input, Select, Textarea } from '@/components/comman/ui';
import { formatPKR } from '@/api/services/salesOps';
import {
  LOG_LABELS, TIER_LABELS, apiAddPartnerLog, apiResolveComplaint, fmtDay, pct, type Milestone, type Scorecard, type ScorecardDetail,
} from '@/api/services/partnerProgramme';
import { errMsg, useStableToast } from '../sales.utils';

const TIER_STATUS = {
  meets: { color: 'gray', text: 'Meets its tier' },
  eligible_for_higher: { color: 'green', text: 'Qualifies for a higher tier' },
  below_requirement: { color: 'orange', text: 'Below its tier’s requirement' },
} as const;

const isFuture = (iso: string | null | undefined) => !!iso && new Date(iso).getTime() > Date.now();

/** The numbers the programme measures (B13), for a manager or for the partner themself. */
export function ScoreGrid({ c }: { c: Scorecard }) {
  const cells: [string, string, string?][] = [
    ['Prospects registered', String(c.prospects), `${c.registrationsAccepted} accepted`],
    ['Demos held', String(c.demos)],
    ['Sellers signed up', String(c.signups)],
    ['Stores live (5+ products)', String(c.liveStores)],
    ['Paying now', String(c.payingNow), `${c.everPaid} ever paid`],
    ['Still paying after 3 months', pct(c.retention3mPercent), c.retentionBase ? `of ${c.retentionBase} sellers` : 'no sellers old enough yet'],
    ['Days to first sale', c.daysToFirstSale === null ? '—' : String(c.daysToFirstSale), 'from the agreement'],
    ['Complaints', String(c.complaints), c.complaintRatePercent === null ? undefined : `${c.complaintRatePercent}% of paying sellers`],
    ['Commission earned', formatPKR(c.earnedPKR)],
  ];
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {cells.map(([k, v, sub]) => (
        <div key={k} className="rounded-lg border border-bone bg-white px-3 py-2">
          <dt className="text-[11px] text-slate">{k}</dt>
          <dd className="text-[18px] font-semibold text-carbon tabular-nums leading-tight">{v}</dd>
          {sub && <dd className="text-[11px] text-slate">{sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

function MilestoneList({ items, approved }: { items: Milestone[]; approved: boolean }) {
  return (
    <ul className="flex flex-col gap-1 list-none p-0 m-0">
      {items.map(m => {
        const Icon = m.met === null ? MinusCircle : m.met ? CheckCircle2 : XCircle;
        return (
          <li key={m.key} className="flex items-center gap-2 text-[12.5px]">
            <Icon size={15} className={clsx('shrink-0', m.met === null ? 'text-slate/60' : m.met ? 'text-success' : 'text-error')} aria-hidden />
            <span className="flex-1">{m.label}</span>
            <span className="tabular-nums text-slate">{m.actual === null ? '—' : m.actual}{m.key === 'complaints' && m.actual !== null ? '%' : ''} / {m.target === null ? 'not set' : `${m.target}${m.key === 'complaints' ? '%' : ''}`}</span>
          </li>
        );
      })}
      {!approved && <li className="text-[11px] text-slate">Targets are still awaiting management approval (Programme settings).</li>}
    </ul>
  );
}

/** Scorecard, pilot milestones, tier, 6-month trend and the review/complaint log. `manage` adds the manager's actions. */
export function ScorecardView({ d, manage, onChange }: { d: ScorecardDetail; manage?: boolean; onChange?: (d: ScorecardDetail) => void }) {
  const c = d.scorecard;
  const pilotRunning = isFuture(d.partner.agreement?.pilotEndsAt);
  const max = Math.max(1, ...d.trend.flatMap(t => [t.registrations, t.signups, t.firstPayments]));
  return (
    <div className="flex flex-col gap-4">
      <ScoreGrid c={c} />
      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Tier</p>
          <p className="text-[13px] text-charcoal">
            {d.partner.tier ? TIER_LABELS[d.partner.tier] : 'No tier'} · numbers today qualify for <strong>{TIER_LABELS[c.eligibleTier]}</strong>
          </p>
          <div className="mt-1.5"><Badge color={TIER_STATUS[c.tierStatus].color} dot>{TIER_STATUS[c.tierStatus].text}</Badge></div>
          <p className="text-[11px] text-slate mt-1.5">Tiers are reviewed every quarter. A partner moves down only after a written warning and 60 days to recover; earned commission is never taken back.</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mt-4 mb-2">Pilot milestones{pilotRunning ? ` (pilot ends ${fmtDay(d.partner.agreement!.pilotEndsAt)})` : ''}</p>
          <MilestoneList items={d.milestones} approved={d.milestonesApproved} />
        </section>
        <section className="rounded-xl border border-bone bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2">Last 6 months</p>
          <table className="w-full text-[12px]">
            <thead><tr className="text-left text-slate"><th className="font-semibold pb-1">Month</th><th className="font-semibold pb-1">Registered</th><th className="font-semibold pb-1">Signed up</th><th className="font-semibold pb-1">First payment</th></tr></thead>
            <tbody>
              {d.trend.map(t => (
                <tr key={t.month}>
                  <td className="py-0.5 pr-2 text-slate">{new Date(`${t.month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</td>
                  {[t.registrations, t.signups, t.firstPayments].map((n, i) => (
                    <td key={i} className="py-0.5 pr-2">
                      <span className="inline-flex items-center gap-1.5 tabular-nums"><span className="h-1.5 rounded-full bg-brand-orange/70" style={{ width: `${Math.max(2, (n / max) * 48)}px` }} aria-hidden />{n}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <LogSection d={d} manage={manage} onChange={onChange} />
    </div>
  );
}

function LogSection({ d, manage, onChange }: { d: ScorecardDetail; manage?: boolean; onChange?: (d: ScorecardDetail) => void }) {
  const toast = useStableToast();
  const [type, setType] = useState<'monthly_review' | 'qbr' | 'complaint' | 'note'>('monthly_review');
  const [f, setF] = useState({ summary: '', details: '', plan: '', about: '', at: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!f.summary.trim()) return toast.error('Add a short summary.');
    setBusy(true);
    try {
      const r = await apiAddPartnerLog(d.partner._id, { type, summary: f.summary.trim(), details: f.details || undefined, plan: f.plan || undefined, about: f.about || undefined, at: f.at });
      onChange?.(r.data); setF({ summary: '', details: '', plan: '', about: '', at: new Date().toISOString().slice(0, 10) }); toast.success('Saved.');
    } catch (e) { toast.error(errMsg(e, 'Could not save.')); }
    setBusy(false);
  };
  const resolve = async (logId: string) => {
    try { onChange?.((await apiResolveComplaint(d.partner._id, logId)).data); } catch (e) { toast.error(errMsg(e, 'Could not save.')); }
  };
  return (
    <section className="rounded-xl border border-bone bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Reviews and records</p>
        <div className="flex gap-1.5">
          <Badge color={d.reviews.monthlyDue ? 'orange' : 'gray'}>Monthly review {d.reviews.lastMonthlyAt ? fmtDay(d.reviews.lastMonthlyAt) : 'not held yet'}{d.reviews.monthlyDue ? ' · due' : ''}</Badge>
          <Badge color={d.reviews.qbrDue ? 'orange' : 'gray'}>QBR {d.reviews.lastQbrAt ? fmtDay(d.reviews.lastQbrAt) : 'not held yet'}{d.reviews.qbrDue ? ' · due' : ''}</Badge>
        </div>
      </div>
      {manage && (
        <div className="rounded-lg border border-bone bg-cream/40 p-3 mb-3 flex flex-col gap-2">
          <div className="grid sm:grid-cols-3 gap-2">
            <Select label="Add" value={type} onChange={e => setType(e.target.value as typeof type)}>
              <option value="monthly_review">Monthly pipeline review</option><option value="qbr">Quarterly business review</option>
              <option value="complaint">Complaint</option><option value="note">Internal note</option>
            </Select>
            <Input label="Date" type="date" value={f.at} max={new Date().toISOString().slice(0, 10)} onChange={e => setF({ ...f, at: e.target.value })} />
            {type === 'complaint' && <Input label="From (seller / store)" value={f.about} onChange={e => setF({ ...f, about: e.target.value })} />}
          </div>
          <Input label="Summary" value={f.summary} placeholder={type === 'qbr' ? 'Results against milestones, retention, complaints' : type === 'monthly_review' ? 'Prospects, demos, stores live, paying sellers, open issues' : ''} onChange={e => setF({ ...f, summary: e.target.value })} />
          <Textarea label="Details (optional)" rows={2} value={f.details} onChange={e => setF({ ...f, details: e.target.value })} />
          {type === 'qbr' && <Textarea label="Plan for next quarter" rows={2} value={f.plan} onChange={e => setF({ ...f, plan: e.target.value })} />}
          <p className="text-[11px] text-slate">{type === 'complaint' || type === 'note' ? 'Kept internal: the partner does not see it.' : 'Shared with the partner, with today’s numbers saved alongside.'}</p>
          <div className="flex justify-end"><Button size="sm" loading={busy} onClick={save}>Save</Button></div>
        </div>
      )}
      {d.log.length === 0 ? <p className="text-[12.5px] text-slate">Nothing recorded yet.</p> : (
        <ul className="flex flex-col list-none p-0 m-0">
          {d.log.map(l => (
            <li key={l._id} className="border-b border-bone last:border-0 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge color={l.type === 'complaint' ? (l.resolvedAt ? 'gray' : 'red') : l.type === 'note' ? 'gray' : 'blue'}>{LOG_LABELS[l.type]}</Badge>
                <span className="text-[11.5px] text-slate">{fmtDay(l.at)}{l.about ? ` · ${l.about}` : ''}{l.type === 'complaint' ? (l.resolvedAt ? ` · resolved ${fmtDay(l.resolvedAt)}` : ' · open') : ''}</span>
                {manage && !l.visibleToPartner && <span className="text-[11px] text-slate">(internal)</span>}
                {manage && l.type === 'complaint' && !l.resolvedAt && <Button size="xs" variant="ghost" onClick={() => resolve(l._id)}><Circle size={11} /> Mark resolved</Button>}
              </div>
              <p className="text-[13px] text-charcoal mt-0.5">{l.summary}</p>
              {l.details && <p className="text-[12px] text-slate whitespace-pre-wrap">{l.details}</p>}
              {l.plan && <p className="text-[12px] text-charcoal whitespace-pre-wrap"><strong>Next quarter:</strong> {l.plan}</p>}
              {l.snapshot && <p className="text-[11px] text-slate">At the time: {l.snapshot.payingNow ?? 0} paying · {l.snapshot.liveStores ?? 0} live · {l.snapshot.prospects ?? 0} prospects · retention {pct(l.snapshot.retention3mPercent ?? null)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
