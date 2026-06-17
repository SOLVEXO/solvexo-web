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
            <button className="px-4 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Export Subscribers
            </button>
            <button className="px-4 py-[7px] bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">
              + Create Plan
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

        {/* ── Plan Cards ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {PLANS.map(plan => (
            <div key={plan.name} className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-5 flex flex-col">
              {/* Name + Price */}
              <div className="mb-[10px]">
                <p className="text-[15px] font-bold text-[#141413] mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-bold text-brand-orange">{plan.price}</span>
                  <span className="text-xs text-[#8C8A82]">{plan.annual}</span>
                </div>
              </div>

              <p className="text-xs text-[#8C8A82] mb-4 leading-[1.6]">{plan.desc}</p>

              {/* Features */}
              <ul className="flex flex-col gap-2 mb-5 p-0 list-none">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-[13px] text-[#4A4945]">
                    <Check size={13} style={{ color: '#2D8A4E', flexShrink: 0 }} />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="flex items-center justify-between py-3 border-t border-[#F0EEE6] mb-[14px]">
                <span className="text-xs text-[#8C8A82]">{plan.subscribers} subscribers</span>
                <span className="text-xs font-bold text-[#2D8A4E]">{plan.mrr}/mo</span>
              </div>

              {/* Edit button */}
              <button className="w-full py-2 bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
                Edit Plan
              </button>
            </div>
          ))}
        </div>

        {/* ── Subscribers Table ── */}
        <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-[14px] border-b border-[#E8E6DC]">
            <p className="text-[15px] font-bold text-[#141413]">Subscribers</p>
            <div className="flex items-center gap-0.5 bg-[#F5F4EF] rounded-lg p-[3px]">
              {SUB_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className="px-[14px] py-[5px] rounded-[6px] text-xs font-medium cursor-pointer border-none transition-all duration-[120ms]"
                  style={{
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['SUB ID','CUSTOMER','PLAN','AMOUNT','STATUS','STARTED','NEXT BILLING','TOTAL PAID',''].map(h => (
                    <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-[#8C8A82] uppercase tracking-[0.05em] border-b border-[#E8E6DC] bg-[#FAF9F5] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBSCRIBERS.map((sub, i) => {
                  const av = avatarColors[sub.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                  return (
                    <tr
                      key={sub.id}
                      className="transition-[background] duration-[120ms]"
                      style={{ borderBottom: i < SUBSCRIBERS.length - 1 ? '1px solid #F0EEE6' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-[#B95A3A]">{sub.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-[10px]">
                          <div
                            className="w-[30px] h-[30px] rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                            style={{ background: av.bg, color: av.color }}
                          >
                            {sub.initials}
                          </div>
                          <span className="text-[13px] font-medium text-[#141413] whitespace-nowrap">{sub.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#4A4945] whitespace-nowrap">{sub.plan}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#141413] whitespace-nowrap">{sub.amount}</td>
                      <td className="px-4 py-3">
                        <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold bg-[#E3F4EA] text-[#1E7A3C]">{sub.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#8C8A82] whitespace-nowrap">{sub.started}</td>
                      <td className="px-4 py-3 text-[13px] text-[#8C8A82] whitespace-nowrap">{sub.nextBilling}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#141413]">{sub.totalPaid}</td>
                      <td className="px-4 py-3">
                        <button className="px-3 py-1 bg-white border border-[#E8E6DC] rounded-[6px] text-xs text-[#4A4945] cursor-pointer">
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
