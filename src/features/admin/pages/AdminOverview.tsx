import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const METRICS = [
  { label: 'Total Users',      value: '48,294', trend: '+1.2K this week',  sub: null,       trendUp: true  },
  { label: 'Active Sellers',   value: '12,481', trend: '+284 this month',  sub: null,       trendUp: true  },
  { label: 'GMV This Month',   value: '$8.4M',  trend: '+18.2%',           sub: null,       trendUp: true  },
  { label: 'Moderation Queue', value: '52',     trend: null,               sub: '14 urgent',trendUp: false },
] as const;

const RECENT_SIGNUPS = [
  { name: 'priya.sharma@edu.in',  initial: 'P', role: 'Seller', date: 'Today 9:04 AM'  },
  { name: 'tom.b@outlook.com',    initial: 'T', role: 'Buyer',  date: 'Today 8:42 AM'  },
  { name: 'designhub@gmail.com',  initial: 'D', role: 'Seller', date: 'Today 7:18 AM'  },
  { name: 'student44@school.edu', initial: 'S', role: 'Buyer',  date: 'Yesterday'      },
  { name: 'maths4kids@yahoo.com', initial: 'M', role: 'Seller', date: 'Yesterday'      },
];

const PLATFORM_HEALTH: { label: string; status: 'healthy' | 'degraded' | 'down'; Icon: LucideIcon }[] = [
  { label: 'API',      status: 'healthy',  Icon: CheckCircle   },
  { label: 'Payments', status: 'healthy',  Icon: CheckCircle   },
  { label: 'Search',   status: 'degraded', Icon: AlertTriangle },
  { label: 'Email',    status: 'healthy',  Icon: CheckCircle   },
];

const TOP_CATEGORIES = [
  { name: 'Educational Resources', gmv: '$3.8M', pct: 45 },
  { name: 'Digital Downloads',     gmv: '$2.1M', pct: 25 },
  { name: 'Handmade & Crafts',     gmv: '$1.3M', pct: 15 },
  { name: 'Home & Lifestyle',      gmv: '$0.8M', pct: 10 },
  { name: 'Business Tools',        gmv: '$0.4M', pct: 5  },
];

const ADMIN_ACTIONS = [
  { time: '10:12 AM',  action: 'Approved listing "Grade 5 Math Bundle" (R-3399)',       admin: 'admin@solvexo.com' },
  { time: '9:58 AM',   action: 'Suspended seller account "FastDigital99"',              admin: 'admin@solvexo.com' },
  { time: '9:34 AM',   action: 'Removed listing "Unauthorized Exam Papers 2024"',      admin: 'mod@solvexo.com'   },
  { time: 'Yesterday', action: 'Published announcement "Platform Maintenance May 18"', admin: 'admin@solvexo.com' },
  { time: 'Yesterday', action: 'Updated AI credit limit to 1,000 / month',             admin: 'admin@solvexo.com' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminOverview() {
  return (
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">
          Platform Overview
        </h1>
        <p className="text-[12px] text-slate">
          Real-time snapshot of the Solvexo platform.
        </p>
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-[18px]"
          >
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">
              {m.label}
            </p>
            <p className="text-[28px] font-bold text-charcoal leading-[1.15]">
              {m.value}
            </p>
            {m.trend && (
              <p className="text-[12px] text-[#2D8A4E] mt-1">
                ▲ {m.trend}
              </p>
            )}
            {m.sub && (
              <p className="text-[12px] text-slate mt-1">
                {m.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Row 2: Recent Signups + Platform Health ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Recent Signups */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="px-5 pt-4 pb-[10px]">
            <p className="text-[14px] font-bold text-charcoal">Recent Signups</p>
          </div>
          <div>
            {RECENT_SIGNUPS.map((u, i) => (
              <div
                key={u.name}
                className={`flex items-center gap-3 px-5 py-[10px]${i < RECENT_SIGNUPS.length - 1 ? ' border-b border-[#F0EEE6]' : ''}`}
              >
                {/* Initial circle */}
                <div className="w-[30px] h-[30px] rounded-full bg-bone text-[#5A5852] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {u.initial}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-charcoal overflow-hidden text-ellipsis whitespace-nowrap">
                    {u.name}
                  </p>
                  <p className="text-[11px] text-slate mt-[1px]">{u.date}</p>
                </div>
                {/* Role badge */}
                <span className={`text-[11px] font-semibold px-[9px] py-[2px] rounded-[5px] flex-shrink-0 ${u.role === 'Seller' ? 'bg-[#FBECE4] text-[#C96847]' : 'bg-[#EAF0FB] text-[#2156A8]'}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
          <p className="text-[14px] font-bold text-charcoal mb-[14px]">Platform Health</p>
          <div className="flex flex-col gap-[10px]">
            {PLATFORM_HEALTH.map((item) => {
              const healthy  = item.status === 'healthy';
              const degraded = item.status === 'degraded';
              const iconColor = healthy ? '#2D8A4E' : degraded ? '#C08B1E' : '#C0392B';
              const badgeCls = healthy
                ? 'bg-[#E3F4EA] text-[#1E7A3C]'
                : degraded
                ? 'bg-[#FFF4DC] text-[#B36200]'
                : 'bg-[#FDECEA] text-[#C0392B]';

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-[14px] py-[10px] rounded-lg bg-[#FAF9F5]"
                >
                  <item.Icon size={18} style={{ color: iconColor }} className="flex-shrink-0" />
                  <span className="text-[13px] font-medium text-charcoal flex-1">
                    {item.label}
                  </span>
                  <span className={`text-[11px] font-semibold px-[9px] py-[2px] rounded-[5px] ${badgeCls}`}>
                    {healthy ? 'Healthy' : degraded ? 'Degraded' : 'Down'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Top Categories + Admin Action Log ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Top Categories */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
          <p className="text-[14px] font-bold text-charcoal mb-4">
            Top Categories by GMV
          </p>
          <div className="flex flex-col gap-[14px]">
            {TOP_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between items-center mb-[5px]">
                  <span className="text-[12px] text-[#4A4945]">{cat.name}</span>
                  <span className="text-[12px] font-semibold text-charcoal">{cat.gmv}</span>
                </div>
                <div className="h-2 rounded-[4px] bg-bone">
                  <div
                    className="h-full rounded-[4px] bg-brand-orange"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Actions */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="px-5 pt-4 pb-[10px]">
            <p className="text-[14px] font-bold text-charcoal">Recent Admin Actions</p>
          </div>
          <div>
            {ADMIN_ACTIONS.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-5 py-[10px]${i < ADMIN_ACTIONS.length - 1 ? ' border-b border-[#F0EEE6]' : ''}`}
              >
                <div className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#4A4945] leading-[1.4]">{a.action}</p>
                  <p className="text-[11px] text-slate mt-[3px]">
                    {a.admin} · {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
