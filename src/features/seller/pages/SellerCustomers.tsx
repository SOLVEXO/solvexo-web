import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Mail, Gift } from 'lucide-react';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
type Segment = 'VIP' | 'Loyal' | 'Returning' | 'New' | 'At Risk';

interface Customer {
  id: string; name: string; initials: string; email: string;
  orders: number; ltv: string; lastOrder: string; segment: Segment; joined: string;
}

const CUSTOMERS: Customer[] = [
  { id: 'C-1001', name: 'Sarah Mitchell', initials: 'SM', email: 'sarah@email.com',  orders: 14, ltv: '$612',   lastOrder: 'Today',     segment: 'VIP',       joined: 'Jan 2024' },
  { id: 'C-1002', name: 'David Reynolds', initials: 'DR', email: 'david@email.com',  orders: 9,  ltv: '$387',   lastOrder: 'Yesterday', segment: 'Loyal',     joined: 'Mar 2024' },
  { id: 'C-1003', name: 'Lena Kowalski',  initials: 'LK', email: 'lena@email.com',   orders: 3,  ltv: '$134',   lastOrder: 'May 10',    segment: 'New',       joined: 'Apr 2025' },
  { id: 'C-1004', name: 'Tom Barnes',     initials: 'TB', email: 'tom@email.com',    orders: 21, ltv: '$1,042', lastOrder: 'May 14',    segment: 'VIP',       joined: 'Nov 2023' },
  { id: 'C-1005', name: 'Amy Liu',        initials: 'AL', email: 'amy@email.com',    orders: 6,  ltv: '$228',   lastOrder: 'May 8',     segment: 'Returning', joined: 'Feb 2024' },
  { id: 'C-1006', name: 'Mike Svensson',  initials: 'MS', email: 'mike@email.com',   orders: 1,  ltv: '$49',    lastOrder: 'May 16',    segment: 'New',       joined: 'May 2025' },
  { id: 'C-1007', name: 'Jane Park',      initials: 'JP', email: 'jane@email.com',   orders: 0,  ltv: '$0',     lastOrder: '—',         segment: 'At Risk',   joined: 'Dec 2023' },
  { id: 'C-1008', name: 'Carlos Mendez',  initials: 'CM', email: 'carlos@email.com', orders: 11, ltv: '$504',   lastOrder: 'Apr 30',    segment: 'Loyal',     joined: 'Jun 2024' },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  SM: { bg: '#FDECEA', color: '#C0392B' }, DR: { bg: '#EAF3FB', color: '#2156A8' },
  LK: { bg: '#EAF7EF', color: '#1E7A3C' }, TB: { bg: '#FFF4E5', color: '#B36200' },
  AL: { bg: '#F3EAFB', color: '#7A1EA8' }, MS: { bg: '#E5F4FB', color: '#1A6A8A' },
  JP: { bg: '#FDECEA', color: '#C0392B' }, CM: { bg: '#EAF7EF', color: '#1E7A3C' },
};

const segmentStyle: Record<Segment, { bg: string; color: string }> = {
  VIP:       { bg: '#FBECE4', color: '#C96847' },
  Loyal:     { bg: '#E3F4EA', color: '#1E7A3C' },
  Returning: { bg: '#EAF0FB', color: '#2156A8' },
  New:       { bg: '#F0EEE6', color: '#5A5852' },
  'At Risk': { bg: '#FDECEA', color: '#C0392B' },
};

const SEGMENT_PILLS = [
  { label: 'All',       count: 1284 },
  { label: 'VIP',       count: 94   },
  { label: 'Loyal',     count: 312  },
  { label: 'Returning', count: 478  },
  { label: 'New',       count: 362  },
  { label: 'At Risk',   count: 38   },
];

const metrics = [
  { label: 'Total Customers',    value: '1,284', trend: '+48 this month',       sub: null,                    trendUp: true  },
  { label: 'Avg Lifetime Value', value: '$247',  trend: '+$18 vs last month',   sub: null,                    trendUp: true  },
  { label: 'Repeat Rate',        value: '62%',   trend: 'Healthy',              sub: null,                    trendUp: true  },
  { label: 'At Risk',            value: '38',    trend: null,                   sub: 'No purchase in 90 days',trendUp: false },
] as const;

