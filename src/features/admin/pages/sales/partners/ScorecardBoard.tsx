import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { ArrowDown, Trophy } from 'lucide-react';
import { Badge, EmptyState, Modal } from '@/components/comman/ui';
import { formatPKR } from '@/api/services/salesOps';
import { TIER_LABELS, apiLeaderboard, apiScorecard, pct, type LeaderRow, type ScorecardDetail } from '@/api/services/partnerProgramme';
import { errMsg, useStableToast } from '../sales.utils';
import { ScorecardView } from './ScorecardView';

type SortKey = 'payingNow' | 'liveStores' | 'prospects' | 'demos' | 'retention3mPercent' | 'daysToFirstSale' | 'complaints' | 'earnedPKR';
const COLS: { key: SortKey; label: string; render: (r: LeaderRow) => string; asc?: boolean }[] = [
  { key: 'prospects', label: 'Prospects', render: r => String(r.prospects) },
  { key: 'demos', label: 'Demos', render: r => String(r.demos) },
  { key: 'liveStores', label: 'Live', render: r => String(r.liveStores) },
  { key: 'payingNow', label: 'Paying', render: r => String(r.payingNow) },
  { key: 'retention3mPercent', label: '3-mo retention', render: r => pct(r.retention3mPercent) },
  { key: 'daysToFirstSale', label: 'Days to 1st sale', render: r => (r.daysToFirstSale === null ? '—' : String(r.daysToFirstSale)), asc: true },
  { key: 'complaints', label: 'Complaints', render: r => String(r.complaints), asc: true },
  { key: 'earnedPKR', label: 'Earned', render: r => formatPKR(r.earnedPKR) },
];

/** Super Admin → Sales Ops → Partners → Scorecards: every selling partner side by side (programme B13). */
export function ScorecardBoard() {
  const toast = useStableToast();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [sort, setSort] = useState<SortKey>('payingNow');
  const [open, setOpen] = useState<ScorecardDetail | null>(null);

  useEffect(() => {
    apiLeaderboard().then(r => setRows(r.data)).catch(e => { setRows([]); toast.error(errMsg(e, 'Could not load scorecards.')); });
  }, [toast]);

  const sorted = useMemo(() => {
    const col = COLS.find(c => c.key === sort)!;
    const v = (r: LeaderRow) => r[sort] ?? (col.asc ? Infinity : -Infinity);
    return [...(rows ?? [])].sort((a, b) => (col.asc ? v(a) - v(b) : v(b) - v(a)));
  }, [rows, sort]);

  const openRow = async (id: string) => {
    try { setOpen((await apiScorecard(id)).data); } catch (e) { toast.error(errMsg(e, 'Could not open the scorecard.')); }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-slate">
        Quality as well as volume (programme B13): paying sellers, sellers still paying after 3 months, time to first sale and complaints, with pilot milestones and tier eligibility. Click a partner for their scorecard, monthly reviews and QBRs.
      </p>
      {!rows ? <div className="h-40 rounded-xl bg-cream animate-pulse" /> : rows.length === 0 ? (
        <EmptyState icon={<Trophy size={28} />} title="No selling partners yet" description="Partners appear here once their agreement is signed." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bone bg-white">
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate border-b border-bone">
              <th className="px-3 py-2 font-semibold">Partner</th>
              {COLS.map(c => (
                <th key={c.key} className="px-3 py-2 font-semibold text-right whitespace-nowrap">
                  <button onClick={() => setSort(c.key)} className={clsx('inline-flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer uppercase tracking-wide text-[11px] font-semibold', sort === c.key ? 'text-charcoal' : 'text-slate')}>
                    {c.label}{sort === c.key && <ArrowDown size={11} className={clsx(c.asc && 'rotate-180')} aria-hidden />}
                  </button>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r._id} onClick={() => openRow(r._id)} className="border-b border-bone last:border-0 hover:bg-cream cursor-pointer">
                  <td className="px-3 py-2">
                    <p className="font-medium text-charcoal">{r.name}</p>
                    <p className="text-[11.5px] text-slate flex flex-wrap items-center gap-1">
                      {r.tier ? TIER_LABELS[r.tier] : 'No tier'}{r.territory ? ` · ${r.territory}` : ''}
                      {r.tierStatus === 'eligible_for_higher' && <Badge color="green">→ {TIER_LABELS[r.eligibleTier]}</Badge>}
                      {r.tierStatus === 'below_requirement' && <Badge color="orange">below tier</Badge>}
                      {r.milestones && <Badge color={r.milestones.some(m => m.met === false) ? 'orange' : 'gray'}>pilot {r.milestones.filter(m => m.met).length}/{r.milestones.length}</Badge>}
                    </p>
                  </td>
                  {COLS.map(c => <td key={c.key} className="px-3 py-2 text-right tabular-nums">{c.render(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <Modal title={`${open.partner.name}: scorecard`} onClose={() => setOpen(null)} width={900}>
          <ScorecardView d={open} manage onChange={setOpen} />
        </Modal>
      )}
    </div>
  );
}
