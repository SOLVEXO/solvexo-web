import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart as RechartsBar, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, ChevronRight, Info } from 'lucide-react';
import { MetricCard } from '@/components/comman/ui';
import { CHART_GRID, CHART_TICK } from '@/components/comman/charts/chartTheme';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { apiGetPlanInsights, type PlanInsightRow, type PlanInsights, type PlanMoveKind } from '@/api/services/analytics/saasMetrics';
import { Card, Empty } from './parts';

const RANGE_OPTIONS = [6, 12, 24];
const usd = (n: number, digits = 0) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits });
const pct = (n: number | null | undefined, digits = 1) => (n === null || n === undefined ? '—' : `${n.toLocaleString('en-US', { maximumFractionDigits: digits })}%`);
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Same blue / green / red as the MRR movement chart (validated with the dataviz palette checker): gains up, losses down.
const MOVES = [
  { key: 'new', label: 'New paid plans', color: '#2a78d6', sign: 1 },
  { key: 'upgrades', label: 'Upgrades', color: '#1baf7a', sign: 1 },
  { key: 'downgrades', label: 'Downgrades', color: '#e34948', sign: -1 },
] as const;
const KIND_LABEL: Record<PlanMoveKind, string> = { new: 'New', upgrade: 'Upgrade', downgrade: 'Downgrade', interval: 'Billing switch', lateral: 'Same price' };
const KIND_CLASS: Record<PlanMoveKind, string> = {
  new: 'bg-[#2a78d6]/10 text-[#1f5fae]', upgrade: 'bg-success/10 text-success', downgrade: 'bg-error/10 text-error',
  interval: 'bg-fog text-slate', lateral: 'bg-fog text-slate',
};

