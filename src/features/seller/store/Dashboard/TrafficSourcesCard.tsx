import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { apiSellerAnalyticsTrafficSources, type SellerTrafficSourcesData } from '@/api/services/analytics/analytics';
import type { AnalyticsRangePreset } from '@/components/comman/analytics/analyticsFilters';
import { SkeletonBox } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatNumber } from '@/components/comman/analytics/format';

const LABEL: Record<string, string> = { direct: 'Direct', search: 'Search', social: 'Social', email: 'Email', paid: 'Paid ads', referral: 'Referral', unknown: 'Unknown' };

/** Where this store's orders came from (first-party session data). Summary only; the full report is in Analytics. */
export function TrafficSourcesCard({ storeId, range }: { storeId: string; range: AnalyticsRangePreset }) {
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const key = `${storeId}:${range}:${reloadKey}`;
  // The result remembers which request it answers, so a range change shows the skeleton again without setting state in the effect.
  const [result, setResult] = useState<{ key: string; data?: SellerTrafficSourcesData; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiSellerAnalyticsTrafficSources({ storeId, range })
      .then(res => { if (!cancelled) setResult({ key, data: res.data }); })
      .catch(err => { if (!cancelled) setResult({ key, error: err instanceof Error ? err.message : 'Could not load traffic sources.' }); });
    return () => { cancelled = true; };
  }, [storeId, range, key]);
  const current = result?.key === key ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? '';

  return (
    <div className="dash-section-enter surface-panel rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#f3f2ec] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#eef2ff] text-[#4F46E5] flex items-center justify-center shrink-0"><Megaphone size={13} /></div>
        <p className="flex-1 text-[13px] font-bold text-charcoal">Traffic sources</p>
        <button type="button" onClick={() => navigate(`/store/${storeId}/analytics`)} className="text-[11.5px] font-semibold text-slate hover:text-brand-orange bg-transparent border-none cursor-pointer">Analytics →</button>
      </div>
      <div className="px-4 py-3 flex-1">
        {error ? <AnalyticsErrorState message={error} onRetry={() => setReloadKey(k => k + 1)} />
          : !data ? <div className="flex flex-col gap-3">{[0, 1, 2, 3].map(i => <SkeletonBox key={i} className="h-5 w-full" />)}</div>
          : data.breakdown.length === 0 ? <p className="text-[12.5px] text-slate py-6 text-center">No orders with a known source in this period yet.</p>
          : (
            <ul className="flex flex-col gap-3 list-none p-0 m-0">
              {data.breakdown.slice(0, 6).map(row => (
                <li key={row.source}>
                  <div className="flex justify-between text-[12px] mb-1"><span className="text-graphite">{LABEL[row.source] ?? row.source}</span><span className="font-semibold text-charcoal">{formatNumber(row.count)} · {row.percent.toFixed(0)}%</span></div>
                  <div className="h-1.5 rounded-full bg-cream overflow-hidden"><div className="h-full rounded-full bg-brand-orange" style={{ width: `${Math.min(100, row.percent)}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
