import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';

// ── Data ──────────────────────────────────────────────────────────────────────
interface User {
  id: string; name: string; initials: string; email: string;
  role: 'Seller' | 'Buyer' | 'Admin'; plan: string;
  status: 'Active' | 'Suspended' | 'Pending'; joined: string;
}

const USERS: User[] = [
  { id: 'U-1001', name: 'Alex Chen',        initials: 'AC', email: 'alex@myshop.com',       role: 'Seller', plan: 'Professional', status: 'Active',    joined: 'Jan 2024' },
  { id: 'U-1002', name: 'Sarah Mitchell',   initials: 'SM', email: 'sarah@email.com',       role: 'Buyer',  plan: 'Free',         status: 'Active',    joined: 'Mar 2024' },
  { id: 'U-1003', name: 'DesignHub Studio', initials: 'DS', email: 'designhub@gmail.com',   role: 'Seller', plan: 'Starter',      status: 'Active',    joined: 'Feb 2024' },
  { id: 'U-1004', name: 'FastDigital99',    initials: 'FD', email: 'fastdigital@yahoo.com', role: 'Seller', plan: 'Starter',      status: 'Suspended', joined: 'Nov 2023' },
  { id: 'U-1005', name: 'BeatFactory',      initials: 'BF', email: 'beats@mail.com',        role: 'Seller', plan: 'Professional', status: 'Active',    joined: 'Jun 2024' },
  { id: 'U-1006', name: 'Tom Barnes',       initials: 'TB', email: 'tom.b@outlook.com',     role: 'Buyer',  plan: 'Free',         status: 'Active',    joined: 'Nov 2023' },
  { id: 'U-1007', name: 'QuickSell Store',  initials: 'QS', email: 'quicksell@store.com',   role: 'Seller', plan: 'Starter',      status: 'Pending',   joined: 'May 2025' },
  { id: 'U-1008', name: 'Priya Sharma',     initials: 'PS', email: 'priya@edu.in',          role: 'Seller', plan: 'Professional', status: 'Active',    joined: 'Apr 2025' },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  AC: { bg: '#FBECE4', color: '#B95A3A' }, SM: { bg: '#FDECEA', color: '#C0392B' },
  DS: { bg: '#EAF0FB', color: '#2156A8' }, FD: { bg: '#FFF4DC', color: '#B36200' },
  BF: { bg: '#EAF7EF', color: '#1E7A3C' }, TB: { bg: '#FFF4E5', color: '#B36200' },
  QS: { bg: '#F3EAFB', color: '#7A1EA8' }, PS: { bg: '#E5F4FB', color: '#1A6A8A' },
};

const roleStyle: Record<string, { bg: string; color: string }> = {
  Seller: { bg: '#FBECE4', color: '#C96847' },
  Buyer:  { bg: '#EAF0FB', color: '#2156A8' },
  Admin:  { bg: '#FDECEA', color: '#C0392B' },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Active:    { bg: '#E3F4EA', color: '#1E7A3C' },
  Suspended: { bg: '#FDECEA', color: '#C0392B' },
  Pending:   { bg: '#FFF4DC', color: '#B36200' },
};

const metrics = [
  { label: 'Total Users',    value: '48,294', trend: '+1.2K this week', sub: null,           trendUp: true  },
  { label: 'Active Sellers', value: '12,481', trend: '+284 this month', sub: null,           trendUp: true  },
  { label: 'Suspended',      value: '127',    trend: null,              sub: 'Under review', trendUp: false },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminUsers() {
  usePageTitle('Users');
  const [search,       setSearch]  = useState('');
  const [roleFilter,   setRole]    = useState('');
  const [statusFilter, setStatusF] = useState('');

  const filtered = USERS.filter(u => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (roleFilter   && roleFilter   !== 'All Roles'     && u.role   !== roleFilter)   return false;
    if (statusFilter && statusFilter !== 'All Statuses'  && u.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Users &amp; Sellers</h1>
        <p className="text-[12px] text-slate">Manage all platform users, sellers and accounts.</p>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
            <p className="text-[28px] font-bold text-charcoal leading-[1.15]">{m.value}</p>
            {m.trend && <p className="text-[12px] text-[#2D8A4E] mt-1">▲ {m.trend}</p>}
            {m.sub   && <p className="text-[12px] text-slate mt-1">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">

        {/* Filters */}
        <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
          <div className="flex items-center gap-[6px] border border-bone rounded-lg px-3 bg-white flex-1 max-w-[280px]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
              className="border-none outline-none text-[13px] py-2 w-full text-[#2C2A28] bg-transparent" />
          </div>
          <select value={roleFilter} onChange={e => setRole(e.target.value)}
            className="px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-[#2C2A28] outline-none cursor-pointer">
            {['All Roles','Seller','Buyer','Admin'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusF(e.target.value)}
            className="px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-[#2C2A28] outline-none cursor-pointer">
            {['All Statuses','Active','Suspended','Pending'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['User','Email','Role','Plan','Status','Joined','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-[#FAF9F5] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const av = avatarColors[u.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                const rs = roleStyle[u.role]         ?? { bg: '#F0EEE6', color: '#5A5852' };
                const ss = statusStyle[u.status]     ?? { bg: '#F0EEE6', color: '#5A5852' };
                return (
                  <tr key={u.id}
                    className="transition-colors duration-[120ms]"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                          style={{ background: av.bg, color: av.color }}>
                          {u.initials}
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-charcoal">{u.name}</p>
                          <p className="text-[11px] text-slate">{u.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-[13px] text-[#4A4945]">{u.email}</td>
                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                        style={{ background: rs.bg, color: rs.color }}>{u.role}</span>
                    </td>
                    {/* Plan */}
                    <td className="px-4 py-3 text-[13px] text-[#4A4945]">{u.plan}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                        style={{ background: ss.bg, color: ss.color }}>{u.status}</span>
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3 text-[13px] text-slate">{u.joined}</td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-[12px] font-medium text-[#1A72C2] bg-transparent border-none cursor-pointer">View</button>
                        <span className="text-[#E8E6DC] text-[13px]">|</span>
                        <button className="text-[12px] font-medium text-[#C13030] bg-transparent border-none cursor-pointer">
                          {u.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
