import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart as RechartsBar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronRight, Info } from 'lucide-react';
import { MetricCard } from '@/components/comman/ui';
import { LineChart } from '@/components/comman/charts';
import { CHART_GRID, CHART_TICK } from '@/components/comman/charts/chartTheme';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { apiGetRevenueModel, type RevenueModel, type RevenueStream } from '@/api/services/analytics/saasMetrics';
import { Card, Empty } from './parts';

const RANGE_OPTIONS = [6, 12, 24];
const usd = (n: number, digits = 0) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits });
const pct = (n: number | null | undefined, digits = 1) => (n === null || n === undefined ? '—' : `${n.toLocaleString('en-US', { maximumFractionDigits: digits })}%`);
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });

// Fixed stream order and colors: the first six slots of the dataviz reference palette, validated in this stacking
// order (CVD-safe). Three are under 3:1 contrast on white, so every value is also in the tables below.
const STREAMS: { key: RevenueStream; label: string; color: string }[] = [
  { key: 'plans', label: 'Plan fees', color: '#2a78d6' },
  { key: 'transactionFees', label: 'Transaction fees', color: '#eb6834' },
  { key: 'commission', label: 'Sales commission', color: '#1baf7a' },
  { key: 'addons', label: 'Add-ons', color: '#eda100' },
  { key: 'posPlans', label: 'POS plans', color: '#e87ba4' },
  { key: 'promotions', label: 'Paid promotions', color: '#008300' },
];
const colorOf = (k: RevenueStream) => STREAMS.find(s => s.key === k)?.color ?? '#8c8a82';

