import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── Types & Data ──────────────────────────────────────────────────────────────
type FilterCategory = 'all' | 'products' | 'orders' | 'finance' | 'marketing' | 'customers' | 'settings' | 'security';
type TeamMember     = 'all' | 'alex' | 'jordan' | 'sam';

interface ActivityItem {
  id: number; user: string; initials: string; role: 'Owner' | 'Manager' | 'Staff';
  category: string; timestamp: string; title: string; detail: string; ip: string; isSecurity?: boolean;
}

const FILTER_CATEGORIES: { id: FilterCategory; label: string; count?: number }[] = [
  { id: 'all',       label: 'All Events'  },
  { id: 'products',  label: 'Products',   count: 1 },
  { id: 'orders',    label: 'Orders',     count: 2 },
  { id: 'finance',   label: 'Finance',    count: 2 },
  { id: 'marketing', label: 'Marketing',  count: 1 },
  { id: 'customers', label: 'Customers',  count: 1 },
  { id: 'settings',  label: 'Settings',   count: 1 },
  { id: 'security',  label: 'Security',   count: 1 },
];

const TEAM_MEMBERS = [
  { id: 'all'    as TeamMember, label: 'All Members',  sub: ''        },
  { id: 'alex'   as TeamMember, label: 'Alex Chen',    sub: 'Owner'   },
  { id: 'jordan' as TeamMember, label: 'Jordan Lee',   sub: 'Manager' },
  { id: 'sam'    as TeamMember, label: 'Sam Rivera',   sub: 'Staff'   },
];

const ACTIVITY_LOG: ActivityItem[] = [
  { id: 1,  user: 'Alex Chen',   initials: 'AC', role: 'Owner',   category: 'Product',   timestamp: '2 min ago',         title: 'Updated product price',     detail: 'Grade 5 Math Bundle: $44.00 → $49.00',                ip: '192.168.1.1'  },
  { id: 2,  user: 'Jordan Lee',  initials: 'JL', role: 'Manager', category: 'Order',     timestamp: '18 min ago',        title: 'Fulfilled order',            detail: 'Order #8821 — Sarah Mitchell — Shipped via USPS',     ip: '10.0.0.4'     },
  { id: 3,  user: 'Alex Chen',   initials: 'AC', role: 'Owner',   category: 'Marketing', timestamp: '1h ago',            title: 'Created coupon',             detail: 'BACK2SCHOOL — 20% off — expires Jun 30',              ip: '192.168.1.1'  },
  { id: 4,  user: 'Sam Rivera',  initials: 'SR', role: 'Staff',   category: 'POS',       timestamp: '2h ago',            title: 'Processed POS sale',         detail: 'Ceramic Mug Set × 2 — $56.00 — Cash',                 ip: '10.0.0.7'     },
  { id: 5,  user: 'Jordan Lee',  initials: 'JL', role: 'Manager', category: 'Customer',  timestamp: '3h ago',            title: 'Edited customer profile',    detail: 'David Reynolds — Updated email address',              ip: '10.0.0.4'     },
  { id: 6,  user: 'Alex Chen',   initials: 'AC', role: 'Owner',   category: 'Finance',   timestamp: 'Yesterday 4:12 PM', title: 'Changed payout schedule',    detail: 'Weekly → Bi-weekly payout schedule',                  ip: '192.168.1.1'  },
  { id: 7,  user: 'Alex Chen',   initials: 'AC', role: 'Owner',   category: 'Settings',  timestamp: 'Yesterday 2:44 PM', title: 'Added team member',          detail: 'Taylor Kim — Staff role — Products, Inventory access', ip: '192.168.1.1'  },
  { id: 8,  user: 'Sam Rivera',  initials: 'SR', role: 'Staff',   category: 'Order',     timestamp: 'May 18 11:22 AM',   title: 'Applied discount',           detail: 'Order #8818 — 10% manual discount applied',           ip: '10.0.0.7'     },
  { id: 9,  user: 'Jordan Lee',  initials: 'JL', role: 'Manager', category: 'Finance',   timestamp: 'May 18 10:14 AM',   title: 'Issued refund',              detail: 'RMA-039 — Mike Svensson — $24.00 refunded',           ip: '10.0.0.4'     },
  { id: 10, user: 'Alex Chen',   initials: 'AC', role: 'Owner',   category: 'Security',  timestamp: 'May 17 9:00 AM',    title: 'Login from new device',      detail: 'Safari on iPhone — New York, US',                     ip: '76.24.1.82',  isSecurity: true  },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  AC: { bg: '#FBECE4', color: '#B95A3A' },
  JL: { bg: '#EAF3FB', color: '#2156A8' },
  SR: { bg: '#EAF7EF', color: '#1E7A3C' },
};

const roleStyle: Record<string, { bg: string; color: string }> = {
  Owner:   { bg: '#FBECE4', color: '#B95A3A' },
  Manager: { bg: '#EAF0FB', color: '#2156A8' },
  Staff:   { bg: '#F0EEE6', color: '#5A5852' },
};

const categoryStyle: Record<string, { bg: string; color: string }> = {
  Product:  { bg: '#EEF2FF', color: '#4F46E5' },
  Order:    { bg: '#EAF0FB', color: '#2156A8' },
  Marketing:{ bg: '#FFF4DC', color: '#B36200' },
  POS:      { bg: '#F3E8FF', color: '#7C3AED' },
  Customer: { bg: '#E3F4EA', color: '#1E7A3C' },
  Finance:  { bg: '#FFF3E0', color: '#D97706' },
  Settings: { bg: '#F0EEE6', color: '#5A5852' },
  Security: { bg: '#FDECEA', color: '#C0392B' },
};

