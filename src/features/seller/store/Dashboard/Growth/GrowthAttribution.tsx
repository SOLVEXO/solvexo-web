import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';
import { Select, Table, type TableColumn } from '@/components/comman/ui';
import { formatMoney } from '@/utils/currency';
import {
  apiGetAttribution, type AttributionBy, type AttributionModel, type AttributionReport, type AttributionRow, type GrowthRange,
} from '@/api/services/growth';
import { ErrorBanner, RangeSelect, StatCard } from './growthShared';
import { channelLabel, percent } from './growthFormat';

const MODEL_LABEL: Record<AttributionModel, string> = {
  last_non_direct: 'Last non-direct click',
  last_click: 'Last click',
  first_click: 'First click',
};
const MODEL_HELP: Record<AttributionModel, string> = {
  last_non_direct: "Each order is credited to the visit that brought the customer. If they came back directly, it is credited to the last visit that came from somewhere (within 30 days).",
  last_click: 'Each order is credited to the very visit it was placed in, even when that was a direct visit.',
  first_click: 'Each order is credited to the customer\'s first visit in the 30 days before the order.',
};
const BY_LABEL: Record<AttributionBy, string> = { channel: 'Marketing channel', source: 'Source', campaign: 'Campaign' };

/** Growth → Attribution: sessions, orders and sales credited to each channel, source or campaign. */
export function GrowthAttribution({ storeId }: { storeId: string }) {
  const [range, setRange] = useState<GrowthRange>('30d');
  const [model, setModel] = useState<AttributionModel>('last_non_direct');
  const [by, setBy] = useState<AttributionBy>('channel');
  const [data, setData] = useState<AttributionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);
  const retry = () => { setLoading(true); setError(''); setReloadKey(k => k + 1); };
  const busy = () => { setLoading(true); setError(''); };

  useEffect(() => {
    let alive = true;
    apiGetAttribution(storeId, { range, model, by })
      .then(res => { if (alive) { setData(res.data); setLoading(false); } })
      .catch(e => { if (alive) { setError(e instanceof Error ? e.message : 'Failed to load attribution.'); setLoading(false); } });
    return () => { alive = false; };
  }, [storeId, range, model, by, reloadKey]);

  const money = (n: number) => formatMoney(n, data?.currency);
  const label = (key: string) => (by === 'channel' ? channelLabel(key) : key);

  const columns: TableColumn<AttributionRow>[] = [
    { key: 'key', header: BY_LABEL[by], render: r => <span className="font-semibold text-carbon">{label(r.key)}</span> },
    { key: 'sessions', header: 'Sessions', render: r => r.sessions.toLocaleString() },
    { key: 'orders', header: 'Orders', render: r => r.orders.toLocaleString() },
    { key: 'sales', header: 'Sales', render: r => money(r.sales) },
    { key: 'aov', header: 'Average order value', render: r => money(r.averageOrderValue) },
    { key: 'cr', header: 'Conversion rate', render: r => percent(r.conversionRate) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-[190px]">
          <label className="text-[11.5px] font-medium text-slate block mb-1" htmlFor="attr-by">View by</label>
          <Select id="attr-by" value={by} onChange={e => { busy(); setBy(e.target.value as AttributionBy); }}>
            {(Object.keys(BY_LABEL) as AttributionBy[]).map(k => <option key={k} value={k}>{BY_LABEL[k]}</option>)}
          </Select>
        </div>
        <div className="w-[210px]">
          <label className="text-[11.5px] font-medium text-slate block mb-1" htmlFor="attr-model">Attribution model</label>
          <Select id="attr-model" value={model} onChange={e => { busy(); setModel(e.target.value as AttributionModel); }}>
            {(Object.keys(MODEL_LABEL) as AttributionModel[]).map(k => <option key={k} value={k}>{MODEL_LABEL[k]}</option>)}
          </Select>
        </div>
        <div className="ml-auto"><RangeSelect value={range} onChange={v => { busy(); setRange(v); }} /></div>
      </div>
      <p className="text-[12.5px] text-slate">
        {MODEL_HELP[model]}{' '}
        <Link to={`/store/${storeId}/analytics`} className="font-semibold text-brand-orange hover:underline">Open Analytics</Link> for the full traffic and sales reports.
      </p>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Sales" value={money(data.totals.sales)} />
          <StatCard label="Orders" value={data.totals.orders.toLocaleString()} />
          <StatCard label="Sessions" value={data.totals.sessions.toLocaleString()} />
          <StatCard label="Conversion rate" value={percent(data.totals.conversionRate)} />
        </div>
      )}

      <div className="bg-white border border-bone rounded-xl overflow-hidden">
        <Table
          columns={columns}
          data={data?.rows ?? []}
          keyExtractor={r => r.key}
          loading={loading && !data}
          emptyState={{
            icon: <BarChart2 size={26} className="text-slate/50" />,
            title: by === 'campaign' ? 'No campaign visits yet' : 'No data for this period',
            description: by === 'campaign'
              ? 'Visits that arrive through a link with a utm_campaign tag appear here. Create a campaign to get a tagged link.'
              : 'Once shoppers visit your store and order, you will see which channels bring them.',
          }}
        />
      </div>
    </div>
  );
}
