import { useNavigate } from 'react-router-dom';
import { AreaChart } from '@/components/comman/charts';
import { ArrowRight, Store } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { Table } from '@/components/comman/ui/Table';
import type { TableColumn } from '@/components/comman/ui/Table';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useMyStores } from '@/hooks/store/useMyStores';

// ── Data ──────────────────────────────────────────────────────────────────────
const revenueData = [
  { day: 'Mon', sales: 1240 },
  { day: 'Tue', sales: 1820 },
  { day: 'Wed', sales: 1450 },
  { day: 'Thu', sales: 2100 },
  { day: 'Fri', sales: 1900 },
  { day: 'Sat', sales: 2640 },
  { day: 'Sun', sales: 2200 },
];

const topProducts = [
  { name: 'Grade 5 Math Bundle',        sales: 847, revenue: '$41,503', pct: 100 },
  { name: 'Fractions Mastery Kit',      sales: 623, revenue: '$11,214', pct: 74  },
  { name: 'Reading Comprehension Pack', sales: 501, revenue: '$11,022', pct: 59  },
  { name: 'Science Lab Worksheets',     sales: 389, revenue: '$5,835',  pct: 46  },
  { name: 'Creative Writing Prompts',   sales: 278, revenue: '$3,336',  pct: 33  },
];

const recentOrders = [
  { id: '#8821', customer: 'Sarah M.', initials: 'SM', product: 'Grade 5 Math Bundle', amount: '$49.00', status: 'Paid' },
  { id: '#8820', customer: 'David R.', initials: 'DR', product: 'Fractions Mastery Kit', amount: '$18.00', status: 'Fulfilled' },
  { id: '#8819', customer: 'Lena K.', initials: 'LK', product: 'Creative Writing Prompts', amount: '$12.00', status: 'Pending' },
  { id: '#8818', customer: 'Tom B.', initials: 'TB', product: 'Science Lab Worksheets', amount: '$15.00', status: 'Paid' },
];

const metrics = [
  { label: "Today's Revenue", value: '$1,284', trend: '+12.4% vs yesterday', sub: null },
  { label: 'Orders', value: '38', trend: '6 pending', sub: 'Active orders' },
  { label: 'Visitors', value: '2,140', trend: '+8.2% this week', sub: null },
  { label: 'Conversion', value: '1.78%', trend: '+0.2% vs last week', sub: null },
] as const;

// Initials avatar color map
const avatarColors: Record<string, { bg: string; color: string }> = {
  SM: { bg: '#FDECEA', color: '#C0392B' },
  DR: { bg: '#EAF3FB', color: '#2156A8' },
  LK: { bg: '#EAF7EF', color: '#1E7A3C' },
  TB: { bg: '#FFF4E5', color: '#B36200' },
};

// Status badge styles
const statusStyles: Record<string, { bg: string; color: string }> = {
  Paid: { bg: '#E3F4EA', color: '#1E7A3C' },
  Fulfilled: { bg: '#EAF0FB', color: '#2156A8' },
  Pending: { bg: '#FFF0E0', color: '#B36200' },
};

// ── Order table columns ───────────────────────────────────────────────────────
type OrderRow = { id: string; customer: string; initials: string; product: string; amount: string; status: string };

