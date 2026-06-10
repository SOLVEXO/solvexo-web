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
    <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, padding: '6px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12, fontFamily: poppins }}>
      <p style={{ color: '#8C8A82', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700, color: '#141413' }}>${payload[0].value.toLocaleString()}</p>
    </div>
  );
}

function OrdersTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, padding: '6px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12, fontFamily: poppins }}>
      <p style={{ color: '#8C8A82', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700, color: '#141413' }}>{payload[0].value} orders</p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E8E6DC',
  borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

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
              style={{
                padding: '7px 12px', fontSize: 13, border: '1px solid #E8E6DC',
                borderRadius: 8, background: '#fff', color: '#2C2A28',
                outline: 'none', cursor: 'pointer', fontFamily: poppins, width: 160,
              }}
            >
              <option>Last 6 months</option>
              <option>Last 30 days</option>
              <option>Last year</option>
            </select>
            <button style={{
              padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC',
              borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945',
              cursor: 'pointer', fontFamily: poppins,
            }}>
              Export PDF
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ ...cardStyle, padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {m.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>
                {m.value}
              </p>
              {m.trend && (
                <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>▲ {m.trend}</p>
              )}
              {m.sub && (
                <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 2 }}>{m.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Revenue Over Time */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px 8px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>Revenue Over Time</p>
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
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px 8px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>Orders per Month</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Traffic Sources */}
          <div style={{ ...cardStyle, padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 20 }}>Traffic Sources</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {trafficSources.map(src => (
                <div key={src.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', fontFamily: poppins }}>{src.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#141413', fontFamily: poppins }}>{src.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#E8E6DC', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${src.pct}%`, background: '#D97757', height: '100%', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products by Revenue */}
          <div style={{ ...cardStyle, padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 20 }}>Top Products by Revenue</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topProducts.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 26, height: 26, background: '#FBECE4', color: '#B95A3A',
                    borderRadius: 7, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 700,
                    flexShrink: 0, fontFamily: poppins,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: poppins }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#8C8A82', marginTop: 1, fontFamily: poppins }}>
                      {p.orders} orders
                    </p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#141413', flexShrink: 0, fontFamily: poppins }}>
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