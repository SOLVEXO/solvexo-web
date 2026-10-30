import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight, Download, HeartPulse, Info, XCircle } from 'lucide-react';
import { Button, MetricCard, SearchInput, Table, type TableColumn } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import {
  apiExportMerchantHealth, apiGetMerchantHealth,
  type HealthBand, type MerchantHealthData, type MerchantHealthQuery, type MerchantHealthRow,
} from '@/api/services/admin/adminClients';

const PER_PAGE = 25;
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 });
const daysAgo = (iso: string | null) => {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
};

// Status colours always come with an icon and a word, never colour alone.
const BAND: Record<HealthBand, { label: string; text: string; bar: string; Icon: typeof CheckCircle2 }> = {
  healthy: { label: 'Healthy', text: 'text-success', bar: 'bg-success', Icon: CheckCircle2 },
  attention: { label: 'Needs attention', text: 'text-warning', bar: 'bg-warning', Icon: AlertTriangle },
  at_risk: { label: 'At risk', text: 'text-error', bar: 'bg-error', Icon: XCircle },
};
const PLAN_LABEL: Record<string, string> = {
  active: 'Active', trialing: 'Trial', past_due: 'Payment failed', locked: 'Locked', trial_ended: 'Trial ended', canceled: 'Canceled',
};
const FILTERS: { id: HealthBand | 'all'; label: string }[] = [
  { id: 'at_risk', label: 'At risk' }, { id: 'attention', label: 'Needs attention' }, { id: 'healthy', label: 'Healthy' }, { id: 'all', label: 'All' },
];

