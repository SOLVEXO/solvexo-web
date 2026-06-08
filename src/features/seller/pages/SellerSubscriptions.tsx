import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Check } from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  annual: string;
  desc: string;
  features: string[];
  subscribers: number;
  mrr: string;
}

const PLANS: Plan[] = [
  {
    name: 'Teacher Pro',
    price: '$9.99/mo',
    annual: 'or $89/yr',
    desc: 'Full access to all educational resources + new monthly drops',
    features: [
      'Unlimited downloads',
      'New monthly resources',
      'Priority support',
      'Community access',
    ],
    subscribers: 38,
    mrr: '$379.62',
  },
  {
    name: 'Resource Bundle',
    price: '$24.99/mo',
    annual: 'or $229/yr',
    desc: 'Complete store access including premium digital and physical items',
    features: [
      'Everything in Teacher Pro',
      'Physical product discounts',
      '1 free digital download/mo',
      'Early access',
    ],
    subscribers: 8,
    mrr: '$199.92',
  },
  {
    name: 'School License',
    price: '$89/mo',
    annual: 'or $799/yr',
    desc: 'Multi-teacher license for schools and districts',
    features: [
      'Up to 30 teacher seats',
      'Usage analytics',
      'Admin dashboard',
      'Bulk download',
    ],
    subscribers: 2,
    mrr: '$178.00',
  },
];

interface Subscriber {
  id: string;
  name: string;
  plan: string;
  amount: string;
  status: string;
  started: string;
  nextBilling: string;
  totalPaid: string;
}

const SUBSCRIBERS: Subscriber[] = [
  {
    id: 'SUB-201',
    name: 'Sarah Mitchell',
    plan: 'Teacher Pro — Monthly',
    amount: '$9.99/mo',
    status: 'Active',
    started: 'Jan 15',
    nextBilling: 'Jun 15',
    totalPaid: '$49.95',
  },
  {
    id: 'SUB-202',
    name: 'Tom Barnes',
    plan: 'Resource Bundle — Annual',
    amount: '$89/yr',
    status: 'Active',
    started: 'Feb 1',
    nextBilling: 'Feb 1, 2026',
    totalPaid: '$89.00',
  },
  {
    id: 'SUB-203',
    name: 'Amy Liu',
    plan: 'Teacher Pro — Monthly',
    amount: '$9.99/mo',
    status: 'Active',
    started: 'Mar 3',
    nextBilling: 'Jun 3',
    totalPaid: '$29.97',
  },
];

const SUB_TABS = ['Active', 'Paused', 'Canceled'];

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
            <Button variant="ghost" size="sm">Export Subscribers</Button>
            <Button variant="primary" size="sm">+ Create Plan</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-6">

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Active Subscribers"
            value="48"
            trend="+6 this month"
            trendUp
          />
          <MetricCard
            label="MRR"
            value="$482"
            trend="+14% vs last month"
            trendUp
          />
          <MetricCard
            label="ARR"
            value="$5,784"
            sub="Projected"
          />
          <MetricCard
            label="Churn Rate"
            value="4.2%"
            trend="↓ Low"
            trendUp
          />
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <Card key={plan.name} className="flex flex-col">
              {/* Plan name & price */}
              <div className="mb-3">
                <p className="text-[15px] font-bold text-carbon mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-bold text-brand-orange">{plan.price}</span>
                  <span className="text-[12px] text-slate">{plan.annual}</span>
                </div>
              </div>

              <p className="text-[12px] text-slate mb-4 leading-relaxed">{plan.desc}</p>

              {/* Features */}
              <ul className="flex flex-col gap-1.5 mb-5">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-[13px] text-charcoal">
                    <Check size={13} className="text-success flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="flex items-center justify-between py-3 border-t border-bone mb-4">
                <span className="text-[12px] text-slate">{plan.subscribers} subscribers</span>
                <span className="text-[13px] font-bold text-success">{plan.mrr}/mo recurring revenue</span>
              </div>

              <Button variant="ghost" size="sm" fullWidth>Edit Plan</Button>
            </Card>
          ))}
        </div>

        {/* Subscribers Table */}
        <Card padding="none">
          {/* Table header with tabs */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-bone">
            <p className="text-[15px] font-bold text-carbon">Subscribers</p>
            <div className="flex items-center gap-1 bg-cream rounded-lg p-1">
              {SUB_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className={[
                    'px-3 py-1.5 rounded-md text-[12px] font-medium cursor-pointer transition-all duration-150',
                    subTab === tab
                      ? 'bg-carbon text-white'
                      : 'text-slate hover:text-charcoal',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-bone">
                  {['SUB ID', 'CUSTOMER', 'PLAN', 'AMOUNT', 'STATUS', 'STARTED', 'NEXT BILLING', 'TOTAL PAID', ''].map(h => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-slate uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBSCRIBERS.map((sub, i) => (
                  <tr
                    key={sub.id}
                    className={`transition-colors hover:bg-cream ${i < SUBSCRIBERS.length - 1 ? 'border-b border-bone' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-bold text-brand-deep-orange">{sub.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={sub.name} size={30} />
                        <span className="font-medium text-carbon whitespace-nowrap">{sub.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal whitespace-nowrap">{sub.plan}</td>
                    <td className="px-4 py-3 font-semibold text-carbon whitespace-nowrap">{sub.amount}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3 text-slate whitespace-nowrap">{sub.started}</td>
                    <td className="px-4 py-3 text-slate whitespace-nowrap">{sub.nextBilling}</td>
                    <td className="px-4 py-3 font-semibold text-carbon">{sub.totalPaid}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </>
  );
}
