import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Eye, ShoppingCart, CreditCard, PackageCheck, Users, MousePointerClick } from 'lucide-react';
import { MetricCard, Table, type TableColumn } from '@/components/comman/ui';
import { LineChart, FunnelChart } from '@/components/comman/charts';
import { useSellerAnalyticsSessions } from '@/hooks/seller/useSellerAnalytics';
import { apiSellerAnalyticsLive, type SellerAnalyticsParams, type SellerLiveViewData, type SessionBreakdownRow } from '@/api/services/analytics/analytics';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatBucketLabel } from '@/components/comman/analytics/format';
import { formatMoneyCompact } from '@/utils/currency';

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct', search: 'Search', social: 'Social', email: 'Email', paid: 'Paid ads', referral: 'Referral sites',
};
const DEVICE_LABELS: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' };

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string | null): string {
  if (!code) return 'Unknown';
  try {
    regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const pct = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
const count = (n: number) => n.toLocaleString('en-US');

/** Shopify Live View: refreshes every 15 s while the page is visible. */
function LiveViewPanel({ storeId }: { storeId: string }) {
  const [data, setData] = useState<SellerLiveViewData | null>(null);
  const [error, setError] = useState('');
  const seq = useRef(0);

  const load = useCallback(() => {
    const mine = ++seq.current;
    apiSellerAnalyticsLive(storeId)
      .then(res => { if (mine === seq.current) { setData(res.data); setError(''); } })
      .catch(err => { if (mine === seq.current) setError(err instanceof Error ? err.message : 'Failed to load Live View.'); });
  }, [storeId]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') load(); }, 15_000);
    return () => { window.clearInterval(timer); seq.current += 1; };
  }, [load]);

  if (error && !data) return <AnalyticsErrorState message={error} onRetry={load} />;
  if (!data) return <ChartCardSkeleton height={160} />;

  return (
    <div className="bg-white border border-bone rounded-[10px] px-5 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" /><span className="relative inline-flex size-2.5 rounded-full bg-success" /></span>
          <p className="text-[14px] font-bold text-charcoal">Live View</p>
          <span className="text-[11px] text-slate">Visitors active in the last 5 minutes · updates every 15 s</span>
        </div>
        {error && <span role="alert" className="text-[11px] text-error">Couldn't refresh — showing the last update</span>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Visitors right now" value={count(data.visitorsNow)} icon={<Eye size={16} />} color="#22C55E" />
        <MetricCard label="Active carts" value={count(data.activeCarts)} icon={<ShoppingCart size={16} />} color="#0EA5E9" />
        <MetricCard label="Checking out" value={count(data.checkingOut)} icon={<CreditCard size={16} />} color="#8B5CF6" />
        <MetricCard label="Purchased" value={count(data.purchasedNow)} icon={<PackageCheck size={16} />} color="#D97757" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
        <div><p className="text-slate">Sessions today</p><p className="text-[15px] font-bold text-charcoal">{count(data.today.sessions)}</p></div>
        <div><p className="text-slate">Orders today</p><p className="text-[15px] font-bold text-charcoal">{count(data.today.orders)}</p></div>
        <div><p className="text-slate">Sales today</p><p className="text-[15px] font-bold text-charcoal">{formatMoneyCompact(data.today.sales, data.currency)}</p></div>
        <div><p className="text-slate">Conversion today</p><p className="text-[15px] font-bold text-charcoal">{pct(data.today.conversionRate)}</p></div>
      </div>
      {(data.topPages.length > 0 || data.countries.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
          <div>
            <p className="font-semibold text-charcoal mb-1.5">Pages being viewed</p>
            <ul className="flex flex-col gap-1">
              {data.topPages.map(p => (
                <li key={p.path} className="flex justify-between gap-3"><span className="truncate text-graphite">{p.path}</span><span className="tabular-nums text-charcoal">{p.visitors}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-charcoal mb-1.5">Visitors by location</p>
            <ul className="flex flex-col gap-1">
              {data.countries.map(c => (
                <li key={c.country ?? 'unknown'} className="flex justify-between gap-3"><span className="truncate text-graphite">{countryName(c.country)}</span><span className="tabular-nums text-charcoal">{c.visitors}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownTable<T extends SessionBreakdownRow>({ title, rows, label, keyOf }: {
  title: string; rows: T[]; label: (r: T) => string; keyOf: (r: T) => string;
}) {
  const columns: TableColumn<T>[] = [
    { key: 'label', header: title, render: r => <span className="truncate">{label(r)}</span> },
    { key: 'sessions', header: 'Sessions', align: 'right', render: r => count(r.sessions) },
    { key: 'conversionRate', header: 'Conversion', align: 'right', render: r => pct(r.conversionRate) },
  ];
  return (
    <div className="bg-white border border-bone rounded-[10px]">
      <div className="px-5 pt-4 pb-3"><p className="text-[14px] font-bold text-charcoal">{title}</p></div>
      <Table
        columns={columns}
        data={rows}
        keyExtractor={keyOf}
        emptyState={{ icon: <MousePointerClick size={28} className="text-slate/50" />, title: 'No sessions in this period' }}
      />
    </div>
  );
}

export function SellerSessionsTab({ params, storeId }: { params: SellerAnalyticsParams; storeId: string | null }) {
  const sessions = useSellerAnalyticsSessions(params);
  const d = sessions.data;

  if (!storeId) {
    return <p className="text-[13px] text-slate">Sessions are reported per store — open a store to see them.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <LiveViewPanel storeId={storeId} />

      {sessions.loading && !d ? (
        <ChartCardSkeleton height={240} />
      ) : sessions.error ? (
        <AnalyticsErrorState message={sessions.error} onRetry={sessions.refetch} />
      ) : d ? (
        <>
          <p className="text-[11.5px] text-slate">
            {d.trackingSince
              ? `Online store sessions are counted from ${new Date(d.trackingSince).toLocaleDateString()} onward. Visitors who decline analytics cookies are not counted.`
              : 'No visits recorded yet — sessions start counting as soon as visitors open your online store.'}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard
              label="Sessions" value={count(d.sessions)} icon={<Activity size={16} />} color="#0EA5E9"
              trend={d.sessionsChangePercent != null ? `${d.sessionsChangePercent > 0 ? '+' : ''}${d.sessionsChangePercent}%` : undefined}
              trendUp={(d.sessionsChangePercent ?? 0) >= 0}
            />
            <MetricCard
              label="Conversion rate" value={pct(d.conversionRate)} icon={<PackageCheck size={16} />} color="#D97757"
              trend={d.conversionRateChange ? `${d.conversionRateChange > 0 ? '+' : ''}${d.conversionRateChange} pts` : undefined}
              trendUp={d.conversionRateChange >= 0}
              sub="Sessions that placed an order"
            />
            <MetricCard label="Visitors" value={count(d.visitors)} icon={<Users size={16} />} color="#8B5CF6" sub={`${pct(d.returningVisitorRate)} returning`} />
            <MetricCard label="Pages per session" value={d.pagesPerSession.toLocaleString('en-US')} icon={<Eye size={16} />} color="#22C55E" sub={`${count(d.pageViews)} page views`} />
            <MetricCard label="Bounce rate" value={pct(d.bounceRate)} icon={<MousePointerClick size={16} />} color="#F59E0B" sub="Left after one page" />
            <MetricCard label="Added to cart" value={pct(d.funnel.addedToCartRate)} icon={<ShoppingCart size={16} />} color="#0D9488" sub={`${count(d.funnel.addedToCart)} sessions`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FunnelChart
              title="Conversion funnel"
              subtitle="Sessions → added to cart → reached checkout → converted"
              steps={[
                { label: 'Sessions', value: d.funnel.sessions },
                { label: `Added to cart (${pct(d.funnel.addedToCartRate)})`, value: d.funnel.addedToCart },
                { label: `Reached checkout (${pct(d.funnel.reachedCheckoutRate)})`, value: d.funnel.reachedCheckout },
                { label: `Converted (${pct(d.funnel.conversionRate)})`, value: d.funnel.converted },
              ]}
            />
            <LineChart
              title="Sessions over time"
              data={d.series.map(p => ({ label: formatBucketLabel(p.date, d.granularity), sessions: p.sessions }))}
              lines={[{ dataKey: 'sessions', label: 'Sessions', color: '#0EA5E9' }]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BreakdownTable title="Sessions by traffic source" rows={d.byTrafficSource} label={r => SOURCE_LABELS[r.source] ?? r.source} keyOf={r => r.source} />
            <BreakdownTable title="Sessions by device" rows={d.byDevice} label={r => DEVICE_LABELS[r.deviceType] ?? r.deviceType} keyOf={r => r.deviceType} />
            <BreakdownTable title="Sessions by location" rows={d.byCountry} label={r => countryName(r.country)} keyOf={r => r.country ?? 'unknown'} />
            <BreakdownTable title="Top referrers" rows={d.byReferrer} label={r => r.referrer} keyOf={r => r.referrer} />
            <BreakdownTable title="Top landing pages" rows={d.byLandingPage} label={r => r.path} keyOf={r => r.path} />
          </div>
        </>
      ) : null}
    </div>
  );
}
