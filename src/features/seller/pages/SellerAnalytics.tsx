import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Button }     from '@/components/ui/Button';
import { Card }       from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Select }     from '@/components/ui/Input';
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

// Reference uses C.orange (#D97757) for ALL traffic bars — single color
const trafficSources = [
  { label: 'Marketplace Search', pct: 42 },
  { label: 'Direct Link',        pct: 23 },
  { label: 'Social Media',       pct: 18 },
  { label: 'Email',              pct: 11 },
  { label: 'Other',              pct: 6  },
];

const topProducts = [
  { name: 'Grade 5 Math Bundle',           revenue: '$8,403',  orders: 171 },
  { name: 'Reading Comprehension Passages', revenue: '$5,286',  orders: 240 },
  { name: 'Brand Identity Figma Kit',       revenue: '$4,251',  orders: 109 },
  { name: 'Ceramic Mug Set (2pk)',          revenue: '$3,596',  orders: 62  },
  { name: 'Scented Soy Candle',            revenue: '$3,264',  orders: 136 },
];

// ── Custom Tooltips ───────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-2 shadow-lg text-[12px]">
      <p className="text-slate mb-0.5">{label}</p>
      <p className="font-bold text-carbon">${payload[0].value.toLocaleString()}</p>
    </div>
  );
}

function OrdersTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-2 shadow-lg text-[12px]">
      <p className="text-slate mb-0.5">{label}</p>
      <p className="font-bold text-carbon">{payload[0].value} orders</p>
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
            <Select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="w-[160px]"
            >
              <option>Last 6 months</option>
              <option>Last 30 days</option>
              <option>Last year</option>
            </Select>
            <Button variant="ghost" size="sm">Export PDF</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Total Revenue"  value="$36,800" trend="+28.4% YoY"            trendUp />
          <MetricCard label="Total Orders"   value="736"     trend="+182 vs last period"    trendUp />
          <MetricCard label="Avg Order Value"value="$50.00"  trend="+4.2%"                  trendUp />
          <MetricCard label="Repeat Buyers"  value="31%"     trend="Improving"              trendUp sub="Of total customers" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Revenue over time */}
          <Card padding="none">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[14px] font-bold text-carbon">Revenue Over Time</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D97757" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D97757" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E8E6DC" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8C8A82' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C8A82' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={46} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#D97757" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: '#D97757' }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Orders per month */}
          <Card padding="none">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[14px] font-bold text-carbon">Orders per Month</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E8E6DC" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8C8A82' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C8A82' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<OrdersTooltip />} />
                <Bar dataKey="orders" fill="#D97757" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Traffic Sources */}
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-5">Traffic Sources</p>
            <div className="flex flex-col gap-3.5">
              {trafficSources.map(src => (
                <div key={src.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-charcoal">{src.label}</span>
                    <span className="text-[12px] font-bold text-carbon">{src.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#E8E6DC', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${src.pct}%`,
                        background: '#D97757',
                        height: '100%',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Products by Revenue */}
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-5">Top Products by Revenue</p>
            <div className="flex flex-col gap-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div
                    style={{
                      width: 24, height: 24, background: '#FBECE4', color: '#B95A3A',
                      borderRadius: 6, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-carbon truncate">{p.name}</p>
                    <p className="text-[11px] text-slate">{p.orders} orders</p>
                  </div>
                  <span className="text-[13px] font-bold text-carbon flex-shrink-0">{p.revenue}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
