import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { ArrowRight } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const TRANSACTIONS = [
  { date: 'May 20', description: 'Payout — Bank Transfer',       type: 'Payout', amount: '-$2,840.00', positive: false, balance: '$320.40'   },
  { date: 'May 18', description: 'Sale — Grade 5 Math Bundle × 6',type: 'Sale',   amount: '+$294.00',   positive: true,  balance: '$3,160.40' },
  { date: 'May 17', description: 'Sale — Fractions Kit × 3',      type: 'Sale',   amount: '+$54.00',    positive: true,  balance: '$2,866.40' },
  { date: 'May 17', description: 'Platform Fee (8%)',              type: 'Fee',    amount: '-$27.84',    positive: false, balance: '$2,812.40' },
  { date: 'May 16', description: 'Refund — Order #8815',           type: 'Refund', amount: '-$12.00',    positive: false, balance: '$2,840.24' },
  { date: 'May 15', description: 'Sale — Ceramic Mug Set',         type: 'Sale',   amount: '+$58.00',    positive: true,  balance: '$2,852.24' },
];

const typeStyle: Record<string, { bg: string; color: string }> = {
  Sale:   { bg: '#E3F4EA', color: '#1E7A3C' },
  Payout: { bg: '#F0EEE6', color: '#5A5852' },
  Fee:    { bg: '#FFF4DC', color: '#B36200' },
  Refund: { bg: '#FDECEA', color: '#C0392B' },
};

const TAX_REPORTS = [
  { name: 'Q1 2025 Summary', period: 'Jan–Mar',  date: 'Generated Apr 1, 2025'  },
  { name: 'Q4 2024 Summary', period: 'Oct–Dec',  date: 'Generated Jan 2, 2025'  },
  { name: 'Annual 2024',     period: 'Full Year', date: 'Generated Feb 5, 2025' },
];

const metrics = [
  { label: 'This Month Revenue', value: '$9,100',  trend: '+23% vs last month', sub: null,              trendUp: true  },
  { label: 'Platform Fees',      value: '$728',    trend: null,                 sub: '8% of revenue',   trendUp: false },
  { label: 'Total Paid Out',     value: '$24,800', trend: null,                 sub: 'All time',         trendUp: false },
  { label: 'Pending Tax',        value: '$1,240',  trend: null,                 sub: 'Est. for Q2 2025', trendUp: false },
] as const;

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerFinance() {
  usePageTitle('Finance');

  return (
    <>
      <SellerPageHeader
        title="Finance & Payouts"
        subtitle="Track earnings, payouts, fees, and tax reports."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Download Tax Report
            </button>
            <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              Request Payout
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Balance Card ── */}
        <div style={{ background: '#141413', borderRadius: 12, padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Available Balance
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 12 }}>$3,160.40</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <span style={{ fontSize: 11, color: '#8C8A82' }}>Pending: <span style={{ color: '#fff', fontWeight: 500 }}>$840.00</span></span>
              <span style={{ fontSize: 11, color: '#D97757', fontWeight: 500 }}>Next Payout: May 25</span>
              <span style={{ fontSize: 11, color: '#8C8A82' }}>Method: Bank ••4821</span>
            </div>
          </div>
          <button style={{ padding: '10px 20px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins, display: 'flex', alignItems: 'center', gap: 6 }}>
            Request Payout <ArrowRight size={14} />
          </button>
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

        {/* ── 2-col layout ── */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* LEFT — Transaction History */}
          <div style={{ flex: 1, minWidth: 0, ...cardStyle, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E8E6DC', flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#141413' }}>Transaction History</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select style={{ padding: '7px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins }}>
                  <option>All Types</option>
                  <option>Sale</option>
                  <option>Payout</option>
                  <option>Fee</option>
                  <option>Refund</option>
                </select>
                <button style={{ padding: '7px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                  Export CSV
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date','Description','Type','Amount','Balance'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E6DC', background: '#FAF9F5', whiteSpace: 'nowrap', fontFamily: poppins }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map((t, i) => {
                    const ts = typeStyle[t.type] ?? { bg: '#F0EEE6', color: '#5A5852' };
                    return (
                      <tr key={i} style={{ borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid #F0EEE6' : 'none', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#8C8A82', whiteSpace: 'nowrap', fontFamily: poppins }}>{t.date}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4945', fontFamily: poppins }}>{t.description}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: ts.bg, color: ts.color, fontFamily: poppins }}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', color: t.positive ? '#2D8A4E' : '#C13030', fontFamily: poppins }}>
                          {t.amount}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#141413', whiteSpace: 'nowrap', fontFamily: poppins }}>
                          {t.balance}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — 3 stacked cards */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Payout Schedule */}
            <div style={{ ...cardStyle, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 12 }}>Payout Schedule</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Frequency','Weekly (Every Monday)'],['Method','Bank Transfer ••4821'],['Currency','USD'],['Minimum','$50.00']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#8C8A82', fontFamily: poppins }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', fontFamily: poppins }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0EEE6' }}>
                <button style={{ padding: '6px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                  Update Payout Method
                </button>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div style={{ ...cardStyle, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 12 }}>Fee Breakdown</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Marketplace Listing Fee','Free'],['Transaction Fee','8% per sale'],['Payment Processing','2.9% + $0.30'],['Digital Delivery','Included'],['AI Credits','750 / month']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#8C8A82', fontFamily: poppins }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', fontFamily: poppins }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Reports */}
            <div style={{ ...cardStyle, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 12 }}>Tax Reports</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {TAX_REPORTS.map(r => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#4A4945', lineHeight: 1.3, fontFamily: poppins }}>{r.name}</p>
                      <p style={{ fontSize: 11, color: '#8C8A82', marginTop: 2, fontFamily: poppins }}>{r.period} · {r.date}</p>
                    </div>
                    <button style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#8C8A82', cursor: 'pointer', fontFamily: poppins }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}