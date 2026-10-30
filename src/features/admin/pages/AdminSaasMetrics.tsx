import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart as RechartsBar, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Download, Gauge, Info, Rocket } from 'lucide-react';
import { Button, MetricCard, TabBar, type Tab } from '@/components/comman/ui';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';
import { ActivationTab } from './saas/ActivationTab';
import { Card, Empty } from './saas/parts';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { AreaChart } from '@/components/comman/charts';
import { CHART_GRID, CHART_TICK } from '@/components/comman/charts/chartTheme';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { usePageTitle } from '@/hooks/usePageTitle';
import { apiExportSaasMetrics, apiGetSaasMetrics, type SaasCohort, type SaasMetrics, type SaasMonth } from '@/api/services/analytics/saasMetrics';

const usd = (n: number, digits = 0) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits });
const loss = (n: number) => (n === 0 ? usd(0, 2) : `−${usd(n, 2)}`);
const pct = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`);
const rangeLabel = (ms: string[]) => (ms.length > 1 ? `${monthLabel(ms[0])} – ${monthLabel(ms[ms.length - 1])}` : ms.map(monthLabel).join(''));
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });

// MRR movement: gains above the zero line, losses below. Validated with the dataviz palette checker (CVD-safe in this
// stacking order); yellow and aqua are under 3:1 contrast on white, so every value is also in the table below.
const MOVEMENT = [
  { key: 'newMrr', label: 'New', color: '#2a78d6', sign: 1 },
  { key: 'expansionMrr', label: 'Expansion', color: '#1baf7a', sign: 1 },
  { key: 'reactivationMrr', label: 'Reactivation', color: '#6250d6', sign: 1 },
  { key: 'contractionMrr', label: 'Contraction', color: '#eda100', sign: -1 },
  { key: 'churnedMrr', label: 'Churn', color: '#e34948', sign: -1 },
] as const;

const RANGE_OPTIONS = [6, 12, 24];

type SaasTab = 'revenue' | 'activation';
const TABS: Tab[] = [
  { id: 'revenue', label: 'Revenue', icon: <Gauge size={14} /> },
  { id: 'activation', label: 'Activation', icon: <Rocket size={14} /> },
];

/** Admin → SaaS Metrics: Solvexo's own subscription business (Revenue) and how new merchants get started (Activation). */
export function AdminSaasMetrics() {
  usePageTitle('SaaS Metrics');
  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs<SaasTab>('revenue');
  return (
    <>
      <AdminPageHeader
        title="SaaS Metrics"
        subtitle="Solvexo's own subscription business: what stores pay, how it grows, who stays, and how new merchants get started."
        icon={<Gauge size={18} />}
      />
      <TabBar tabs={TABS} active={activeTab} onChange={t => setActiveTab(t as SaasTab)} className="px-4 sm:px-7 mt-4" />
      {isVisited('revenue') && <div className={paneClassName('revenue')}><RevenueTab /></div>}
      {isVisited('activation') && <div className={paneClassName('activation')}><ActivationTab /></div>}
    </>
  );
}

function RevenueTab() {
  const [months, setMonths] = useState(12);
  const [data, setData] = useState<SaasMetrics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError('');
    apiGetSaasMetrics(months)
      .then(r => setData(r.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load SaaS metrics.'))
      .finally(() => setLoading(false));
  }, [months]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try { await apiExportSaasMetrics(months); } catch (e) { setError(e instanceof Error ? e.message : 'Export failed.'); } finally { setExporting(false); }
  };

  const c = data?.current;
  const mrrSeries = useMemo(() => data?.monthly.map(m => m.mrr) ?? [], [data]);

  return (
      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <label htmlFor="saas-range" className="sr-only">Months shown</label>
          <select id="saas-range" value={months} onChange={e => setMonths(Number(e.target.value))}
            className="h-8 rounded-lg border border-bone bg-white px-2.5 text-[12.5px] text-charcoal">
            {RANGE_OPTIONS.map(n => <option key={n} value={n}>Last {n} months</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={exportCsv} loading={exporting} disabled={!data}><Download size={13} /> CSV</Button>
        </div>
        {error && !data && <AnalyticsErrorState message={error} onRetry={load} />}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard label="MRR" value={c ? usd(c.mrr) : ''} sub={c ? `ARR ${usd(c.arr)}` : undefined} loading={loading && !data} sparkline={mrrSeries.length > 1 ? mrrSeries : undefined}
            trend={c ? `${c.netNewMrrThisMonth >= 0 ? '+' : ''}${usd(c.netNewMrrThisMonth)} this month` : undefined} trendUp={c ? c.netNewMrrThisMonth >= 0 : undefined} />
          <MetricCard label="Paying stores" value={c ? c.payingStores.toLocaleString() : ''} sub={c ? `ARPU ${usd(c.arpu, 2)} / month` : undefined} loading={loading && !data} />
          {/* Trailing 12 months needs stores that paid a year ago; a younger platform falls back to this month. */}
          <MetricCard label="Net revenue retention" value={c ? pct(c.nrrPercentTrailing12 ?? c.nrrPercentThisMonth) : ''}
            sub={c?.nrrPercentTrailing12 !== null ? 'Last 12 months, existing stores' : 'This month, existing stores'} loading={loading && !data} />
          <MetricCard label="Store churn this month" value={c ? pct(c.logoChurnPercentThisMonth) : ''} sub={c ? `Revenue churn ${pct(c.revenueChurnPercentThisMonth)}` : undefined} loading={loading && !data} />
          <MetricCard label="Customer lifetime value" value={c ? (c.ltv === null ? 'Not enough churn yet' : usd(c.ltv)) : ''}
            sub={c?.expectedLifetimeMonths ? `≈ ${Math.round(c.expectedLifetimeMonths)} months average life` : 'ARPU ÷ monthly churn (6 mo.)'} loading={loading && !data} />
          <MetricCard label="Quick ratio" value={c ? (c.quickRatioThisMonth === null ? 'No losses' : c.quickRatioThisMonth.toFixed(2)) : ''} sub="Gains ÷ losses; above 4 is excellent" loading={loading && !data} />
        </div>

        {data && data.dataQuality.reconstructedMonths.length > 0 && (
          <p className="flex items-start gap-2 text-[11.5px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">
            <Info size={13} className="shrink-0 mt-px" />
            <span>
              {data.dataQuality.firstDailySnapshot
                ? `Exact daily MRR records start ${data.dataQuality.firstDailySnapshot}. `
                : 'Exact daily MRR records start tonight (23:55 UTC). '}
              Months marked "est." ({rangeLabel(data.dataQuality.reconstructedMonths)}) are rebuilt from subscription history, so a short lapse that was later paid again may not show.
            </span>
          </p>
        )}

        {loading && !data ? <ChartCardSkeleton height={240} /> : data && (
          <AreaChart title="MRR" subtitle="Monthly recurring revenue at each month end (this month: today)" height={240} loading={loading}
            data={data.monthly.map(m => ({ label: monthLabel(m.month), mrr: m.mrr }))} dataKey="mrr" valuePrefix="$" yTickFormatter={v => usd(v)} />
        )}

        {loading && !data ? <ChartCardSkeleton height={300} /> : data && <MovementChart monthly={data.monthly} totals={data.periodTotals} />}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <Card title="MRR by plan" subtitle="Paying stores today">
              {data.byPlan.length === 0 ? <Empty text="No paying stores yet." /> : (
                <div className="overflow-x-auto"><table className="w-full text-[12.5px] whitespace-nowrap">
                  <thead><tr className="text-left text-[11px] uppercase tracking-[0.05em] text-slate"><th className="py-2 font-semibold">Plan</th><th className="py-2 font-semibold text-right">Stores</th><th className="py-2 font-semibold text-right">MRR</th><th className="py-2 font-semibold text-right">Share</th></tr></thead>
                  <tbody>{data.byPlan.map(p => (
                    <tr key={p.planId} className="border-t border-fog"><td className="py-2 text-charcoal font-medium">{p.planName}</td><td className="py-2 text-right">{p.stores}</td><td className="py-2 text-right">{usd(p.mrr, 2)}</td>
                      <td className="py-2 text-right text-slate">{pct(data.current.mrr > 0 ? (p.mrr / data.current.mrr) * 100 : null)}</td></tr>
                  ))}</tbody>
                </table></div>
              )}
            </Card>
            <Card title="Trial to paid" subtitle="By the month the trial started; conversion counts finished trials only">
              <TrialTable trials={data.trials} />
            </Card>
          </div>
        )}

        {data && <CohortTable cohorts={data.cohorts} />}
        {data && <MonthlyTable monthly={data.monthly} />}
      </div>
  );
}

function MovementChart({ monthly, totals }: { monthly: SaasMonth[]; totals: SaasMetrics['periodTotals'] }) {
  const rows = monthly.map(m => ({
    label: monthLabel(m.month), net: m.netNewMrr,
    ...Object.fromEntries(MOVEMENT.map(s => [s.key, s.sign * (m[s.key] as number)])),
  }));
  const hasMovement = monthly.some(m => MOVEMENT.some(s => (m[s.key] as number) !== 0));
  return (
    <Card title="MRR movement" subtitle="What added and removed recurring revenue each month">
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-[12px]">
        {MOVEMENT.map(s => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-slate"><span aria-hidden className="size-2 rounded-full" style={{ background: s.color }} />{s.label} <strong className="text-charcoal">{totals[s.key] === 0 ? '' : s.sign < 0 ? '−' : '+'}{usd(totals[s.key])}</strong></span>
        ))}
      </div>
      {!hasMovement ? <Empty text="No MRR changes in this period yet." /> : (
        <div style={{ height: 280 }} role="img" aria-label="Stacked bar chart of MRR gains and losses per month. The same numbers are in the monthly table below.">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBar data={rows} stackOffset="sign" barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid {...CHART_GRID} vertical={false} />
              <XAxis dataKey="label" tick={CHART_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => usd(v)} />
              <ReferenceLine y={0} stroke="#8C8A82" />
              <Tooltip cursor={{ fill: 'rgba(140,138,130,0.08)' }} content={<MovementTooltip />} />
              {MOVEMENT.map(s => (
                <Bar key={s.key} dataKey={s.key} name={s.label} stackId="mrr" fill={s.color} stroke="#fff" strokeWidth={1} maxBarSize={34} />
              ))}
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

interface TipProps { active?: boolean; label?: string; payload?: { name: string; value: number; color: string; payload: { net: number } }[] }
function MovementTooltip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-2 text-[12px] shadow-sm min-w-[170px]">
      <p className="text-slate mb-1">{label}</p>
      {payload.filter(p => p.value !== 0).map(p => (
        <p key={p.name} className="flex items-center justify-between gap-4 text-charcoal">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
          <span>{p.value < 0 ? '−' : '+'}{usd(Math.abs(p.value), 2)}</span>
        </p>
      ))}
      <p className="flex justify-between gap-4 border-t border-fog mt-1 pt-1 font-bold text-carbon"><span>Net new MRR</span><span>{usd(payload[0].payload.net, 2)}</span></p>
    </div>
  );
}

function TrialTable({ trials }: { trials: SaasMetrics['trials'] }) {
  const rows = trials.filter(t => t.started > 0);
  if (rows.length === 0) return <Empty text="No trials started in this period." />;
  return (
    <div className="overflow-x-auto"><table className="w-full text-[12.5px] whitespace-nowrap">
      <thead><tr className="text-left text-[11px] uppercase tracking-[0.05em] text-slate">
        <th className="py-2 pr-3 font-semibold">Month</th><th className="py-2 font-semibold text-right">Started</th><th className="py-2 font-semibold text-right">Paid</th>
        <th className="py-2 font-semibold text-right">Still trialing</th><th className="py-2 font-semibold text-right">Conversion</th><th className="py-2 font-semibold text-right">Days to pay</th>
      </tr></thead>
      <tbody>{[...rows].reverse().map(t => (
        <tr key={t.month} className="border-t border-fog">
          <td className="py-2 text-charcoal font-medium">{monthLabel(t.month)}</td><td className="py-2 text-right">{t.started}</td><td className="py-2 text-right">{t.converted}</td>
          <td className="py-2 text-right text-slate">{t.stillTrialing}</td><td className="py-2 text-right font-semibold text-charcoal">{pct(t.conversionPercent)}</td>
          <td className="py-2 text-right text-slate">{t.avgDaysToConvert === null ? '—' : Math.round(t.avgDaysToConvert)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

// Sequential single-hue scale (light → dark blue) for retention %, with the number always printed in the cell.
const heat = (v: number | null) => {
  if (v === null) return { background: 'transparent' };
  const a = Math.max(0.06, Math.min(1, v / 100));
  return { background: `rgba(42,120,214,${(a * 0.85).toFixed(2)})`, color: a > 0.55 ? '#fff' : '#2C2A28' };
};

function CohortTable({ cohorts }: { cohorts: SaasCohort[] }) {
  const [mode, setMode] = useState<'stores' | 'revenue'>('stores');
  const maxLen = Math.max(0, ...cohorts.map(c => c.retention.length));
  return (
    <Card title="Cohort retention" subtitle="Stores grouped by the month they first paid. Each cell: share still paying N months later."
      action={
        <div role="group" aria-label="Retention measure" className="inline-flex rounded-lg border border-bone p-0.5 text-[12px]">
          {(['stores', 'revenue'] as const).map(m => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded-md cursor-pointer border-none ${mode === m ? 'bg-charcoal text-white' : 'bg-transparent text-slate hover:text-charcoal'}`}>
              {m === 'stores' ? 'Stores' : 'Revenue'}
            </button>
          ))}
        </div>
      }>
      {cohorts.length === 0 ? <Empty text="No store has started paying in this period yet." /> : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="text-[12px] border-separate" style={{ borderSpacing: 2 }}>
            <thead><tr className="text-[11px] text-slate">
              <th className="text-left font-semibold pr-3 py-1">Cohort</th><th className="text-right font-semibold pr-3">Stores</th>
              {Array.from({ length: maxLen }, (_, i) => <th key={i} className="font-semibold w-12 text-center">M{i}</th>)}
            </tr></thead>
            <tbody>{cohorts.map(c => (
              <tr key={c.cohort}>
                <td className="pr-3 py-1 text-charcoal font-medium whitespace-nowrap">{monthLabel(c.cohort)}</td>
                <td className="pr-3 text-right text-slate">{c.stores}</td>
                {Array.from({ length: maxLen }, (_, i) => {
                  const r = c.retention[i];
                  const v = r ? (mode === 'stores' ? r.storesPercent : r.revenuePercent) : null;
                  return <td key={i} className="w-12 h-8 text-center rounded-[4px] tabular-nums" style={r ? heat(v === null ? null : Math.min(v, 100)) : undefined}>{r ? pct(v) : ''}</td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function MonthlyTable({ monthly }: { monthly: SaasMonth[] }) {
  const cols: { label: string; render: (m: SaasMonth) => string }[] = [
    { label: 'MRR', render: m => usd(m.mrr, 2) }, { label: 'Paying', render: m => String(m.payingStores) },
    { label: 'New', render: m => usd(m.newMrr, 2) }, { label: 'Expansion', render: m => usd(m.expansionMrr, 2) },
    { label: 'Reactivation', render: m => usd(m.reactivationMrr, 2) }, { label: 'Contraction', render: m => loss(m.contractionMrr) },
    { label: 'Churn', render: m => loss(m.churnedMrr) }, { label: 'Net new', render: m => usd(m.netNewMrr, 2) },
    { label: 'NRR', render: m => pct(m.nrrPercent) }, { label: 'Store churn', render: m => pct(m.logoChurnPercent) },
    { label: 'ARPU', render: m => usd(m.arpu, 2) },
  ];
  return (
    <Card title="Monthly detail" subtitle="Every number behind the charts">
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-[12px] whitespace-nowrap">
          <thead><tr className="bg-cream text-left text-[11px] uppercase tracking-[0.05em] text-slate border-y border-bone">
            <th className="px-5 py-2 font-semibold">Month</th>{cols.map(c => <th key={c.label} className="px-3 py-2 font-semibold text-right">{c.label}</th>)}
          </tr></thead>
          <tbody>{[...monthly].reverse().map(m => (
            <tr key={m.month} className="border-b border-fog last:border-0">
              <td className="px-5 py-2 text-charcoal font-medium">{monthLabel(m.month)}
                {m.source === 'reconstructed' && <span className="ml-1.5 text-[10.5px] text-slate" title="Rebuilt from subscription history">est.</span>}
                {m.source === 'live' && <span className="ml-1.5 text-[10.5px] text-success">live</span>}
              </td>
              {cols.map(c => <td key={c.label} className="px-3 py-2 text-right tabular-nums text-charcoal">{c.render(m)}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>
  );
}
