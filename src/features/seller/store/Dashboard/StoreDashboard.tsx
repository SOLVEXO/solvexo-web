import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, ShoppingBag, Package, Users,
  CheckCircle, Clock, Globe, ExternalLink,
  ArrowRight, Settings, AlertTriangle, Lightbulb,
  Megaphone, ClipboardList, Plus, History, Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader, TrialBillingPill } from '@/components/layouts/StoreLayout';
import { AreaChart } from '@/components/comman/charts';
import { MetricCard, SkeletonBox, Button, FilterDropdown, CopyIconButton } from '@/components/comman/ui';
import {
  apiSellerAnalyticsOverview, apiSellerAnalyticsRevenueOverTime, apiSellerAnalyticsToday, apiSellerAnalyticsSalesForecast,
  type SellerOverviewData, type RevenuePoint, type SellerTodaySummaryData, type SellerSalesForecastData,
} from '@/api/services/analytics/analytics';
import type { AnalyticsRangePreset } from '@/components/comman/analytics/analyticsFilters';
import { apiGetStoreInventory, apiGetLowStockSummary, apiGetSellerOrders } from '@/api/services/product';
import { apiGetSellerReturns } from '@/api/services/orders';
import { apiGetOpenDisputeCount, apiGetHighRiskOrderCount, apiGetAwaitingCaptureCount } from '@/api/services/payment';
import { apiUpdateStore } from '@/api/services/store';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import { apiGetFinanceDashboard, type FinanceWallet } from '@/api/services/finance';
import { apiGetActivityLog, type ActivityLogEntry, type ActivityCategory } from '@/api/services/activityLog';
import { timeAgo } from '@/utils/timeAgo';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
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
  entitlements: EntitlementsSummary | null;
  salesForecast: SellerSalesForecastData | null;
  primaryWallet: FinanceWallet | null;
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
      // Real plan-usage data — same entitlements Billing Center already
      // shows. Only ever surfaced here as a contextual warning when a limit
      // is genuinely close, never as a permanent card (see getUsageWarning).
      apiGetStoreEntitlements(storeId).catch(() => null),
      // Both best-effort — a fresh store with no sales history yet, or a
      // seller who hasn't touched Finance, should never block the rest of
      // the dashboard from loading over these two.
      apiSellerAnalyticsSalesForecast({ storeId }).catch(() => null),
      apiGetFinanceDashboard(storeId).catch(() => null),
    ])
      .then(([overviewRes, revenueRes, inventoryRes, todayRes, lowStockRes, ordersRes, returnsRes, disputesRes, riskRes, captureRes, entitlementsRes, forecastRes, financeRes]) => {
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
          entitlements: (entitlementsRes as any)?.data ?? null,
          salesForecast: (forecastRes as any)?.data ?? null,
          primaryWallet: (financeRes as any)?.wallets?.[0] ?? null,
        });
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load store metrics.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, reloadKey]);

  return { metrics, loading, error, refetch };
}

// ── Needs Attention ───────────────────────────────────────────────────────────
// Real, actionable signals already computed by existing endpoints (low-stock
// threshold from Phase 5, order stats, return stats). Every one of the 6
// signals is always shown — flagged as a colored, clickable row when it
// needs action, or as a quiet green "all fine" row when it doesn't. This
// gives a genuine full status picture (not just problems) and fills the
// card naturally, instead of either one lonely row floating in a mostly
// empty box, or a single vague "all caught up" placeholder.
interface AttentionItem { label: string; okLabel: string; count: number; path: string; Icon: LucideIcon; color: string }

