import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { apiGetCodStats, type CodStats } from '@/api/services/codProtection';
import { errorMessage } from '@/api/errorMessage';
import { SkeletonBox } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { currencySymbol } from '@/utils/currency';

const DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '6m': 182, '12m': 365 };
const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);

/** Dashboard card: how well COD confirmation and delivery are going, and what protection saved. Real numbers or an honest dash, never a guess. */
export function CodProtectionCard({ storeId, range }: { storeId: string; range: string }) {
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const key = `${storeId}:${range}:${reloadKey}`;
  const [result, setResult] = useState<{ key: string; data?: CodStats; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetCodStats(storeId, DAYS[range] ?? 30)
      .then(data => { if (!cancelled) setResult({ key, data }); })
      .catch(e => { if (!cancelled) setResult({ key, error: errorMessage(e, 'Could not load COD protection.') }); });
    return () => { cancelled = true; };
  }, [storeId, range, key]);
  const current = result?.key === key ? result : null;
  const data = current?.data ?? null;

  return (
    <div className="dash-section-enter surface-panel flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[#f3f2ec] px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5] text-[#059669]"><ShieldCheck size={13} /></div>
        <p className="flex-1 text-[13px] font-bold text-charcoal">COD protection</p>
        <button type="button" onClick={() => navigate(`/store/${storeId}/cod-protection`)} className="text-[13px] font-medium text-brand-orange sm:text-[11.5px]">Settings</button>
      </div>
      <div className="flex-1 px-4 py-3">
        {current?.error ? <AnalyticsErrorState message={current.error} onRetry={() => setReloadKey(k => k + 1)} />
          : !data ? <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <SkeletonBox key={i} className="h-5 w-full" />)}</div>
          : data.codOrders === 0 ? <p className="py-6 text-center text-[12.5px] text-slate">No cash-on-delivery orders in this period yet.</p>
          : (
            <dl className="m-0 flex flex-col gap-3 text-[12.5px]">
              <div className="flex justify-between"><dt className="text-graphite">Confirmed by customers</dt><dd className="m-0 font-semibold text-charcoal">{pct(data.confirmationRate)}<span className="ml-1 font-normal text-slate">({data.confirmed} of {data.confirmed + data.cancelled + data.expired})</span></dd></div>
              <div className="flex justify-between"><dt className="text-graphite">Parcels returned (RTO)</dt><dd className="m-0 font-semibold text-charcoal">{pct(data.rtoRate)}<span className="ml-1 font-normal text-slate">({data.rtoOrders} of {data.bookedOrders})</span></dd></div>
              <div className="flex justify-between"><dt className="text-graphite">Saved (never shipped)</dt><dd className="m-0 font-semibold text-charcoal">{currencySymbol(data.currency)} {data.savedAmount.toLocaleString()}</dd></div>
              {data.awaiting > 0 && <p role="status" className="m-0 text-xs text-slate">{data.awaiting} order(s) are waiting for the customer to confirm.</p>}
            </dl>
          )}
      </div>
    </div>
  );
}
