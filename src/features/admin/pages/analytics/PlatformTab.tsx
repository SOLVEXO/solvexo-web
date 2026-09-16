import { MetricCard, Table, type TableColumn } from '@/components/comman/ui';
import { LineChart } from '@/components/comman/charts';
import { Megaphone, Activity } from 'lucide-react';
import { useAdminAnalyticsPlatformMetrics, useAdminAnalyticsSellerAcquisition, useAdminAnalyticsPlatformHealth } from '@/hooks/admin/useAdminAnalytics';
import type { BaseAnalyticsParams, SellerAcquisitionRow, QueueBacklogRow } from '@/api/services/analytics/adminAnalytics';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatBucketLabel, formatPercent } from '@/components/comman/analytics/format';

const DEPENDENCY_STATUS_STYLE: Record<'up' | 'down', string> = {
  up: 'bg-green-50 text-green-700',
  down: 'bg-red-50 text-red-700',
};

export function PlatformTab({ params }: { params: BaseAnalyticsParams }) {
  const platform = useAdminAnalyticsPlatformMetrics(params);
  // Phase 9 — Merchant Acquisition Tracking. A separate query/endpoint from
  // platformMetrics above: real UTM/referrer capture at seller signup, not
  // derived from or blended with buyer-side Order.attributionSource.
  const acquisition = useAdminAnalyticsSellerAcquisition(params);
  // Phase 10 — Platform Health. Real, live infrastructure data (dependency
  // status, webhook failure rate, queue backlog) — never a fabricated
  // uptime/latency/error-rate number derived from business analytics.
  const health = useAdminAnalyticsPlatformHealth(params);

  if (platform.error) {
    return <AnalyticsErrorState message={platform.error} onRetry={platform.refetch} />;
  }

  const d = platform.data;
  const c = d?.conversionMetrics;
  const a = acquisition.data;
  const h = health.data;

  const acquisitionColumns: TableColumn<SellerAcquisitionRow>[] = [
    { key: 'source', header: 'Source' },
    { key: 'medium', header: 'Medium', render: r => r.medium ?? '—' },
    { key: 'campaign', header: 'Campaign', render: r => r.campaign ?? '—' },
    { key: 'sellerCount', header: 'Sellers', align: 'right' },
  ];

  const queueColumns: TableColumn<QueueBacklogRow>[] = [
    { key: 'name', header: 'Queue' },
    { key: 'waiting', header: 'Waiting', align: 'right', render: r => r.unavailable ? '—' : r.waiting },
    { key: 'active', header: 'Active', align: 'right', render: r => r.unavailable ? '—' : r.active },
    { key: 'failed', header: 'Failed', align: 'right', render: r => r.unavailable ? '—' : r.failed },
    { key: 'delayed', header: 'Delayed', align: 'right', render: r => r.unavailable ? '—' : r.delayed },
    {
      key: 'completed', header: 'Status', align: 'right',
      render: r => r.unavailable
        ? <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700">Unavailable</span>
        : <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">OK</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {platform.loading ? (
        <ChartCardSkeleton height={260} />
      ) : d ? (
        <LineChart
          title="Marketplace Growth"
          subtitle="New sellers, stores & products"
          height={260}
          data={(d.marketplaceGrowth ?? []).map(p => ({
            label: formatBucketLabel(p.date, d.granularity),
            newSellers: p.newSellers,
            newStores: p.newStores,
            newProducts: p.newProducts,
          }))}
          lines={[
            { dataKey: 'newSellers', label: 'New Sellers', color: '#D97757' },
            { dataKey: 'newStores', label: 'New Stores', color: '#2156A8' },
            { dataKey: 'newProducts', label: 'New Products', color: '#2D8A4E' },
          ]}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="New Users in Period" value={c ? c.newUsersInPeriod.toLocaleString() : ''} loading={platform.loading} />
        <MetricCard label="New Users Who Ordered" value={c ? c.newUsersWhoOrdered.toLocaleString() : ''} loading={platform.loading} />
        <MetricCard label="Signup → Order Conversion" value={c ? formatPercent(c.signupToOrderConversionPercent) : ''} loading={platform.loading} />
      </div>

      {c?.note && (
        <p className="text-[11px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">{c.note}</p>
      )}

      <div className="bg-white border border-bone rounded-[10px]">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <p className="text-[14px] font-bold text-charcoal">Merchant Acquisition</p>
          {a && (
            <p className="text-[11px] text-slate">{a.attributedCount} of {a.totalSellers} sellers attributed</p>
          )}
        </div>
        <Table
          columns={acquisitionColumns}
          data={a?.breakdown ?? []}
          keyExtractor={r => `${r.source}-${r.medium}-${r.campaign}`}
          loading={acquisition.loading}
          emptyState={{ icon: <Megaphone size={28} className="text-slate/50" />, title: 'No sellers signed up in this period' }}
        />
      </div>

      {a?.note && (
        <p className="text-[11px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">{a.note}</p>
      )}

      <div className="bg-white border border-bone rounded-[10px] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-bold text-charcoal">Platform Health</p>
          {h && (
            <p className="text-[11px] text-slate">Checked {new Date(h.dependencyStatus.checkedAt).toLocaleTimeString()}</p>
          )}
        </div>

        {h && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${DEPENDENCY_STATUS_STYLE[h.dependencyStatus.mongodb]}`}>
              <Activity size={12} /> MongoDB: {h.dependencyStatus.mongodb === 'up' ? 'Up' : 'Down'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${DEPENDENCY_STATUS_STYLE[h.dependencyStatus.redis]}`}>
              <Activity size={12} /> Redis: {h.dependencyStatus.redis === 'up' ? 'Up' : 'Down'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <MetricCard label="Webhook Events" value={h ? h.webhookReliability.totalEvents.toLocaleString() : ''} loading={health.loading} />
          <MetricCard label="Failed Events" value={h ? h.webhookReliability.failedEvents.toLocaleString() : ''} loading={health.loading} />
          <MetricCard label="Failure Rate" value={h ? formatPercent(h.webhookReliability.failureRatePercent) : ''} loading={health.loading} />
        </div>

        <p className="text-[13px] font-semibold text-charcoal mb-2">Queue Backlog (live)</p>
        <Table
          columns={queueColumns}
          data={h?.queueBacklog ?? []}
          keyExtractor={r => r.name}
          loading={health.loading}
          emptyState={{ icon: <Activity size={28} className="text-slate/50" />, title: 'No queue data available' }}
        />

        {h?.webhookReliability?.note && (
          <p className="text-[11px] text-slate bg-cream border border-bone rounded-lg px-3 py-2 mt-3">{h.webhookReliability.note}</p>
        )}
        {h?.note && (
          <p className="text-[11px] text-slate bg-cream border border-bone rounded-lg px-3 py-2 mt-2">{h.note}</p>
        )}
      </div>
    </div>
  );
}
