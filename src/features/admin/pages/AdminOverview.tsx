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

// ── Helpers ───────────────────────────────────────────────────────────────────
const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E8E6DC',
  borderRadius: 10,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminOverview() {
  return (
    <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, ...poppins }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 3 }}>
          Platform Overview
        </h1>
        <p style={{ fontSize: 12, color: '#8C8A82' }}>
          Real-time snapshot of the Solvexo platform.
        </p>
      </div>

      {/* ── Metrics Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {METRICS.map((m) => (
          <div
            key={m.label}
            style={{
              ...card,
              padding: '18px 20px',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {m.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>
              {m.value}
            </p>
            {m.trend && (
              <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>
                ▲ {m.trend}
              </p>
            )}
            {m.sub && (
              <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>
                {m.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Row 2: Recent Signups + Platform Health ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent Signups */}
        <div style={card}>
          <div style={{ padding: '16px 20px 10px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>Recent Signups</p>
          </div>
          <div>
            {RECENT_SIGNUPS.map((u, i) => (
              <div
                key={u.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px',
                  borderBottom: i < RECENT_SIGNUPS.length - 1 ? '1px solid #F0EEE6' : 'none',
                }}
              >
                {/* Initial circle */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#E8E6DC', color: '#5A5852',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {u.initial}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#141413', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.name}
                  </p>
                  <p style={{ fontSize: 11, color: '#8C8A82', marginTop: 1 }}>{u.date}</p>
                </div>
                {/* Role badge */}
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '2px 9px', borderRadius: 5,
                  background: u.role === 'Seller' ? '#FBECE4' : '#EAF0FB',
                  color:      u.role === 'Seller' ? '#C96847'  : '#2156A8',
                  flexShrink: 0,
                }}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Health */}
        <div style={{ ...card, padding: '16px 20px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 14 }}>Platform Health</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLATFORM_HEALTH.map((item) => {
              const healthy  = item.status === 'healthy';
              const degraded = item.status === 'degraded';
              const iconColor = healthy ? '#2D8A4E' : degraded ? '#C08B1E' : '#C0392B';
              const badgeStyle: React.CSSProperties = healthy
                ? { background: '#E3F4EA', color: '#1E7A3C' }
                : degraded
                ? { background: '#FFF4DC', color: '#B36200' }
                : { background: '#FDECEA', color: '#C0392B' };

              return (
                <div
                  key={item.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8,
                    background: '#FAF9F5',
                  }}
                >
                  <item.Icon size={18} style={{ color: iconColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#141413', flex: 1 }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '2px 9px', borderRadius: 5,
                    ...badgeStyle,
                  }}>
                    {healthy ? 'Healthy' : degraded ? 'Degraded' : 'Down'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Top Categories + Admin Action Log ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Top Categories */}
        <div style={{ ...card, padding: '16px 20px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 16 }}>
            Top Categories by GMV
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TOP_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#4A4945' }}>{cat.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#141413' }}>{cat.gmv}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: '#E8E6DC' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${cat.pct}%`,
                    background: '#D97757',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Actions */}
        <div style={card}>
          <div style={{ padding: '16px 20px 10px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>Recent Admin Actions</p>
          </div>
          <div>
            {ADMIN_ACTIONS.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 20px',
                  borderBottom: i < ADMIN_ACTIONS.length - 1 ? '1px solid #F0EEE6' : 'none',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#D97757', flexShrink: 0, marginTop: 4,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: '#4A4945', lineHeight: 1.4 }}>{a.action}</p>
                  <p style={{ fontSize: 11, color: '#8C8A82', marginTop: 3 }}>
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