const ORDER_COLUMNS: TableColumn<OrderRow>[] = [
  {
    key: 'id', header: 'Order',
    render: row => <span className="font-semibold text-brand-orange">{row.id}</span>,
  },
  {
    key: 'customer', header: 'Customer',
    render: row => {
      const av = avatarColors[row.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
      return (
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-full text-[9px] font-bold flex items-center justify-center shrink-0" style={{ background: av.bg, color: av.color }}>
            {row.initials}
          </div>
          <span className="text-[#4A4945]">{row.customer}</span>
        </div>
      );
    },
  },
  {
    key: 'product', header: 'Product',
    render: row => <span className="text-[#4A4945]">{row.product}</span>,
  },
  {
    key: 'amount', header: 'Amount',
    render: row => <span className="font-semibold text-charcoal">{row.amount}</span>,
  },
  {
    key: 'status', header: 'Status',
    render: row => {
      const st = statusStyles[row.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
      return (
        <span className="inline-block text-[11px] font-semibold px-[10px] py-[3px] rounded-[5px]" style={{ background: st.bg, color: st.color }}>
          {row.status}
        </span>
      );
    },
  },
  {
    key: 'actions', header: 'Actions',
    render: () => (
      <button className="bg-transparent border-0 cursor-pointer text-xs text-brand-orange font-semibold hover:underline">
        View
      </button>
    ),
  },
];

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

function MyStoreCard() {
  const navigate = useNavigate();
  const { stores, loading, error } = useMyStores();

  if (loading) return <MyStoreCardSkeleton />;

  if (error || stores.length === 0) {
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
                  ? <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
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

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerDashboard() {
  const navigate = useNavigate();
  const subtitle = "Welcome back — Here's your store overview.";

  return (
    <>
      <SellerPageHeader
        title="Dashboard"
        subtitle={subtitle}
        actions={
          <>
            
          </>
        }
      />

      <div className="px-5 pt-4 pb-6 flex flex-col gap-4">

        {/* ── Row 1: Metric Cards ── */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            >
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-[6px]">
                {m.label}
              </p>
              <p className="text-[28px] font-bold text-charcoal leading-[1.15]">
                {m.value}
              </p>
              <p className="text-xs text-[#2D8A4E] mt-[5px]">
                ▲ {m.trend}
              </p>
              {m.sub && (
                <p className="text-[11px] text-slate mt-0.5">
                  {m.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ── Row 2: Revenue Chart + My Store (col-8 + col-4) ── */}
        <div className="grid grid-cols-[2fr_1fr] gap-4">
          <AreaChart
            data={revenueData}
            dataKey="sales"
            xKey="day"
            title="Revenue — Last 7 Days"
            action={<span className="bg-brand-pale-orange text-[#C96847] text-xs font-semibold px-[10px] py-[3px] rounded-md">$13,434 total</span>}
            height={240}
            valuePrefix="$"
            yTickFormatter={v => `$${v.toLocaleString()}`}
          />
          <MyStoreCard />
        </div>

        {/* ── Row 3: Top Products + Recent Orders ── */}
        <div className="grid grid-cols-[320px_1fr] gap-4">

          {/* Top Products */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-[18px] pt-4 pb-3 flex items-center justify-between border-b border-bone">
              <p className="text-sm font-bold text-charcoal">Top Products</p>
              <button onClick={() => navigate('/seller/products')} className="bg-transparent border-0 cursor-pointer text-[13px] text-slate font-medium flex items-center gap-1 hover:text-charcoal transition-colors">
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="px-[18px] py-3 space-y-[14px]">
              {topProducts.map((p, i) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-[6px]">
                    <div className="flex items-center gap-[7px] min-w-0">
                      <span className="text-[10px] font-bold text-slate shrink-0 w-4">#{i + 1}</span>
                      <span className="text-[12px] font-medium text-charcoal truncate">{p.name}</span>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <span className="text-[12px] font-bold text-carbon">{p.revenue}</span>
                      <span className="text-[10px] text-slate ml-1">{p.sales} sales</span>
                    </div>
                  </div>
                  <div className="h-[3px] bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange rounded-full" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders — Table component */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 pt-4 pb-[10px] flex items-center justify-between">
              <p className="text-sm font-bold text-charcoal">Recent Orders</p>
              <button onClick={() => navigate('/seller/orders')} className="bg-transparent border-0 cursor-pointer text-[13px] text-slate font-medium flex items-center gap-1 hover:text-charcoal transition-colors">
                View All <ArrowRight size={14} />
              </button>
            </div>
            <Table
              columns={ORDER_COLUMNS}
              data={recentOrders}
              keyExtractor={row => row.id}
            />
          </div>
        </div>

      </div>
    </>
  );
}
