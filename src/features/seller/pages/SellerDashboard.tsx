import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Package, Monitor, Sparkles, BarChart2, ClipboardList, ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button }      from '@/components/ui/Button';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

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

const quickActions: { Icon: LucideIcon; label: string; path: string }[] = [
  { Icon: Package,       label: 'Add New Product',     path: '/seller/products/add' },
  { Icon: Monitor,       label: 'Open POS Register',   path: '/seller/pos'          },
  { Icon: Sparkles,      label: 'AI Write Listing',    path: '/seller/ai'           },
  { Icon: BarChart2,     label: 'View Full Analytics', path: '/seller/analytics'    },
  { Icon: ClipboardList, label: 'Manage Inventory',    path: '/seller/inventory'    },
];

const recentOrders = [
  { id: '#8821', customer: 'Sarah M.',  initials: 'SM', product: 'Grade 5 Math Bundle',      amount: '$49.00', status: 'Paid'      },
  { id: '#8820', customer: 'David R.',  initials: 'DR', product: 'Fractions Mastery Kit',    amount: '$18.00', status: 'Fulfilled' },
  { id: '#8819', customer: 'Lena K.',   initials: 'LK', product: 'Creative Writing Prompts', amount: '$12.00', status: 'Pending'   },
  { id: '#8818', customer: 'Tom B.',    initials: 'TB', product: 'Science Lab Worksheets',   amount: '$15.00', status: 'Paid'      },
];

const metrics = [
  { label: "Today's Revenue", value: '$1,284', trend: '+12.4% vs yesterday', sub: null            },
  { label: 'Orders',          value: '38',     trend: '6 pending',           sub: 'Active orders' },
  { label: 'Visitors',        value: '2,140',  trend: '+8.2% this week',     sub: null            },
  { label: 'Conversion',      value: '1.78%',  trend: '+0.2% vs last week',  sub: null            },
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
  Paid:      { bg: '#E3F4EA', color: '#1E7A3C' },
  Fulfilled: { bg: '#EAF0FB', color: '#2156A8' },
  Pending:   { bg: '#FFF0E0', color: '#B36200' },
};

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E8E6DC',
      borderRadius: 8,
      padding: '6px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontSize: 12,
      fontFamily: "'Poppins', sans-serif",
    }}>
      <p style={{ color: '#8C8A82', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700, color: '#141413' }}>${payload[0].value.toLocaleString()}</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerDashboard() {
  const navigate = useNavigate();

  return (
    <>
      <SellerPageHeader
        title="Dashboard"
        subtitle="Welcome back, Alex — Here's your store overview."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate('/seller/products/add')}>
              + Add Product
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/seller/pos')}>
              Open POS
            </Button>
          </>
        }
      />

      <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Row 1: Metric Cards (separate boxes) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map((m) => (
            <div
              key={m.label}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E6DC',
                borderRadius: 10,
                padding: '16px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <p style={{
                fontSize: 11, fontWeight: 500, color: '#8C8A82',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: 6, fontFamily: "'Poppins', sans-serif",
              }}>
                {m.label}
              </p>
              <p style={{
                fontSize: 28, fontWeight: 700, color: '#141413',
                lineHeight: 1.15, fontFamily: "'Poppins', sans-serif",
              }}>
                {m.value}
              </p>
              <p style={{
                fontSize: 12, color: '#2D8A4E',
                marginTop: 5, fontFamily: "'Poppins', sans-serif",
              }}>
                ▲ {m.trend}
              </p>
              {m.sub && (
                <p style={{
                  fontSize: 11, color: '#8C8A82',
                  marginTop: 2, fontFamily: "'Poppins', sans-serif",
                }}>
                  {m.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ── Row 2: Chart + Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

          {/* Revenue Chart */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E8E6DC',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              padding: '16px 20px 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', fontFamily: "'Poppins', sans-serif" }}>
                Revenue — Last 7 Days
              </p>
              <span style={{
                background: '#FBECE4', color: '#C96847',
                fontSize: 12, fontWeight: 600,
                padding: '3px 10px', borderRadius: 6,
                fontFamily: "'Poppins', sans-serif",
              }}>
                $13,434 total
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D97757" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#D97757" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E8E6DC" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#8C8A82', fontFamily: 'Poppins, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8C8A82', fontFamily: 'Poppins, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                  width={64}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#D97757"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#D97757', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E8E6DC',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ padding: '16px 18px 8px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', fontFamily: "'Poppins', sans-serif" }}>
                Quick Actions
              </p>
            </div>
            <div style={{ padding: '0 8px 8px' }}>
              {quickActions.map((a, i) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: i < quickActions.length - 1 ? '1px solid #F5F4EF' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    fontFamily: "'Poppins', sans-serif",
                    borderRadius: 6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF9F5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#FBECE4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <a.Icon size={15} style={{ color: '#D97757' }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#141413' }}>
                    {a.label}
                  </span>
                  <span style={{ fontSize: 16, color: '#C0BDB5' }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Recent Orders ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E8E6DC',
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '16px 20px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', fontFamily: "'Poppins', sans-serif" }}>
              Recent Orders
            </p>
            <button
              onClick={() => navigate('/seller/orders')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#8C8A82', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>
              <thead>
                <tr style={{ borderTop: '1px solid #E8E6DC', borderBottom: '1px solid #E8E6DC' }}>
                  {['Order', 'Customer', 'Product', 'Amount', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left', fontSize: 11, fontWeight: 600,
                        color: '#8C8A82', textTransform: 'uppercase',
                        letterSpacing: '0.05em', padding: '10px 18px',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const av = avatarColors[order.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                  const st = statusStyles[order.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: i < recentOrders.length - 1 ? '1px solid #F5F4EF' : 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '11px 18px', fontWeight: 600, color: '#D97757' }}>
                        {order.id}
                      </td>
                      <td style={{ padding: '11px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: av.bg, color: av.color,
                            fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {order.initials}
                          </div>
                          <span style={{ color: '#4A4945' }}>{order.customer}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 18px', color: '#4A4945' }}>{order.product}</td>
                      <td style={{ padding: '11px 18px', fontWeight: 600, color: '#141413' }}>{order.amount}</td>
                      <td style={{ padding: '11px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          background: st.bg, color: st.color,
                          fontSize: 11, fontWeight: 600,
                          padding: '3px 10px', borderRadius: 5,
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '11px 18px' }}>
                        <button
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 12, color: '#D97757', fontWeight: 600,
                            fontFamily: "'Poppins', sans-serif",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}