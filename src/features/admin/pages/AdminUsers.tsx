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

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

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
    <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 3 }}>Users &amp; Sellers</h1>
        <p style={{ fontSize: 12, color: '#8C8A82' }}>Manage all platform users, sellers and accounts.</p>
      </div>

      {/* ── Metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ ...cardStyle, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{m.value}</p>
            {m.trend && <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>▲ {m.trend}</p>}
            {m.sub   && <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #E8E6DC', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E8E6DC', borderRadius: 8, padding: '0 12px', background: '#fff', flex: 1, maxWidth: 280 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', width: '100%', fontFamily: poppins, color: '#2C2A28', background: 'transparent' }} />
          </div>
          <select value={roleFilter} onChange={e => setRole(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins }}>
            {['All Roles','Seller','Buyer','Admin'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusF(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins }}>
            {['All Statuses','Active','Suspended','Pending'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['User','Email','Role','Plan','Status','Joined','Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E6DC', background: '#FAF9F5', whiteSpace: 'nowrap', fontFamily: poppins }}>
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
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* User */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: av.bg, color: av.color, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {u.initials}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{u.name}</p>
                          <p style={{ fontSize: 11, color: '#8C8A82', fontFamily: poppins }}>{u.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4945', fontFamily: poppins }}>{u.email}</td>
                    {/* Role */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: rs.bg, color: rs.color, fontFamily: poppins }}>{u.role}</span>
                    </td>
                    {/* Plan */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4945', fontFamily: poppins }}>{u.plan}</td>
                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color, fontFamily: poppins }}>{u.status}</span>
                    </td>
                    {/* Joined */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#8C8A82', fontFamily: poppins }}>{u.joined}</td>
                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button style={{ fontSize: 12, fontWeight: 500, color: '#1A72C2', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>View</button>
                        <span style={{ color: '#E8E6DC', fontSize: 13 }}>|</span>
                        <button style={{ fontSize: 12, fontWeight: 500, color: '#C13030', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>
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