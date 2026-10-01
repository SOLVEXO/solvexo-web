import type { ClientOverviewData } from '@/api/services/admin/adminClients';
import { MetricCard } from '@/components/comman/ui';
import { formatCurrency, formatNumber, formatPercent } from '@/components/comman/analytics/format';
import { DollarSign, ShoppingBag, Users, RefreshCw, Wallet, Layers, ShieldAlert } from 'lucide-react';

interface OverviewTabProps {
  overview: ClientOverviewData;
  onGoToTab: (tab: string) => void;
}

// ── Client-level KPI strip — everything here comes from ONE composed backend
// call (see useClientOverview / AdminClientsService.getOverview), itself
// fanning out to already-existing sellerId-scoped services. Nothing here is
// a per-store loop. ──────────────────────────────────────────────────────────
export function OverviewTab({ overview, onGoToTab }: OverviewTabProps) {
  const { analytics, finance, billing, openModerationReports } = overview;
  const primaryBalance = finance.balances[0] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Revenue (30d)" value={formatCurrency(analytics.totalRevenue)} icon={<DollarSign size={16} />} />
        <MetricCard label="Orders (30d)" value={formatNumber(analytics.totalOrders)} icon={<ShoppingBag size={16} />} />
        <MetricCard label="Stores" value={formatNumber(billing.storeCount)} icon={<Layers size={16} />} />
        <MetricCard label="Refund Rate" value={formatPercent(analytics.refundRatePercent)} icon={<RefreshCw size={16} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onGoToTab('finance')}
          className="text-left bg-white border border-bone rounded-[10px] p-5 hover:border-brand-orange/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={15} className="text-brand-orange" />
            <p className="text-[13px] font-semibold text-charcoal">Finance</p>
          </div>
          {primaryBalance ? (
            <>
              <p className="text-[22px] font-bold text-carbon">{formatCurrency(finance.totalsUSD?.availableBalance ?? 0)}</p>
              <p className="text-[11.5px] text-slate mt-1">Available balance (USD) — click to see full breakdown</p>
            </>
          ) : (
            <p className="text-[12.5px] text-slate">No balance activity yet.</p>
          )}
        </button>

        <button
          type="button"
          onClick={() => onGoToTab('billing')}
          className="text-left bg-white border border-bone rounded-[10px] p-5 hover:border-brand-orange/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers size={15} className="text-brand-orange" />
            <p className="text-[13px] font-semibold text-charcoal">Platform Billing</p>
          </div>
          <p className="text-[22px] font-bold text-carbon">{formatCurrency(billing.totalPlatformSpendUSD)}</p>
          <p className="text-[11.5px] text-slate mt-1">Lifetime spend across {billing.storeCount} store{billing.storeCount === 1 ? '' : 's'} — click for per-store plans</p>
        </button>
      </div>

      {openModerationReports > 0 && (
        <button
          type="button"
          onClick={() => onGoToTab('moderation')}
          className="text-left flex items-center gap-3 bg-error-bg border border-error/20 rounded-[10px] px-5 py-4 hover:border-error/40 transition-colors cursor-pointer"
        >
          <ShieldAlert size={18} className="text-error shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-error">{openModerationReports} open moderation report{openModerationReports === 1 ? '' : 's'}</p>
            <p className="text-[11.5px] text-error/80 mt-0.5">Against this client's account, listings, or reviews — click to review.</p>
          </div>
        </button>
      )}

      <div className="bg-white border border-bone rounded-[10px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-brand-orange" />
          <p className="text-[13px] font-semibold text-charcoal">GMV (30 days)</p>
        </div>
        <p className="text-[22px] font-bold text-carbon">{formatCurrency(analytics.totalGMV)}</p>
        <p className="text-[11.5px] text-slate mt-1">{formatNumber(analytics.totalCustomers)} platform-wide customers seen — see the Customers tab for this client's own segmentation.</p>
      </div>
    </div>
  );
}
