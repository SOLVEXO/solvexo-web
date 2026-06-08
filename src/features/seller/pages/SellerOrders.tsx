import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

// ── Data ──────────────────────────────────────────────────────────────────────
const ORDERS = [
  { id: '#8821', cust: 'Sarah M.',  initials: 'SM', email: 'sarah@email.com', product: 'Grade 5 Math Bundle',      type: 'Digital',  date: 'Today 2:14 PM',  amount: '$49.00', status: 'Paid'       },
  { id: '#8820', cust: 'David R.',  initials: 'DR', email: 'david@email.com', product: 'Fractions Mastery Kit',    type: 'Digital',  date: 'Today 11:03 AM', amount: '$18.00', status: 'Fulfilled'  },
  { id: '#8819', cust: 'Lena K.',   initials: 'LK', email: 'lena@email.com',  product: 'Handmade Ceramic Mug Set', type: 'Physical', date: 'Yesterday',      amount: '$58.00', status: 'Processing' },
  { id: '#8818', cust: 'Tom B.',    initials: 'TB', email: 'tom@email.com',   product: 'Science Lab Worksheets',   type: 'Digital',  date: 'Yesterday',      amount: '$15.00', status: 'Paid'       },
  { id: '#8817', cust: 'Amy L.',    initials: 'AL', email: 'amy@email.com',   product: 'Linen Wall Hanging',       type: 'Physical', date: 'May 18',         amount: '$72.00', status: 'Delivered'  },
  { id: '#8816', cust: 'Mike S.',   initials: 'MS', email: 'mike@email.com',  product: 'Lo-Fi Music Pack',         type: 'Digital',  date: 'May 18',         amount: '$19.00', status: 'Fulfilled'  },
  { id: '#8815', cust: 'Jane P.',   initials: 'JP', email: 'jane@email.com',  product: 'Creative Writing Prompts', type: 'Digital',  date: 'May 17',         amount: '$12.00', status: 'Refunded'   },
];

// ── Style maps ────────────────────────────────────────────────────────────────
const avatarColor: Record<string, { bg: string; color: string }> = {
  SM: { bg: '#FDECEA', color: '#C0392B' },
  DR: { bg: '#EAF3FB', color: '#2156A8' },
  LK: { bg: '#EAF7EF', color: '#1E7A3C' },
  TB: { bg: '#FFF4E5', color: '#B36200' },
  AL: { bg: '#F3EAFB', color: '#7A1EA8' },
  MS: { bg: '#E5F4FB', color: '#1A6A8A' },
  JP: { bg: '#FDECEA', color: '#C0392B' },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Paid:       { bg: '#E3F4EA', color: '#1E7A3C' },
  Fulfilled:  { bg: '#EAF0FB', color: '#2156A8' },
  Processing: { bg: '#EAF0FB', color: '#2156A8' },
  Delivered:  { bg: '#E3F4EA', color: '#1E7A3C' },
  Refunded:   { bg: '#FDECEA', color: '#C0392B' },
  Pending:    { bg: '#FFF0E0', color: '#B36200' },
};

const typeStyle: Record<string, { bg: string; color: string }> = {
  Digital:  { bg: '#EAF0FB', color: '#2156A8' },
  Physical: { bg: '#FBECE4', color: '#C96847' },
};

const metrics = [
  { label: 'Total Orders', value: '284',     trend: '+12 this week',        sub: null,                  trendUp: true  },
  { label: 'Revenue',      value: '$12,480', trend: '+8.4%',                sub: null,                  trendUp: true  },
  { label: 'Pending',      value: '6',       trend: null,                   sub: 'Awaiting fulfillment', trendUp: false },
  { label: 'Avg Order',    value: '$43.94',  trend: '+$2.10 vs last month', sub: null,                  trendUp: true  },
] as const;

