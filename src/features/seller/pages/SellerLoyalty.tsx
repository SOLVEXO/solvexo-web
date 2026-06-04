import { useState } from 'react';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';

const TABS = [
  { id: 'overview',       label: '⭐ Overview'         },
  { id: 'tiers',          label: '🏆 Tiers'            },
  { id: 'rewards',        label: '🎁 Rewards Catalog'  },
  { id: 'members',        label: '👥 Member Activity'  },
  { id: 'earning-rules',  label: '⚙️ Earning Rules'    },
];

const TIERS = [
  { icon: '🥉', name: 'Bronze',   members: 892, pct: 67, color: 'bg-charcoal'      },
  { icon: '🥈', name: 'Silver',   members: 312, pct: 24, color: 'bg-slate'         },
  { icon: '🥇', name: 'Gold',     members: 94,  pct: 7,  color: 'bg-yellow-400'    },
  { icon: '💎', name: 'Platinum', members: 28,  pct: 2,  color: 'bg-blue-400'      },
];

const POINTS_ACTIVITY = [
  { label: 'Points Earned from Purchases', value: '142,800', positive: true  },
  { label: 'Points Earned from Reviews',   value: '8,400',   positive: true  },
  { label: 'Points Earned from Referrals', value: '12,200',  positive: true  },
  { label: 'Birthday Bonuses',             value: '6,000',   positive: true  },
  { label: 'Points Expired',               value: '-24,000', positive: false },
  { label: 'Total Points Redeemed',        value: '-84,200', positive: false },
];

export function SellerLoyalty() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      <SellerPageHeader
        title="Loyalty & Rewards"
        subtitle="Build lasting customer relationships with a points-based loyalty program."
        actions={
          <>
            <Button variant="ghost" size="sm">Program Settings</Button>
            <Button variant="primary" size="sm">+ Create Reward</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-6">

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Program Members"
            value="1,326"
            trend="+84 this month"
            trendUp
          />
          <MetricCard
            label="Points Issued"
            value="248,400"
            trend="Last 30 days"
            trendUp
          />
          <MetricCard
            label="Points Redeemed"
            value="84,200"
            sub="34% redemption rate"
          />
          <MetricCard
            label="Revenue from Loyal Customers"
            value="$8,200"
            trend="+31% vs non-members"
            trendUp
          />
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-bone">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-4 py-2.5 text-[13px] font-medium rounded-t-lg cursor-pointer transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-white border border-bone border-b-white text-carbon -mb-px'
                  : 'text-slate hover:text-charcoal',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-5">

            {/* Member Distribution */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Member Distribution</p>
              <div className="flex flex-col gap-4">
                {TIERS.map(tier => (
                  <div key={tier.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[18px]">{tier.icon}</span>
                        <span className="text-[13px] font-semibold text-charcoal">{tier.name}</span>
                      </div>
                      <span className="text-[12px] text-slate">{tier.members.toLocaleString()} members</span>
                    </div>
                    <div className="h-2 rounded-full bg-bone overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tier.color}`}
                        style={{ width: `${tier.pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate mt-0.5 text-right">{tier.pct}%</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Points Activity */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Points Activity (Last 30 Days)</p>
              <div className="flex flex-col">
                {POINTS_ACTIVITY.map(item => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2 border-b border-bone last:border-b-0"
                  >
                    <span className="text-[13px] text-charcoal">{item.label}</span>
                    <span className={`text-[13px] font-bold ${item.positive ? 'text-success' : 'text-error'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'tiers' && (
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-4">Tier Configuration</p>
            <p className="text-[13px] text-slate">Configure tier thresholds, benefits, and upgrade criteria.</p>
          </Card>
        )}

        {activeTab === 'rewards' && (
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-4">Rewards Catalog</p>
            <p className="text-[13px] text-slate">Create and manage redeemable rewards for your loyalty members.</p>
          </Card>
        )}

        {activeTab === 'members' && (
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-4">Member Activity</p>
            <p className="text-[13px] text-slate">View individual member points balances, activity, and tier status.</p>
          </Card>
        )}

        {activeTab === 'earning-rules' && (
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-4">Earning Rules</p>
            <p className="text-[13px] text-slate">Define how members earn points — purchases, reviews, referrals and more.</p>
          </Card>
        )}

      </div>
    </>
  );
}
