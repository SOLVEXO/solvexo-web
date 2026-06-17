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
            <button className="px-4 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Program Settings
            </button>
            <button className="px-4 py-[7px] bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">
              + Create Reward
            </button>
          </>
        }
      />

      <div className="px-7 pb-8 pt-5 flex flex-col gap-5">

        {/* ── Metrics ── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-[#E8E6DC] rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-medium text-[#8C8A82] uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-[#141413] leading-[1.15]">{m.value}</p>
              {m.trend && <p className="text-xs text-[#2D8A4E] mt-1">▲ {m.trend}</p>}
              {m.sub   && <p className="text-xs text-[#8C8A82] mt-1">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-0.5 border-b border-[#E8E6DC]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-[10px] text-[13px] font-medium cursor-pointer border-none rounded-tl-lg rounded-tr-lg transition-all duration-[120ms] flex items-center gap-1.5"
              style={{
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
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>

            {/* Member Distribution */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[14px] font-bold text-[#141413] mb-[18px]">Member Distribution</p>
              <div className="flex flex-col gap-4">
                {TIERS.map(tier => (
                  <div key={tier.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <tier.Icon size={18} style={{ color: tier.iconColor }} />
                        <span className="text-[13px] font-semibold text-[#4A4945]">{tier.name}</span>
                      </div>
                      <span className="text-xs text-[#8C8A82]">{tier.members.toLocaleString()} members</span>
                    </div>
                    <div className="h-2 rounded-[4px] bg-[#E8E6DC] overflow-hidden">
                      <div className="h-full rounded-[4px]" style={{ width: `${tier.pct}%`, background: tier.barColor }} />
                    </div>
                    <p className="text-[11px] text-[#8C8A82] mt-[3px] text-right">{tier.pct}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Points Activity */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[14px] font-bold text-[#141413] mb-[18px]">Points Activity (Last 30 Days)</p>
              <div className="flex flex-col">
                {POINTS_ACTIVITY.map((item, i) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-[10px]"
                    style={{ borderBottom: i < POINTS_ACTIVITY.length - 1 ? '1px solid #F0EEE6' : 'none' }}
                  >
                    <span className="text-[13px] text-[#4A4945]">{item.label}</span>
                    <span className="text-[13px] font-bold" style={{ color: item.positive ? '#2D8A4E' : '#C13030' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Other Tabs ── */}
        {activeTab !== 'overview' && (
          <div className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[14px] font-bold text-[#141413] mb-2">
              {TABS.find(t => t.id === activeTab)?.label}
            </p>
            <p className="text-[13px] text-[#8C8A82]">
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
