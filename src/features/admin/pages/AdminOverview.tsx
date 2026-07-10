import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  apiAdminAnalyticsOverview, apiAdminAnalyticsTopCategories,
  type AdminOverviewData, type TopCategoryRow,
} from '@/api/services/analytics/adminAnalytics';
import { formatCurrency, formatNumber, formatPercent } from '@/components/comman/analytics/format';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminOverview() {
  const [overview, setOverview]   = useState<AdminOverviewData | null>(null);
  const [categories, setCategories] = useState<TopCategoryRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      apiAdminAnalyticsOverview({ range: '30d' }),
      apiAdminAnalyticsTopCategories({ range: '30d', limit: 5 }),
    ])
      .then(([overviewRes, categoriesRes]) => {
        if (cancelled) return;
        setOverview(overviewRes.data);
        setCategories(categoriesRes.data);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load platform overview.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const metrics = overview ? [
    { label: 'Total Sellers',  value: formatNumber(overview.totalSellers),   trend: null, sub: null },
    { label: 'Active Sellers', value: formatNumber(overview.activeSellers),  trend: overview.activeSellersChange ? formatPercent(overview.activeSellersChange, { signed: true }) : null, sub: null },
    { label: 'GMV (30 days)',  value: formatCurrency(overview.totalGMV),     trend: overview.totalRevenueChangePercent != null ? formatPercent(overview.totalRevenueChangePercent, { signed: true }) : null, sub: null },
    { label: 'New Users',      value: formatNumber(overview.newUsers),       trend: null, sub: `${formatNumber(overview.totalCustomers)} total customers` },
  ] : [];

  const maxCategoryRevenue = Math.max(1, ...categories.map(c => c.revenue));

  return (
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">
          Platform Overview
        </h1>
        <p className="text-[12px] text-slate">
          Last 30 days across the Solvexo platform.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-error-bg text-error text-[12.5px]">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-bone rounded-[10px] px-5 py-[18px]">
              <SkeletonBox className="h-3 w-20 mb-3" />
              <SkeletonBox className="h-7 w-16" />
            </div>
          ))
        ) : metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-[18px]"
          >
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">
              {m.label}
            </p>
            <p className="text-[28px] font-bold text-charcoal leading-[1.15]">
              {m.value}
            </p>
            {m.trend && (
              <p className="text-[12px] text-[#2D8A4E] mt-1">
                ▲ {m.trend}
              </p>
            )}
            {m.sub && (
              <p className="text-[12px] text-slate mt-1">
                {m.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Top Categories ── */}
      <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
        <p className="text-[14px] font-bold text-charcoal mb-4">
          Top Categories by Revenue (30 days)
        </p>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-6 w-full" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-[12.5px] text-slate py-2">No category revenue recorded in this period yet.</p>
        ) : (
          <div className="flex flex-col gap-[14px]">
            {categories.map((cat) => (
              <div key={cat.categoryId}>
                <div className="flex justify-between items-center mb-[5px]">
                  <span className="text-[12px] text-graphite">{cat.name}</span>
                  <span className="text-[12px] font-semibold text-charcoal">{formatCurrency(cat.revenue)}</span>
                </div>
                <div className="h-2 rounded-[4px] bg-bone">
                  <div
                    className="h-full rounded-[4px] bg-brand-orange"
                    style={{ width: `${Math.round((cat.revenue / maxCategoryRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