function NeedsAttentionCard({ storeId, lowStockCount, pendingOrdersCount, openReturnsCount, openDisputeCount, highRiskOrderCount, awaitingCaptureCount }: {
  storeId: string; lowStockCount: number; pendingOrdersCount: number; openReturnsCount: number; openDisputeCount: number; highRiskOrderCount: number; awaitingCaptureCount: number;
}) {
  const navigate = useNavigate();
  // Collapsible, same header pattern as SetupGuideCard/RecentActivityCard.
  const [collapsed, setCollapsed] = useState(false);
  // Seller-friendly phrasing — "N need X", not "Order(s) with an open Y" —
  // same real signals, easier to scan at a glance.
  const allItems: AttentionItem[] = [
    { label: 'order(s) need payment capture', okLabel: 'No payments awaiting capture', count: awaitingCaptureCount, path: 'orders', Icon: AlertTriangle, color: '#B45309' },
    { label: 'order(s) need fulfillment', okLabel: 'No orders awaiting fulfillment', count: pendingOrdersCount, path: 'orders', Icon: Package, color: '#8B5CF6' },
    { label: 'order(s) flagged high-risk — review before shipping', okLabel: 'No high-risk orders', count: highRiskOrderCount, path: 'orders', Icon: AlertTriangle, color: '#B91C1C' },
    { label: 'payment dispute(s) need a response', okLabel: 'No open disputes', count: openDisputeCount, path: 'disputes', Icon: AlertTriangle, color: '#DC2626' },
    { label: 'product(s) low on stock', okLabel: 'Stock levels look healthy', count: lowStockCount, path: 'inventory', Icon: ClipboardList, color: '#F59E0B' },
    { label: 'return(s) need review', okLabel: 'No returns awaiting review', count: openReturnsCount, path: 'returns', Icon: AlertTriangle, color: '#EF4444' },
  ];
  const flagged = allItems.filter(i => i.count > 0);
  const clear = allItems.filter(i => i.count === 0);
  const totalCount = flagged.reduce((s, i) => s + i.count, 0);
  const allClear = flagged.length === 0;

  return (
    // self-start while collapsed — same "opt out of items-stretch" trick as
    // SetupGuideCard/RecentActivityCard, so a collapsed card never gets
    // force-stretched into a tall empty box. Expanded, the full 6-row
    // checklist naturally fills close to the Revenue chart's height.
    // No surface-panel-interactive — the whole card isn't a single click
    // target (only the header toggle + individual rows are), so a
    // whole-card hover-lift read as a visual glitch rather than a hint.
    <div className={`dash-section-enter surface-panel rounded-2xl overflow-hidden flex flex-col ${collapsed ? 'self-start' : 'h-full'}`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className={`w-full flex items-center gap-2.5 px-5 py-3 bg-transparent border-0 cursor-pointer text-left shrink-0 ${!collapsed ? 'border-b border-[#f3f2ec]' : ''}`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${allClear ? 'bg-success-bg text-success' : 'bg-error-bg text-error'}`}>
          {allClear ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
        </div>
        <p className="text-sm font-bold text-charcoal">Needs Attention</p>
        <span className={`ml-auto text-[11px] font-semibold px-2 py-[2px] rounded-full ${allClear ? 'text-success bg-success-bg' : 'text-slate bg-cream'}`}>
          {allClear ? 'All clear' : totalCount}
        </span>
        {collapsed ? <ChevronDownIcon size={15} className="text-slate shrink-0" /> : <ChevronUp size={15} className="text-slate shrink-0" />}
      </button>
      {!collapsed && (
        <div className="flex flex-col divide-y divide-[#f3f2ec]">
          {flagged.map(item => (
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
          {clear.map(item => (
            <div key={item.label} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-success-bg text-success flex items-center justify-center shrink-0">
                <CheckCircle size={14} />
              </div>
              <span className="flex-1 text-[13px] text-slate">{item.okLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Insights ("Things worth knowing") ─────────────────────────────────────────
// Mirrors Shopify Home's own "Insights" section (data-driven observations,
// capped at a handful shown at once) — deliberately NOT an AI/LLM-generated
// feature. Every insight is a plain rule evaluated against real
// period-over-period numbers the backend already computes for
// `SellerOverviewData` (or, for the last rule, the same trend+seasonality
// sales forecast already fetched for this page) — nothing new is computed
// here, and nothing shown can't already be found on the Analytics page.
interface Insight { text: string; tone: 'positive' | 'negative' | 'neutral'; magnitude: number }

function buildInsights(overview: SellerOverviewData, forecast?: SellerSalesForecastData | null, currency?: string | null): Insight[] {
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

  // Only the real trend+seasonality forecast (never the low-data "simple
  // average" fallback) counts as a genuine trend worth calling out here.
  if (forecast && forecast.method === 'trend_seasonal' && forecast.projectedNext7Days > 0) {
    insights.push({
      tone: 'positive',
      magnitude: 4,
      text: `Your sales are trending toward ${formatMoneyCompact(forecast.projectedNext7Days, currency)} over the next 7 days.`,
    });
  }

  // Shopify caps this at a handful shown at once so it reads as "worth your
  // attention," not a wall of stats — same reasoning here, biggest-magnitude first.
  return insights.sort((a, b) => b.magnitude - a.magnitude).slice(0, 3);
}

function InsightsStrip({ overview, forecast, currency }: { overview: SellerOverviewData; forecast?: SellerSalesForecastData | null; currency?: string | null }) {
  const insights = buildInsights(overview, forecast, currency);
  if (insights.length === 0) return null;

  const toneStyle: Record<Insight['tone'], { bg: string; color: string; Icon: LucideIcon }> = {
    positive: { bg: '#eaf7ef', color: '#1E7A3C', Icon: TrendingUp },
    negative: { bg: '#fdecec', color: '#C0362C', Icon: TrendingDown },
    neutral:  { bg: '#eef2fb', color: '#2156A8', Icon: Users },
  };

  return (
    <div className="dash-section-enter surface-panel surface-panel-interactive rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-[#f3f2ec] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand-pale-orange text-brand-orange flex items-center justify-center shrink-0">
          <Lightbulb size={14} />
        </div>
        <div>
          <p className="text-sm font-bold text-charcoal">Things worth knowing</p>
          <p className="text-[11px] text-slate mt-[1px]">A few observations from the last 30 days</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
        {insights.map((insight, i) => {
          const { bg, color, Icon } = toneStyle[insight.tone];
          return (
            <div key={i} className="flex flex-col gap-2.5 rounded-[14px] border border-[#f0eee6] bg-[#fafaf6] p-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg, color }}>
                <Icon size={15} />
              </div>
              <p className="text-[12.5px] text-charcoal leading-[1.45]">{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent Activity — real store activity feed (products/orders/finance/
// marketing/customers/settings/security events already tracked by the
// backend's ActivityLog, same data the seller's own Settings → Activity Log
// tab shows in full). Surfaced here so opening Home also reads as "what just
// happened in my store," not only a numbers dashboard. Best-effort/self-
// hiding — a brand-new store with no events yet, or a failed fetch, simply
// shows nothing rather than an empty placeholder. ──────────────────────────
const ACTIVITY_ICON: Record<ActivityCategory, LucideIcon> = {
  products: ShoppingBag, orders: Package, finance: Wallet, marketing: Megaphone,
  customers: Users, settings: Settings, security: AlertTriangle,
};

function RecentActivityCard({ storeId }: { storeId: string }) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ActivityLogEntry[] | null>(null);
  // Collapsible, same show/hide pattern as SetupGuideCard's own header
  // toggle — a seller who doesn't care about the feed can tuck it away
  // without losing the row entirely.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetActivityLog(storeId, { limit: 5 })
      .then(res => { if (!cancelled) setEntries(res.data.logs); })
      .catch(() => { if (!cancelled) setEntries([]); });
    return () => { cancelled = true; };
  }, [storeId]);

  if (!entries || entries.length === 0) return null;

  return (
    // self-start while collapsed — opts this card OUT of the grid's
    // items-stretch when there's nothing but a header to show, so it never
    // gets force-stretched into a tall card with a big empty body. Expanded,
    // it stretches to match Setup Guide's height, with the footer pinned to
    // the bottom (mt-auto below) so a short activity list doesn't leave the
    // "View activity" link stranded mid-card.
    <div className={`dash-section-enter bg-white border border-bone rounded-2xl overflow-hidden flex flex-col ${collapsed ? 'self-start' : 'h-full'}`}>
      {/* Same header shape as SetupGuideCard's own header (icon badge +
         title + inline subtitle + chevron, border only while expanded) — so
         the two collapsed cards land on the exact same height. */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={`w-full flex items-center gap-2.5 px-4 py-3 bg-transparent border-0 cursor-pointer text-left shrink-0 ${!collapsed ? 'border-b border-[#f3f2ec]' : ''}`}
      >
        <div className="w-7 h-7 rounded-lg bg-info-bg text-info flex items-center justify-center shrink-0">
          <History size={13} />
        </div>
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <p className="text-[13px] font-bold text-charcoal shrink-0">Recent Activity</p>
          <span className="text-[11px] text-slate truncate">Last {entries.length} event{entries.length === 1 ? '' : 's'}</span>
        </div>
        {collapsed ? <ChevronDownIcon size={15} className="text-slate shrink-0" /> : <ChevronUp size={15} className="text-slate shrink-0" />}
      </button>

      {!collapsed && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col divide-y divide-[#f3f2ec]">
            {entries.map(entry => {
              const Icon = ACTIVITY_ICON[entry.category] ?? History;
              return (
                <div key={entry._id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <div className="w-6 h-6 rounded-md bg-cream text-slate flex items-center justify-center shrink-0">
                    <Icon size={11.5} />
                  </div>
                  <span className="flex-1 text-[12px] text-charcoal leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap">
                    {entry.description ?? entry.action}
                  </span>
                  <span className="text-[10.5px] text-slate shrink-0">{timeAgo(entry.createdAt)}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate(`/store/${storeId}/settings?tab=activity`)}
            className="mt-auto w-full px-4 py-2.5 border-t border-[#f3f2ec] text-[11.5px] font-semibold text-brand-orange hover:underline bg-transparent border-0 cursor-pointer text-left"
          >
            View activity →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Available Balance — a slim, contextual strip (not a permanent full-size
// card) surfaced only when there's actually something to say: a real,
// non-zero available or pending balance from Finance's own ledger
// (`FinanceService.getDashboard`). Hidden entirely for a store that hasn't
// sold anything yet — full per-currency detail always stays Finance's job. ─
function AvailableBalanceBanner({ wallet, storeId }: { wallet: FinanceWallet; storeId: string }) {
  const navigate = useNavigate();
  return (
    // No surface-panel-interactive — this strip isn't a single click target
    // (only the "View Finance" button is), so a whole-strip hover-lift read
    // as a glitch rather than a hint.
    <div className="dash-section-enter surface-panel rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap">
      <div className="w-9 h-9 rounded-lg bg-success-bg text-success flex items-center justify-center shrink-0">
        <Wallet size={16} />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.06em]">Available</p>
          <p className="text-[17px] font-bold text-carbon tabular-nums leading-tight">{formatMoneyCompact(wallet.availableBalance, wallet.currency)}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-slate">
          <Clock size={12} />
          Pending: <span className="font-semibold text-graphite">{formatMoneyCompact(wallet.pendingBalance, wallet.currency)}</span>
        </div>
      </div>
      <button
        onClick={() => navigate(`/store/${storeId}/finance`)}
        className="text-[12px] font-semibold text-brand-orange hover:underline bg-transparent border-none cursor-pointer shrink-0"
      >
        View Finance →
      </button>
    </div>
  );
}

// ── Plan usage warning — a contextual banner, not a permanent card. Shows at
// most one (the closest-to-limit) usage figure, and only once it's genuinely
// worth flagging — full usage detail always stays Billing's own job. ───────
function getUsageWarning(entitlements: EntitlementsSummary | null): { label: string; pct: number } | null {
  if (!entitlements) return null;
  const candidates = [
    { label: 'product limit', used: entitlements.maxProducts.used, max: entitlements.maxProducts.limit },
    { label: 'AI credits', used: Math.max(0, entitlements.aiCredits.monthlyAllowance - entitlements.aiCredits.balance), max: entitlements.aiCredits.monthlyAllowance },
    { label: 'staff account limit', used: entitlements.maxStaffAccounts.used, max: entitlements.maxStaffAccounts.limit },
    { label: 'POS location limit', used: entitlements.maxPosLocations.used, max: entitlements.maxPosLocations.limit },
  ];
  let worst: { label: string; pct: number } | null = null;
  for (const c of candidates) {
    if (c.max === -1 || c.max <= 0) continue;
    const pct = (c.used / c.max) * 100;
    if (pct >= 85 && (!worst || pct > worst.pct)) worst = { label: c.label, pct };
  }
  return worst;
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
  // A 0-vs-0 comparison (nothing happened this period, nothing happened last
  // period either) isn't a real trend — showing "↑0%"/"↑+0 vs prev." on a
  // brand-new store with zero activity reads as if something happened when
  // nothing did, so the trend badge only renders once there's genuine
  // activity to compare against.
  const hasRevenue = (metrics?.overview.totalRevenue ?? 0) > 0;
  const hasOrders  = (metrics?.overview.totalOrders ?? 0) > 0;
  const revenueChangePct = hasRevenue ? (metrics?.overview.totalRevenueChangePercent ?? null) : null;
  const aovChangePct = hasOrders ? (metrics?.overview.avgOrderValueChangePercent ?? null) : null;
  const ordersChange = hasOrders ? metrics?.overview.totalOrdersChange : undefined;

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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashSkeleton() {
  return (
    <div className="px-4 lg:px-7 py-6 flex flex-col gap-5 max-w-[1440px] mx-auto">
      <DashboardHeroSkeleton />
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

// Every range option is fetched once, in parallel, up front — switching the
// filter afterward is a plain in-memory lookup, not a new request, so the
// dropdown never shows a loading state after the initial page load (the one
// exception: it briefly refetches everything after Metrics's own refetch,
// e.g. after "Try again").
function useRevenueOverviewAll(storeId: string) {
  const [seriesByRange, setSeriesByRange] = useState<Partial<Record<AnalyticsRangePreset, RevenuePoint[]>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all(
      REVENUE_RANGE_OPTIONS.map(({ value }) =>
        apiSellerAnalyticsRevenueOverTime({ storeId, range: value, granularity: REVENUE_RANGE_GRANULARITY[value] })
          .then(res => [value, res.data.series] as const),
      ),
    )
      .then(entries => { if (!cancelled) setSeriesByRange(Object.fromEntries(entries)); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load revenue data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, reloadKey]);

  return { seriesByRange, loading, error, refetch };
}

// ── Dashboard Hero ────────────────────────────────────────────────────────────
// A single, clean "welcome" moment at the top of the page — store identity,
// live status, and the two actions a seller reaches for most (Add product /
// View store). Deliberately carries NO metrics — those already have a
// dedicated, customizable row right below it, and repeating them here just
// duplicated the same numbers twice on one page.
function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardHero({ store, storeId }: { store: ReturnType<typeof useStoreWorkspace>['store']; storeId: string }) {
  const navigate = useNavigate();
  const isLive = store?.status === 'active';
  const statusLabel = isLive
    ? 'Store is live'
    : store?.status === 'pending'
      ? 'Store is pending review'
      : store?.status === 'suspended'
        ? 'Store is suspended'
        : 'Store is not live yet';

  return (
    <div className="dash-section-enter surface-panel rounded-2xl relative overflow-hidden">
      {/* One deliberate ambient glow, brand-colored — the "surprise" moment
         for the whole page, not repeated on every card below it. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(130% 100% at 100% 0%, rgba(217,119,87,0.09), transparent 55%)' }}
      />
      <div className="relative px-6 sm:px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-brand-pale-orange border border-[#eee0d5] flex items-center justify-center overflow-hidden shrink-0">
            {store?.logo
              ? <img loading="lazy" decoding="async" src={store.logo} alt={store?.name} className="w-full h-full object-cover" />
              : <Globe size={22} className="text-brand-orange" />}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-brand-orange uppercase tracking-[0.08em] mb-1">
              {getTimeGreeting()}
            </p>
            <h1 className="text-[24px] sm:text-[27px] font-bold text-carbon tracking-tight leading-tight overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px] sm:max-w-none">
              {store?.name ?? 'Your Store'}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className={`size-[6px] rounded-full ${isLive ? 'bg-success pos-live-pulse' : 'bg-slate'}`} />
                <span className={`text-[12.5px] font-medium ${isLive ? 'text-success' : 'text-slate'}`}>{statusLabel}</span>
              </span>
              {store?.slug && (
                <span className="flex items-center gap-1 text-[12px] text-slate">
                  <span className="text-slate/60">·</span>
                  /{store.slug}
                  <CopyIconButton value={`/${store.slug}`} title="Copy store URL" size={11} />
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-bone lg:hidden" />

        <div className="flex items-center gap-2 shrink-0">
          {store?.slug && (
            <a
              href={getStorefrontUrl(store.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium py-[7px] px-[14px] rounded-md bg-white text-carbon border border-bone hover:bg-cream hover:border-slate/40 transition-colors duration-150 no-underline"
            >
              View store <ExternalLink size={12} />
            </a>
          )}
          <Button size="sm" icon={<Plus size={12} />} onClick={() => navigate(`/store/${storeId}/products/add`)}>
            Add product
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardHeroSkeleton() {
  return (
    <div className="surface-panel rounded-2xl px-6 sm:px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div className="flex items-center gap-4">
        <SkeletonBox width={56} height={56} rounded="16px" />
        <div>
          <SkeletonBox width={110} height={11} rounded="4px" className="mb-2" />
          <SkeletonBox width={160} height={22} rounded="6px" className="mb-2" />
          <SkeletonBox width={140} height={11} rounded="4px" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBox width={100} height={32} rounded="6px" />
        <SkeletonBox width={110} height={32} rounded="6px" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreDashboard() {
  const navigate = useNavigate();
  const { store, storeId, loading, refetch: refetchStore } = useStoreWorkspace();
  const { metrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useStoreDashboardMetrics(storeId);
  const testimonialPrompt = useTestimonialPrompt();
  const [showCustomize, setShowCustomize] = useState(false);
  const [revenueRange, setRevenueRange] = useState<AnalyticsRangePreset>('30d');
  const { seriesByRange, loading: revenueOverviewLoading, error: revenueOverviewError, refetch: refetchRevenueOverview } = useRevenueOverviewAll(storeId);
  const revenueOverviewSeries = seriesByRange[revenueRange] ?? [];
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
  const usageWarning = getUsageWarning(metrics?.entitlements ?? null);
  const wallet = metrics?.primaryWallet;
  const showBalanceBanner = !!wallet && (wallet.availableBalance > 0 || wallet.pendingBalance > 0);

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
        <div className="px-4 lg:px-7 py-6 flex flex-col gap-6 max-w-[1440px] mx-auto">

          {/* Shopify-style trial pill — Dashboard-only (not shown on any
             other page's header). */}
          <TrialBillingPill />

          <DashboardHero store={store} storeId={storeId} />

          {metricsError && (
            <div className="dash-section-enter flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-error-bg text-error text-[12.5px] border border-error/10">
              <span>{metricsError}</span>
              <button onClick={refetchMetrics} className="font-semibold underline bg-transparent border-none cursor-pointer text-error shrink-0">
                Try again
              </button>
            </div>
          )}

          {/* Contextual plan-usage warning — only ever appears when a real
             limit is genuinely close; otherwise this row doesn't exist. */}
          {usageWarning && (
            <div className="dash-section-enter flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-brand-pale-orange text-brand-deep-orange text-[12.5px] border border-brand-orange/20">
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                You're using {usageWarning.pct.toFixed(0)}% of your {usageWarning.label}.
              </span>
              <button
                onClick={() => navigate(`/store/${storeId}/settings?tab=billing`)}
                className="font-semibold underline bg-transparent border-none cursor-pointer shrink-0"
              >
                View plan →
              </button>
            </div>
          )}

          {/* Metric Cards — customizable, see MetricsCustomizeModal above. */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em]">Metrics</p>
            <button
              onClick={() => setShowCustomize(true)}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate hover:text-brand-orange bg-transparent border-none cursor-pointer"
            >
              <Sliders size={12} /> Customize
            </button>
          </div>
          {/* auto-fit, not a fixed 4-column grid — the card count here is
             seller-customizable (see MetricsCustomizeModal), and a fixed
             column count leaves a leftover row's 1-2 cards small and
             left-aligned, looking abandoned. auto-fit instead stretches
             whatever's left in the last row to fill it. */}
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {activeMetricIds.map(id => renderMetricCard(id, metrics, store?.baseCurrency, totalCustomers, revenueSparkline))}
          </div>

          {/* Revenue Chart + Needs Attention — the core of the page: trend
             on the left, urgent tasks on the right, sharing one row.
             items-stretch — Needs Attention matches the chart's height (it
             opts out via self-start while collapsed, so a collapsed card
             never gets force-stretched into empty white space). */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-stretch">
            {revenueOverviewError ? (
              <div className="surface-panel rounded-2xl px-5 py-5 flex items-center justify-center min-h-[300px]">
                <AnalyticsErrorState message={revenueOverviewError} onRetry={refetchRevenueOverview} />
              </div>
            ) : (
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
            )}
            {metrics && (
              <NeedsAttentionCard
                storeId={storeId}
                lowStockCount={metrics.lowStockCount}
                pendingOrdersCount={metrics.pendingOrdersCount}
                openReturnsCount={metrics.openReturnsCount}
                openDisputeCount={metrics.openDisputeCount}
                highRiskOrderCount={metrics.highRiskOrderCount}
                awaitingCaptureCount={metrics.awaitingCaptureCount}
              />
            )}
          </div>

          {/* Payout — a slim, contextual strip, only when there's a real
             balance to mention. */}
          {showBalanceBanner && wallet && <AvailableBalanceBanner wallet={wallet} storeId={storeId} />}

          {metrics?.overview && <InsightsStrip overview={metrics.overview} forecast={metrics.salesForecast} currency={store?.baseCurrency} />}

          {/* Setup Guide + Recent Activity, side by side. Both are
             self-hiding (Setup Guide once every task is done; Activity once
             there's nothing to show), so a mature, active store naturally
             loses this row entirely over time. items-stretch — both cards
             match the taller one's height (each card opts out via
             self-start while collapsed, so a collapsed card never gets
             force-stretched into empty white space). */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {metrics && <SetupGuideCard storeId={storeId} totalProducts={metrics.totalProducts} store={store} />}
            <RecentActivityCard storeId={storeId} />
          </div>

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