const poppins = "'Poppins', sans-serif";

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerOrders() {
  usePageTitle('Orders');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type,   setType]   = useState('');
  const [time,   setTime]   = useState('');

  const filtered = ORDERS.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.id.toLowerCase().includes(q) && !o.cust.toLowerCase().includes(q) && !o.product.toLowerCase().includes(q)) return false;
    if (status && status !== 'All Status' && o.status !== status) return false;
    if (type   && type   !== 'All Types'  && o.type   !== type)   return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Orders"
        subtitle="Track and manage all customer orders."
        actions={
          <>
            <button style={{
              padding: '7px 16px', background: '#fff',
              border: '1px solid #E8E6DC', borderRadius: 8,
              fontSize: 12, fontWeight: 500, color: '#4A4945',
              cursor: 'pointer', fontFamily: poppins,
            }}>
              Export CSV
            </button>
            <button style={{
              padding: '7px 16px', background: '#D97757',
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 600, color: '#fff',
              cursor: 'pointer', fontFamily: poppins,
            }}>
              Bulk Actions
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics row (separate cards) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{
              background: '#fff', border: '1px solid #E8E6DC',
              borderRadius: 10, padding: '16px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {m.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>
                {m.value}
              </p>
              {m.trend && (
                <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>▲ {m.trend}</p>
              )}
              {m.sub && (
                <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>{m.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div style={{
          background: '#fff', border: '1px solid #E8E6DC',
          borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          padding: '20px 20px 16px',
        }}>

          {/* Filter row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid #E8E6DC', borderRadius: 8,
              padding: '0 12px', background: '#fff', flexShrink: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search orders..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  border: 'none', outline: 'none', fontSize: 13,
                  padding: '8px 0', width: 200, fontFamily: poppins,
                  color: '#2C2A28',
                }}
              />
            </div>

            {/* Dropdowns */}
            {[
              { value: status, set: setStatus, options: ['All Status','Paid','Pending','Processing','Fulfilled','Delivered','Refunded'] },
              { value: type,   set: setType,   options: ['All Types','Physical','Digital'] },
              { value: time,   set: setTime,   options: ['All Time','Today','Last 7 days','This month'] },
            ].map((s, i) => (
              <select
                key={i}
                value={s.value || s.options[0]}
                onChange={e => s.set(e.target.value)}
                style={{
                  fontSize: 13, padding: '8px 12px', borderRadius: 8,
                  border: '1px solid #E8E6DC', background: '#fff',
                  color: '#2C2A28', outline: 'none', cursor: 'pointer',
                  fontFamily: poppins,
                }}
              >
                {s.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}

            <button
              onClick={() => { setSearch(''); setStatus(''); setType(''); setTime(''); }}
              style={{
                padding: '8px 14px', background: 'transparent',
                border: '1px solid #E8E6DC', borderRadius: 8,
                fontSize: 12, color: '#8C8A82', cursor: 'pointer', fontFamily: poppins,
              }}
            >
              Clear Filters
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Order','Customer','Product','Type','Date','Amount','Status','Actions'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px',
                      fontSize: 11, fontWeight: 600, color: '#8C8A82',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #E8E6DC',
                      background: '#FAF9F5', whiteSpace: 'nowrap',
                      fontFamily: poppins,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => {
                  const av = avatarColor[o.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                  const st = statusStyle[o.status]   ?? { bg: '#F0EEE6', color: '#5A5852' };
                  const ty = typeStyle[o.type]        ?? { bg: '#F0EEE6', color: '#5A5852' };
                  return (
                    <tr
                      key={o.id}
                      style={{ borderBottom: '1px solid #F0EEE6', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Order ID */}
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#B95A3A', fontFamily: poppins }}>
                          {o.id}
                        </span>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: av.bg, color: av.color,
                            fontSize: 9, fontWeight: 700, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {o.initials}
                          </div>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 500, color: '#141413', lineHeight: 1.3, margin: 0, fontFamily: poppins }}>
                              {o.cust}
                            </p>
                            <p style={{ fontSize: 11, color: '#8C8A82', lineHeight: 1.3, margin: 0, fontFamily: poppins }}>
                              {o.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '13px 14px', fontSize: 12, color: '#2C2A28', fontFamily: poppins }}>
                        {o.product}
                      </td>

                      {/* Type badge */}
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px',
                          borderRadius: 5, fontSize: 11, fontWeight: 600,
                          background: ty.bg, color: ty.color, fontFamily: poppins,
                        }}>
                          {o.type}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '13px 14px', fontSize: 12, color: '#8C8A82', whiteSpace: 'nowrap', fontFamily: poppins }}>
                        {o.date}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '13px 14px', fontSize: 13, fontWeight: 700, color: '#141413', fontFamily: poppins }}>
                        {o.amount}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px',
                          borderRadius: 5, fontSize: 11, fontWeight: 600,
                          background: st.bg, color: st.color, fontFamily: poppins,
                        }}>
                          {o.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button style={{
                            padding: '4px 12px', background: 'transparent',
                            border: '1px solid #E8E6DC', borderRadius: 6,
                            fontSize: 12, color: '#4A4945', cursor: 'pointer',
                            fontFamily: poppins,
                          }}>
                            View
                          </button>
                          {o.status === 'Paid' && (
                            <button style={{
                              padding: '4px 12px', background: '#D97757',
                              border: 'none', borderRadius: 6,
                              fontSize: 12, fontWeight: 600, color: '#fff',
                              cursor: 'pointer', fontFamily: poppins,
                            }}>
                              Fulfill
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', color: '#8C8A82', fontSize: 13, fontFamily: poppins }}>
                      No orders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: '#8C8A82', fontFamily: poppins }}>
              Showing {filtered.length} of 284 orders
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {([<ChevronLeft size={14} />, '1', '2', '3', '…', '28', <ChevronRight size={14} />] as ReactNode[]).map((p, i) => (
                <button
                  key={i}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    fontSize: 12, fontWeight: p === '1' ? 600 : 400,
                    border: `1px solid ${p === '1' ? '#D97757' : '#E8E6DC'}`,
                    background: p === '1' ? '#D97757' : 'transparent',
                    color: p === '1' ? '#fff' : '#2C2A28',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: poppins,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}