/** SaaS Metrics → Plans: how each plan sells, which way stores move, what they really pay, and who has outgrown their plan. */
export function PlansTab() {
  const navigate = useNavigate();
  const [months, setMonths] = useState(12);
  const [data, setData] = useState<PlanInsights | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true); setError('');
    apiGetPlanInsights(months)
      .then(r => setData(r.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load plan insights.'))
      .finally(() => setLoading(false));
  }, [months]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const s = data?.summary;
  const atRisk = s ? s.cancelingMrr + s.scheduledDowngradeMrr : 0;
  const openClient = (sellerId: string | null) => { if (sellerId) navigate(`/admin/clients/${sellerId}`); };

  return (
    <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <label htmlFor="plans-range" className="sr-only">Months shown</label>
        <select id="plans-range" value={months} onChange={e => setMonths(Number(e.target.value))}
          className="h-8 rounded-lg border border-bone bg-white px-2.5 text-[12.5px] text-charcoal">
          {RANGE_OPTIONS.map(n => <option key={n} value={n}>Last {n} months</option>)}
        </select>
      </div>

      {error && !data && <AnalyticsErrorState message={error} onRetry={load} />}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="Upgrades / downgrades" value={s ? `${s.upgrades} / ${s.downgrades}` : ''} loading={loading && !data}
          sub={s ? `+${usd(s.upgradeMrr)} / −${usd(s.downgradeMrr)} MRR` : undefined}
          trend={s?.upgradeToDowngradeRatio != null ? `${s.upgradeToDowngradeRatio.toFixed(1)} up per down` : undefined} trendUp={s?.upgradeToDowngradeRatio != null ? s.upgradeToDowngradeRatio >= 1 : undefined} />
        <MetricCard label="New paid plans" value={s ? s.newStores.toLocaleString() : ''} sub={s ? `${usd(s.newMrr)} MRR added` : undefined} loading={loading && !data} />
        <MetricCard label="On yearly billing" value={s ? pct(s.yearlySharePercent, 0) : ''} sub={s ? `of ${plural(s.payingStores, 'paying store')}` : undefined} loading={loading && !data} />
        <MetricCard label="Below list price" value={s ? `${usd(s.belowListGapMrr)}/mo` : ''} sub={s ? `${plural(s.belowListStores, 'store')} on an older price or offer` : undefined} loading={loading && !data} />
        <MetricCard label="MRR at risk" value={s ? usd(atRisk) : ''} sub={s ? `${s.cancelingStores} cancelling, ${s.scheduledDowngrades} downgrading` : undefined} loading={loading && !data} />
        <MetricCard label="Upgrade opportunity" value={s ? `+${usd(s.upgradeOpportunityMrr)}/mo` : ''} sub={s ? `${plural(s.outgrowingStores, 'store')} near the product limit` : undefined} loading={loading && !data} />
      </div>

      {loading && !data ? <ChartCardSkeleton height={320} /> : data && <PlanTable plans={data.plans} />}

      {loading && !data ? <ChartCardSkeleton height={280} /> : data && <MovesChart monthly={data.monthly} summary={data.summary} />}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <Card title="Where stores move" subtitle="Changes between plans in the period, most common first">
            {data.moves.length === 0 ? <Empty text="No store changed plan in this period." /> : (
              <ul className="flex flex-col list-none p-0 m-0 divide-y divide-fog">
                {data.moves.map(m => (
                  <li key={`${m.fromPlanId}>${m.toPlanId}`} className="flex items-center gap-2 py-2 text-[12.5px]">
                    <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${KIND_CLASS[m.kind]}`}>{KIND_LABEL[m.kind]}</span>
                    <span className="flex-1 min-w-0 truncate text-charcoal">
                      {m.fromName} <ArrowRight size={12} className="inline text-slate mx-0.5" aria-label="to" /> <strong>{m.toName}</strong>
                    </span>
                    <span className="text-slate tabular-nums">{plural(m.moves, 'store')}</span>
                    <span className={`w-20 text-right tabular-nums font-semibold ${m.mrrChange >= 0 ? 'text-success' : 'text-error'}`}>
                      {m.mrrChange >= 0 ? '+' : '−'}{usd(Math.abs(m.mrrChange), 2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Outgrowing their plan" subtitle="Using 80% or more of their plan's product limit">
            {data.candidates.length === 0 ? <Empty text="No store is close to its product limit." /> : (
              <ul className="flex flex-col list-none p-0 m-0 divide-y divide-fog">
                {data.candidates.map(c => (
                  <li key={c.storeId}>
                    <button type="button" disabled={!c.sellerId} onClick={() => openClient(c.sellerId)}
                      className="w-full flex items-center gap-3 py-2 bg-transparent border-none cursor-pointer text-left hover:bg-cream/50 rounded-md disabled:cursor-default">
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12.5px] font-semibold text-charcoal truncate">{c.storeName}</span>
                        <span className="block text-[11.5px] text-slate">
                          {c.planName}: {c.products.toLocaleString()} of {c.maxProducts.toLocaleString()} products ({pct(c.usagePercent, 0)})
                        </span>
                      </span>
                      <span className="text-right text-[11.5px] shrink-0">
                        {c.suggestedPlanName ? <>
                          <span className="block text-charcoal font-semibold">{c.suggestedPlanName}</span>
                          {c.mrrIfUpgraded !== null && <span className="block text-success tabular-nums">+{usd(Math.max(0, c.mrrIfUpgraded - c.currentMrr), 2)}/mo</span>}
                        </> : <span className="text-slate">No bigger plan</span>}
                      </span>
                      {c.sellerId ? <ChevronRight size={14} className="text-slate shrink-0" /> : <span aria-hidden className="w-3.5 shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {data && (
        <p className="flex items-start gap-2 text-[11.5px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">
          <Info size={13} className="shrink-0 mt-px" />
          <span>
            MRR is the plan price per month (a yearly plan counts as its price ÷ 12), the same rule as the Revenue tab. An upgrade or downgrade is a move to a
            plan worth more or less per month; switching between monthly and yearly on the same plan is counted separately
            ({data.summary.intervalSwitches} {data.summary.intervalSwitches === 1 ? 'switch' : 'switches'}, {data.summary.switchedToYearly} to yearly). "Below list price" compares what each store pays with
            today's price for its billing interval. "Stopped paying" counts stores that were paying on a plan at the start of the period and pay nothing now.
          </span>
        </p>
      )}
    </div>
  );
}

function PlanTable({ plans }: { plans: PlanInsightRow[] }) {
  return (
    <Card title="Plans" subtitle="Today's subscribers and revenue per plan, with movement over the period">
      {plans.length === 0 ? <Empty text="No plans yet." /> : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-[12px] whitespace-nowrap">
            <thead><tr className="bg-cream text-left text-[11px] uppercase tracking-[0.05em] text-slate border-y border-bone">
              <th className="px-5 py-2 font-semibold">Plan</th>
              <th className="px-3 py-2 font-semibold text-right">List price</th>
              <th className="px-3 py-2 font-semibold text-right">Paying</th>
              <th className="px-3 py-2 font-semibold">MRR</th>
              <th className="px-3 py-2 font-semibold text-right">Avg paid</th>
              <th className="px-3 py-2 font-semibold text-right">Below list</th>
              <th className="px-3 py-2 font-semibold text-right">New</th>
              <th className="px-3 py-2 font-semibold text-right" title="Stores that upgraded to this plan / from this plan">Upgrades in / out</th>
              <th className="px-3 py-2 font-semibold text-right" title="Stores that downgraded to this plan / from this plan">Downgrades in / out</th>
              <th className="px-3 py-2 font-semibold text-right">Stopped paying</th>
              <th className="px-3 py-2 font-semibold text-right">Fee</th>
            </tr></thead>
            <tbody>{plans.map(p => (
              <tr key={p.planId} className="border-b border-fog last:border-0">
                <td className="px-5 py-2.5">
                  <span className="text-charcoal font-semibold">{p.name}</span>
                  {p.isFree && <Tag>Free</Tag>}
                  {!p.isPublic && <Tag>Hidden</Tag>}
                  {p.status === 'archived' && <Tag>Archived</Tag>}
                  {p.isCustomPricing && <Tag>Custom</Tag>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {p.monthlyPriceUSD ? <>{usd(p.monthlyPriceUSD)}<span className="text-slate">/mo</span></> : p.isFree ? usd(0) : '—'}
                  {p.yearlyPriceUSD ? <span className="block text-[11px] text-slate">{usd(p.yearlyPriceUSD)}/yr{p.yearlyDiscountPercent ? ` (−${pct(p.yearlyDiscountPercent, 0)})` : ''}</span> : null}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {p.isFree ? <span className="text-slate">{p.stores} on it</span> : p.payingStores}
                  {p.yearlyStores > 0 && <span className="block text-[11px] text-slate">{p.yearlyStores} yearly</span>}
                  {p.pastDueStores > 0 && <span className="block text-[11px] text-error">{p.pastDueStores} past due</span>}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-[132px]">
                    <span className="h-1.5 w-10 shrink-0 rounded-full bg-fog overflow-hidden" aria-hidden>
                      <span className="block h-full rounded-full bg-[#2a78d6]" style={{ width: `${Math.min(100, p.mrrSharePercent ?? 0)}%` }} />
                    </span>
                    <span className="tabular-nums text-charcoal font-semibold w-16 text-right">{usd(p.mrr)}</span>
                    <span className="tabular-nums text-slate w-9 text-right">{pct(p.mrrSharePercent, 0)}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{p.arpu === null ? '—' : usd(p.arpu, 2)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {p.belowListStores > 0 ? <>{p.belowListStores}<span className="block text-[11px] text-slate">−{usd(p.belowListGapMrr, 2)}/mo</span></> : <span className="text-slate">0</span>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{p.newStores}</td>
                <td className="px-3 py-2.5 text-right tabular-nums"><InOut a={p.upgradesIn} b={p.upgradesOut} /></td>
                <td className="px-3 py-2.5 text-right tabular-nums"><InOut a={p.downgradesIn} b={p.downgradesOut} /></td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {p.payingAtStart > 0 ? <>{pct(p.stoppedPayingPercent, 0)}<span className="block text-[11px] text-slate">{p.stoppedPaying} of {p.payingAtStart}</span></> : '—'}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate">{pct(p.transactionFeePercent, 2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** "in / out" counts; zeros stay grey so the plans with movement stand out. */
const InOut = ({ a, b }: { a: number; b: number }) => (
  <span className={a || b ? 'text-charcoal' : 'text-slate'}>{a} <span className="text-slate">/</span> {b}</span>
);

const Tag = ({ children }: { children: string }) => <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate bg-fog px-1.5 py-0.5 rounded">{children}</span>;

function MovesChart({ monthly, summary }: { monthly: PlanInsights['monthly']; summary: PlanInsights['summary'] }) {
  const rows = monthly.map(m => ({ label: monthLabel(m.month), new: m.new, upgrades: m.upgrades, downgrades: -m.downgrades, raw: m }));
  const totals = { new: summary.newStores, upgrades: summary.upgrades, downgrades: summary.downgrades };
  const any = monthly.some(m => m.new || m.upgrades || m.downgrades);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <Card title="Plan changes per month" subtitle="Stores starting a paid plan or moving up, above the line; moving down, below it"
      action={
        <div role="group" aria-label="Show plan changes as" className="inline-flex rounded-lg border border-bone p-0.5 text-[12px]">
          {(['chart', 'table'] as const).map(v => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-md cursor-pointer border-none ${view === v ? 'bg-charcoal text-white' : 'bg-transparent text-slate hover:text-charcoal'}`}>
              {v === 'chart' ? 'Chart' : 'Table'}
            </button>
          ))}
        </div>
      }>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-[12px]">
        {MOVES.map(x => (
          <span key={x.key} className="inline-flex items-center gap-1.5 text-slate"><span aria-hidden className="size-2 rounded-full" style={{ background: x.color }} />{x.label} <strong className="text-charcoal">{totals[x.key]}</strong></span>
        ))}
      </div>
      {!any ? <Empty text="No plan changes in this period yet." /> : view === 'table' ? (
        <div className="overflow-x-auto"><table className="w-full text-[12.5px] whitespace-nowrap">
          <thead><tr className="text-left text-[11px] uppercase tracking-[0.05em] text-slate">
            <th className="py-2 pr-3 font-semibold">Month</th><th className="py-2 px-2 font-semibold text-right">New</th><th className="py-2 px-2 font-semibold text-right">Upgrades</th>
            <th className="py-2 px-2 font-semibold text-right">Downgrades</th><th className="py-2 pl-2 font-semibold text-right">MRR change</th>
          </tr></thead>
          <tbody>{[...monthly].reverse().map(m => {
            const net = m.newMrr + m.upgradeMrr - m.downgradeMrr;
            return (
              <tr key={m.month} className="border-t border-fog">
                <td className="py-2 pr-3 text-charcoal font-medium">{monthLabel(m.month)}</td>
                <td className="py-2 px-2 text-right tabular-nums">{m.new}{m.new > 0 && <span className="text-slate"> (+{usd(m.newMrr, 2)})</span>}</td>
                <td className="py-2 px-2 text-right tabular-nums">{m.upgrades}{m.upgrades > 0 && <span className="text-slate"> (+{usd(m.upgradeMrr, 2)})</span>}</td>
                <td className="py-2 px-2 text-right tabular-nums">{m.downgrades}{m.downgrades > 0 && <span className="text-slate"> (−{usd(m.downgradeMrr, 2)})</span>}</td>
                <td className={`py-2 pl-2 text-right tabular-nums font-semibold ${net >= 0 ? 'text-success' : 'text-error'}`}>{net >= 0 ? '+' : '−'}{usd(Math.abs(net), 2)}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      ) : (
        <div style={{ height: 260 }} role="img" aria-label="Bar chart of new paid plans and upgrades (up) and downgrades (down) per month.">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBar data={rows} stackOffset="sign" barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid {...CHART_GRID} vertical={false} />
              <XAxis dataKey="label" tick={CHART_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} width={32} allowDecimals={false} tickFormatter={(v: number) => String(Math.abs(v))} />
              <ReferenceLine y={0} stroke="#8C8A82" />
              <Tooltip cursor={{ fill: 'rgba(140,138,130,0.08)' }} content={<MovesTooltip />} />
              {MOVES.map(x => <Bar key={x.key} dataKey={x.key} name={x.label} stackId="moves" fill={x.color} stroke="#fff" strokeWidth={1} maxBarSize={34} />)}
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

interface TipProps { active?: boolean; label?: string; payload?: { payload: { raw: PlanInsights['monthly'][number] } }[] }
function MovesTooltip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload.raw;
  const line = (color: string, name: string, n: number, mrr: string) => (
    <p className="flex items-center justify-between gap-4 text-charcoal">
      <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: color }} />{name} {n}</span><span>{mrr}</span>
    </p>
  );
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-2 text-[12px] shadow-sm min-w-[200px]">
      <p className="text-slate mb-1">{label}</p>
      {line(MOVES[0].color, 'New', m.new, `+${usd(m.newMrr, 2)}`)}
      {line(MOVES[1].color, 'Upgrades', m.upgrades, `+${usd(m.upgradeMrr, 2)}`)}
      {line(MOVES[2].color, 'Downgrades', m.downgrades, `−${usd(m.downgradeMrr, 2)}`)}
    </div>
  );
}
