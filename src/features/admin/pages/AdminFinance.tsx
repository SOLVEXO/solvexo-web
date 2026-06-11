import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';

// ── Data ──────────────────────────────────────────────────────────────────────
interface Payout {
  id: string; seller: string; initials: string; email: string;
  amount: string; method: string; period: string;
  status: 'Pending' | 'Processing' | 'Paid' | 'Held';
}

const PAYOUTS: Payout[] = [
  { id: 'PAY-0841', seller: 'Alex Chen',        initials: 'AC', email: 'alex@myshop.com',       amount: '$2,184.00', method: 'Bank Transfer', period: 'May 2025', status: 'Pending'    },
  { id: 'PAY-0840', seller: 'DesignHub Studio', initials: 'DS', email: 'designhub@gmail.com',   amount: '$980.00',   method: 'PayPal',        period: 'May 2025', status: 'Processing' },
  { id: 'PAY-0839', seller: 'BeatFactory',      initials: 'BF', email: 'beats@mail.com',        amount: '$340.00',   method: 'Bank Transfer', period: 'May 2025', status: 'Pending'    },
  { id: 'PAY-0838', seller: 'Priya Sharma',     initials: 'PS', email: 'priya@edu.in',          amount: '$1,240.00', method: 'Bank Transfer', period: 'May 2025', status: 'Pending'    },
  { id: 'PAY-0837', seller: 'QuickSell Store',  initials: 'QS', email: 'quicksell@store.com',   amount: '$120.00',   method: 'PayPal',        period: 'Apr 2025', status: 'Held'       },
  { id: 'PAY-0836', seller: 'Alex Chen',        initials: 'AC', email: 'alex@myshop.com',       amount: '$1,980.00', method: 'Bank Transfer', period: 'Apr 2025', status: 'Paid'       },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  AC: { bg: '#FBECE4', color: '#B95A3A' }, DS: { bg: '#EAF0FB', color: '#2156A8' },
  BF: { bg: '#EAF7EF', color: '#1E7A3C' }, PS: { bg: '#E5F4FB', color: '#1A6A8A' },
  QS: { bg: '#F3EAFB', color: '#7A1EA8' },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Pending:    { bg: '#FFF4DC', color: '#B36200' },
  Processing: { bg: '#EAF0FB', color: '#2156A8' },
  Paid:       { bg: '#E3F4EA', color: '#1E7A3C' },
  Held:       { bg: '#FDECEA', color: '#C0392B' },
};

const metrics = [
  { label: 'Total Revenue',   value: '$8.4M',   trend: '+18.2% this month', sub: null,                trendUp: true  },
  { label: 'Pending Payouts', value: '$4,744',  trend: null,                sub: '4 sellers awaiting',trendUp: false },
  { label: 'Platform Fee',    value: '$1.26M',  trend: '15% commission',    sub: null,                trendUp: true  },
  { label: 'Refunds Issued',  value: '$12,480', trend: null,                sub: 'This month',        trendUp: false },
] as const;

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminFinance() {
  usePageTitle('Finance');
  const [payouts, setPayouts] = useState<Payout[]>(PAYOUTS);

  const approve = (id: string) => setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'Processing' as const } : p));
  const hold    = (id: string) => setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'Held'       as const } : p));

  return (
    <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 3 }}>Finance &amp; Payouts</h1>
        <p style={{ fontSize: 12, color: '#8C8A82' }}>Review revenue, manage seller payouts and financial reports.</p>
      </div>

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

      {/* ── Revenue split ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Revenue Breakdown */}
        <div style={{ ...cardStyle, padding: '20px 22px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 18 }}>Revenue Breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Gross Merchandise Value',   value: '$8,400,000', pct: 100 },
              { label: 'Platform Commission (15%)',  value: '$1,260,000', pct: 15  },
              { label: 'Seller Payouts (85%)',        value: '$7,140,000', pct: 85  },
              { label: 'Payment Fees (~2%)',           value: '$168,000',   pct: 2   },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#4A4945', fontFamily: poppins }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{item.value}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#E8E6DC' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${item.pct}%`, background: '#D97757' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Summary */}
        <div style={{ ...cardStyle, padding: '20px 22px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 16 }}>Payout Summary</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Pending',    count: 3, amount: '$3,764', color: '#C08B1E', bg: '#FEF7E5' },
              { label: 'Processing', count: 1, amount: '$980',   color: '#1A72C2', bg: '#E6F1FB' },
              { label: 'Held',       count: 1, amount: '$120',   color: '#C13030', bg: '#FDEAEA' },
              { label: 'Paid (May)', count: 1, amount: '$1,980', color: '#2D8A4E', bg: '#EBF7EF' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 9, background: s.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.color, fontFamily: poppins }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: s.color, fontFamily: poppins }}>{s.count} seller{s.count !== 1 ? 's' : ''}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: poppins }}>{s.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payouts table ── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 10px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', fontFamily: poppins }}>Pending Payouts</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID','Seller','Amount','Method','Period','Status','Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E6DC', background: '#FAF9F5', whiteSpace: 'nowrap', fontFamily: poppins }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => {
                const av = avatarColors[p.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                const ss = statusStyle[p.status];
                return (
                  <tr key={p.id}
                    style={{ borderBottom: i < payouts.length - 1 ? '1px solid #F0EEE6' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* ID */}
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{p.id}</td>
                    {/* Seller */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: av.bg, color: av.color, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {p.initials}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#141413', fontFamily: poppins }}>{p.seller}</p>
                          <p style={{ fontSize: 11, color: '#8C8A82', fontFamily: poppins }}>{p.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Amount */}
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#141413', fontFamily: poppins }}>{p.amount}</td>
                    {/* Method */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4945', fontFamily: poppins }}>{p.method}</td>
                    {/* Period */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#8C8A82', fontFamily: poppins }}>{p.period}</td>
                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color, fontFamily: poppins }}>{p.status}</span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.status === 'Pending' ? (
                          <>
                            <button onClick={() => approve(p.id)} style={{ fontSize: 11, fontWeight: 500, color: '#2D8A4E', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>Approve</button>
                            <span style={{ color: '#E8E6DC', fontSize: 13 }}>|</span>
                            <button onClick={() => hold(p.id)}    style={{ fontSize: 11, fontWeight: 500, color: '#C13030', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>Hold</button>
                          </>
                        ) : (
                          <button style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>View</button>
                        )}
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