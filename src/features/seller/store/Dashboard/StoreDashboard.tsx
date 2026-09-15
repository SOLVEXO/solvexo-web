import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, ShoppingBag, Package, Users,
  CheckCircle, Clock, Globe, Copy, ExternalLink,
  ArrowRight, Settings, Sparkles, BarChart2,
  ClipboardList, Megaphone, AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader, TrialBillingPill } from '@/components/layouts/StoreLayout';
import { AreaChart, DonutChart } from '@/components/comman/charts';
import { MetricCard, SkeletonBox, Button, FilterDropdown } from '@/components/comman/ui';
import {
  apiSellerAnalyticsOverview, apiSellerAnalyticsRevenueOverTime, apiSellerAnalyticsToday,
  type SellerOverviewData, type RevenuePoint, type SellerTodaySummaryData,
} from '@/api/services/analytics/analytics';
import type { AnalyticsRangePreset } from '@/components/comman/analytics/analyticsFilters';
import { apiGetStoreInventory, apiGetLowStockSummary, apiGetSellerOrders } from '@/api/services/product';
import { apiGetSellerReturns } from '@/api/services/orders';
import { apiGetOpenDisputeCount, apiGetHighRiskOrderCount, apiGetAwaitingCaptureCount } from '@/api/services/payment';
import { apiUpdateStore } from '@/api/services/store';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import { DASHBOARD_METRIC_CATALOG, DEFAULT_DASHBOARD_METRICS } from './dashboardMetrics.const';
import { Sliders, Check as CheckIcon, ChevronUp, ChevronDown as ChevronDownIcon, X as XIcon } from 'lucide-react';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import { formatNumber, formatBucketLabel } from '@/components/comman/analytics/format';
import { formatMoneyCompact, currencySymbol } from '@/utils/currency';
import { SetupGuideCard } from './SetupGuideCard';
import { useTestimonialPrompt } from '@/hooks/seller/useTestimonialPrompt';
import { TestimonialPromptCard } from '@/features/seller/components/TestimonialPromptCard';

interface StoreMetrics {
  overview:      SellerOverviewData;
  revenueSeries: RevenuePoint[];
  totalProducts: number;
  today:         SellerTodaySummaryData;
  lowStockCount: number;
  pendingOrdersCount: number;
  openReturnsCount: number;
  openDisputeCount: number;
  highRiskOrderCount: number;
  awaitingCaptureCount: number;
  inventoryBreakdown: { inStock: number; lowStock: number; outOfStock: number };
  entitlements: EntitlementsSummary | null;
}

function useStoreDashboardMetrics(storeId: string) {
  const [metrics, setMetrics] = useState<StoreMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      apiSellerAnalyticsOverview({ storeId, range: '30d' }),
      apiSellerAnalyticsRevenueOverTime({ storeId, range: '6m', granularity: 'month' }),
      apiGetStoreInventory(storeId, 1, 1),
      apiSellerAnalyticsToday(storeId),
      apiGetLowStockSummary(storeId),
      apiGetSellerOrders(storeId, 1, 1),
      apiGetSellerReturns({ storeId }),
      apiGetOpenDisputeCount(storeId),
      apiGetHighRiskOrderCount(storeId),
      apiGetAwaitingCaptureCount(storeId),
      // Real plan-usage progress bars — same entitlements data Billing
      // Center already shows, surfaced here too so "what's my overall
      // status" doesn't require leaving the dashboard.
      apiGetStoreEntitlements(storeId).catch(() => null),
    ])
      .then(([overviewRes, revenueRes, inventoryRes, todayRes, lowStockRes, ordersRes, returnsRes, disputesRes, riskRes, captureRes, entitlementsRes]) => {
        if (cancelled) return;
        setMetrics({
          overview: overviewRes.data,
          revenueSeries: revenueRes.data.series,
          totalProducts: inventoryRes.data.stats.totalProducts,
          today: todayRes.data,
          lowStockCount: lowStockRes.data.count,
          pendingOrdersCount: ordersRes.data.stats.pending,
          openReturnsCount: returnsRes.data.stats.openRequests,
          openDisputeCount: disputesRes.data.count,
          highRiskOrderCount: riskRes.data.count,
          awaitingCaptureCount: captureRes.data.count,
          inventoryBreakdown: {
            inStock: inventoryRes.data.stats.inStock,
            lowStock: inventoryRes.data.stats.lowStock,
            outOfStock: inventoryRes.data.stats.outOfStock,
          },
          entitlements: (entitlementsRes as any)?.data ?? null,
        });
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load store metrics.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, reloadKey]);

  return { metrics, loading, error, refetch };
}

// ── Badge style maps ───────────────────────────────────────────────────────────
const planStyles: Record<string, { bg: string; color: string }> = {
  starter:      { bg: '#EAF0FB', color: '#2156A8' },
  professional: { bg: '#EAF7EF', color: '#1E7A3C' },
  enterprise:   { bg: '#F5F0FF', color: '#7C3AED' },
};
const typeStyles: Record<string, { bg: string; color: string }> = {
  creator: { bg: '#FFF4E5', color: '#B36200' },
  seller:  { bg: '#EAF0FB', color: '#2156A8' },
  brand:   { bg: '#F5F0FF', color: '#7C3AED' },
};

