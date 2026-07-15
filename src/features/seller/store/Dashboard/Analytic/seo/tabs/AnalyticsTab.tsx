import { MetricCard } from '@/components/comman/ui/MetricCard';
import { Card } from '@/components/comman/ui/Card';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { LineChart } from '@/components/comman/charts';
import { MousePointerClick, Eye, Percent, TrendingUp } from 'lucide-react';
import { useSeoSearchPerformance, useSeoOrganicTraffic } from '@/hooks/seller/seo/useSeoAnalytics';

interface AnalyticsTabProps {
  storeId: string;
}

export function AnalyticsTab({ storeId }: AnalyticsTabProps) {
  const { data: perf, loading: perfLoading, error: perfError, refetch: refetchPerf } = useSeoSearchPerformance(storeId, { days: 28 });
  const { data: traffic, loading: trafficLoading } = useSeoOrganicTraffic(storeId, { days: 28 });

  if (perfError) return <AnalyticsErrorState message={perfError} onRetry={refetchPerf} />;

  const totals = (perf ?? []).reduce(
    (acc, r) => {
      acc.clicks += r.clicks ?? 0;
      acc.impressions += r.impressions ?? 0;
      return acc;
    },
    { clicks: 0, impressions: 0 },
  );
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const totalOrganicSessions = (traffic ?? []).reduce((sum, r) => sum + (r.organicSessions ?? 0), 0);

  const perfSeries = (perf ?? []).map(r => ({ date: r.date, value: r.clicks ?? 0 }));
  const trafficSeries = (traffic ?? []).map(r => ({ date: r.date, value: r.organicSessions ?? 0 }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <MetricCard label="Clicks (28d)" value={totals.clicks.toLocaleString()} icon={<MousePointerClick size={16} />} loading={perfLoading} />
        <MetricCard label="Impressions (28d)" value={totals.impressions.toLocaleString()} icon={<Eye size={16} />} loading={perfLoading} />
        <MetricCard label="Avg CTR" value={`${avgCtr.toFixed(1)}%`} icon={<Percent size={16} />} loading={perfLoading} />
        <MetricCard label="Organic Sessions (28d)" value={totalOrganicSessions.toLocaleString()} icon={<TrendingUp size={16} />} loading={trafficLoading} />
      </div>

      <Card>
        <p className="text-[13px] font-semibold text-carbon mb-3">Search Clicks Over Time</p>
        {perfLoading ? (
          <div className="h-[220px] bg-cream animate-pulse rounded-lg" />
        ) : perfSeries.length > 0 ? (
          <LineChart data={perfSeries} xKey="date" lines={[{ dataKey: 'value', label: 'Clicks' }]} height={220} />
        ) : (
          <p className="text-[12px] text-slate py-10 text-center">No search performance data yet — connect Search Console to start collecting data.</p>
        )}
      </Card>

      <Card>
        <p className="text-[13px] font-semibold text-carbon mb-3">Organic Traffic Over Time</p>
        {trafficLoading ? (
          <div className="h-[220px] bg-cream animate-pulse rounded-lg" />
        ) : trafficSeries.length > 0 ? (
          <LineChart data={trafficSeries} xKey="date" lines={[{ dataKey: 'value', label: 'Organic Sessions' }]} height={220} />
        ) : (
          <p className="text-[12px] text-slate py-10 text-center">No organic traffic data yet — connect Google Analytics to start collecting data.</p>
        )}
      </Card>
    </div>
  );
}
