import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Star, Trophy, Gift, Users, Settings, Award, Gem } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const TABS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 'overview',      Icon: Star,     label: 'Overview'        },
  { id: 'tiers',         Icon: Trophy,   label: 'Tiers'           },
  { id: 'rewards',       Icon: Gift,     label: 'Rewards Catalog' },
  { id: 'members',       Icon: Users,    label: 'Member Activity' },
  { id: 'earning-rules', Icon: Settings, label: 'Earning Rules'   },
];

const TIERS: { Icon: LucideIcon; iconColor: string; barColor: string; name: string; members: number; pct: number }[] = [
  { Icon: Award, iconColor: '#CD7F32', barColor: '#8C6A3A', name: 'Bronze',   members: 892, pct: 67 },
  { Icon: Award, iconColor: '#A0A0A0', barColor: '#A0A0A0', name: 'Silver',   members: 312, pct: 24 },
  { Icon: Award, iconColor: '#D4A017', barColor: '#D4A017', name: 'Gold',     members: 94,  pct: 7  },
  { Icon: Gem,   iconColor: '#4A90D9', barColor: '#4A90D9', name: 'Platinum', members: 28,  pct: 2  },
];

const POINTS_ACTIVITY = [
  { label: 'Points Earned from Purchases', value: '142,800', positive: true  },
  { label: 'Points Earned from Reviews',   value: '8,400',   positive: true  },
  { label: 'Points Earned from Referrals', value: '12,200',  positive: true  },
  { label: 'Birthday Bonuses',             value: '6,000',   positive: true  },
  { label: 'Points Expired',               value: '-24,000', positive: false },
  { label: 'Total Points Redeemed',        value: '-84,200', positive: false },
];

const metrics = [
  { label: 'Program Members',               value: '1,326',   trend: '+84 this month',        sub: null,                  trendUp: true  },
  { label: 'Points Issued',                 value: '248,400', trend: 'Last 30 days',          sub: null,                  trendUp: true  },
  { label: 'Points Redeemed',               value: '84,200',  trend: null,                    sub: '34% redemption rate', trendUp: false },
  { label: 'Revenue from Loyal Customers',  value: '$8,200',  trend: '+31% vs non-members',   sub: null,                  trendUp: true  },
] as const;

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerLoyalty() {
  usePageTitle('Loyalty');
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      <SellerPageHeader
        title="Loyalty & Rewards"
        subtitle="Build lasting customer relationships with a points-based loyalty program."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Program Settings
            </button>
            <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              + Create Reward
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{m.value}</p>
              {m.trend && <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>▲ {m.trend}</p>}
              {m.sub   && <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #E8E6DC' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: 'none', fontFamily: poppins,
                borderRadius: '8px 8px 0 0', transition: 'all 0.12s',
                display: 'flex', alignItems: 'center', gap: 6,
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#141413' : '#8C8A82',
                borderBottom: activeTab === tab.id ? '2px solid #D97757' : '2px solid transparent',
              }}
            >
              <tab.Icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Member Distribution */}
            <div style={cardStyle}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 18 }}>Member Distribution</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {TIERS.map(tier => (
                  <div key={tier.name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <tier.Icon size={18} style={{ color: tier.iconColor }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#4A4945', fontFamily: poppins }}>{tier.name}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#8C8A82', fontFamily: poppins }}>{tier.members.toLocaleString()} members</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#E8E6DC', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, width: `${tier.pct}%`, background: tier.barColor }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#8C8A82', marginTop: 3, textAlign: 'right', fontFamily: poppins }}>{tier.pct}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Points Activity */}
            <div style={cardStyle}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 18 }}>Points Activity (Last 30 Days)</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {POINTS_ACTIVITY.map((item, i) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < POINTS_ACTIVITY.length - 1 ? '1px solid #F0EEE6' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#4A4945', fontFamily: poppins }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.positive ? '#2D8A4E' : '#C13030', fontFamily: poppins }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Other Tabs ── */}
        {activeTab !== 'overview' && (
          <div style={cardStyle}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 8 }}>
              {TABS.find(t => t.id === activeTab)?.label}
            </p>
            <p style={{ fontSize: 13, color: '#8C8A82', fontFamily: poppins }}>
              {activeTab === 'tiers'         && 'Configure tier thresholds, benefits, and upgrade criteria.'}
              {activeTab === 'rewards'       && 'Create and manage redeemable rewards for your loyalty members.'}
              {activeTab === 'members'       && 'View individual member points balances, activity, and tier status.'}
              {activeTab === 'earning-rules' && 'Define how members earn points — purchases, reviews, referrals and more.'}
            </p>
          </div>
        )}

      </div>
    </>
  );
}