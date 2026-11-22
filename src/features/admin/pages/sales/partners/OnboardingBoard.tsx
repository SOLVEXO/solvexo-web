import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, Settings2, UserPlus } from 'lucide-react';
import { Badge, Button, EmptyState, MetricCard } from '@/components/comman/ui';
import {
  MODEL_LABELS, STAGES, STAGE_COLORS, STAGE_LABELS, TIER_LABELS, apiPartnerBoard, fmtDay, type BoardRow, type PartnerStage,
} from '@/api/services/partnerProgramme';
import { errMsg, useStableToast } from '../sales.utils';
import { PartnerOnboardingModal } from './PartnerOnboardingModal';
import { ProgrammeSettingsModal } from './ProgrammeSettingsModal';

type Filter = 'attention' | 'open' | PartnerStage | 'all';
const OPEN: PartnerStage[] = ['applied', 'documents', 'review', 'agreement', 'onboarding'];

/** Super Admin → Sales Ops → Partners → Applications & onboarding. */
export function OnboardingBoard({ onChanged }: { onChanged?: () => void }) {
  const toast = useStableToast();
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiPartnerBoard().then(r => { if (!cancelled) setRows(r.data); }).catch(e => { if (!cancelled) { setRows([]); toast.error(errMsg(e, 'Could not load applications.')); } });
    return () => { cancelled = true; };
  }, [tick, toast]);

  const count = (f: Filter) => (rows ?? []).filter(r => match(r, f)).length;
  const shown = useMemo(() => (rows ?? []).filter(r => match(r, filter)), [rows, filter]);
  const filters: Filter[] = ['attention', 'open', ...STAGES, 'all'];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="New applications" value={count('applied')} loading={!rows} />
        <MetricCard label="Being vetted" value={count('documents') + count('review')} loading={!rows} sub="Documents and references" />
        <MetricCard label="Onboarding" value={count('agreement') + count('onboarding')} loading={!rows} sub="Agreement and first 30 days" />
        <MetricCard label="Needs attention" value={count('attention')} loading={!rows} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter applications">
          {filters.map(f => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={clsx('px-3 py-1.5 rounded-full text-[12px] font-medium border cursor-pointer', filter === f ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-bone hover:border-charcoal/40')}>
              {f === 'attention' ? 'Needs attention' : f === 'open' ? 'In progress' : f === 'all' ? 'All' : STAGE_LABELS[f]} <span className="opacity-60">{count(f)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <a href="/partners" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-orange hover:underline"><UserPlus size={14} /> Application page</a>
          <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}><Settings2 size={13} /> Programme settings</Button>
        </div>
      </div>

      {!rows ? <div className="h-40 rounded-xl bg-cream animate-pulse" /> : shown.length === 0 ? (
        <EmptyState icon={<UserPlus size={28} />} title={filter === 'attention' ? 'Nothing needs attention' : 'No applications here'}
          description="Partners apply on solvexo.store/partners. Each application lands here and moves through vetting, the agreement and a 30-day onboarding." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bone bg-white">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate border-b border-bone">
              <th className="px-3 py-2 font-semibold">Partner</th><th className="px-3 py-2 font-semibold">Stage</th>
              <th className="px-3 py-2 font-semibold">Documents</th><th className="px-3 py-2 font-semibold">Checklist</th>
              <th className="px-3 py-2 font-semibold">Key dates</th>
            </tr></thead>
            <tbody>
              {shown.map(r => (
                <tr key={r._id} onClick={() => setOpenId(r._id)} className="border-b border-bone last:border-0 hover:bg-cream cursor-pointer align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium text-charcoal">{r.name}</p>
                    <p className="text-[11.5px] text-slate">
                      {[r.model ? MODEL_LABELS[r.model] : r.entityType === 'individual' ? 'Individual' : 'Business', r.tier ? TIER_LABELS[r.tier] : null, r.territory ?? r.city].filter(Boolean).join(' · ')}
                    </p>
                    {r.attention.length > 0 && <p className="text-[11.5px] text-warning flex items-start gap-1 mt-0.5"><AlertTriangle size={12} className="shrink-0 mt-[2px]" aria-hidden />{r.attention.join(' · ')}</p>}
                  </td>
                  <td className="px-3 py-2"><Badge color={STAGE_COLORS[r.stage]} dot>{STAGE_LABELS[r.stage]}</Badge></td>
                  <td className="px-3 py-2 tabular-nums text-slate">{r.docs.verified}/{r.docs.required} verified{r.docs.waiting ? <span className="text-charcoal"> · {r.docs.waiting} to check</span> : ''}</td>
                  <td className="px-3 py-2 tabular-nums">
                    <span className={clsx(r.checklist.overdue ? 'text-error' : 'text-slate')}>{r.checklist.done}/{r.checklist.total}{r.checklist.overdue ? ` · ${r.checklist.overdue} overdue` : ''}</span>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-slate">
                    {r.stage === 'applied' || r.stage === 'documents' || r.stage === 'review' ? `Applied ${fmtDay(r.appliedAt)}` : r.pilotEndsAt ? <>Pilot ends {fmtDay(r.pilotEndsAt)}<br />Notice by {fmtDay(r.noticeBy)}</> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && <PartnerOnboardingModal id={openId} onClose={() => setOpenId(null)} onChanged={() => { setTick(t => t + 1); onChanged?.(); }} />}
      {settingsOpen && <ProgrammeSettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function match(r: BoardRow, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'attention') return r.attention.length > 0;
  if (f === 'open') return OPEN.includes(r.stage);
  return r.stage === f;
}