/** Clients → Health: every store's health score, worst first, so the team knows who to call this week. */
export function MerchantHealthTab() {
  const navigate = useNavigate();
  const [band, setBand] = useState<HealthBand | 'all'>('at_risk');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MerchantHealthData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const query: MerchantHealthQuery = { band, search: search.trim() || undefined, page, limit: PER_PAGE };
  const load = useCallback(() => {
    setLoading(true); setError('');
    apiGetMerchantHealth({ band, search: search.trim() || undefined, page, limit: PER_PAGE })
      .then(r => setData(r.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load merchant health.'))
      .finally(() => setLoading(false));
  }, [band, search, page]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try { await apiExportMerchantHealth(query); } catch (e) { setError(e instanceof Error ? e.message : 'Export failed.'); } finally { setExporting(false); }
  };

  const s = data?.summary;
  const columns: TableColumn<MerchantHealthRow>[] = [
    {
      key: 'store', header: 'Store',
      render: r => (
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-charcoal truncate">{r.storeName}</p>
          <p className="text-[11px] text-slate truncate">{r.sellerEmail ?? r.sellerName ?? '—'}</p>
        </div>
      ),
    },
    { key: 'score', header: 'Health', render: r => <ScoreCell row={r} /> },
    {
      key: 'reasons', header: 'Why',
      render: r => r.reasons.length === 0 ? <span className="text-[12px] text-slate">Nothing to fix</span> : (
        <ul className="text-[12px] text-graphite leading-snug max-w-[340px]" title={r.reasons.map(x => `${x.text} (−${x.lost})`).join('\n')}>
          {r.reasons.slice(0, 2).map(x => <li key={x.text} className="truncate">{x.text}</li>)}
          {r.reasons.length > 2 && <li className="text-slate text-[11px]">+{r.reasons.length - 2} more</li>}
        </ul>
      ),
    },
    { key: 'mrr', header: 'MRR', align: 'right', render: r => <span className="text-[12.5px] tabular-nums text-charcoal">{r.mrr > 0 ? usd(r.mrr) : '—'}</span> },
    { key: 'plan', header: 'Plan', render: r => <span className="text-[12px] text-graphite whitespace-nowrap">{r.planStatus ? PLAN_LABEL[r.planStatus] ?? r.planStatus : 'None'}</span> },
    { key: 'lastOrder', header: 'Last order', render: r => <span className="text-[12px] text-slate whitespace-nowrap">{daysAgo(r.lastOrderAt) ?? 'Never'}</span> },
    { key: 'login', header: 'Seller sign-in', render: r => <span className="text-[12px] text-slate whitespace-nowrap">{daysAgo(r.lastSellerLoginAt) ?? 'Over 90 days'}</span> },
    { key: 'open', header: '', render: () => <ChevronRight size={15} className="text-slate" /> },
  ];

  return (
    <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Average health" value={s ? (s.averageScore ?? '—') : ''} sub={s ? `${s.stores} stores scored` : undefined} loading={loading && !data} icon={<HeartPulse size={16} />} />
        <MetricCard label="At risk" value={s ? s.atRisk : ''} sub={s ? `${usd(s.mrrAtRisk)} MRR at risk` : undefined} loading={loading && !data} />
        <MetricCard label="Needs attention" value={s ? s.attention : ''} sub={s ? `${usd(s.mrrNeedsAttention)} MRR` : undefined} loading={loading && !data} />
        <MetricCard label="Healthy" value={s ? s.healthy : ''} sub="Score 70 or more" loading={loading && !data} />
      </div>

      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
          <div role="group" aria-label="Health filter" className="inline-flex rounded-lg border border-bone p-0.5 text-[12px] flex-wrap">
            {FILTERS.map(f => (
              <button key={f.id} type="button" aria-pressed={band === f.id} onClick={() => { setBand(f.id); setPage(1); }}
                className={`px-2.5 py-1 rounded-md cursor-pointer border-none ${band === f.id ? 'bg-charcoal text-white' : 'bg-transparent text-slate hover:text-charcoal'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search store, seller or email…" className="flex-1 min-w-[180px] max-w-[280px]" />
          <Button size="sm" variant="outline" onClick={exportCsv} loading={exporting} disabled={!data} className="ml-auto"><Download size={13} /> CSV</Button>
        </div>

        {error && !data ? (
          <div className="p-5"><AnalyticsErrorState message={error} onRetry={load} /></div>
        ) : (
          <Table
            columns={columns}
            data={data?.items ?? []}
            keyExtractor={r => r.storeId}
            loading={loading}
            onRowClick={r => navigate(`/admin/clients/${r.sellerId}`)}
            emptyState={{
              icon: <HeartPulse size={28} className="text-slate/50" />,
              title: band === 'at_risk' ? 'No stores at risk right now' : 'No stores match',
              description: band === 'at_risk' ? 'Nice. Check "Needs attention" for stores that are slipping.' : 'Try another filter or search.',
            }}
            pagination={{ page, total: data?.total ?? 0, perPage: PER_PAGE, onChange: setPage, label: 'stores' }}
          />
        )}
      </div>

      <p className="flex items-start gap-2 text-[11.5px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">
        <Info size={13} className="shrink-0 mt-px" />
        <span>
          Score out of 100: sales 30 (last order and 30-day revenue trend), seller sign-ins 20, plan billing 25, catalog 15
          (active products, less out of stock), refunds 10. Healthy is 70+, at risk is under 40. Fixed rules, refreshed every 5 minutes
          {data ? ` (last ${new Date(data.computedAt).toLocaleTimeString()})` : ''}. Hover a reason list to see all points lost.
        </span>
      </p>
    </div>
  );
}

function ScoreCell({ row }: { row: MerchantHealthRow }) {
  const b = BAND[row.band];
  return (
    <div className="flex items-center gap-2.5 min-w-[150px]">
      <span className="text-[15px] font-bold text-carbon tabular-nums w-7 text-right">{row.score}</span>
      <div className="flex-1 min-w-[48px]">
        <div className="h-1.5 rounded-full bg-fog overflow-hidden" aria-hidden>
          <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${row.score}%` }} />
        </div>
        <span className={`mt-1 inline-flex items-center gap-1 text-[10.5px] font-semibold ${b.text}`}><b.Icon size={11} />{b.label}</span>
      </div>
    </div>
  );
}
