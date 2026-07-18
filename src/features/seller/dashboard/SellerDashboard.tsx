import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart } from '@/components/comman/charts';
import {
  ArrowRight, Store, AlertCircle, DollarSign, Package, ShoppingBag, Repeat,
  BarChart2, Settings, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { Table } from '@/components/comman/ui/Table';
import type { TableColumn } from '@/components/comman/ui/Table';
import { Avatar } from '@/components/comman/ui/Avatar';
import { StatusBadge } from '@/components/comman/ui/Badge';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useMyStores } from '@/hooks/store/useMyStores';
import { apiGetSellerPlatformOverview } from '@/api/services/platformPlans';
import {
  apiSellerAnalyticsOverview, apiSellerAnalyticsRevenueOverTime, apiSellerAnalyticsTopProducts,
  type SellerOverviewData, type RevenuePoint, type TopProductRow,
} from '@/api/services/analytics/analytics';
import { apiGetSellerOrders, type SellerOrder } from '@/api/services/product';
import { formatCurrency, formatNumber, formatPercent, formatBucketLabel } from '@/components/comman/analytics/format';

// ── My Store Card ────────────────────────────────────────────────────────────
const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: '#E3F4EA', color: '#1E7A3C' },
  inactive: { bg: '#F0EEE6', color: '#8C8A82' },
  pending: { bg: '#FFF0E0', color: '#B36200' },
};

