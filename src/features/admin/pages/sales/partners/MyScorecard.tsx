import { useEffect, useState } from 'react';
import { apiMyScorecard, type ScorecardDetail } from '@/api/services/partnerProgramme';
import { ScorecardView } from './ScorecardView';

/** The partner's own scorecard: the same numbers Solvexo reviews with them each month and quarter. */
export function MyScorecard() {
  const [d, setD] = useState<ScorecardDetail | null>(null);
  useEffect(() => { apiMyScorecard().then(r => setD(r.data)).catch(() => setD(null)); }, []);
  if (!d) return null;
  return (
    <section className="flex flex-col gap-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate">Your scorecard</p>
      <ScorecardView d={d} />
    </section>
  );
}
