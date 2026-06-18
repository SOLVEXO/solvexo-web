import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { StorePageHeader } from '@/components/layouts/StoreLayout';
import { AreaChart, BarChart, DonutChart } from '@/components/comman/charts';

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
  { label: 'Marketplace Search', value: 42 },
  { label: 'Direct Link',        value: 23 },
  { label: 'Social Media',       value: 18 },
  { label: 'Email',              value: 11 },
  { label: 'Other',              value: 6  },
];

const topProducts = [
  { name: 'Grade 5 Math Bundle',            revenue: '$8,403', orders: 171 },
  { name: 'Reading Comprehension Passages',  revenue: '$5,286', orders: 240 },
  { name: 'Brand Identity Figma Kit',        revenue: '$4,251', orders: 109 },
  { name: 'Ceramic Mug Set (2pk)',           revenue: '$3,596', orders: 62  },
  { name: 'Scented Soy Candle',             revenue: '$3,264', orders: 136 },
];

const metrics = [
  { label: 'Total Revenue',   value: '$36,800', trend: '+28.4% YoY',         sub: null,                 trendUp: true },
  { label: 'Total Orders',    value: '736',     trend: '+182 vs last period', sub: null,                 trendUp: true },
  { label: 'Avg Order Value', value: '$50.00',  trend: '+4.2%',               sub: null,                 trendUp: true },
  { label: 'Repeat Buyers',   value: '31%',     trend: 'Improving',           sub: 'Of total customers', trendUp: true },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreAnalytics() {
  usePageTitle('Analytics');
  const [period, setPeriod] = useState('Last 6 months');

  return (
    <>
      <StorePageHeader
        title="Analytics"
        subtitle="Understand your store performance and growth trends."
        actions={
          <>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-3 py-[7px] text-[13px] border border-bone rounded-lg bg-white text-charcoal outline-none cursor-pointer w-[160px]"
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

        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-charcoal leading-[1.15]">{m.value}</p>
              {m.trend && <p className="text-xs text-[#2D8A4E] mt-1">▲ {m.trend}</p>}
              {m.sub   && <p className="text-xs text-slate mt-0.5">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          <AreaChart
            data={monthlyData}
            dataKey="revenue"
            xKey="month"
            title="Revenue Over Time"
            height={220}
            valuePrefix="$"
          />
          <BarChart
            data={monthlyData}
            dataKey="orders"
            xKey="month"
            title="Orders per Month"
            height={220}
            valueSuffix=" orders"
          />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-4">
          <DonutChart
            data={trafficSources}
            title="Traffic Sources"
            centerLabel="Total"
            size={180}
          />

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
                    <p className="text-[13px] font-medium text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">{p.name}</p>
                    <p className="text-[11px] text-slate mt-px">{p.orders} orders</p>
                  </div>
                  <span className="text-[13px] font-bold text-charcoal shrink-0">{p.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
