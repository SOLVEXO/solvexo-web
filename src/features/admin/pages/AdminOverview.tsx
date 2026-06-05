import { usePageTitle } from '@/hooks/usePageTitle';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const RECENT_SIGNUPS = [
  { name: 'priya.sharma@edu.in',      role: 'Seller',  date: 'Today 9:04 AM' },
  { name: 'tom.b@outlook.com',        role: 'Buyer',   date: 'Today 8:42 AM' },
  { name: 'designhub@gmail.com',      role: 'Seller',  date: 'Today 7:18 AM' },
  { name: 'student44@school.edu',     role: 'Buyer',   date: 'Yesterday' },
  { name: 'maths4kids@yahoo.com',     role: 'Seller',  date: 'Yesterday' },
];

const PLATFORM_HEALTH: { label: string; status: string; Icon: LucideIcon }[] = [
  { label: 'API',       status: 'healthy',   Icon: CheckCircle   },
  { label: 'Payments',  status: 'healthy',   Icon: CheckCircle   },
  { label: 'Search',    status: 'degraded',  Icon: AlertTriangle },
  { label: 'Email',     status: 'healthy',   Icon: CheckCircle   },
];

const TOP_CATEGORIES = [
  { name: 'Educational Resources', gmv: '$3.8M', pct: 45 },
  { name: 'Digital Downloads',      gmv: '$2.1M', pct: 25 },
  { name: 'Handmade & Crafts',      gmv: '$1.3M', pct: 15 },
  { name: 'Home & Lifestyle',       gmv: '$0.8M', pct: 10 },
  { name: 'Business Tools',         gmv: '$0.4M', pct: 5  },
];

const ADMIN_ACTIONS = [
  { time: '10:12 AM', action: 'Approved listing "Grade 5 Math Bundle" (R-3399)',       admin: 'admin@solvexo.com' },
  { time: '9:58 AM',  action: 'Suspended seller account "FastDigital99"',              admin: 'admin@solvexo.com' },
  { time: '9:34 AM',  action: 'Removed listing "Unauthorized Exam Papers 2024"',      admin: 'mod@solvexo.com'   },
  { time: 'Yesterday', action: 'Published announcement "Platform Maintenance May 18"', admin: 'admin@solvexo.com' },
  { time: 'Yesterday', action: 'Updated AI credit limit to 1,000 / month',             admin: 'admin@solvexo.com' },
];

export function AdminOverview() {
  usePageTitle('Admin Overview');
  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-carbon">Platform Overview</h1>
        <p className="text-[12px] text-slate mt-0.5">Real-time snapshot of the Solvexo platform.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Users"       value="48,294" trend="+1.2K this week"  trendUp />
        <MetricCard label="Active Sellers"    value="12,481" trend="+284 this month"  trendUp />
        <MetricCard label="GMV This Month"    value="$8.4M"  trend="+18.2%"           trendUp />
        <MetricCard label="Moderation Queue"  value="52"     sub="14 urgent" />
      </div>

      {/* Row 2 */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Recent signups */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[14px] font-bold text-carbon">Recent Signups</p>
          </div>
          <div>
            {RECENT_SIGNUPS.map((u, i) => (
              <div
                key={u.name}
                className={`flex items-center gap-3 px-5 py-3 ${i < RECENT_SIGNUPS.length - 1 ? 'border-b border-bone' : ''}`}
              >
                <Avatar name={u.name} size={30} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-carbon truncate">{u.name}</p>
                  <p className="text-[11px] text-slate">{u.date}</p>
                </div>
                <Badge color={u.role === 'Seller' ? 'orange' : 'blue'}>{u.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Platform health */}
        <Card>
          <p className="text-[14px] font-bold text-carbon mb-4">Platform Health</p>
          <div className="flex flex-col gap-3">
            {PLATFORM_HEALTH.map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#FAF9F5' }}>
                <item.Icon size={18} style={{ color: item.status === 'healthy' ? '#2D8A4E' : '#C08B1E', flexShrink: 0 }} />
                <span className="text-[13px] font-medium text-carbon flex-1">{item.label}</span>
                <Badge
                  color={item.status === 'healthy' ? 'green' : item.status === 'degraded' ? 'yellow' : 'red'}
                >
                  {item.status === 'healthy' ? 'Healthy' : item.status === 'degraded' ? 'Degraded' : 'Down'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Top categories */}
        <Card>
          <p className="text-[14px] font-bold text-carbon mb-4">Top Categories by GMV</p>
          <div className="flex flex-col gap-3">
            {TOP_CATEGORIES.map(cat => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-charcoal">{cat.name}</span>
                  <span className="text-[12px] font-semibold text-carbon">{cat.gmv}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#E8E6DC' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.pct}%`, background: '#D97757' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Admin action log */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[14px] font-bold text-carbon">Recent Admin Actions</p>
          </div>
          <div>
            {ADMIN_ACTIONS.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-5 py-3 ${i < ADMIN_ACTIONS.length - 1 ? 'border-b border-bone' : ''}`}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: '#D97757' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-charcoal">{a.action}</p>
                  <p className="text-[11px] text-slate mt-0.5">{a.admin} · {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