/** SaaS Metrics → Revenue model: how Solvexo makes money, how much of merchants' sales it keeps, and from whom. */
export function RevenueModelTab() {
  const navigate = useNavigate();
  const [months, setMonths] = useState(12);
  const [data, setData] = useState<RevenueModel | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true); setError('');
    apiGetRevenueModel(months)
      .then(r => setData(r.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load the revenue model.'))
      .finally(() => setLoading(false));
  }, [months]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const s = data?.summary;
  // Only streams that earned something in the period get a bar and a legend entry.
  const active = STREAMS.filter(x => data?.streams.some(st => st.stream === x.key && st.total > 0));

  return (
    <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <label htmlFor="revenue-model-range" className="sr-only">Months shown</label>
        <select id="revenue-model-range" value={months} onChange={e => setMonths(Number(e.target.value))}
          className="h-8 rounded-lg border border-bone bg-white px-2.5 text-[12.5px] text-charcoal">
          {RANGE_OPTIONS.map(n => <option key={n} value={n}>Last {n} months</option>)}
        </select>
      </div>

      {error && !data && <AnalyticsErrorState message={error} onRetry={load} />}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard label="Solvexo revenue" value={s ? usd(s.totalRevenue) : ''} sub={s ? `${usd(s.thisMonthSoFar)} this month so far` : undefined} loading={loading && !data} />
        <MetricCard label="Take rate" value={s ? pct(s.takeRatePercent, 2) : ''} sub="Solvexo revenue ÷ merchant sales" loading={loading && !data} />
        <MetricCard label="Kept from each sale" value={s ? pct(s.transactionalTakeRatePercent, 2) : ''} sub="Commission + transaction fees ÷ sales" loading={loading && !data} />
        <MetricCard label="From subscriptions" value={s ? pct(s.subscriptionSharePercent, 0) : ''} sub="Plans, add-ons, POS; the rest is per sale" loading={loading && !data} />
        <MetricCard label="Revenue per paying store" value={s ? (s.revenuePerPayingStore === null ? '—' : usd(s.revenuePerPayingStore, 2)) : ''} sub={s ? `${s.payingStores} stores paid Solvexo` : undefined} loading={loading && !data} />
      </div>

      {loading && !data ? <ChartCardSkeleton height={300} /> : data && (
        <Card title="Revenue by stream" subtitle={`Merchant sales (GMV) over the period: ${usd(data.summary.totalGmv)}. The current month is partial.`}>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-[12px]">
            {active.map(x => {
              const t = data.streams.find(st => st.stream === x.key)!;
              return <span key={x.key} className="inline-flex items-center gap-1.5 text-slate"><span aria-hidden className="size-2 rounded-full" style={{ background: x.color }} />{x.label} <strong className="text-charcoal">{usd(t.total)}</strong> <span>({pct(t.sharePercent, 0)})</span></span>;
            })}
          </div>
          {active.length === 0 ? <Empty text="No Solvexo revenue in this period yet." /> : (
            <div style={{ height: 280 }} role="img" aria-label="Stacked bar chart of Solvexo revenue per month by stream. Every value is in the monthly table below.">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBar data={data.monthly.map(m => ({ label: monthLabel(m.month), ...m.streams, total: m.total }))} barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <CartesianGrid {...CHART_GRID} vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => usd(v)} />
                  <Tooltip cursor={{ fill: 'rgba(140,138,130,0.08)' }} content={<StreamTooltip />} />
                  {active.map(x => <Bar key={x.key} dataKey={x.key} name={x.label} stackId="rev" fill={x.color} stroke="#fff" strokeWidth={1} maxBarSize={34} />)}
                </RechartsBar>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {data && data.summary.totalGmv > 0 && (
        <LineChart title="Take rate" subtitle="Solvexo revenue as a share of merchant sales, per month" height={220} valueSuffix="%" yTickFormatter={v => `${v}%`}
          // A month without merchant sales has no take rate: leave a gap rather than plotting 0%.
          data={data.monthly.map(m => ({ label: monthLabel(m.month), takeRate: m.takeRatePercent, perSale: m.transactionalTakeRatePercent }))}
          lines={[
            { dataKey: 'takeRate', label: 'Take rate (all revenue)', color: '#2a78d6' },
            { dataKey: 'perSale', label: 'Kept from each sale', color: '#eb6834' },
          ]} />
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <Card title="Streams" subtitle="Last full month vs the month before">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px] whitespace-nowrap">
                <thead><tr className="text-left text-[11px] uppercase tracking-[0.05em] text-slate">
                  <th className="py-2 pr-3 font-semibold">Stream</th><th className="py-2 px-2 font-semibold text-right">Period</th>
                  <th className="py-2 px-2 font-semibold text-right">Share</th><th className="py-2 px-2 font-semibold text-right">Last month</th><th className="py-2 pl-2 font-semibold text-right">Change</th>
                </tr></thead>
                <tbody>{data.streams.map(st => (
                  <tr key={st.stream} className="border-t border-fog">
                    <td className="py-2 pr-3 text-charcoal font-medium"><span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full" style={{ background: colorOf(st.stream) }} />{st.label}</span></td>
                    <td className="py-2 px-2 text-right tabular-nums">{usd(st.total, 2)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate">{pct(st.sharePercent, 0)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{usd(st.lastMonth, 2)}</td>
                    <td className={`py-2 pl-2 text-right tabular-nums font-semibold ${st.changePercent === null ? 'text-slate' : st.changePercent >= 0 ? 'text-success' : 'text-error'}`}>
                      {st.changePercent === null ? '—' : `${st.changePercent >= 0 ? '+' : ''}${pct(st.changePercent, 0)}`}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
          <Card title="Who the revenue comes from" subtitle={data.concentration.top10SharePercent === null ? 'Biggest paying stores' : `The top 10 stores bring ${pct(data.concentration.top10SharePercent, 0)} of Solvexo's revenue`}>
            {data.concentration.top.length === 0 ? <Empty text="No store has paid Solvexo in this period yet." /> : (
              <ol className="flex flex-col list-none p-0 m-0 divide-y divide-fog">
                {data.concentration.top.map((t, i) => (
                  <li key={t.storeId}>
                    <button type="button" disabled={!t.sellerId} onClick={() => t.sellerId && navigate(`/admin/clients/${t.sellerId}`)}
                      className="w-full flex items-center gap-3 py-2 bg-transparent border-none cursor-pointer text-left hover:bg-cream/50 rounded-md disabled:cursor-default">
                      <span className="text-[11.5px] text-slate w-5 text-right tabular-nums">{i + 1}</span>
                      <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-charcoal truncate">{t.storeName}</span>
                      <span className="text-[12px] tabular-nums text-charcoal">{usd(t.amount, 2)}</span>
                      <span className="text-[11.5px] tabular-nums text-slate w-12 text-right">{pct(t.sharePercent, 0)}</span>
                      {t.sellerId ? <ChevronRight size={14} className="text-slate shrink-0" /> : <span aria-hidden className="w-3.5 shrink-0" />}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      )}

      {data && (
        <Card title="Monthly detail" subtitle="Every number behind the charts">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-[12px] whitespace-nowrap">
              <thead><tr className="bg-cream text-left text-[11px] uppercase tracking-[0.05em] text-slate border-y border-bone">
                <th className="px-5 py-2 font-semibold">Month</th><th className="px-3 py-2 font-semibold text-right">Revenue</th>
                {STREAMS.map(x => <th key={x.key} className="px-3 py-2 font-semibold text-right">{x.label}</th>)}
                <th className="px-3 py-2 font-semibold text-right">Merchant sales</th><th className="px-3 py-2 font-semibold text-right">Take rate</th><th className="px-3 py-2 font-semibold text-right">Per sale</th>
              </tr></thead>
              <tbody>{[...data.monthly].reverse().map((m, i) => (
                <tr key={m.month} className="border-b border-fog last:border-0">
                  <td className="px-5 py-2 text-charcoal font-medium">{monthLabel(m.month)}{i === 0 && <span className="ml-1.5 text-[10.5px] text-slate">so far</span>}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-charcoal">{usd(m.total, 2)}</td>
                  {STREAMS.map(x => <td key={x.key} className="px-3 py-2 text-right tabular-nums text-charcoal">{usd(m.streams[x.key], 2)}</td>)}
                  <td className="px-3 py-2 text-right tabular-nums">{usd(m.gmv)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(m.takeRatePercent, 2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(m.transactionalTakeRatePercent, 2)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      )}

      {data && (
        <p className="flex items-start gap-2 text-[11.5px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">
          <Info size={13} className="shrink-0 mt-px" />
          <span>
            Revenue is what Solvexo collected, in USD: plan fees (net of refunds and tax), transaction fees on collected bills, commission on sales
            paid through Solvexo, add-ons, POS plans and paid promotions. Merchant sales are non-cancelled order subtotals, as in Analytics.
            Not included: {data.notes.excluded.join('; ')}.
            {data.notes.unconvertedCurrencies?.length ? ` Amounts in ${data.notes.unconvertedCurrencies.join(', ')} have no exchange rate and are left out.` : ''}
          </span>
        </p>
      )}
    </div>
  );
}

interface TipProps { active?: boolean; label?: string; payload?: { name: string; value: number; color: string; payload: { total: number } }[] }
function StreamTooltip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-2 text-[12px] shadow-sm min-w-[180px]">
      <p className="text-slate mb-1">{label}</p>
      {payload.filter(p => p.value > 0).map(p => (
        <p key={p.name} className="flex items-center justify-between gap-4 text-charcoal">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
          <span>{usd(p.value, 2)}</span>
        </p>
      ))}
      <p className="flex justify-between gap-4 border-t border-fog mt-1 pt-1 font-bold text-carbon"><span>Total</span><span>{usd(payload[0].payload.total, 2)}</span></p>
    </div>
  );
}
