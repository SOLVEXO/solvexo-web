import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { StorePageHeader } from '@/components/layouts/StoreLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  Product:   { bg: '#EEF2FF', color: '#4F46E5' },
  Order:     { bg: '#EAF0FB', color: '#2156A8' },
  Marketing: { bg: '#FFF4DC', color: '#B36200' },
  POS:       { bg: '#F3E8FF', color: '#7C3AED' },
  Customer:  { bg: '#E3F4EA', color: '#1E7A3C' },
  Finance:   { bg: '#FFF3E0', color: '#D97706' },
  Settings:  { bg: '#F0EEE6', color: '#5A5852' },
  Security:  { bg: '#FDECEA', color: '#C0392B' },
};

const metrics = [
  { label: 'Total Events',        value: '2,841',     sub: 'Last 90 days',          trend: null,         trendUp: false },
  { label: 'Staff Actions Today', value: '14',        sub: '3 team members active', trend: null,         trendUp: false },
  { label: 'Security Alerts',     value: '0',         sub: null,                    trend: 'No threats', trendUp: true  },
  { label: 'Last Login',          value: '2 min ago', sub: 'Alex Chen — Chrome',    trend: null,         trendUp: false },
] as const;

export function StoreActivity() {
  usePageTitle('Activity');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [activeMember,   setActiveMember]   = useState<TeamMember>('all');
  const [dateRange,      setDateRange]      = useState('last7');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [actionFilter,   setActionFilter]   = useState('all');
  const [currentPage,    setCurrentPage]    = useState(1);

  return (
    <>
      <StorePageHeader
        title="Activity Log"
        subtitle="Full audit trail of all staff actions, changes, and security events."
        actions={
          <>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">Export Log</button>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">Security Settings</button>
          </>
        }
      />

      <div className="px-7 pb-8 pt-5 flex flex-col gap-5">

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-carbon leading-[1.15]">{m.value}</p>
              {m.trend && <p className="text-xs text-[#2D8A4E] mt-1">▲ {m.trend}</p>}
              {m.sub   && <p className="text-xs text-slate mt-1">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* 2-col layout */}
        <div className="grid grid-cols-[240px_1fr] gap-4">

          {/* LEFT: Sidebar filters */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-4 py-3 border-b border-bone">
              <p className="text-[13px] font-semibold text-carbon">Filter by Type</p>
            </div>
            {FILTER_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="w-full flex items-center justify-between px-4 py-[10px] border-b border-[#F0EEE6] cursor-pointer border-none text-left transition-[background] duration-[120ms]"
                  style={{
                    background: isActive ? '#FBECE4' : 'transparent',
                    borderLeft: isActive ? '3px solid #D97757' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FAF9F5'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span className="text-[13px]" style={{ fontWeight: isActive ? 600 : 400, color: isActive ? '#B95A3A' : '#4A4945' }}>
                    {cat.label}
                  </span>
                  {cat.count != null && (
                    <span className="w-5 h-5 rounded-full bg-[#F0EEE6] text-[11px] font-semibold text-slate flex items-center justify-center">
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Team Member filter */}
            <div className="px-4 py-[14px] border-b border-bone">
              <p className="text-xs font-semibold text-[#4A4945] mb-[10px]">Filter by Team Member</p>
              {TEAM_MEMBERS.map(m => (
                <label key={m.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setActiveMember(m.id)}
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center cursor-pointer"
                    style={{
                      border: `2px solid ${activeMember === m.id ? '#D97757' : '#E8E6DC'}`,
                      background: activeMember === m.id ? '#D97757' : '#fff',
                    }}
                  >
                    {activeMember === m.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  <span className="text-[13px] text-[#4A4945]">
                    {m.label}
                    {m.sub && <span className="text-[11px] text-slate ml-1">({m.sub})</span>}
                  </span>
                </label>
              ))}
            </div>

            {/* Date Range */}
            <div className="px-4 py-[14px]">
              <p className="text-xs font-semibold text-[#4A4945] mb-2">Date Range</p>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-charcoal outline-none cursor-pointer mb-[10px]"
              >
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
              <button className="w-full py-[7px] bg-white border border-bone rounded-lg text-xs text-[#4A4945] cursor-pointer">
                Apply Filter
              </button>
            </div>
          </div>

          {/* RIGHT: Activity feed */}
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center gap-[10px] px-4 py-3 border-b border-bone">
              <div className="flex-1 flex items-center gap-1.5 border border-bone rounded-lg px-3 bg-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  placeholder="Search activity..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="border-none outline-none text-[13px] py-2 w-full text-charcoal bg-transparent"
                />
              </div>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="w-[150px] px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-charcoal outline-none cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="products">Products</option>
                <option value="orders">Orders</option>
                <option value="finance">Finance</option>
                <option value="security">Security</option>
              </select>
              <div className="flex items-center gap-[5px] shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#2D8A4E]" />
                <span className="text-[11px] text-[#2D8A4E] font-medium">Live</span>
              </div>
            </div>

            {ACTIVITY_LOG.map((item, i) => {
              const av  = avatarColors[item.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
              const rs  = roleStyle[item.role]        ?? { bg: '#F0EEE6', color: '#5A5852' };
              const cs  = item.isSecurity ? { bg: '#FDECEA', color: '#C0392B' } : (categoryStyle[item.category] ?? { bg: '#F0EEE6', color: '#5A5852' });
              const catLabel = item.isSecurity ? 'Security Alert' : item.category;
              return (
                <div key={item.id} className="px-4 py-[14px]" style={{ borderBottom: i < ACTIVITY_LOG.length - 1 ? '1px solid #F0EEE6' : 'none' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-[30px] h-[30px] rounded-full text-[9px] font-bold flex items-center justify-center shrink-0" style={{ background: av.bg, color: av.color }}>
                      {item.initials}
                    </div>
                    <span className="text-[13px] font-semibold text-carbon">{item.user}</span>
                    <span className="px-[7px] py-[2px] rounded-[20px] text-[10px] font-semibold" style={{ background: rs.bg, color: rs.color }}>{item.role}</span>
                    <span className="px-[7px] py-[2px] rounded-[20px] text-[10px] font-semibold" style={{ background: cs.bg, color: cs.color }}>{catLabel}</span>
                    <span className="ml-auto text-[11px] text-slate shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-carbon pl-[38px] mb-0.5">{item.title}</p>
                  <p className="text-xs text-slate pl-[38px] mb-0.5">{item.detail}</p>
                  <p className="text-[11px] text-[#C0BDB5] pl-[38px]">IP: {item.ip}</p>
                </div>
              );
            })}

            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-bone">
              <span className="text-xs text-slate">Showing 10 of 2,841 events</span>
              <div className="flex items-center gap-1">
                {[<ChevronLeft size={14} />, 1, 2, 3, '…', 284, <ChevronRight size={14} />].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => typeof p === 'number' && setCurrentPage(p)}
                    className="w-7 h-7 rounded-[6px] text-xs flex items-center justify-center cursor-pointer"
                    style={{
                      fontWeight: p === currentPage ? 600 : 400,
                      border: `1px solid ${p === currentPage ? '#D97757' : '#E8E6DC'}`,
                      background: p === currentPage ? '#D97757' : 'transparent',
                      color: p === currentPage ? '#fff' : '#4A4945',
                    }}
                  >
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