// ── Store Info Card ───────────────────────────────────────────────────────────
function StoreInfoCard() {
  const navigate = useNavigate();
  const { store, storeId } = useStoreWorkspace();
  const [copied, setCopied] = useState(false);

  const statusColor = store?.status === 'active' ? '#22C55E' : '#8C8A82';
  const StatusIcon  = store?.status === 'active' ? CheckCircle : Clock;
  const planStyle   = planStyles[store?.plan ?? ''] ?? { bg: '#F0EEE6', color: '#5A5852' };
  const typeStyle   = typeStyles[store?.sellerType ?? ''] ?? { bg: '#F0EEE6', color: '#5A5852' };

  const handleCopy = () => {
    if (store?.slug) {
      navigator.clipboard.writeText(`/${store.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-bone hover:border-slate/30 transition-colors duration-200 flex flex-col h-full">

      {/* Logo + name + badges */}
      <div className="px-5 pt-5 pb-4 border-b border-[#f3f2ec]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-[10px] bg-brand-pale-orange border border-[#eae8de] flex items-center justify-center overflow-hidden shrink-0">
            {store?.logo
              ? <img loading="lazy" decoding="async" src={store.logo} alt={store?.name} className="w-full h-full object-cover" />
              : <Globe size={18} className="text-brand-orange" />}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">
              {store?.name ?? '—'}
            </p>
            <p className="text-[11px] text-slate mt-[2px]">Store Workspace</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-[6px]">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-[3px] rounded-full"
            style={{ background: statusColor + '18', color: statusColor }}
          >
            <StatusIcon size={9} />
            {store?.status ?? '—'}
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-[3px] rounded-full"
            style={planStyle}
          >
            {store?.plan ?? '—'} plan
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-[3px] rounded-full capitalize"
            style={typeStyle}
          >
            {store?.sellerType ?? '—'}
          </span>
        </div>
      </div>

      {/* URL + Product Types */}
      <div className="px-5 py-4 border-b border-[#f3f2ec] flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.06em] mb-1.5">Store URL</p>
          <div className="flex items-center gap-2 bg-[#f7f6f1] rounded-lg px-[10px] py-[8px] border border-[#edebd8]">
            <span className="flex-1 text-[12px] font-medium text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">
              /{store?.slug ?? '…'}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 border-0 bg-transparent p-0 cursor-pointer transition-transform active:scale-90"
              title="Copy URL"
            >
              <Copy size={12} className={copied ? 'text-[#22c55e]' : 'text-slate'} />
            </button>
          </div>
          {copied && <p className="text-[10px] text-[#22c55e] mt-1 font-medium">Copied!</p>}
        </div>

        {(store?.productTypes?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.06em] mb-1.5">
              Product Types
            </p>
            <div className="flex flex-wrap gap-1">
              {store!.productTypes!.map(pt => (
                <span
                  key={pt}
                  className="text-[10px] font-medium text-charcoal bg-bone border border-bone px-[8px] py-[3px] rounded-[5px] capitalize"
                >
                  {pt.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action links */}
      <div className="px-3 py-3 mt-auto flex flex-col gap-0.5">
        <button
          onClick={() => navigate(`/store/${storeId}/settings`)}
          className="flex items-center gap-2.5 px-[10px] py-[9px] rounded-lg text-[12px] font-medium text-charcoal bg-transparent border-0 cursor-pointer text-left transition-colors duration-150 hover:bg-[#f7f6f1] w-full"
        >
          <Settings size={13} className="text-slate shrink-0" />
          Store Settings
          <ArrowRight size={11} className="text-dark-text ml-auto" />
        </button>
        {store?.slug && (
          <a
            href={getStorefrontUrl(store.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-[10px] py-[9px] rounded-lg text-[12px] font-medium text-charcoal no-underline transition-colors duration-150 hover:bg-[#f7f6f1]"
          >
            <ExternalLink size={13} className="text-slate shrink-0" />
            View Live Store
            <ExternalLink size={10} className="text-dark-text ml-auto" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Quick Actions Row ─────────────────────────────────────────────────────────
interface QuickAction { Icon: LucideIcon; label: string; path: string; gradient: string; iconColor: string }

function QuickActionsRow({ storeId }: { storeId: string }) {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    { Icon: ShoppingBag,   label: 'Add Product', path: 'products/add', gradient: 'from-brand-pale-orange to-brand-pale-orange', iconColor: '#D97757' },
    { Icon: Package,       label: 'View Orders', path: 'orders',        gradient: 'from-[#f3e8ff] to-[#ede0fe]',         iconColor: '#8B5CF6' },
    { Icon: BarChart2,     label: 'Analytics',   path: 'analytics',     gradient: 'from-info-bg to-[#dcebfa]',         iconColor: '#0EA5E9' },
    { Icon: ClipboardList, label: 'Inventory',   path: 'inventory',     gradient: 'from-[#eaf7ef] to-[#dff3e7]',         iconColor: '#22C55E' },
    { Icon: Megaphone,     label: 'Marketing',   path: 'marketing',     gradient: 'from-[#fff4e5] to-[#feebcf]',         iconColor: '#F59E0B' },
    { Icon: Sparkles,      label: 'AI Studio',   path: 'ai/studio',     gradient: 'from-cream to-bone',                  iconColor: '#A855F7' },
  ];

  return (
    <div className="bg-white border border-bone rounded-2xl hover:border-slate/30 transition-colors duration-200">
      <div className="px-5 pt-4 pb-3 border-b border-[#f3f2ec]">
        <p className="text-sm font-bold text-charcoal">Quick Actions</p>
      </div>
      <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map(({ Icon, label, path, gradient, iconColor }) => (
          <button
            key={label}
            onClick={() => navigate(`/store/${storeId}/${path}`)}
            className={`group flex flex-col items-center gap-2 py-4 px-2 rounded-[14px] border border-bone bg-gradient-to-br ${gradient} cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:border-brand-orange/25 w-full`}
          >
            <div
              className="w-9 h-9 rounded-[10px] bg-white/70 border border-white/60 flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{ color: iconColor }}
            >
              <Icon size={16} />
            </div>
            <span className="text-[11px] font-semibold text-charcoal text-center leading-[1.3]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Needs Attention ───────────────────────────────────────────────────────────
// Real, actionable signals already computed by existing endpoints (low-stock
// threshold from Phase 5, order stats, return stats) — surfaced as one glance
// list instead of a seller having to separately check Inventory/Orders/
// Returns to notice something needs action. Renders nothing extra when
// everything's caught up, rather than an empty placeholder card.
interface AttentionItem { label: string; count: number; path: string; Icon: LucideIcon; color: string }

function NeedsAttentionCard({ storeId, lowStockCount, pendingOrdersCount, openReturnsCount, openDisputeCount, highRiskOrderCount, awaitingCaptureCount }: {
  storeId: string; lowStockCount: number; pendingOrdersCount: number; openReturnsCount: number; openDisputeCount: number; highRiskOrderCount: number; awaitingCaptureCount: number;
}) {
  const navigate = useNavigate();
  const items: AttentionItem[] = [
    // Mirrors Shopify's real manual-capture "Capture a payment" order task —
    // only ever non-zero for a Store.paymentCaptureMethod === 'manual' store
    // with a genuinely authorized-but-uncaptured order (PaymentService.getAwaitingCaptureCount).
    { label: 'Order(s) awaiting payment capture', count: awaitingCaptureCount, path: 'orders', Icon: AlertTriangle, color: '#B45309' },
    { label: 'Order(s) awaiting fulfillment', count: pendingOrdersCount, path: 'orders', Icon: Package, color: '#8B5CF6' },
    // Mirrors Shopify Home's "Review high-risk orders" order task — real
    // Stripe Radar fraud-risk signal (PaymentService.getHighRiskOrderCount),
    // not an invented score.
    { label: 'Order(s) flagged as high-risk — review before shipping', count: highRiskOrderCount, path: 'orders', Icon: AlertTriangle, color: '#B91C1C' },
    // Mirrors Shopify Home's "Submit evidence for chargebacks" order task —
    // real Stripe dispute-status tracking (PaymentService.getOpenDisputeCount),
    // shown only while genuinely awaiting the seller's response (not merely
    // "under review", where there's nothing left to do).
    { label: 'Order(s) with an open payment dispute', count: openDisputeCount, path: 'orders', Icon: AlertTriangle, color: '#DC2626' },
    { label: 'Product(s) low on stock', count: lowStockCount, path: 'inventory', Icon: ClipboardList, color: '#F59E0B' },
    { label: 'Return request(s) awaiting review', count: openReturnsCount, path: 'returns', Icon: AlertTriangle, color: '#EF4444' },
  ].filter(i => i.count > 0);

  if (items.length === 0) {
    return (
      <div className="dash-section-enter bg-white border border-bone rounded-2xl px-5 py-4 flex items-center gap-2.5">
        <CheckCircle size={16} className="text-success shrink-0" />
        <p className="text-[13px] font-medium text-charcoal">All caught up — nothing needs your attention right now.</p>
      </div>
    );
  }

  return (
    <div className="dash-section-enter bg-white border border-bone rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-[#f3f2ec] flex items-center gap-2">
        <AlertTriangle size={14} className="text-brand-orange" />
        <p className="text-sm font-bold text-charcoal">Needs Attention</p>
      </div>
      <div className="flex flex-col divide-y divide-[#f3f2ec]">
        {items.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(`/store/${storeId}/${item.path}`)}
            className="flex items-center gap-3 px-5 py-3 bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 hover:bg-[#f7f6f1]"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.color + '18', color: item.color }}>
              <item.Icon size={14} />
            </div>
            <span className="flex-1 text-[13px] font-medium text-charcoal">{item.count} {item.label}</span>
            <ArrowRight size={14} className="text-slate shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Insights ──────────────────────────────────────────────────────────────────
// Mirrors Shopify Home's "Insights" section (their own docs describe it as
// "data-driven observations about your store's performance", capped at a
// handful shown at once) — deliberately NOT an AI/LLM-generated feature
// (Solvexo has no dashboard-recommendation engine, and faking one with a
// canned "Sidekick"-style assistant would be exactly the kind of decorative,
// non-functional UI this project's standards explicitly reject). Every
// insight here is a plain rule evaluated against real period-over-period
// percentages the backend already computes for `SellerOverviewData`
// (`totalRevenueChangePercent`, `avgOrderValueChangePercent`,
// `refundRatePercent`, `repeatBuyerTrend`) — nothing new was fetched to
// build this, and nothing here can ever show a number the seller couldn't
// already find on the Analytics page themselves.
interface Insight { text: string; tone: 'positive' | 'negative' | 'neutral'; magnitude: number }

function buildInsights(overview: SellerOverviewData): Insight[] {
  const insights: Insight[] = [];

  if (overview.totalRevenueChangePercent !== null && Math.abs(overview.totalRevenueChangePercent) >= 5) {
    const up = overview.totalRevenueChangePercent >= 0;
    insights.push({
      tone: up ? 'positive' : 'negative',
      magnitude: Math.abs(overview.totalRevenueChangePercent),
      text: `Revenue is ${up ? 'up' : 'down'} ${Math.abs(overview.totalRevenueChangePercent).toFixed(0)}% vs. the previous period.`,
    });
  }

  if (overview.avgOrderValueChangePercent !== null && Math.abs(overview.avgOrderValueChangePercent) >= 8) {
    const up = overview.avgOrderValueChangePercent >= 0;
    insights.push({
      tone: up ? 'positive' : 'neutral',
      magnitude: Math.abs(overview.avgOrderValueChangePercent),
      text: `Average order value ${up ? 'increased' : 'decreased'} ${Math.abs(overview.avgOrderValueChangePercent).toFixed(0)}% vs. the previous period.`,
    });
  }

  if (overview.totalOrders > 0 && overview.refundRatePercent >= 8) {
    insights.push({
      tone: 'negative',
      magnitude: overview.refundRatePercent,
      text: `Your refund rate is ${overview.refundRatePercent.toFixed(0)}% this period — worth a look at what's driving returns.`,
    });
  }

  if (overview.repeatBuyerTrend === 'improving' || overview.repeatBuyerTrend === 'declining') {
    const up = overview.repeatBuyerTrend === 'improving';
    insights.push({
      tone: up ? 'positive' : 'neutral',
      magnitude: overview.repeatBuyerPercent,
      text: `Repeat buyers ${up ? 'grew' : 'shrank'} — they now make up ${overview.repeatBuyerPercent.toFixed(0)}% of your orders.`,
    });
  }

  if (overview.totalOrders > 0 && overview.newCustomersCount > overview.returningCustomersCount * 2) {
    insights.push({
      tone: 'neutral',
      magnitude: 5,
      text: `Most of your customers this period are new (${formatNumber(overview.newCustomersCount)} new vs. ${formatNumber(overview.returningCustomersCount)} returning).`,
    });
  }

  // Shopify caps this at a handful shown at once so it reads as "worth your
  // attention," not a wall of stats — same reasoning here, biggest-magnitude first.
  return insights.sort((a, b) => b.magnitude - a.magnitude).slice(0, 3);
}