const poppins = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const inputStyle: React.CSSProperties = { padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, outline: 'none', fontFamily: poppins, color: '#2C2A28', background: '#fff', boxSizing: 'border-box' as const };

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerCustomers() {
  usePageTitle('Customers');
  const [search,     setSearch]     = useState('');
  const [seg,        setSeg]        = useState('');
  const [sort,       setSort]       = useState('');
  const [filterPill, setFilterPill] = useState('All');
  const [sel,        setSel]        = useState<Customer | null>(null);

  const filtered = CUSTOMERS.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
    if (seg && seg !== 'All Segments' && c.segment !== seg) return false;
    if (filterPill !== 'All' && c.segment !== filterPill) return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Customers"
        subtitle="Manage buyer relationships, segments and loyalty."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Export CSV
            </button>
            <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              + Add Customer
            </button>
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

        {/* ── Segment pills ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {SEGMENT_PILLS.map(pill => {
            const active = filterPill === pill.label;
            const st = pill.label === 'All' ? { bg: '#F0EEE6', color: '#5A5852' } : segmentStyle[pill.label as Segment] ?? { bg: '#F0EEE6', color: '#5A5852' };
            return (
              <button
                key={pill.label}
                onClick={() => setFilterPill(pill.label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                  border: `1px solid ${active ? '#D97757' : '#E8E6DC'}`,
                  background: active ? '#FBECE4' : '#fff',
                  color: active ? '#B95A3A' : '#2C2A28',
                  fontSize: 12, fontWeight: 500, fontFamily: poppins,
                  transition: 'all 0.12s',
                }}
              >
                {pill.label}
                <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: active ? '#fff' : st.bg, color: active ? '#B95A3A' : st.color }}>
                  {pill.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Table + Detail ── */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Table */}
          <div style={{ ...cardStyle, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, padding: '14px 20px', borderBottom: '1px solid #E8E6DC', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E8E6DC', borderRadius: 8, padding: '0 12px', background: '#fff', flex: 1, maxWidth: 260 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', width: '100%', fontFamily: poppins, color: '#2C2A28', background: 'transparent' }} />
              </div>
              <select value={seg} onChange={e => setSeg(e.target.value)} style={{ ...inputStyle, width: 150, cursor: 'pointer' }}>
                {['All Segments','VIP','Loyal','Returning','New','At Risk'].map(o => <option key={o}>{o}</option>)}
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputStyle, width: 160, cursor: 'pointer' }}>
                {['Sort: Default','Highest LTV','Most Orders','Recently Active','Newest'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Customer','Orders','Lifetime Value','Last Order','Segment','Joined',''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E6DC', background: '#FAF9F5', whiteSpace: 'nowrap', fontFamily: poppins }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const av = avatarColors[c.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                    const sg = segmentStyle[c.segment];
                    return (
                      <tr key={c.id} onClick={() => setSel(sel?.id === c.id ? null : c)}
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none', background: sel?.id === c.id ? '#FBECE4' : 'transparent', cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => { if (sel?.id !== c.id) e.currentTarget.style.background = '#FAF9F5'; }}
                        onMouseLeave={e => { if (sel?.id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: av.bg, color: av.color, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.initials}</div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2A28', lineHeight: 1.3 }}>{c.name}</p>
                              <p style={{ fontSize: 11, color: '#8C8A82' }}>{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#2C2A28' }}>{c.orders}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#2C2A28' }}>{c.ltv}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#8C8A82' }}>{c.lastOrder}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: sg.bg, color: sg.color, fontFamily: poppins }}>{c.segment}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#8C8A82' }}>{c.joined}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={e => { e.stopPropagation(); setSel(sel?.id === c.id ? null : c); }}
                            style={{ fontSize: 12, fontWeight: 500, color: '#D97757', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>
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

          {/* Detail panel */}
          {sel && (
            <div style={{ width: 300, flexShrink: 0 }}>
              <div style={{ ...cardStyle, padding: '20px 18px', position: 'sticky', top: 70 }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #F0EEE6', marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarColors[sel.initials]?.bg ?? '#F0EEE6', color: avatarColors[sel.initials]?.color ?? '#5A5852', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    {sel.initials}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', marginBottom: 3 }}>{sel.name}</p>
                  <p style={{ fontSize: 12, color: '#8C8A82', marginBottom: 8 }}>{sel.email}</p>
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: segmentStyle[sel.segment].bg, color: segmentStyle[sel.segment].color }}>
                    {sel.segment}
                  </span>
                </div>

                {/* Stats table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
                  <tbody>
                    {[['Customer ID', sel.id],['Member Since', sel.joined],['Total Orders', String(sel.orders)],['Lifetime Value', sel.ltv],['Last Purchase', sel.lastOrder]].map(([label, value]) => (
                      <tr key={label} style={{ borderBottom: '1px solid #F0EEE6' }}>
                        <td style={{ padding: '7px 0', color: '#8C8A82', fontFamily: poppins }}>{label}</td>
                        <td style={{ padding: '7px 0', fontWeight: 600, color: '#141413', textAlign: 'right', fontFamily: poppins }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Recent orders */}
                <p style={{ fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Recent Orders</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {sel.orders > 0 ? (
                    [{ id: '#8821', product: 'Grade 5 Math Bundle', amount: '$49.00', status: 'Paid' },
                     { id: '#8820', product: 'Fractions Kit', amount: '$18.00', status: 'Fulfilled' }]
                    .slice(0, Math.min(sel.orders, 2)).map(o => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF9F5', borderRadius: 8, padding: '9px 12px' }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{o.id}</p>
                          <p style={{ fontSize: 11, color: '#8C8A82', fontFamily: poppins }}>{o.product}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#141413', fontFamily: poppins, marginBottom: 3 }}>{o.amount}</p>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: o.status === 'Paid' ? '#E3F4EA' : '#EAF0FB', color: o.status === 'Paid' ? '#1E7A3C' : '#2156A8', fontFamily: poppins }}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 12, color: '#8C8A82', fontStyle: 'italic', fontFamily: poppins }}>No orders yet</p>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '8px 0', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Mail size={13} /> Email
                  </button>
                  <button style={{ flex: 1, padding: '8px 0', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Gift size={13} /> Loyalty Gift
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}