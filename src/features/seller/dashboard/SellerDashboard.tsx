import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart } from '@/components/comman/charts';
import {
  ArrowRight, Store, AlertCircle, DollarSign, Package, ShoppingBag, Repeat,
  BarChart2, Settings, Sparkles, CircleCheck, PackagePlus, Rocket,
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
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { apiGetSellerPlatformOverview } from '@/api/services/platformPlans';
import {
  apiSellerAnalyticsOverview, apiSellerAnalyticsRevenueOverTime, apiSellerAnalyticsTopProducts,
  type SellerOverviewData, type RevenuePoint, type TopProductRow,
} from '@/api/services/analytics/analytics';
import { apiGetMySellerOrders, type SellerOrder } from '@/api/services/product';
import { formatCurrency, formatNumber, formatPercent, formatBucketLabel } from '@/components/comman/analytics/format';
import { formatMoneyCompact, currencySymbol } from '@/utils/currency';

// ── Workspace hero — replaces the plain title/subtitle with a real-data
// summary banner: who's logged in, how many stores they run, and the most
// common next actions, front and center. ──────────────────────────────────
function WorkspaceHero({ storeCount, activeCount }: { storeCount: number; activeCount: number }) {
  const navigate = useNavigate();
  const { profile } = useGetProfile();

  return (
    <div className="dash-section-enter relative overflow-hidden rounded-2xl bg-gradient-to-br from-carbon via-[#241f1b] to-brand-deep-orange px-6 py-6 sm:px-7 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
      />
      <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-brand-orange/25 blur-3xl" />

      <div className="relative flex items-center gap-4 flex-1 min-w-0">
        {profile?.profileImage ? (
          <img
            loading="lazy" decoding="async"
            src={profile.profileImage} alt={profile.name}
            className="size-14 rounded-2xl object-cover ring-2 ring-white/15 shrink-0"
          />
        ) : (
          <div className="size-14 rounded-2xl bg-white/10 ring-2 ring-white/15 flex items-center justify-center shrink-0">
            <Avatar name={profile?.name ?? 'Seller'} size={44} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[20px] sm:text-[22px] font-bold text-white leading-tight truncate">
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-[6px] rounded-full bg-white/10 px-[10px] py-[4px] text-[12px] font-medium text-white/85">
              <Store size={12} /> {storeCount} store{storeCount === 1 ? '' : 's'}
            </span>
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-[6px] rounded-full bg-success/20 px-[10px] py-[4px] text-[12px] font-medium text-[#8fe3ac]">
                <CircleCheck size={12} /> {activeCount} active
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-2 flex-wrap shrink-0">
        <Button variant="outline" size="sm" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" onClick={() => navigate('/seller/analytics')}>
          View Analytics
        </Button>
        <Button variant="primary" size="sm" icon={<Sparkles size={14} />} onClick={() => navigate('/onboard')}>
          Create Store
        </Button>
      </div>
    </div>
  );
}

// ── New-seller guided setup — replaces the metrics/chart/orders rows (which
// have nothing real to show yet) with one coherent "get started" panel
// instead of three separate blank widgets each repeating "create a store".
// No fabricated numbers anywhere here — just the real path to the first sale. ──
const GETTING_STARTED_STEPS: { Icon: LucideIcon; title: string; description: string }[] = [
  { Icon: Store,       title: 'Create your store',  description: 'Set up your store profile, branding, and business details.' },
  { Icon: PackagePlus, title: 'Add your products', description: 'List physical goods, digital downloads, or courses to sell.' },
  { Icon: Rocket,       title: 'Start selling',     description: 'Go live on the marketplace and start taking real orders.' },
];

function NewSellerGuide() {
  const navigate = useNavigate();
  return (
    <div className="dash-section-enter bg-white border border-bone rounded-2xl px-6 py-7 sm:px-8 sm:py-8">
      <div className="max-w-[560px] mx-auto text-center mb-7">
        <p className="text-[16px] font-bold text-carbon mb-1">Let's get your store live</p>
        <p className="text-[13px] text-slate leading-[1.6]">
          You don't have a store yet — your revenue, orders, and product performance will show up here once you do. It only takes a few minutes to get started.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[720px] mx-auto mb-7">
        {GETTING_STARTED_STEPS.map(({ Icon, title, description }, i) => (
          <div key={title} className="relative flex flex-col items-center text-center gap-2 px-3 py-4 rounded-xl bg-cream">
            <span className="absolute top-2 left-2 text-[10px] font-bold text-slate/50">{i + 1}</span>
            <span className="flex size-10 items-center justify-center rounded-full bg-white border border-bone text-brand-orange">
              <Icon size={17} />
            </span>
            <p className="text-[12.5px] font-semibold text-charcoal">{title}</p>
            <p className="text-[11px] text-slate leading-[1.5]">{description}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Button variant="primary" icon={<Sparkles size={14} />} onClick={() => navigate('/onboard')}>
          Create Your Store
        </Button>
      </div>
    </div>
  );
}

// ── My Store Card ────────────────────────────────────────────────────────────
const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: '#E3F4EA', color: '#1E7A3C' },
  inactive: { bg: '#F0EEE6', color: '#8C8A82' },
  pending: { bg: '#FFF0E0', color: '#B36200' },
  under_review: { bg: '#E6F1FB', color: '#1A72C2' },
  rejected: { bg: '#FDEAEA', color: '#C13030' },
  suspended: { bg: '#FDEAEA', color: '#C13030' },
};

function MyStoreCardSkeleton() {
  return (
    <div className="bg-white border border-bone rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-[10px] flex items-center justify-between">
        <SkeletonBox width={72} height={14} rounded="4px" />
        <SkeletonBox width={44} height={11} rounded="3px" />
      </div>
      <div className="px-2 pb-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`flex items-center gap-3 px-[10px] py-[11px]${i < 2 ? ' border-b border-[#f5f4ef]' : ''}`}>
            <SkeletonBox width={32} height={32} rounded="8px" className="shrink-0" />
            <div className="flex-1 flex flex-col gap-[6px]">
              <SkeletonBox width={100} height={12} rounded="4px" />
              <SkeletonBox width={64} height={10} rounded="4px" />
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
      <div className="bg-white border border-bone rounded-2xl px-5 py-8 text-center">
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
      <div className="bg-white border border-bone rounded-2xl px-5 py-8 text-center">
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
          onClick={() => navigate('/onboard')}
        >
          Create Store
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-bone rounded-2xl hover:border-slate/30 transition-colors duration-200 overflow-hidden h-full flex flex-col">
      <div className="px-5 pt-4 pb-2 flex items-start justify-between">
        <p className="text-sm font-bold text-charcoal">My Stores</p>
        <div className="text-right">
          <span className="text-[11px] text-slate">
            Total ({stores.length})
          </span>
          <br />
          <button
            onClick={() => navigate('/seller/stores')}
            className="bg-transparent border-0 cursor-pointer p-0 text-[11px] text-brand-orange font-semibold mt-0.5 hover:text-brand-deep-orange transition-colors"
          >
            View All
          </button>
        </div>
      </div>
      <div className="px-2 pb-2 flex-1 max-h-[252px] overflow-y-auto scrollbar-hide">
        {stores.map((store, i) => {
          const st = statusColors[store.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
          return (
            <button
              key={store._id}
              onClick={() => navigate(`/seller/store/${store._id}/dashboard`)}
              className="w-full flex items-center gap-3 px-[10px] py-[11px] bg-transparent border-0 cursor-pointer text-left transition-colors duration-150 rounded-lg hover:bg-cream"
              style={{ borderBottom: i < stores.length - 1 ? '1px solid #F5F4EF' : 'none' }}
            >
              <div className="w-8 h-8 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0 overflow-hidden border border-[#edebe2]">
                {store.logo
                  ? <img loading="lazy" decoding="async" src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                  : <Store size={15} className="text-brand-orange" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">{store.name}</p>
                <div className="flex items-center gap-[6px] mt-0.5">
                  <span className="text-[10px] font-semibold px-[6px] py-px rounded-[20px] capitalize" style={{ background: st.bg, color: st.color }}>
                    {store.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate">/{store.slug}</span>
                </div>
              </div>
              <span className="text-base text-dark-text">›</span>
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
    apiGetSellerPlatformOverview().then(res => setStores(res.data.stores ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="bg-white border border-bone rounded-2xl h-full min-h-[220px] overflow-hidden"><SkeletonBox height="100%" width="100%" rounded="0" /></div>;
  if (stores.length === 0) return null;

  const totalUSD = stores.reduce((s, r) => s + r.totalPaidUSD, 0);

  return (
    <div className="bg-white border border-bone rounded-2xl hover:border-slate/30 transition-colors duration-200 overflow-hidden h-full flex flex-col">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#f3f2ec]">
        <p className="text-sm font-bold text-charcoal">Platform Billing</p>
        <span className="bg-brand-pale-orange text-[#c96847] text-xs font-semibold px-[10px] py-[3px] rounded-md">
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
              className="w-full flex items-center gap-3 px-[10px] py-[11px] bg-transparent border-0 cursor-pointer text-left hover:bg-cream rounded-lg transition-colors duration-150"
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
interface QuickAction { Icon: LucideIcon; label: string; path: string; gradient: string; iconColor: string }

const QUICK_ACTIONS: QuickAction[] = [
  { Icon: Store,     label: 'My Stores',    path: '/seller/stores',    gradient: 'from-brand-pale-orange to-brand-pale-orange', iconColor: '#D97757' },
  { Icon: Sparkles,  label: 'Create Store', path: '/onboard',          gradient: 'from-[#f3e8ff] to-[#ede0fe]',         iconColor: '#A855F7' },
  { Icon: BarChart2, label: 'Analytics',    path: '/seller/analytics', gradient: 'from-info-bg to-[#dcebfa]',         iconColor: '#0EA5E9' },
  { Icon: Settings,  label: 'Settings',     path: '/seller/settings',  gradient: 'from-cream to-bone',                  iconColor: '#8C8A82' },
];

function QuickActionsRow() {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-bone rounded-2xl hover:border-slate/30 transition-colors duration-200 h-full flex flex-col">
      <div className="px-5 pt-4 pb-3 border-b border-[#f3f2ec]">
        <p className="text-sm font-bold text-charcoal">Quick Actions</p>
      </div>
      <div className="px-4 py-4 grid grid-cols-2 gap-3 flex-1">
        {QUICK_ACTIONS.map(({ Icon, label, path, gradient, iconColor }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`group flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-[14px] border border-bone bg-gradient-to-br ${gradient} cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:border-brand-orange/25 w-full`}
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

// ── Recent orders table columns ──────────────────────────────────────────────
// A static const, not a function of a single dashboard-level currency — each
// row carries its own `currency` (fixed per store), which matters here
// specifically because this table can span stores in different currencies.
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
    render: row => <span className="font-semibold text-charcoal">{formatMoneyCompact(row.amount, row.currency)}</span>,
  },
  {
    key: 'status', header: 'Status',
    render: row => <StatusBadge status={row.status} size="sm" />,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerDashboard() {
  const navigate = useNavigate();

  const { stores, loading: storesLoading, error: storesError, refetch: refetchStores } = useMyStores();
  const hasStore = stores.length > 0;
  const activeStoreCount = stores.filter(s => s.status === 'active').length;

  // "View All" next to Top Products / Recent Orders: there's no cross-store
  // products/orders list page today, so the only destination that actually
  // matches the label is the one store's own list when there's exactly one
  // store to disambiguate to — otherwise fall back to the store picker
  // rather than guessing which store's list to open.
  const singleStoreId = stores.length === 1 ? stores[0]._id : null;
  const goToTopProducts = () => navigate(singleStoreId ? `/seller/store/${singleStoreId}/products` : '/seller/stores');
  const goToRecentOrders = () => navigate(singleStoreId ? `/seller/store/${singleStoreId}/orders` : '/seller/stores');

  const [overview, setOverview]       = useState<SellerOverviewData | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Aggregated across every store this seller owns — not just one — so the
  // top-level seller dashboard reflects the whole business, not a single store.
  useEffect(() => {
    if (storesLoading) return;
    if (!hasStore) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      apiSellerAnalyticsOverview({ range: '7d' }),
      apiSellerAnalyticsRevenueOverTime({ range: '7d' }),
      apiSellerAnalyticsTopProducts({ limit: 5, sort: 'revenue' }),
      apiGetMySellerOrders(1, 4),
    ])
      .then(([overviewRes, revenueRes, productsRes, ordersRes]) => {
        if (cancelled) return;
        setOverview(overviewRes.data);
        setRevenueSeries(revenueRes.data.series ?? []);
        setTopProducts(productsRes.data ?? []);
        setRecentOrders(ordersRes.data.orders ?? []);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hasStore, storesLoading]);

  // Backend-resolved (see AnalyticsService.resolveScopeCurrency) rather than
  // guessed from `stores` here — `null` means this seller's stores span more
  // than one currency, so every money figure below is a blended sum across
  // incompatible currencies and must not be labeled with any one symbol.
  const currency = overview?.currency ?? null;
  const currencyMixed = !!overview && stores.length > 1 && currency === null;

  const revenueSparkline = revenueSeries.map(p => p.grossRevenue);

  const metrics = overview ? [
    { label: 'Revenue (7 days)',  value: formatMoneyCompact(overview.totalRevenue, currency), trend: overview.totalRevenueChangePercent != null ? formatPercent(overview.totalRevenueChangePercent, { signed: true }) : null, trendUp: (overview.totalRevenueChangePercent ?? 0) >= 0, sub: null, icon: <DollarSign size={16} />, color: '#D97757', sparkline: revenueSparkline },
    { label: 'Orders (7 days)',   value: formatNumber(overview.totalOrders),    trend: overview.totalOrdersChange ? formatPercent(overview.totalOrdersChange, { signed: true }) : null, trendUp: (overview.totalOrdersChange ?? 0) >= 0, sub: null, icon: <Package size={16} />, color: '#8B5CF6' },
    { label: 'Avg Order Value',   value: formatMoneyCompact(overview.avgOrderValue, currency), trend: overview.avgOrderValueChangePercent != null ? formatPercent(overview.avgOrderValueChangePercent, { signed: true }) : null, trendUp: (overview.avgOrderValueChangePercent ?? 0) >= 0, sub: null, icon: <ShoppingBag size={16} />, color: '#0EA5E9' },
    { label: 'Repeat Buyers',     value: formatPercent(overview.repeatBuyerPercent), trend: null, trendUp: true, sub: overview.repeatBuyerTrend === 'improving' ? 'Improving' : overview.repeatBuyerTrend === 'declining' ? 'Declining' : 'Steady', icon: <Repeat size={16} />, color: '#22C55E' },
  ] : [];

  const chartData = revenueSeries.map(p => ({ day: formatBucketLabel(p.date, 'day'), sales: p.grossRevenue }));
  const revenueTotal = revenueSeries.reduce((s, p) => s + p.grossRevenue, 0);
  const maxProductRevenue = Math.max(1, ...topProducts.map(p => p.revenue));

  return (
    <>
      <SellerPageHeader
        title="Dashboard"
        subtitle="Here's how all your stores are doing."
      />

      <div className="px-5 pt-4 pb-6 flex flex-col gap-4">

        {/* ── Workspace hero ── */}
        <WorkspaceHero storeCount={stores.length} activeCount={activeStoreCount} />

        {error && (
          <div className="dash-section-enter flex items-center gap-2 px-4 py-3 rounded-xl bg-error-bg text-error text-[12.5px] border border-error/10">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {currencyMixed && (
          <div className="dash-section-enter flex items-center gap-2 px-4 py-3 rounded-xl bg-brand-pale-orange text-[#8a4a2e] text-[12.5px] border border-brand-orange/15">
            <AlertCircle size={14} className="shrink-0" />
            Your stores use different currencies, so revenue and order-value figures below are a blended total across them — open a store's own dashboard for an amount in that store's currency.
          </div>
        )}

        {/* ── New seller: one clear next step instead of a wall of empty
            widgets repeating "create a store" — everything below needs a
            real store to show real data, so it's hidden rather than shown
            blank. ── */}
        {!storesLoading && !hasStore && <NewSellerGuide />}

        {/* ── Row 1: Metric Cards ── */}
        {(storesLoading || hasStore) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(loading || storesLoading) ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)
          ) : metrics.map((m) => (
            <MetricCard key={m.label} label={m.label} value={m.value} trend={m.trend ?? undefined} trendUp={m.trendUp} sub={m.sub ?? undefined} icon={m.icon} color={m.color} sparkline={m.sparkline} />
          ))}
        </div>
        )}

        {/* ── Revenue chart — dominant, full-width ── */}
        {(storesLoading || hasStore) && (
        <AreaChart
          data={chartData}
          dataKey="sales"
          xKey="day"
          title="Revenue — Last 7 Days"
          action={hasStore ? <span className="bg-brand-pale-orange text-[#c96847] text-xs font-semibold px-[10px] py-[3px] rounded-md">{formatMoneyCompact(revenueTotal, currency)} total</span> : undefined}
          height={320}
          valuePrefix={currencySymbol(currency)}
          yTickFormatter={v => `${currencySymbol(currency)}${v.toLocaleString()}`}
        />
        )}

        {/* ── Row: My Stores + Platform Billing + Quick Actions ── */}
        {(storesLoading || hasStore) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MyStoreCard stores={stores} loading={storesLoading} error={storesError} onRetry={refetchStores} />
          {hasStore ? <PlatformBillingCard /> : null}
          <QuickActionsRow />
        </div>
        )}

        {/* ── Row: Top Products + Recent Orders ── */}
        {(storesLoading || hasStore) && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">

          {/* Top Products */}
          <div className="bg-white border border-bone rounded-2xl hover:border-slate/30 transition-colors duration-200 overflow-hidden">
            <div className="px-[18px] pt-4 pb-3 flex items-center justify-between border-b border-bone">
              <p className="text-sm font-bold text-charcoal">Top Products</p>
              {hasStore && (
                <button onClick={goToTopProducts} className="bg-transparent border-0 cursor-pointer text-[13px] text-slate font-medium flex items-center gap-1 hover:text-charcoal transition-colors">
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
                <div key={p.productId} className="group">
                  <div className="flex items-center justify-between mb-[6px]">
                    <div className="flex items-center gap-[7px] min-w-0">
                      <span className="text-[10px] font-bold text-slate shrink-0 w-4">#{i + 1}</span>
                      <span className="text-[12px] font-medium text-charcoal truncate">{p.name}</span>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <span className="text-[12px] font-bold text-carbon">{formatMoneyCompact(p.revenue, currency)}</span>
                      <span className="text-[10px] text-slate ml-1">{p.unitsSold} sold</span>
                    </div>
                  </div>
                  <div className="h-[3px] bg-cream rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-orange rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.round((p.revenue / maxProductRevenue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders — Table component */}
          <div className="bg-white border border-bone rounded-2xl hover:border-slate/30 transition-colors duration-200 overflow-hidden">
            <div className="px-5 pt-4 pb-[10px] flex items-center justify-between">
              <p className="text-sm font-bold text-charcoal">Recent Orders</p>
              {hasStore && (
                <button onClick={goToRecentOrders} className="bg-transparent border-0 cursor-pointer text-[13px] text-slate font-medium flex items-center gap-1 hover:text-charcoal transition-colors">
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
        )}

      </div>
    </>
  );
}
