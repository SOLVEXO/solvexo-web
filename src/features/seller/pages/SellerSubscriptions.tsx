import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Check } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
interface Plan {
  name: string; price: string; annual: string; desc: string;
  features: string[]; subscribers: number; mrr: string;
}

const PLANS: Plan[] = [
  {
    name: 'Teacher Pro', price: '$9.99/mo', annual: 'or $89/yr',
    desc: 'Full access to all educational resources + new monthly drops',
    features: ['Unlimited downloads','New monthly resources','Priority support','Community access'],
    subscribers: 38, mrr: '$379.62',
  },
  {
    name: 'Resource Bundle', price: '$24.99/mo', annual: 'or $229/yr',
    desc: 'Complete store access including premium digital and physical items',
    features: ['Everything in Teacher Pro','Physical product discounts','1 free digital download/mo','Early access'],
    subscribers: 8, mrr: '$199.92',
  },
  {
    name: 'School License', price: '$89/mo', annual: 'or $799/yr',
    desc: 'Multi-teacher license for schools and districts',
    features: ['Up to 30 teacher seats','Usage analytics','Admin dashboard','Bulk download'],
    subscribers: 2, mrr: '$178.00',
  },
];

interface Subscriber {
  id: string; name: string; initials: string; plan: string;
  amount: string; status: string; started: string; nextBilling: string; totalPaid: string;
}

const SUBSCRIBERS: Subscriber[] = [
  { id: 'SUB-201', name: 'Sarah Mitchell', initials: 'SM', plan: 'Teacher Pro — Monthly',      amount: '$9.99/mo', status: 'Active', started: 'Jan 15', nextBilling: 'Jun 15',      totalPaid: '$49.95' },
  { id: 'SUB-202', name: 'Tom Barnes',     initials: 'TB', plan: 'Resource Bundle — Annual',   amount: '$89/yr',   status: 'Active', started: 'Feb 1',  nextBilling: 'Feb 1, 2026', totalPaid: '$89.00' },
  { id: 'SUB-203', name: 'Amy Liu',        initials: 'AL', plan: 'Teacher Pro — Monthly',      amount: '$9.99/mo', status: 'Active', started: 'Mar 3',  nextBilling: 'Jun 3',       totalPaid: '$29.97' },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  SM: { bg: '#FDECEA', color: '#C0392B' },
  TB: { bg: '#FFF4E5', color: '#B36200' },
  AL: { bg: '#F3EAFB', color: '#7A1EA8' },
};

const metrics = [
  { label: 'Active Subscribers', value: '48',    trend: '+6 this month',       sub: null,       trendUp: true  },
  { label: 'MRR',                value: '$482',  trend: '+14% vs last month',  sub: null,       trendUp: true  },
  { label: 'ARR',                value: '$5,784',trend: null,                  sub: 'Projected',trendUp: false },
  { label: 'Churn Rate',         value: '4.2%',  trend: '↓ Low',               sub: null,       trendUp: true  },
] as const;

const SUB_TABS = ['Active', 'Paused', 'Canceled'];
const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerSubscriptions() {
  usePageTitle('Subscriptions');
  const [subTab, setSubTab] = useState('Active');

  return (
    <>
      <SellerPageHeader
        title="Subscriptions"
        subtitle="Manage recurring billing plans, subscribers, and subscription revenue."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Export Subscribers
            </button>
            <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              + Create Plan
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

        {/* ── Plan Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{ ...cardStyle, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
              {/* Name + Price */}
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', marginBottom: 4 }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#D97757' }}>{plan.price}</span>
                  <span style={{ fontSize: 12, color: '#8C8A82' }}>{plan.annual}</span>
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#8C8A82', marginBottom: 16, lineHeight: 1.6 }}>{plan.desc}</p>

              {/* Features */}
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, padding: 0, listStyle: 'none' }}>
                {plan.features.map(feat => (
                  <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A4945' }}>
                    <Check size={13} style={{ color: '#2D8A4E', flexShrink: 0 }} />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #F0EEE6', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#8C8A82' }}>{plan.subscribers} subscribers</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2D8A4E' }}>{plan.mrr}/mo</span>
              </div>

              {/* Edit button */}
              <button style={{ width: '100%', padding: '8px 0', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                Edit Plan
              </button>
            </div>
          ))}
        </div>

        {/* ── Subscribers Table ── */}
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E8E6DC' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#141413' }}>Subscribers</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#F5F4EF', borderRadius: 8, padding: 3 }}>
              {SUB_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', border: 'none', fontFamily: poppins, transition: 'all 0.12s',
                    background: subTab === tab ? '#141413' : 'transparent',
                    color:      subTab === tab ? '#fff'    : '#8C8A82',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['SUB ID','CUSTOMER','PLAN','AMOUNT','STATUS','STARTED','NEXT BILLING','TOTAL PAID',''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E6DC', background: '#FAF9F5', whiteSpace: 'nowrap', fontFamily: poppins }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBSCRIBERS.map((sub, i) => {
                  const av = avatarColors[sub.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                  return (
                    <tr key={sub.id}
                      style={{ borderBottom: i < SUBSCRIBERS.length - 1 ? '1px solid #F0EEE6' : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#B95A3A', fontFamily: poppins }}>{sub.id}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: av.bg, color: av.color, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sub.initials}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#141413', whiteSpace: 'nowrap', fontFamily: poppins }}>{sub.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4945', whiteSpace: 'nowrap', fontFamily: poppins }}>{sub.plan}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#141413', whiteSpace: 'nowrap', fontFamily: poppins }}>{sub.amount}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#E3F4EA', color: '#1E7A3C', fontFamily: poppins }}>{sub.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#8C8A82', whiteSpace: 'nowrap', fontFamily: poppins }}>{sub.started}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#8C8A82', whiteSpace: 'nowrap', fontFamily: poppins }}>{sub.nextBilling}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{sub.totalPaid}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button style={{ padding: '4px 12px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 6, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}