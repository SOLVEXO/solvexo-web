import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Package, Monitor, Sparkles, BarChart2, ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button }      from '@/components/ui/Button';
import { Card }        from '@/components/ui/Card';
import { MetricCard }  from '@/components/ui/MetricCard';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar }      from '@/components/ui/Avatar';
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
  { Icon: Package,       label: 'Add New Product',    path: '/seller/products/add' },
  { Icon: Monitor,       label: 'Open POS Register',  path: '/seller/pos'          },
  { Icon: Sparkles,      label: 'AI Write Listing',   path: '/seller/ai'           },
  { Icon: BarChart2,     label: 'View Full Analytics', path: '/seller/analytics'   },
  { Icon: ClipboardList, label: 'Manage Inventory',   path: '/seller/inventory'    },
];

const recentOrders = [
  { id: '#8821', customer: 'Sarah M.',  product: 'Grade 5 Math Bundle',         amount: '$49.00', status: 'Paid'      },
  { id: '#8820', customer: 'David R.',  product: 'Fractions Mastery Kit',        amount: '$18.00', status: 'Fulfilled' },
  { id: '#8819', customer: 'Lena K.',   product: 'Creative Writing Prompts',     amount: '$12.00', status: 'Pending'   },
  { id: '#8818', customer: 'Tom B.',    product: 'Science Lab Worksheets',       amount: '$15.00', status: 'Paid'      },
];

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-2 shadow-lg text-[12px]">
      <p className="text-slate mb-0.5">{label}</p>
      <p className="font-bold text-carbon">${payload[0].value.toLocaleString()}</p>
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
        subtitle="Welcome back, Alex 👋  Here's your store overview."
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

      <div className="p-7 flex flex-col gap-6">
        {/* Row 1 — Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Today's Revenue"  value="$1,284" trend="+12.4% vs yesterday"   trendUp />
          <MetricCard label="Orders"           value="38"     trend="6 pending"              trendUp sub="Active orders" />
          <MetricCard label="Visitors"         value="2,140"  trend="+8.2% this week"        trendUp />
          <MetricCard label="Conversion"       value="1.78%"  trend="+0.2% vs last week"     trendUp />
        </div>

        {/* Row 2 — Chart + Quick Actions */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 340px' }}>
          {/* Revenue chart */}
          <Card padding="none">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <p className="text-[14px] font-bold text-carbon">Revenue — Last 7 Days</p>
              <Badge color="orange">$13,434 total</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D97757" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D97757" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E8E6DC" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8C8A82' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C8A82' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`} width={60} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="#D97757" strokeWidth={2.5} fill="url(#salesGradient)" dot={false} activeDot={{ r: 4, fill: '#D97757' }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Quick Actions */}
          <Card padding="none">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[14px] font-bold text-carbon">Quick Actions</p>
            </div>
            <div>
              {quickActions.map((a, i) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 20px', background: 'transparent', border: 'none',
                    borderBottom: i < quickActions.length - 1 ? '1px solid #E8E6DC' : 'none',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#FBECE4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <a.Icon size={15} style={{ color: '#D97757' }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#141413' }}>{a.label}</span>
                  <span style={{ fontSize: 16, color: '#8C8A82' }}>›</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 3 — Recent Orders */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <p className="text-[14px] font-bold text-carbon">Recent Orders</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('/seller/orders')}>
              View All →
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-t border-b border-bone">
                  {['Order', 'Customer', 'Product', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate uppercase px-3 py-[10px]" style={{ letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => (
                  <tr key={order.id} className={`hover:bg-cream/50 transition-colors ${i < recentOrders.length - 1 ? 'border-b border-bone' : ''}`}>
                    <td className="px-3 py-3 font-semibold text-brand-deep-orange text-[13px]">{order.id}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={order.customer} size={28} />
                        <span className="text-charcoal text-[13px]">{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-charcoal text-[13px]">{order.product}</td>
                    <td className="px-3 py-3 font-semibold text-carbon text-[13px]">{order.amount}</td>
                    <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-3 py-3">
                      <button className="text-[12px] text-brand-orange font-medium hover:underline cursor-pointer bg-transparent border-none">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