const metrics = [
  { label: 'Total Events',        value: '2,841',    sub: 'Last 90 days',          trend: null,        trendUp: false },
  { label: 'Staff Actions Today', value: '14',       sub: '3 team members active', trend: null,        trendUp: false },
  { label: 'Security Alerts',     value: '0',        sub: null,                    trend: 'No threats',trendUp: true  },
  { label: 'Last Login',          value: '2 min ago',sub: 'Alex Chen — Chrome',    trend: null,        trendUp: false },
] as const;

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerActivity() {
  usePageTitle('Activity');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [activeMember,   setActiveMember]   = useState<TeamMember>('all');
  const [dateRange,      setDateRange]      = useState('last7');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [actionFilter,   setActionFilter]   = useState('all');
  const [currentPage,    setCurrentPage]    = useState(1);
  const totalPages = 284;

  return (
    <>
      <SellerPageHeader
        title="Activity Log"
        subtitle="Full audit trail of all staff actions, changes, and security events."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Export Log</button>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Security Settings</button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ ...cardStyle, padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{m.value}</p>
              {m.trend && <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>▲ {m.trend}</p>}
              {m.sub   && <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── 2-col layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>

          {/* LEFT: Sidebar filters */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8E6DC' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#141413' }}>Filter by Type</p>
            </div>
            {FILTER_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', borderBottom: '1px solid #F0EEE6', cursor: 'pointer',
                    background: isActive ? '#FBECE4' : 'transparent', border: 'none',
                    borderLeft: isActive ? '3px solid #D97757' : '3px solid transparent',
                    textAlign: 'left', fontFamily: poppins, transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAF9F5'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#B95A3A' : '#4A4945' }}>{cat.label}</span>
                  {cat.count != null && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#F0EEE6', fontSize: 11, fontWeight: 600, color: '#8C8A82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Team Member filter */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8E6DC' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#4A4945', marginBottom: 10 }}>Filter by Team Member</p>
              {TEAM_MEMBERS.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <button
                    type="button"
                    onClick={() => setActiveMember(m.id)}
                    style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${activeMember === m.id ? '#D97757' : '#E8E6DC'}`,
                      background: activeMember === m.id ? '#D97757' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    {activeMember === m.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </button>
                  <span style={{ fontSize: 13, color: '#4A4945', fontFamily: poppins }}>
                    {m.label}
                    {m.sub && <span style={{ fontSize: 11, color: '#8C8A82', marginLeft: 4 }}>({m.sub})</span>}
                  </span>
                </label>
              ))}
            </div>

            {/* Date Range */}
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#4A4945', marginBottom: 8 }}>Date Range</p>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins, marginBottom: 10 }}
              >
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
              <button style={{ width: '100%', padding: '7px 0', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                Apply Filter
              </button>
            </div>
          </div>

          {/* RIGHT: Activity feed */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            {/* Filter row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #E8E6DC' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E8E6DC', borderRadius: 8, padding: '0 12px', background: '#fff' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input placeholder="Search activity..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', width: '100%', fontFamily: poppins, color: '#2C2A28', background: 'transparent' }} />
              </div>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins, width: 150 }}>
                <option value="all">All Actions</option>
                <option value="products">Products</option>
                <option value="orders">Orders</option>
                <option value="finance">Finance</option>
                <option value="security">Security</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2D8A4E' }} />
                <span style={{ fontSize: 11, color: '#2D8A4E', fontWeight: 500, fontFamily: poppins }}>Live</span>
              </div>
            </div>

            {/* Activity items */}
            {ACTIVITY_LOG.map((item, i) => {
              const av  = avatarColors[item.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
              const rs  = roleStyle[item.role]        ?? { bg: '#F0EEE6', color: '#5A5852' };
              const cs  = item.isSecurity ? { bg: '#FDECEA', color: '#C0392B' } : (categoryStyle[item.category] ?? { bg: '#F0EEE6', color: '#5A5852' });
              const catLabel = item.isSecurity ? 'Security Alert' : item.category;
              return (
                <div key={item.id} style={{ padding: '14px 16px', borderBottom: i < ACTIVITY_LOG.length - 1 ? '1px solid #F0EEE6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: av.bg, color: av.color, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.initials}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{item.user}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: rs.bg, color: rs.color }}>{item.role}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: cs.bg, color: cs.color }}>{catLabel}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8C8A82', flexShrink: 0, fontFamily: poppins }}>{item.timestamp}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', paddingLeft: 38, marginBottom: 2, fontFamily: poppins }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: '#8C8A82', paddingLeft: 38, marginBottom: 2, fontFamily: poppins }}>{item.detail}</p>
                  <p style={{ fontSize: 11, color: '#C0BDB5', paddingLeft: 38, fontFamily: poppins }}>IP: {item.ip}</p>
                </div>
              );
            })}

            {/* Pagination */}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E8E6DC' }}>
              <span style={{ fontSize: 12, color: '#8C8A82', fontFamily: poppins }}>Showing 10 of 2,841 events</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[<ChevronLeft size={14} />, 1, 2, 3, '…', 284, <ChevronRight size={14} />].map((p, i) => (
                  <button key={i} onClick={() => typeof p === 'number' && setCurrentPage(p)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, fontSize: 12,
                      fontWeight: p === currentPage ? 600 : 400,
                      border: `1px solid ${p === currentPage ? '#D97757' : '#E8E6DC'}`,
                      background: p === currentPage ? '#D97757' : 'transparent',
                      color: p === currentPage ? '#fff' : '#4A4945',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: poppins,
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}