import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/comman/ui/Card';
import { Button } from '@/components/comman/ui/Button';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { useSeoSitemapStatus, useRegenerateSeoSitemap } from '@/hooks/admin/seo/useSeoSitemap';
import type { SitemapChunk } from '@/api/services/seo/admin/sitemap.service';

export function SitemapTab() {
  const { data, loading, error, refetch } = useSeoSitemapStatus();
  const { regenerate, submitting } = useRegenerateSeoSitemap();

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  const handleRegenerate = async () => {
    const ok = await regenerate();
    if (ok) setTimeout(refetch, 1500);
  };

  const columns: TableColumn<SitemapChunk>[] = [
    { key: 'type', header: 'Type' },
    { key: 'storeId', header: 'Store', render: r => r.storeId ?? 'Platform' },
    { key: 'chunkIndex', header: 'Chunk', align: 'center' },
    { key: 'urlCount', header: 'URLs', align: 'right' },
    { key: 'generatedAt', header: 'Generated', render: r => r.generatedAt ? new Date(r.generatedAt).toLocaleString() : '—' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="Sitemap Chunks" value={data?.chunkCount ?? 0} loading={loading} />
        <MetricCard label="Total URLs" value={(data?.totalUrls ?? 0).toLocaleString()} loading={loading} />
        <MetricCard
          label="Last Generated"
          value={data?.lastGeneratedAt ? new Date(data.lastGeneratedAt).toLocaleDateString() : '—'}
          loading={loading}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" size="sm" icon={<RefreshCw size={13} />} loading={submitting} onClick={handleRegenerate}>
          Regenerate Sitemap
        </Button>
      </div>

      <Card padding="none">
        <Table columns={columns} data={data?.chunks ?? []} keyExtractor={(r, i) => `${r.type}-${r.storeId ?? 'platform'}-${r.chunkIndex}-${i}`} />
        {!loading && (data?.chunks ?? []).length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-slate">No sitemap chunks generated yet.</div>
        )}
      </Card>
    </div>
  );
}
