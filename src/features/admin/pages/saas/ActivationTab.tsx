import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ChevronRight, Info, TrendingDown } from 'lucide-react';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { apiGetActivationFunnel, type ActivationFunnel, type FunnelStep } from '@/api/services/analytics/saasMetrics';
import { Card, Empty } from './parts';

const RANGE_OPTIONS = [3, 6, 12];
const STUCK_PREVIEW = 10;
const STEP_LABEL: Record<FunnelStep, string> = {
  signed_up: 'Signed up', verified: 'Verified email', store: 'Created a store', product: 'Added a product', sale: 'First sale', paying: 'Paying plan',
};
// What a stuck merchant still has to do: shown as the outreach action.
const NEXT_ACTION: Record<FunnelStep, string> = {
  signed_up: 'Sign up', verified: 'Verify their email', store: 'Create a store', product: 'Add a first product', sale: 'Get a first sale', paying: 'Choose a plan',
};
const pct = (n: number | null) => (n === null ? '—' : `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`);
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const STEP_ORDER: FunnelStep[] = ['signed_up', 'verified', 'store', 'product', 'sale', 'paying'];
const COHORT_STEPS: FunnelStep[] = ['verified', 'store', 'product', 'sale', 'paying'];

/** SaaS Metrics → Activation: how far new merchants get after signing up, and who is stuck where. */
export function ActivationTab() {
  const navigate = useNavigate();
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<ActivationFunnel | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [stuckFilter, setStuckFilter] = useState<FunnelStep | 'all'>('all');
  const [showAllStuck, setShowAllStuck] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError('');
    apiGetActivationFunnel(months)
      .then(r => setData(r.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load the activation funnel.'))
      .finally(() => setLoading(false));
  }, [months]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // The step that loses the most merchants (lowest share continuing from the step before).
  const biggestDrop = useMemo(() => {
    const steps = data?.steps.filter(s => s.percentOfPrevious !== null) ?? [];
    if (!data || data.steps[0].merchants === 0 || steps.length === 0) return null;
    const worst = steps.reduce((a, b) => (b.percentOfPrevious! < a.percentOfPrevious! ? b : a));
    const i = data.steps.findIndex(s => s.step === worst.step);
    return { from: data.steps[i - 1].label, to: worst.label, percent: worst.percentOfPrevious! };
  }, [data]);

  const stuck = (data?.stuck ?? []).filter(s => stuckFilter === 'all' || s.stuckAt === stuckFilter);
  const stuckSteps = STEP_ORDER.filter(step => (data?.stuck ?? []).some(s => s.stuckAt === step));
  const signups = data?.steps[0].merchants ?? 0;

  return (
    <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[12.5px] text-slate">Merchants who signed up {data ? `since ${new Date(data.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</p>
        <div>
          <label htmlFor="activation-range" className="sr-only">Sign-up period</label>
          <select id="activation-range" value={months} onChange={e => setMonths(Number(e.target.value))}
            className="h-8 rounded-lg border border-bone bg-white px-2.5 text-[12.5px] text-charcoal">
            {RANGE_OPTIONS.map(n => <option key={n} value={n}>Signed up in the last {n} months</option>)}
          </select>
        </div>
      </div>

      {error && !data && <AnalyticsErrorState message={error} onRetry={load} />}

      {loading && !data ? <ChartCardSkeleton height={320} /> : data && (
        <Card title="Activation funnel" subtitle="How many new merchants reached each step, and how long it took (median days after sign-up)">
          {signups === 0 ? <Empty text="No merchants signed up in this period." /> : (
            <>
              {biggestDrop && (
                <p className="flex items-center gap-2 text-[12.5px] text-charcoal bg-cream border border-bone rounded-lg px-3 py-2 mb-4">
                  <TrendingDown size={14} className="text-error shrink-0" />
                  <span>Biggest drop: <strong>{biggestDrop.from} → {biggestDrop.to}</strong>. Only {pct(biggestDrop.percent)} continue.</span>
                </p>
              )}
              <ol className="flex flex-col list-none p-0 m-0">
                {data.steps.map((s, i) => (
                  <li key={s.step}>
                    {i > 0 && (
                      <p className="flex items-center gap-1.5 text-[11px] text-slate pl-1 my-1">
                        <ArrowDown size={11} /> {pct(s.percentOfPrevious)} continue
                      </p>
                    )}
                    <div className="grid grid-cols-[minmax(110px,170px)_1fr_auto] items-center gap-3">
                      <span className="text-[12.5px] font-semibold text-charcoal">{s.label}</span>
                      <div className="h-6 rounded-[4px] bg-fog overflow-hidden" aria-hidden>
                        <div className="h-full rounded-[4px] bg-[#2a78d6]" style={{ width: `${Math.max(s.percentOfSignups ?? 0, s.merchants > 0 ? 1 : 0)}%` }} />
                      </div>
                      <span className="text-[12px] text-charcoal tabular-nums whitespace-nowrap text-right min-w-[150px]">
                        <strong>{s.merchants.toLocaleString()}</strong> · {pct(s.percentOfSignups)}
                        {s.medianDaysFromSignup !== null && <span className="text-slate"> · {Math.round(s.medianDaysFromSignup)}d</span>}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Card>
      )}

      {data && signups > 0 && (
        <Card title="Merchants to help" subtitle="Signed up in the last 60 days and stuck on a step for 3+ days. Longest first; click to open the client."
          action={stuckSteps.length > 1 && (
            <div role="group" aria-label="Stuck at" className="inline-flex rounded-lg border border-bone p-0.5 text-[12px] flex-wrap">
              {(['all', ...stuckSteps] as const).map(f => (
                <button key={f} type="button" aria-pressed={stuckFilter === f} onClick={() => { setStuckFilter(f); setShowAllStuck(false); }}
                  className={`px-2.5 py-1 rounded-md cursor-pointer border-none ${stuckFilter === f ? 'bg-charcoal text-white' : 'bg-transparent text-slate hover:text-charcoal'}`}>
                  {f === 'all' ? 'All' : NEXT_ACTION[data.stuck.find(x => x.stuckAt === f)!.nextStep]}
                </button>
              ))}
            </div>
          )}>
          {stuck.length === 0 ? <Empty text="Nobody is stuck right now." /> : (
            <ul className="flex flex-col list-none p-0 m-0 divide-y divide-fog">
              {(showAllStuck ? stuck : stuck.slice(0, STUCK_PREVIEW)).map(m => (
                <li key={m.sellerId}>
                  <button type="button" onClick={() => navigate(`/admin/clients/${m.sellerId}`)}
                    className="w-full flex items-center gap-3 py-2.5 bg-transparent border-none cursor-pointer text-left hover:bg-cream/50 rounded-md">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-charcoal truncate">{m.name ?? m.email ?? 'Unnamed merchant'}</span>
                      <span className="block text-[11px] text-slate truncate">{m.email} · signed up {m.signedUpDaysAgo} days ago</span>
                    </span>
                    <span className="text-[12px] text-graphite text-right">
                      <span className="block">Next: {NEXT_ACTION[m.nextStep]}</span>
                      <span className="block text-[11px] text-slate">stuck {m.daysStuck} days</span>
                    </span>
                    <ChevronRight size={15} className="text-slate shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {stuck.length > STUCK_PREVIEW && (
            <button type="button" onClick={() => setShowAllStuck(v => !v)}
              className="mt-2 text-[12px] font-semibold text-brand-deep-orange bg-transparent border-none cursor-pointer p-0 hover:underline">
              {showAllStuck ? 'Show fewer' : `Show all ${stuck.length}`}
            </button>
          )}
        </Card>
      )}

      {data && signups > 0 && (
        <>
          <Card title="By sign-up month" subtitle="Share of each month's sign-ups that reached the step">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] whitespace-nowrap">
                <thead><tr className="text-left text-[11px] uppercase tracking-[0.05em] text-slate">
                  <th className="py-2 pr-3 font-semibold">Month</th><th className="py-2 px-2 font-semibold text-right">Sign-ups</th>
                  {COHORT_STEPS.map(s => <th key={s} className="py-2 px-2 font-semibold text-right">{STEP_LABEL[s]}</th>)}
                </tr></thead>
                <tbody>{[...data.byCohort].reverse().map(c => (
                  <tr key={c.month} className="border-t border-fog">
                    <td className="py-2 pr-3 text-charcoal font-medium">{monthLabel(c.month)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{c.signups}</td>
                    {COHORT_STEPS.map(s => <td key={s} className="py-2 px-2 text-right tabular-nums text-charcoal">{c.signups ? pct(c.percent[s]) : '—'}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
          <Card title="By sign-up channel" subtitle="Where merchants came from (UTM source) and how far they got">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] whitespace-nowrap">
                <thead><tr className="text-left text-[11px] uppercase tracking-[0.05em] text-slate">
                  <th className="py-2 pr-3 font-semibold">Channel</th><th className="py-2 px-2 font-semibold text-right">Sign-ups</th>
                  <th className="py-2 px-2 font-semibold text-right">Store</th><th className="py-2 px-2 font-semibold text-right">First sale</th><th className="py-2 pl-2 font-semibold text-right">Paying</th>
                </tr></thead>
                <tbody>{data.bySource.map(r => (
                  <tr key={r.source} className="border-t border-fog">
                    <td className="py-2 pr-3 text-charcoal font-medium">{r.source}</td><td className="py-2 px-2 text-right tabular-nums">{r.signups}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{pct(r.storePercent)}</td><td className="py-2 px-2 text-right tabular-nums">{pct(r.salePercent)}</td>
                    <td className="py-2 pl-2 text-right tabular-nums font-semibold text-charcoal">{pct(r.payingPercent)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {data && signups > 0 && (
        <p className="flex items-start gap-2 text-[11.5px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">
          <Info size={13} className="shrink-0 mt-px" />
          <span>Recent months look lower because those merchants haven't had time to finish yet. A merchant counts at a step once they have reached it and every step before it, across any of their stores; "Paying" means a paid plan was bought.</span>
        </p>
      )}
    </div>
  );
}
