import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
const monthlyData = [
  { month: 'Dec', revenue: 4200, orders: 84  },
  { month: 'Jan', revenue: 5100, orders: 102 },
  { month: 'Feb', revenue: 4800, orders: 96  },
  { month: 'Mar', revenue: 6200, orders: 124 },
  { month: 'Apr', revenue: 7400, orders: 148 },
  { month: 'May', revenue: 9100, orders: 182 },
];

const trafficSources = [
  { label: 'Marketplace Search', pct: 42 },
  { label: 'Direct Link',        pct: 23 },
  { label: 'Social Media',       pct: 18 },
  { label: 'Email',              pct: 11 },
  { label: 'Other',              pct: 6  },
];

const topProducts = [
  { name: 'Grade 5 Math Bundle',            revenue: '$8,403', orders: 171 },
  { name: 'Reading Comprehension Passages',  revenue: '$5,286', orders: 240 },
  { name: 'Brand Identity Figma Kit',        revenue: '$4,251', orders: 109 },
  { name: 'Ceramic Mug Set (2pk)',           revenue: '$3,596', orders: 62  },
  { name: 'Scented Soy Candle',             revenue: '$3,264', orders: 136 },
];

const metrics = [
  { label: 'Total Revenue',   value: '$36,800', trend: '+28.4% YoY',          sub: null,                  trendUp: true },
  { label: 'Total Orders',    value: '736',     trend: '+182 vs last period',  sub: null,                  trendUp: true },
  { label: 'Avg Order Value', value: '$50.00',  trend: '+4.2%',                sub: null,                  trendUp: true },
  { label: 'Repeat Buyers',   value: '31%',     trend: 'Improving',            sub: 'Of total customers',  trendUp: true },
] as const;

const poppins = "'Poppins', sans-serif";

// ── Custom Tooltips ───────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-xs">
      <p className="text-slate mb-0.5">{label}</p>
      <p className="font-bold text-charcoal">${payload[0].value.toLocaleString()}</p>
    </div>
  );
}

function OrdersTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-xs">
      <p className="text-slate mb-0.5">{label}</p>
      <p className="font-bold text-charcoal">{payload[0].value} orders</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerAnalytics() {
  usePageTitle('Analytics');
  const [period, setPeriod] = useState('Last 6 months');

  return (
    <>
      <SellerPageHeader
        title="Analytics"
        subtitle="Understand your store performance and growth trends."
        actions={
          <>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-3 py-[7px] text-[13px] border border-bone rounded-lg bg-white text-[#2C2A28] outline-none cursor-pointer w-[160px]"
            >
              <option>Last 6 months</option>
              <option>Last 30 days</option>
              <option>Last year</option>
            </select>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Export PDF
            </button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Metrics row ── */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">
                {m.label}
              </p>
              <p className="text-[28px] font-bold text-charcoal leading-[1.15]">
                {m.value}
              </p>
              {m.trend && (
                <p className="text-xs text-[#2D8A4E] mt-1">▲ {m.trend}</p>
              )}
              {m.sub && (
                <p className="text-xs text-slate mt-0.5">{m.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Revenue Over Time */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm font-bold text-charcoal">Revenue Over Time</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D97757" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D97757" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E8E6DC" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8C8A82', fontFamily: poppins }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C8A82', fontFamily: poppins }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={46} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#D97757" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: '#D97757', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders per Month */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm font-bold text-charcoal">Orders per Month</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E8E6DC" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8C8A82', fontFamily: poppins }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C8A82', fontFamily: poppins }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<OrdersTooltip />} />
                <Bar dataKey="orders" fill="#D97757" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Traffic Sources */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-5">
            <p className="text-sm font-bold text-charcoal mb-5">Traffic Sources</p>
            <div className="flex flex-col gap-[14px]">
              {trafficSources.map(src => (
                <div key={src.label}>
                  <div className="flex justify-between items-center mb-[6px]">
                    <span className="text-xs font-medium text-[#4A4945]">{src.label}</span>
                    <span className="text-xs font-bold text-charcoal">{src.pct}%</span>
                  </div>
                  <div className="h-[6px] bg-bone rounded-[3px] overflow-hidden">
                    <div className="bg-brand-orange h-full rounded-[3px]" style={{ width: `${src.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products by Revenue */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-5">
            <p className="text-sm font-bold text-charcoal mb-5">Top Products by Revenue</p>
            <div className="flex flex-col gap-[14px]">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-[26px] h-[26px] bg-brand-pale-orange text-[#B95A3A] rounded-[7px] flex items-center justify-center text-[11px] font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate mt-px">
                      {p.orders} orders
                    </p>
                  </div>
                  <span className="text-[13px] font-bold text-charcoal shrink-0">
                    {p.revenue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
