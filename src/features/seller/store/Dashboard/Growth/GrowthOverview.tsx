import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { SkeletonBox, Table, type TableColumn, Badge } from '@/components/comman/ui';
import { formatMoney } from '@/utils/currency';
import { apiGetGrowthOverview, type AttributionRow, type CampaignReportRow, type GrowthOverview as Overview, type GrowthRange } from '@/api/services/growth';
import { ErrorBanner, RangeSelect, StatCard } from './growthShared';
import { channelLabel, percent } from './growthFormat';

/** Growth → Overview: what marketing brought in, the busiest channels, and the latest campaigns. */
export function GrowthOverview({ storeId }: { storeId: string }) {
  const [range, setRange] = useState<GrowthRange>('30d');
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);
  const retry = () => { setLoading(true); setError(''); setReloadKey(k => k + 1); };
  const changeRange = (v: GrowthRange) => { setLoading(true); setError(''); setRange(v); };

  useEffect(() => {
    let alive = true;
    apiGetGrowthOverview(storeId, range)
      .then(res => { if (alive) { setData(res.data); setLoading(false); } })
      .catch(e => { if (alive) { setError(e instanceof Error ? e.message : 'Failed to load the overview.'); setLoading(false); } });
    return () => { alive = false; };
  }, [storeId, range, reloadKey]);

  const money = (n: number) => formatMoney(n, data?.currency);

  const channelCols: TableColumn<AttributionRow>[] = [
    { key: 'key', header: 'Channel', render: r => <span className="font-semibold text-carbon">{channelLabel(r.key)}</span> },
    { key: 'sessions', header: 'Sessions', render: r => r.sessions.toLocaleString() },
    { key: 'orders', header: 'Orders', render: r => r.orders.toLocaleString() },
    { key: 'sales', header: 'Sales', render: r => money(r.sales) },
    { key: 'cr', header: 'Conversion rate', render: r => percent(r.conversionRate) },
  ];

  const campaignCols: TableColumn<CampaignReportRow>[] = [
    {
      key: 'name', header: 'Campaign', render: c => (
        <div><p className="font-semibold text-carbon">{c.name}</p><p className="text-[11.5px] text-slate">{c.utmCampaign}</p></div>
      ),
    },
    { key: 'status', header: 'Status', render: c => <Badge color={c.status === 'active' ? 'green' : 'gray'}>{c.status === 'active' ? 'Active' : 'Archived'}</Badge> },
    { key: 'sessions', header: 'Sessions', render: c => c.sessions.toLocaleString() },
    { key: 'orders', header: 'Orders', render: c => c.orders.toLocaleString() },
    { key: 'sales', header: 'Sales', render: c => money(c.sales) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[12.5px] text-slate">Sales are credited to the visit that brought the customer (last non-direct click).</p>
        <RangeSelect value={range} onChange={changeRange} />
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} height={84} rounded="10px" />)}</div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard label="Sales from marketing" value={money(data.totals.marketingSales ?? 0)} hint="Excludes direct and unattributed" />
            <StatCard label="Total sales" value={money(data.totals.sales)} />
            <StatCard label="Orders" value={data.totals.orders.toLocaleString()} />
            <StatCard label="Sessions" value={data.totals.sessions.toLocaleString()} />
            <StatCard label="Conversion rate" value={percent(data.totals.conversionRate)} />
            <StatCard label="Average order value" value={money(data.totals.averageOrderValue)} />
          </div>

          {data.totals.sessions === 0 && (
            <p className="text-[12.5px] text-slate bg-cream rounded-lg px-4 py-3">
              No visits have been recorded for this period yet. Visits are counted when shoppers browse your online store (and accept analytics cookies, if your cookie banner is on).
            </p>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[14px] font-bold text-carbon">Top channels</p>
              <Link to="attribution" relative="path" className="text-[12.5px] font-semibold text-brand-orange hover:underline">View attribution</Link>
            </div>
            <div className="bg-white border border-bone rounded-xl overflow-hidden">
              <Table columns={channelCols} data={data.topChannels} keyExtractor={r => r.key} loading={false}
                emptyState={{ icon: <Megaphone size={26} className="text-slate/50" />, title: 'No channel data yet', description: 'Once shoppers visit your store, you will see where they came from here.' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[14px] font-bold text-carbon">Recent campaigns</p>
              <Link to="campaigns" relative="path" className="text-[12.5px] font-semibold text-brand-orange hover:underline">All campaigns</Link>
            </div>
            <div className="bg-white border border-bone rounded-xl overflow-hidden">
              <Table columns={campaignCols} data={data.recentCampaigns} keyExtractor={c => c._id} loading={false}
                emptyState={{ icon: <Megaphone size={26} className="text-slate/50" />, title: 'No campaigns yet', description: 'Create a campaign to see how the sessions and sales from one marketing effort add up.' }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