function MyStoreCardSkeleton() {
  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-[18px] pt-4 pb-[10px] flex items-center justify-between">
        <div className="animate-pulse w-[72px] h-[14px] rounded bg-[#EDEBE2]" />
        <div className="animate-pulse w-[44px] h-[11px] rounded-[3px] bg-[#EDEBE2]" />
      </div>
      <div className="px-2 pb-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`flex items-center gap-3 px-[10px] py-[11px]${i < 2 ? ' border-b border-[#F5F4EF]' : ''}`}>
            <div className="animate-pulse w-8 h-8 rounded-lg bg-[#EDEBE2] shrink-0" />
            <div className="flex-1 flex flex-col gap-[6px]">
              <div className="animate-pulse w-[100px] h-3 rounded bg-[#EDEBE2]" />
              <div className="animate-pulse w-16 h-[10px] rounded bg-[#EDEBE2]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MyStore { _id: string; name: string; slug: string; status: string; logo?: string | null }

function MyStoreCard({ stores, loading, error, onRetry }: { stores: MyStore[]; loading: boolean; error: string; onRetry: () => void }) {
  const navigate = useNavigate();

  if (loading) return <MyStoreCardSkeleton />;

  if (error) {
    return (
      <div className="bg-white border border-bone rounded-[10px] px-5 py-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-center">
        <div className="w-[52px] h-[52px] rounded-xl bg-error-bg flex items-center justify-center mx-auto mb-[14px]">
          <AlertCircle size={24} className="text-error" />
        </div>
        <h3 className="text-[15px] font-bold text-charcoal mb-[6px]">
          Couldn't load your stores
        </h3>
        <p className="text-xs text-slate leading-[1.5] mb-4">
          {error}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>Try Again</Button>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-white border border-bone rounded-[10px] px-5 py-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-center">
        <div className="w-[52px] h-[52px] rounded-xl bg-brand-pale-orange flex items-center justify-center mx-auto mb-[14px]">
          <Store size={24} className="text-brand-orange" />
        </div>

        <h3 className="text-[15px] font-bold text-charcoal mb-[6px]">
          No stores yet
        </h3>

        <p className="text-xs text-slate leading-[1.5] mb-4">
          Create your first store and start selling your products.
        </p>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/onboarding')}
        >
          Create Store
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-[18px] pt-4 pb-2 flex items-start justify-between">
        <p className="text-sm font-bold text-charcoal">My Store</p>
        <div className="text-right">
          <span className="text-[11px] text-slate">
            Total Stores ({stores.length})
          </span>
          <br />
          <button
            onClick={() => navigate('/seller/stores')}
            className="bg-transparent border-0 cursor-pointer p-0 text-[11px] text-brand-orange font-semibold mt-0.5 underline"
          >
            View All
          </button>
        </div>
      </div>
      <div className="px-2 pb-2 max-h-[252px] overflow-y-auto scrollbar-hide">
        {stores.map((store, i) => {
          const st = statusColors[store.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
          return (
            <button
              key={store._id}
              onClick={() => navigate(`/seller/store/${store._id}/dashboard`)}
              className="w-full flex items-center gap-3 px-[10px] py-[11px] bg-transparent border-0 cursor-pointer text-left transition-[background] duration-150 rounded-md"
              style={{ borderBottom: i < stores.length - 1 ? '1px solid #F5F4EF' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="w-8 h-8 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0 overflow-hidden border border-[#EDEBE2]">
                {store.logo
                  ? <img loading="lazy" decoding="async" src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                  : <Store size={15} className="text-brand-orange" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">{store.name}</p>
                <div className="flex items-center gap-[6px] mt-0.5">
                  <span className="text-[10px] font-semibold px-[6px] py-px rounded-[20px]" style={{ background: st.bg, color: st.color }}>
                    {store.status}
                  </span>
                  <span className="text-[10px] text-slate">/{store.slug}</span>
                </div>
              </div>
              <span className="text-base text-[#C0BDB5]">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Platform Billing widget ──────────────────────────────────────────────────
interface PlatformOverviewStore {
  storeId: string;
  storeName: string;
  platformPlan: { id: string; name: string; isFree: boolean } | null;
  subscriptionStatus: string;
  totalPaidUSD: number;
}

const billingStatusColors: Record<string, { bg: string; color: string }> = {
  active:    { bg: '#E3F4EA', color: '#1E7A3C' },
  trialing:  { bg: '#EAF0FB', color: '#2156A8' },
  past_due:  { bg: '#FFF0E0', color: '#B36200' },
  canceled:  { bg: '#FBE9E7', color: '#B3261E' },
  none:      { bg: '#F0EEE6', color: '#8C8A82' },
};

function PlatformBillingCard() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<PlatformOverviewStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetSellerPlatformOverview().then(res => setStores(res.data.stores)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="bg-white border border-bone rounded-[10px] h-full min-h-[220px] animate-pulse" />;
  if (stores.length === 0) return null;

  const totalUSD = stores.reduce((s, r) => s + r.totalPaidUSD, 0);

  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden h-full flex flex-col">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#F3F2EC]">
        <p className="text-sm font-bold text-charcoal">Platform Billing</p>
        <span className="bg-brand-pale-orange text-[#C96847] text-xs font-semibold px-[10px] py-[3px] rounded-md">
          {formatCurrency(totalUSD)}/mo total
        </span>
      </div>
      <div className="px-2 py-2 max-h-[280px] overflow-y-auto scrollbar-hide">
        {stores.map((s, i) => {
          const st = billingStatusColors[s.subscriptionStatus] ?? billingStatusColors.none;
          return (
            <button
              key={s.storeId}
              onClick={() => navigate(`/seller/store/${s.storeId}/plan-billing`)}
              className="w-full flex items-center gap-3 px-[10px] py-[11px] bg-transparent border-0 cursor-pointer text-left hover:bg-cream rounded-md"
              style={{ borderBottom: i < stores.length - 1 ? '1px solid #F5F4EF' : 'none' }}
            >
              <div className="w-9 h-9 rounded-[10px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                <Store size={15} className="text-brand-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-charcoal truncate">{s.storeName}</p>
                <div className="flex items-center gap-[6px] mt-[3px]">
                  <span className="text-[10px] font-semibold px-[6px] py-px rounded-[20px]" style={{ background: st.bg, color: st.color }}>
                    {s.subscriptionStatus}
                  </span>
                  <span className="text-[10px] text-slate">{s.platformPlan?.name ?? 'No plan'}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-bold text-carbon leading-tight">{formatCurrency(s.totalPaidUSD)}</p>
                <p className="text-[10px] text-slate">/mo</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
interface QuickAction { Icon: LucideIcon; label: string; path: string; color: string }

const QUICK_ACTIONS: QuickAction[] = [
  { Icon: Store,     label: 'My Stores',       path: '/seller/stores',   color: '#D97757' },
  { Icon: Sparkles,  label: 'Create Store',    path: '/seller/store',    color: '#A855F7' },
  { Icon: BarChart2, label: 'Analytics',       path: '/seller/analytics', color: '#0EA5E9' },
  { Icon: Settings,  label: 'Settings',        path: '/seller/settings', color: '#8C8A82' },
];

function QuickActionsRow() {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] h-full flex flex-col">
      <div className="px-5 pt-4 pb-3 border-b border-[#F3F2EC]">
        <p className="text-sm font-bold text-charcoal">Quick Actions</p>
      </div>
      <div className="px-4 py-4 grid grid-cols-2 gap-3 flex-1">
        {QUICK_ACTIONS.map(({ Icon, label, path, color }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-[10px] border border-bone bg-transparent cursor-pointer transition-colors duration-150 hover:bg-cream w-full"
          >
            <div
              className="w-9 h-9 rounded-[9px] flex items-center justify-center"
              style={{ background: color + '18' }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <span className="text-[11px] font-medium text-charcoal text-center leading-[1.3]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Recent orders table columns ──────────────────────────────────────────────
const ORDER_COLUMNS: TableColumn<SellerOrder>[] = [
  {
    key: 'orderNumber', header: 'Order',
    render: row => <span className="font-semibold text-brand-orange">{row.orderNumber}</span>,
  },
  {
    key: 'customer', header: 'Customer',
    render: row => (
      <div className="flex items-center gap-2">
        <Avatar name={row.customer.name || 'Guest'} size={26} />
        <span className="text-graphite">{row.customer.name}</span>
      </div>
    ),
  },
  {
    key: 'product', header: 'Product',
    render: row => <span className="text-graphite">{row.product}</span>,
  },
  {
    key: 'amount', header: 'Amount',
    render: row => <span className="font-semibold text-charcoal">{formatCurrency(row.amount)}</span>,
  },
  {
    key: 'status', header: 'Status',
    render: row => <StatusBadge status={row.status} size="sm" />,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerDashboard() {
  const navigate = useNavigate();
  const subtitle = "Welcome back — Here's your store overview.";

  const { stores, loading: storesLoading, error: storesError, refetch: refetchStores } = useMyStores();
  const storeId = stores[0]?._id ?? null;

  const [overview, setOverview]       = useState<SellerOverviewData | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (storesLoading) return;
    if (!storeId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      apiSellerAnalyticsOverview({ storeId, range: '7d' }),
      apiSellerAnalyticsRevenueOverTime({ storeId, range: '7d' }),
      apiSellerAnalyticsTopProducts({ storeId, limit: 5, sort: 'revenue' }),
      apiGetSellerOrders(storeId, 1, 4),
    ])
      .then(([overviewRes, revenueRes, productsRes, ordersRes]) => {
        if (cancelled) return;
        setOverview(overviewRes.data);
        setRevenueSeries(revenueRes.data.series);
        setTopProducts(productsRes.data);
        setRecentOrders(ordersRes.data.orders);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, storesLoading]);

  const metrics = overview ? [
    { label: 'Revenue (7 days)',  value: formatCurrency(overview.totalRevenue), trend: overview.totalRevenueChangePercent != null ? formatPercent(overview.totalRevenueChangePercent, { signed: true }) : null, trendUp: (overview.totalRevenueChangePercent ?? 0) >= 0, sub: null, icon: <DollarSign size={16} />, color: '#D97757' },
    { label: 'Orders (7 days)',   value: formatNumber(overview.totalOrders),    trend: overview.totalOrdersChange ? formatPercent(overview.totalOrdersChange, { signed: true }) : null, trendUp: (overview.totalOrdersChange ?? 0) >= 0, sub: null, icon: <Package size={16} />, color: '#8B5CF6' },
    { label: 'Avg Order Value',   value: formatCurrency(overview.avgOrderValue), trend: overview.avgOrderValueChangePercent != null ? formatPercent(overview.avgOrderValueChangePercent, { signed: true }) : null, trendUp: (overview.avgOrderValueChangePercent ?? 0) >= 0, sub: null, icon: <ShoppingBag size={16} />, color: '#0EA5E9' },
    { label: 'Repeat Buyers',     value: formatPercent(overview.repeatBuyerPercent), trend: null, trendUp: true, sub: overview.repeatBuyerTrend === 'improving' ? 'Improving' : overview.repeatBuyerTrend === 'declining' ? 'Declining' : 'Steady', icon: <Repeat size={16} />, color: '#22C55E' },
  ] : [];

  const chartData = revenueSeries.map(p => ({ day: formatBucketLabel(p.date, 'day'), sales: p.grossRevenue }));
  const revenueTotal = revenueSeries.reduce((s, p) => s + p.grossRevenue, 0);
  const maxProductRevenue = Math.max(1, ...topProducts.map(p => p.revenue));

  const hasStore = !!storeId;

  return (
    <>
      <SellerPageHeader
        title="Dashboard"
        subtitle={subtitle}
      />

      <div className="px-5 pt-4 pb-6 flex flex-col gap-4">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-error-bg text-error text-[12.5px]">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── Row 1: Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(loading || storesLoading) ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)
          ) : !hasStore ? (
            <div className="col-span-full bg-white border border-bone rounded-[10px] px-5 py-6 text-center text-[13px] text-slate">
              Create a store to see your revenue, orders, and product metrics here.
            </div>
          ) : metrics.map((m) => (
            <MetricCard key={m.label} label={m.label} value={m.value} trend={m.trend ?? undefined} trendUp={m.trendUp} sub={m.sub ?? undefined} icon={m.icon} color={m.color} />
          ))}
        </div>

        {/* ── Row 2: Revenue Chart + My Store (col-8 + col-4) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <AreaChart
            data={chartData}
            dataKey="sales"
            xKey="day"
            title="Revenue — Last 7 Days"
            action={hasStore ? <span className="bg-brand-pale-orange text-[#C96847] text-xs font-semibold px-[10px] py-[3px] rounded-md">{formatCurrency(revenueTotal)} total</span> : undefined}
            height={240}
            valuePrefix="$"
            yTickFormatter={v => `$${v.toLocaleString()}`}
          />
          <MyStoreCard stores={stores} loading={storesLoading} error={storesError} onRetry={refetchStores} />
        </div>

        {/* ── Row: Platform Billing (6) + Quick Actions (6) ── */}
        {hasStore ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PlatformBillingCard />
            <QuickActionsRow />
          </div>
        ) : (
          <QuickActionsRow />
        )}

        {/* ── Row 3: Top Products + Recent Orders ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">

          {/* Top Products */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-[18px] pt-4 pb-3 flex items-center justify-between border-b border-bone">
              <p className="text-sm font-bold text-charcoal">Top Products</p>
              {hasStore && (
                <button onClick={() => navigate(`/seller/store/${storeId}/products`)} className="bg-transparent border-0 cursor-pointer text-[13px] text-slate font-medium flex items-center gap-1 hover:text-charcoal transition-colors">
                  View All <ArrowRight size={14} />
                </button>
              )}
            </div>
            <div className="px-[18px] py-3 space-y-[14px]">
              {loading || storesLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-8 w-full" />)
              ) : !hasStore || topProducts.length === 0 ? (
                <p className="text-[12.5px] text-slate py-2">{hasStore ? 'No product sales in the last 7 days yet.' : 'Create a store to see your top products.'}</p>
              ) : topProducts.map((p, i) => (
                <div key={p.productId}>
                  <div className="flex items-center justify-between mb-[6px]">
                    <div className="flex items-center gap-[7px] min-w-0">
                      <span className="text-[10px] font-bold text-slate shrink-0 w-4">#{i + 1}</span>
                      <span className="text-[12px] font-medium text-charcoal truncate">{p.name}</span>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <span className="text-[12px] font-bold text-carbon">{formatCurrency(p.revenue)}</span>
                      <span className="text-[10px] text-slate ml-1">{p.unitsSold} sold</span>
                    </div>
                  </div>
                  <div className="h-[3px] bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange rounded-full" style={{ width: `${Math.round((p.revenue / maxProductRevenue) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders — Table component */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 pt-4 pb-[10px] flex items-center justify-between">
              <p className="text-sm font-bold text-charcoal">Recent Orders</p>
              {hasStore && (
                <button onClick={() => navigate(`/seller/store/${storeId}/orders`)} className="bg-transparent border-0 cursor-pointer text-[13px] text-slate font-medium flex items-center gap-1 hover:text-charcoal transition-colors">
                  View All <ArrowRight size={14} />
                </button>
              )}
            </div>
            {!hasStore ? (
              <p className="px-5 py-4 text-[12.5px] text-slate">Create a store to see recent orders.</p>
            ) : (
              <Table
                columns={ORDER_COLUMNS}
                data={recentOrders}
                keyExtractor={row => row.orderId}
                loading={loading || storesLoading}
                emptyState={{ title: 'No orders yet', description: 'Orders will show up here once customers start buying.' }}
              />
            )}
          </div>
        </div>

      </div>
    </>
  );
}