function InsightsStrip({ overview }: { overview: SellerOverviewData }) {
  const insights = buildInsights(overview);
  if (insights.length === 0) return null;

  const toneStyle: Record<Insight['tone'], { bg: string; color: string; Icon: LucideIcon }> = {
    positive: { bg: '#eaf7ef', color: '#1E7A3C', Icon: TrendingUp },
    negative: { bg: '#fdecec', color: '#C0362C', Icon: TrendingDown },
    neutral:  { bg: '#eef2fb', color: '#2156A8', Icon: Users },
  };

  return (
    <div className="dash-section-enter bg-white border border-bone rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-[#f3f2ec]">
        <p className="text-sm font-bold text-charcoal">Insights</p>
        <p className="text-[11px] text-slate mt-[2px]">A few things worth noticing about the last 30 days</p>
      </div>
      <div className="flex flex-col divide-y divide-[#f3f2ec]">
        {insights.map((insight, i) => {
          const { bg, color, Icon } = toneStyle[insight.tone];
          return (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg, color }}>
                <Icon size={14} />
              </div>
              <span className="text-[13px] text-charcoal">{insight.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Metric Cards — customizable, mirrors Shopify's real Home metrics
// customization (add/remove/reorder cards from a fixed library — confirmed
// against Shopify's own Help Center). `store.dashboardMetrics` (null for
// every pre-existing store) picks which of DASHBOARD_METRIC_CATALOG's ids
// render, and in what order — falls back to the same 4 cards every store
// has always shown. ──────────────────────────────────────────────────────
function renderMetricCard(
  id: string, metrics: StoreMetrics | null, currency: string | null | undefined,
  totalCustomers: number, revenueSparkline: number[],
) {
  const revenueChangePct = metrics?.overview.totalRevenueChangePercent ?? null;
  const aovChangePct = metrics?.overview.avgOrderValueChangePercent ?? null;
  const ordersChange = metrics?.overview.totalOrdersChange;

  switch (id) {
    case 'revenue_30d':
      return (
        <MetricCard key={id}
          label="Revenue (30 days)" value={formatMoneyCompact(metrics?.overview.totalRevenue ?? 0, currency)}
          trend={revenueChangePct !== null ? `${Math.abs(revenueChangePct).toFixed(0)}% vs prev.` : undefined}
          trendUp={revenueChangePct !== null ? revenueChangePct >= 0 : undefined}
          sub={metrics?.overview.totalRevenue ? undefined : 'No sales yet'} icon={<TrendingUp size={16} />} color="#D97757"
          sparkline={revenueSparkline}
        />
      );
    case 'orders_30d':
      return (
        <MetricCard key={id}
          label="Orders (30 days)" value={formatNumber(metrics?.overview.totalOrders ?? 0)}
          trend={ordersChange !== undefined ? `${ordersChange >= 0 ? '+' : ''}${ordersChange} vs prev.` : undefined}
          trendUp={ordersChange !== undefined ? ordersChange >= 0 : undefined}
          sub={metrics?.overview.totalOrders ? `${formatNumber(metrics.overview.cancelledOrders)} cancelled` : 'No orders yet'} icon={<Package size={16} />} color="#8B5CF6"
        />
      );
    case 'active_products':
      return (
        <MetricCard key={id}
          label="Active Products" value={formatNumber(metrics?.totalProducts ?? 0)}
          sub={metrics?.totalProducts ? 'In your catalog' : 'Add your first product'} icon={<ShoppingBag size={16} />} color="#0EA5E9"
        />
      );
    case 'customers_30d':
      return (
        <MetricCard key={id}
          label="Customers (30 days)" value={formatNumber(totalCustomers)}
          // New-vs-returning breakdown lives in the "Customers" donut chart
          // further down the page now — kept out of this sub-label too, so
          // the same number isn't shown twice on one page.
          sub={totalCustomers ? 'Unique buyers' : 'No customers yet'} icon={<Users size={16} />} color="#22C55E"
        />
      );
    case 'avg_order_value_30d':
      return (
        <MetricCard key={id}
          label="Avg. Order Value (30 days)" value={formatMoneyCompact(metrics?.overview.avgOrderValue ?? 0, currency)}
          trend={aovChangePct !== null ? `${Math.abs(aovChangePct).toFixed(0)}% vs prev.` : undefined}
          trendUp={aovChangePct !== null ? aovChangePct >= 0 : undefined}
          sub="Per order" icon={<TrendingUp size={16} />} color="#F59E0B"
        />
      );
    case 'refund_rate_30d':
      return (
        <MetricCard key={id}
          label="Refund Rate (30 days)" value={`${(metrics?.overview.refundRatePercent ?? 0).toFixed(1)}%`}
          sub={`${formatNumber(metrics?.overview.totalRefunds ?? 0)} refund(s)`} icon={<TrendingDown size={16} />} color="#EF4444"
        />
      );
    case 'repeat_buyer_rate_30d':
      return (
        <MetricCard key={id}
          label="Repeat Buyer Rate (30 days)" value={`${(metrics?.overview.repeatBuyerPercent ?? 0).toFixed(0)}%`}
          sub="Of your orders" icon={<Users size={16} />} color="#7C3AED"
        />
      );
    case 'today_revenue':
      return (
        <MetricCard key={id}
          label="Today's Revenue" value={formatMoneyCompact(metrics?.today.revenue ?? 0, currency)}
          sub="So far today" icon={<TrendingUp size={16} />} color="#22C55E"
        />
      );
    case 'today_orders':
      return (
        <MetricCard key={id}
          label="Today's Orders" value={formatNumber(metrics?.today.ordersCount ?? 0)}
          sub="So far today" icon={<Package size={16} />} color="#0EA5E9"
        />
      );
    case 'today_avg_order_value':
      return (
        <MetricCard key={id}
          label="Today's Avg. Order Value" value={formatMoneyCompact(metrics?.today.avgOrderValue ?? 0, currency)}
          sub="So far today" icon={<TrendingUp size={16} />} color="#D97757"
        />
      );
    default:
      return null; // an id the current build no longer recognizes — never crash the dashboard over it
  }
}

function MetricsCustomizeModal({ storeId, current, onClose, onSaved }: {
  storeId: string; current: string[]; onClose: () => void; onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const move = (id: string, dir: -1 | 1) => {
    setSelected(prev => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.length === 0) { setError('Choose at least one metric.'); return; }
    setSaving(true); setError('');
    try {
      await apiUpdateStore({ storeId, dashboardMetrics: selected });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[440px] max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bone flex items-center justify-between">
          <p className="text-sm font-bold text-charcoal">Customize Metrics</p>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-slate hover:text-charcoal">
            <XIcon size={16} />
          </button>
        </div>
        <p className="px-5 pt-3 text-[11.5px] text-slate">Choose which cards show on your dashboard, and drag their order with the arrows.</p>
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1.5">
          {/* Selected, in order, first — so the reorder arrows have obvious meaning */}
          {selected.filter(id => DASHBOARD_METRIC_CATALOG.some(m => m.id === id)).map((id, i, arr) => {
            const def = DASHBOARD_METRIC_CATALOG.find(m => m.id === id)!;
            return (
              <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-orange/30 bg-brand-pale-orange">
                <button onClick={() => toggle(id)} className="w-6 h-6 rounded-md bg-brand-orange text-white flex items-center justify-center shrink-0 border-none cursor-pointer">
                  <CheckIcon size={13} />
                </button>
                <span className="flex-1 text-[12.5px] font-medium text-charcoal">{def.label}</span>
                <button onClick={() => move(id, -1)} disabled={i === 0} className="text-slate hover:text-charcoal disabled:opacity-30 bg-transparent border-none cursor-pointer p-0.5">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => move(id, 1)} disabled={i === arr.length - 1} className="text-slate hover:text-charcoal disabled:opacity-30 bg-transparent border-none cursor-pointer p-0.5">
                  <ChevronDownIcon size={14} />
                </button>
              </div>
            );
          })}
          {/* Not-yet-selected options */}
          {DASHBOARD_METRIC_CATALOG.filter(m => !selected.includes(m.id)).map(def => (
            <button
              key={def.id}
              onClick={() => toggle(def.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-bone bg-white cursor-pointer text-left"
            >
              <span className="w-6 h-6 rounded-md border border-bone flex items-center justify-center shrink-0" />
              <span className="flex-1 text-[12.5px] text-charcoal">{def.label}</span>
            </button>
          ))}
        </div>
        {error && <p className="px-5 text-[11.5px] text-error">{error}</p>}
        <div className="px-5 py-4 border-t border-bone flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
        </div>
      </div>
    </div>
  );
}

// ── Plan Usage — real progress bars (Shopify/Stripe-style "how much of your
// plan have you used"), same EntitlementsSummary data Billing Center already
// shows in full, surfaced here too so a genuine "what's my overall status"
// glance doesn't require leaving the dashboard. ─────────────────────────────
function UsageProgressBar({ label, used, max }: { label: string; used: number; max: number }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / Math.max(1, max)) * 100);
  const near = !unlimited && pct >= 85;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11.5px] text-graphite">{label}</span>
        <span className="text-[11.5px] font-semibold text-carbon">{formatNumber(used)}{unlimited ? '' : ` / ${formatNumber(max)}`}</span>
      </div>
      <div className="h-[6px] bg-cream rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: unlimited ? '100%' : `${pct}%`, background: unlimited ? '#22C55E' : (near ? '#C0392B' : '#D97757') }}
        />
      </div>
    </div>
  );
}

function PlanUsageCard({ entitlements, storeId }: { entitlements: EntitlementsSummary | null; storeId: string }) {
  const navigate = useNavigate();
  return (
    <div className="dash-section-enter bg-white border border-bone rounded-[10px] px-5 py-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-charcoal">Plan Usage</p>
        <button
          onClick={() => navigate(`/store/${storeId}/plan-billing`)}
          className="text-[11px] font-semibold text-brand-orange hover:underline bg-transparent border-none cursor-pointer"
        >
          {entitlements?.currentPlanName ?? 'View plan'}
        </button>
      </div>
      {!entitlements ? (
        <p className="text-[12px] text-slate">Unable to load plan usage.</p>
      ) : (
        <div className="flex flex-col gap-3.5 flex-1 justify-center">
          <UsageProgressBar label="Products" used={entitlements.maxProducts.used} max={entitlements.maxProducts.limit} />
          <UsageProgressBar label="AI Credits" used={Math.max(0, entitlements.aiCredits.monthlyAllowance - entitlements.aiCredits.balance)} max={entitlements.aiCredits.monthlyAllowance} />
          <UsageProgressBar label="Staff Accounts" used={entitlements.maxStaffAccounts.used} max={entitlements.maxStaffAccounts.limit} />
          <UsageProgressBar label="POS Locations" used={entitlements.maxPosLocations.used} max={entitlements.maxPosLocations.limit} />
        </div>
      )}
    </div>
  );
}

// ── Today Snapshot ────────────────────────────────────────────────────────────
function TodaySnapshot({ today, currency }: { today: SellerTodaySummaryData; currency?: string | null }) {
  const up = today.revenueChangePercent >= 0;
  const TrendIcon = up ? TrendingUp : TrendingDown;

  return (
    <div className="dash-section-enter bg-white border border-bone rounded-2xl hover:border-slate/30 transition-colors duration-200 px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
      <p className="text-[13px] font-bold text-charcoal shrink-0 flex items-center gap-[6px]">
        <span className="size-[6px] rounded-full bg-success pos-live-pulse" />
        Today
      </p>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate">Revenue</span>
        <span className="text-[14px] font-bold text-carbon">{formatMoneyCompact(today.revenue, currency)}</span>
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-[6px] py-[1px] rounded-full ${up ? 'text-success bg-success-bg' : 'text-error bg-error-bg'}`}>
          <TrendIcon size={11} />
          {Math.abs(today.revenueChangePercent).toFixed(0)}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate">Orders</span>
        <span className="text-[14px] font-bold text-carbon">{formatNumber(today.ordersCount)}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate">Avg. Order Value</span>
        <span className="text-[14px] font-bold text-carbon">{formatMoneyCompact(today.avgOrderValue, currency)}</span>
      </div>

      <span className="text-[10px] text-slate/70 ml-auto shrink-0">vs. this time yesterday</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashSkeleton() {
  return (
    <div className="px-7 py-6 flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-bone p-5">
            <SkeletonBox width={36} height={36} rounded="8px" className="mb-[14px]" />
            <SkeletonBox width={80} height={10} rounded="4px" className="mb-2" />
            <SkeletonBox width={96} height={24} rounded="4px" className="mb-1.5" />
            <SkeletonBox width={128} height={10} rounded="4px" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="bg-white rounded-2xl border border-bone p-5 h-[320px]">
          <SkeletonBox width={144} height={14} rounded="4px" className="mb-2" />
          <SkeletonBox width={96} height={10} rounded="4px" className="mb-5" />
          <SkeletonBox width="100%" height={200} rounded="8px" />
        </div>
        <div className="bg-white rounded-2xl border border-bone h-[320px]">
          <div className="px-5 pt-5 pb-4 border-b border-[#f3f2ec] flex items-center gap-3">
            <SkeletonBox width={40} height={40} rounded="10px" className="shrink-0" />
            <div className="flex-1">
              <SkeletonBox width={96} height={14} rounded="4px" className="mb-1.5" />
              <SkeletonBox width={64} height={10} rounded="4px" />
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col gap-2">
            {[0,1,2].map(i => <SkeletonBox key={i} width="100%" height={32} rounded="4px" />)}
          </div>
        </div>
      </div>
      <SkeletonBox width="100%" height={136} rounded="16px" />
    </div>
  );
}

// ── Revenue Overview range filter — one chart, switchable range, instead of
// a fixed 6-month area chart sitting next to an always-7-day bar chart that
// showed the same underlying metric twice at two different, unrelated
// windows. ────────────────────────────────────────────────────────────────
const REVENUE_RANGE_OPTIONS: { value: AnalyticsRangePreset; label: string }[] = [
  { value: '7d',  label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m',  label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
];
const REVENUE_RANGE_GRANULARITY: Record<AnalyticsRangePreset, 'day' | 'month'> = {
  '7d': 'day', '30d': 'day', '90d': 'day', '6m': 'month', '12m': 'month', custom: 'day',
};

function useRevenueOverview(storeId: string, range: AnalyticsRangePreset) {
  const [series, setSeries] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    apiSellerAnalyticsRevenueOverTime({ storeId, range, granularity: REVENUE_RANGE_GRANULARITY[range] })
      .then(res => { if (!cancelled) setSeries(res.data.series); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, range]);

  return { series, loading };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreDashboard() {
  const { store, storeId, loading, refetch: refetchStore } = useStoreWorkspace();
  const { metrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useStoreDashboardMetrics(storeId);
  const testimonialPrompt = useTestimonialPrompt();
  const [showCustomize, setShowCustomize] = useState(false);
  const [revenueRange, setRevenueRange] = useState<AnalyticsRangePreset>('30d');
  const { series: revenueOverviewSeries, loading: revenueOverviewLoading } = useRevenueOverview(storeId, revenueRange);
  const activeMetricIds = (store?.dashboardMetrics && store.dashboardMetrics.length > 0)
    ? store.dashboardMetrics
    : DEFAULT_DASHBOARD_METRICS;

  const revenueGranularity = REVENUE_RANGE_GRANULARITY[revenueRange];
  const chartData = revenueOverviewSeries.map(p => ({
    label: formatBucketLabel(p.date, revenueGranularity),
    revenue: p.grossRevenue,
  }));
  const revenueSparkline = (metrics?.revenueSeries ?? []).map(p => p.grossRevenue);
  const totalCustomers = metrics ? metrics.overview.newCustomersCount + metrics.overview.returningCustomersCount : 0;

  return (
    <div>
      <StorePageHeader title="Dashboard" subtitle="" />

      {/* One-time nudge on first dashboard landing — see useTestimonialPrompt's
         own doc comment for exactly when this can and can't show. Always also
         reachable from Settings' "Share Your Story" tab regardless. */}
      {testimonialPrompt.show && (
        <TestimonialPromptCard onClose={testimonialPrompt.dismiss} onSubmitted={testimonialPrompt.dismiss} />
      )}

      {loading || metricsLoading ? <DashSkeleton /> : (
        <div className="px-4 lg:px-7 py-6 flex flex-col gap-5">

          {/* Shopify-style trial pill — Dashboard-only (not shown on any
             other page's header). */}
          <TrialBillingPill />

          {metricsError && (
            <div className="dash-section-enter flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-error-bg text-error text-[12.5px] border border-error/10">
              <span>{metricsError}</span>
              <button onClick={refetchMetrics} className="font-semibold underline bg-transparent border-none cursor-pointer text-error shrink-0">
                Try again
              </button>
            </div>
          )}

          {/* Metric Cards — customizable, see MetricsCustomizeModal above.
             Moved to the very top of the page — the numbers a seller opens
             the dashboard to check, before anything else. */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em]">Metrics</p>
            <button
              onClick={() => setShowCustomize(true)}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate hover:text-brand-orange bg-transparent border-none cursor-pointer"
            >
              <Sliders size={12} /> Customize
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeMetricIds.map(id => renderMetricCard(id, metrics, store?.baseCurrency, totalCustomers, revenueSparkline))}
          </div>

          {/* Today + Needs Attention, side by side — both are "what's
             happening right now" glance cards, so they share one row instead
             of stacking full-width one under the other. */}
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TodaySnapshot today={metrics.today} currency={store?.baseCurrency} />
              <NeedsAttentionCard
                storeId={storeId}
                lowStockCount={metrics.lowStockCount}
                pendingOrdersCount={metrics.pendingOrdersCount}
                openReturnsCount={metrics.openReturnsCount}
                openDisputeCount={metrics.openDisputeCount}
                highRiskOrderCount={metrics.highRiskOrderCount}
                awaitingCaptureCount={metrics.awaitingCaptureCount}
              />
            </div>
          )}

          {metrics?.overview && <InsightsStrip overview={metrics.overview} />}

          {/* Setup Guide + Quick Actions, side by side. Quick Actions stays
             desktop-only within its own column — on mobile, StoreNavMenu (and
             the bottom-nav's Menu sheet, reachable from any page) already
             cover every one of these destinations, so it collapses away
             rather than leaving an empty second column. */}
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SetupGuideCard storeId={storeId} totalProducts={metrics.totalProducts} store={store} />
              <div className="hidden lg:block">
                <QuickActionsRow storeId={storeId} />
              </div>
            </div>
          )}

          {/* Revenue Chart + Store Info — one filterable Revenue Overview
             chart (range picker top-right) replaces the old fixed 6-month
             area chart + always-7-day bar chart pair, which showed the same
             metric twice at two unrelated, non-adjustable windows. */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <AreaChart
              data={chartData}
              dataKey="revenue"
              xKey="label"
              title="Revenue Overview"
              subtitle={revenueOverviewLoading ? 'Loading…' : REVENUE_RANGE_OPTIONS.find(o => o.value === revenueRange)?.label}
              action={
                <FilterDropdown
                  options={REVENUE_RANGE_OPTIONS}
                  value={revenueRange}
                  onChange={v => setRevenueRange(v as AnalyticsRangePreset)}
                />
              }
              height={300}
              loading={revenueOverviewLoading}
              valuePrefix={currencySymbol(store?.baseCurrency)}
              yTickFormatter={v => v >= 1000 ? `${currencySymbol(store?.baseCurrency)}${(v / 1000).toFixed(0)}k` : `${currencySymbol(store?.baseCurrency)}${v}`}
            />
            <StoreInfoCard />
          </div>

          {/* Store Health — a real, varied mix of chart types (donut,
             progress bars) alongside the area chart above, all from data
             already being fetched for this page — mirrors how a real
             platform dashboard (Shopify/Stripe) never relies on a single
             chart type to show "what's going on right now." */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DonutChart
                title="Inventory Health" subtitle="Across your catalog"
                size={150}
                emptyLabel="No products in stock yet"
                // No centerLabel — that total would just repeat the "Active
                // Products" metric card's own number; this chart's only job
                // is the in/low/out-of-stock proportion, not the total itself.
                data={[
                  { label: 'In Stock', value: metrics.inventoryBreakdown.inStock, color: '#22C55E' },
                  { label: 'Low Stock', value: metrics.inventoryBreakdown.lowStock, color: '#F59E0B' },
                  { label: 'Out of Stock', value: metrics.inventoryBreakdown.outOfStock, color: '#EF4444' },
                ]}
              />
              <DonutChart
                title="Customers" subtitle="Last 30 days"
                size={150}
                emptyLabel="No customers yet this period"
                // No centerLabel — that total would just repeat the
                // "Customers (30 days)" metric card's own number; this
                // chart's only job is the new-vs-returning proportion.
                data={[
                  { label: 'New', value: metrics.overview.newCustomersCount, color: '#8B5CF6' },
                  { label: 'Returning', value: metrics.overview.returningCustomersCount, color: '#0EA5E9' },
                ]}
              />
              <PlanUsageCard entitlements={metrics.entitlements} storeId={storeId} />
            </div>
          )}

        </div>
      )}

      {showCustomize && (
        <MetricsCustomizeModal
          storeId={storeId}
          current={activeMetricIds}
          onClose={() => setShowCustomize(false)}
          onSaved={() => { setShowCustomize(false); refetchStore(); }}
        />
      )}
    </div>
  );
}
