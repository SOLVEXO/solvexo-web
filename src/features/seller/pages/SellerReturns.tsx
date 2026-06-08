import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
const RETURNS = [
  { rma: 'RMA-041', order: '#8802', customer: 'David Reynolds', product: 'Fractions Mastery Kit',   reason: 'Wrong item received',    amount: '$18.00', status: 'Approved',          date: 'May 18' },
  { rma: 'RMA-040', order: '#8799', customer: 'Lena Kowalski',  product: 'Ceramic Mug — Sage',      reason: 'Arrived damaged',        amount: '$28.00', status: 'Replacement Sent',  date: 'May 16' },
  { rma: 'RMA-039', order: '#8795', customer: 'Mike Svensson',  product: 'Lo-Fi Music Pack',         reason: 'Not as described',       amount: '$24.00', status: 'Under Review',      date: 'May 15' },
  { rma: 'RMA-038', order: '#8780', customer: 'Jane Park',      product: 'Geometric Mug — Navy',     reason: 'Defective product',      amount: '$32.00', status: 'Refunded',          date: 'May 12' },
  { rma: 'RMA-037', order: '#8761', customer: 'Carlos Mendez',  product: 'Writing Prompts Vol.1',    reason: 'Accidentally purchased', amount: '$12.00', status: 'Declined',          date: 'May 8'  },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  'Approved':         { bg: '#EAF0FB', color: '#2156A8' },
  'Replacement Sent': { bg: '#E3F4EA', color: '#1E7A3C' },
  'Under Review':     { bg: '#FFF4DC', color: '#B36200' },
  'Refunded':         { bg: '#E3F4EA', color: '#1E7A3C' },
  'Declined':         { bg: '#FDECEA', color: '#C0392B' },
};

const metrics = [
  { label: 'Open Requests',  value: '2',       trend: null,             sub: 'Awaiting action' },
  { label: 'Return Rate',    value: '2.1%',    trend: '↓ Below avg (5%)', sub: null           },
  { label: 'Total Refunded', value: '$860',    trend: null,             sub: 'Last 30 days'   },
  { label: 'Avg Resolution', value: '1.4 days',trend: '↑ Fast',         sub: null            },
] as const;

const poppins = "'Poppins', sans-serif";

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerReturns() {
  usePageTitle('Returns');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type,   setType]   = useState('');

  const filtered = RETURNS.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.rma.toLowerCase().includes(q) && !r.customer.toLowerCase().includes(q) && !r.product.toLowerCase().includes(q)) return false;
    if (status && status !== 'All Status' && r.status !== status) return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Returns & Refunds"
        subtitle="Process return requests, issue refunds, and send replacements."
        actions={
          <button style={{
            padding: '7px 16px', background: '#fff',
            border: '1px solid #E8E6DC', borderRadius: 8,
            fontSize: 12, fontWeight: 500, color: '#4A4945',
            cursor: 'pointer', fontFamily: poppins,
          }}>
            Export Report
          </button>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics row ── */}
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

        {/* ── Return Policy Summary ── */}
        <div style={{
          background: '#fff', border: '1px solid #E8E6DC',
          borderRadius: 10, padding: '18px 22px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 6 }}>
              Return Policy Summary
            </p>
            <p style={{ fontSize: 13, color: '#8C8A82', lineHeight: 1.6 }}>
              Physical: 30-day returns in original condition. Digital: Non-refundable unless defective. Damaged items: replacement or full refund.
            </p>
          </div>
          <button style={{
            padding: '7px 14px', background: '#fff',
            border: '1px solid #E8E6DC', borderRadius: 8,
            fontSize: 12, color: '#4A4945', cursor: 'pointer',
            flexShrink: 0, fontFamily: poppins,
          }}>
            Edit Policy
          </button>
        </div>

        {/* ── Table card ── */}
        <div style={{
          background: '#fff', border: '1px solid #E8E6DC',
          borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>

          {/* Filters */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 20px', borderBottom: '1px solid #E8E6DC',
            flexWrap: 'wrap',
          }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid #E8E6DC', borderRadius: 8,
              padding: '0 12px', background: '#fff',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search RMA ID or order..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  border: 'none', outline: 'none', fontSize: 13,
                  padding: '8px 0', width: 220, fontFamily: poppins, color: '#2C2A28',
                }}
              />
            </div>

            {/* Status dropdown */}
            <select
              value={status || 'All Status'}
              onChange={e => setStatus(e.target.value === 'All Status' ? '' : e.target.value)}
              style={{
                fontSize: 13, padding: '8px 12px', borderRadius: 8,
                border: '1px solid #E8E6DC', background: '#fff',
                color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins,
              }}
            >
              {['All Status','Approved','Replacement Sent','Under Review','Refunded','Declined'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>

            {/* Type dropdown */}
            <select
              value={type || 'All Types'}
              onChange={e => setType(e.target.value === 'All Types' ? '' : e.target.value)}
              style={{
                fontSize: 13, padding: '8px 12px', borderRadius: 8,
                border: '1px solid #E8E6DC', background: '#fff',
                color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins,
              }}
            >
              {['All Types','Physical','Digital'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['RMA','Order','Customer','Product','Reason','Amount','Status','Date','Actions'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 16px',
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
                {filtered.map((r, i) => {
                  const st = statusStyle[r.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
                  return (
                    <tr
                      key={r.rma}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* RMA */}
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#B95A3A', fontFamily: poppins }}>{r.rma}</span>
                      </td>

                      {/* Order */}
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#141413', fontFamily: poppins }}>{r.order}</span>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#4A4945', whiteSpace: 'nowrap', fontFamily: poppins }}>
                        {r.customer}
                      </td>

                      {/* Product */}
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#4A4945', maxWidth: 180, fontFamily: poppins }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.product}
                        </span>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#8C8A82', maxWidth: 180, fontFamily: poppins }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.reason}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: '#141413', whiteSpace: 'nowrap', fontFamily: poppins }}>
                        {r.amount}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px',
                          borderRadius: 5, fontSize: 11, fontWeight: 600,
                          background: st.bg, color: st.color, fontFamily: poppins,
                          whiteSpace: 'nowrap',
                        }}>
                          {r.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#8C8A82', whiteSpace: 'nowrap', fontFamily: poppins }}>
                        {r.date}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 16px' }}>
                        <button style={{
                          padding: '4px 14px', background: '#fff',
                          border: '1px solid #E8E6DC', borderRadius: 6,
                          fontSize: 12, color: '#4A4945', cursor: 'pointer',
                          fontFamily: poppins, whiteSpace: 'nowrap',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#8C8A82', fontFamily: poppins }}>
                      No return requests match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #E8E6DC' }}>
            <span style={{ fontSize: 12, color: '#8C8A82', fontFamily: poppins }}>
              Showing {filtered.length} of {RETURNS.length} return requests
            </span>
          </div>

        </div>
      </div>
    </>
  );
}