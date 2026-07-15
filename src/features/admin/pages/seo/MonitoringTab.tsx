import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/comman/ui/Card';
import { Button } from '@/components/comman/ui/Button';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import {
  useSeoCrawlLogs, useSeoCrawlStats, useSeoIndexSnapshots, useSeoCwv, useSeoMonitoringActions,
} from '@/hooks/admin/seo/useSeoMonitoring';
import type { CrawlLogRow, IndexSnapshotRow, CoreWebVitalsRow } from '@/api/services/seo/admin/monitoring.service';

export function MonitoringTab() {
  const [page, setPage] = useState(1);
  const { data: logs, loading: logsLoading, error, refetch: refetchLogs } = useSeoCrawlLogs({ page, limit: 20 });
  const { data: stats, loading: statsLoading } = useSeoCrawlStats();
  const { data: indexSnapshots, loading: indexLoading, refetch: refetchIndex } = useSeoIndexSnapshots();
  const { data: cwv, loading: cwvLoading, refetch: refetchCwv } = useSeoCwv();
  const { refreshIndexSnapshots, refreshCwv, submitting } = useSeoMonitoringActions();

  if (error) return <AnalyticsErrorState message={error} onRetry={refetchLogs} />;

  const handleRefreshIndex = async () => {
    if (await refreshIndexSnapshots()) setTimeout(refetchIndex, 1000);
  };

  const handleRefreshCwv = async () => {
    const urls = (cwv ?? []).map(r => r.url);
    if (urls.length === 0) return;
    if (await refreshCwv(urls)) setTimeout(refetchCwv, 1000);
  };

  const crawlColumns: TableColumn<CrawlLogRow>[] = [
    { key: 'botName', header: 'Bot' },
    { key: 'path', header: 'Path', render: r => <span className="font-mono text-[12px]">{r.path}</span> },
    { key: 'statusCode', header: 'Status', align: 'center' },
    { key: 'createdAt', header: 'Time', render: r => new Date(r.createdAt).toLocaleString() },
  ];

  const indexColumns: TableColumn<IndexSnapshotRow>[] = [
    { key: 'provider', header: 'Provider' },
    { key: 'indexedCount', header: 'Indexed', align: 'right' },
    { key: 'excludedCount', header: 'Excluded', align: 'right' },
    { key: 'snapshotDate', header: 'Date', render: r => new Date(r.snapshotDate).toLocaleDateString() },
  ];

  const cwvColumns: TableColumn<CoreWebVitalsRow>[] = [
    { key: 'url', header: 'URL', render: r => <span className="font-mono text-[12px] truncate block max-w-[280px]">{r.url}</span> },
    { key: 'lcp', header: 'LCP (ms)', align: 'right', render: r => r.lcp ?? '—' },
    { key: 'inp', header: 'INP (ms)', align: 'right', render: r => r.inp ?? '—' },
    { key: 'cls', header: 'CLS', align: 'right', render: r => r.cls ?? '—' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="Bot Hits (30d)" value={(stats?.last30Days.byBot.reduce((s, b) => s + b.hits, 0) ?? 0).toLocaleString()} loading={statsLoading} />
        <MetricCard label="Error Hits (30d)" value={stats?.last30Days.errorHits ?? 0} loading={statsLoading} />
      </div>

      <Card padding="none">
        <div className="px-5 py-3 border-b border-bone">
          <p className="text-[13px] font-semibold text-carbon">Crawl Logs</p>
        </div>
        <Table
          columns={crawlColumns}
          data={logs?.items ?? []}
          keyExtractor={r => r._id}
          pagination={logs ? {
            page: logs.pagination.page,
            total: logs.pagination.total,
            perPage: logs.pagination.limit,
            onChange: setPage,
            label: 'crawl hits',
          } : undefined}
        />
        {logsLoading && <div className="px-5 py-6 text-center text-[12px] text-slate">Loading…</div>}
        {!logsLoading && (logs?.items ?? []).length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-slate">No crawl activity logged yet.</div>
        )}
      </Card>

      <Card padding="none">
        <div className="px-5 py-3 border-b border-bone flex items-center justify-between">
          <p className="text-[13px] font-semibold text-carbon">Index Coverage Snapshots</p>
          <Button variant="outline" size="xs" icon={<RefreshCw size={11} />} loading={submitting} onClick={handleRefreshIndex}>Refresh</Button>
        </div>
        <Table columns={indexColumns} data={indexSnapshots ?? []} keyExtractor={r => r._id} />
        {!indexLoading && (indexSnapshots ?? []).length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-slate">No index snapshots yet.</div>
        )}
      </Card>

      <Card padding="none">
        <div className="px-5 py-3 border-b border-bone flex items-center justify-between">
          <p className="text-[13px] font-semibold text-carbon">Core Web Vitals</p>
          <Button variant="outline" size="xs" icon={<RefreshCw size={11} />} loading={submitting} onClick={handleRefreshCwv}>Refresh</Button>
        </div>
        <Table columns={cwvColumns} data={cwv ?? []} keyExtractor={r => r._id} />
        {!cwvLoading && (cwv ?? []).length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-slate">No Core Web Vitals data yet.</div>
        )}
      </Card>
    </div>
  );
}
