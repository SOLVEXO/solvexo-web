import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Tag as TagIcon, Mail, ShoppingCart, Handshake, Gift, type LucideIcon } from 'lucide-react';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
type Tab = 'coupons' | 'email' | 'cart' | 'affiliate' | 'giftcards';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'coupons',   label: 'Coupons',        Icon: TagIcon      },
  { id: 'email',     label: 'Email Campaigns', Icon: Mail         },
  { id: 'cart',      label: 'Abandoned Cart',  Icon: ShoppingCart },
  { id: 'affiliate', label: 'Affiliate',       Icon: Handshake    },
  { id: 'giftcards', label: 'Gift Cards',      Icon: Gift         },
];

const COUPONS = [
  { code: 'BACK2SCHOOL', type: '20% Off',     uses: 84, limit: 200,  expires: 'Jun 30', revenue: '$1,240', status: 'Active' },
  { code: 'NEWTEACHER10',type: '$10 Off $50+', uses: 62, limit: null, expires: 'Never',  revenue: '$820',   status: 'Active' },
  { code: 'SUMMER30',    type: '30% Off',     uses: 38, limit: 100,  expires: 'Jul 31', revenue: '$920',   status: 'Active' },
];

const CAMPAIGNS = [
  { name: 'Back to School Sale',      status: 'Sent',   info: 'Sent May 15, 2025',       sent: 2840, opened: 1136, clicked: 284, revenue: '$1,480' },
  { name: 'Welcome New Buyers',       status: 'Active', info: 'Automated — ongoing',      sent: 362,  opened: 181,  clicked: 54,  revenue: '$620'   },
  { name: 'Summer Discount Blast',    status: 'Draft',  info: 'Scheduled Jun 1, 2025',   sent: 0,    opened: 0,    clicked: 0,   revenue: '—'      },
  { name: 'Re-engage At-Risk Buyers', status: 'Paused', info: 'Paused Apr 30, 2025',     sent: 38,   opened: 12,   clicked: 4,   revenue: '$180'   },
];

const metrics = [
  { label: 'Marketing Revenue',  value: '$4,280', trend: '+22%',                sub: null,                trendUp: true  },
  { label: 'Active Campaigns',   value: '3',      trend: null,                  sub: '2 email · 1 coupon',trendUp: false },
  { label: 'Coupon Redemptions', value: '184',    trend: 'Last 30 days',        sub: null,                trendUp: true  },
  { label: 'Cart Recovery',      value: '$640',   trend: '12 carts recovered',  sub: null,                trendUp: true  },
] as const;

const statusStyle: Record<string, { bg: string; color: string }> = {
  Sent:   { bg: '#E3F4EA', color: '#1E7A3C' },
  Active: { bg: '#E3F4EA', color: '#1E7A3C' },
  Draft:  { bg: '#F0EEE6', color: '#5A5852' },
  Paused: { bg: '#FFF4DC', color: '#B36200' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerMarketing() {
  usePageTitle('Marketing');
  const [tab,          setTab]          = useState<Tab>('coupons');
  const [couponCode,   setCouponCode]   = useState('');
  const [discountType, setDiscountType] = useState('');
  const [value,        setValue]        = useState('');
  const [minOrder,     setMinOrder]     = useState('');
  const [usageLimit,   setUsageLimit]   = useState('');
  const [expiryDate,   setExpiryDate]   = useState('');

  return (
    <>
      <SellerPageHeader
        title="Marketing"
        subtitle="Drive traffic, recover sales, and reward customers."
        actions={
          <button className="px-4 py-[7px] bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">
            + Create Campaign
          </button>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Metrics ── */}
        <div className="grid grid-cols-4 gap-3">
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
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium cursor-pointer border-none bg-transparent transition-all duration-[120ms] -mb-px"
              style={{
                borderBottom: `2px solid ${tab === t.id ? '#D97757' : 'transparent'}`,
                color: tab === t.id ? '#D97757' : '#8C8A82',
              }}
            >
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Coupons Tab ── */}
        {tab === 'coupons' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold text-[#141413]">Active Coupons</p>
              <button className="px-3.5 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
                + New Coupon
              </button>
            </div>

            {/* Coupon cards */}
            <div className="grid grid-cols-3 gap-4">
              {COUPONS.map(coupon => (
                <div key={coupon.code} className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="px-3 py-[5px] rounded-lg border-2 border-dashed border-brand-orange font-mono text-[13px] font-bold text-[#B95A3A] bg-[#FBECE4]">
                      {coupon.code}
                    </div>
                    <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold bg-[#E3F4EA] text-[#1E7A3C]">
                      {coupon.status}
                    </span>
                  </div>

                  <p className="text-[13px] font-semibold text-[#141413] mb-3">{coupon.type}</p>

                  <table className="w-full border-collapse text-xs mb-3">
                    <tbody>
                      {[['Uses', `${coupon.uses} / ${coupon.limit ?? 'Unlimited'}`],['Expires', coupon.expires],['Revenue', coupon.revenue]].map(([label, val], i, arr) => (
                        <tr key={label} style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0EEE6' : 'none' }}>
                          <td className="py-1.5 text-[#8C8A82]">{label}</td>
                          <td className="py-1.5 font-semibold text-[#141413] text-right">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {coupon.limit && (
                    <div className="h-[5px] bg-[#E8E6DC] rounded-[3px] mb-3.5 overflow-hidden">
                      <div
                        className="h-full rounded-[3px] bg-brand-orange"
                        style={{ width: `${(coupon.uses / coupon.limit) * 100}%` }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="flex-1 py-[7px] bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">Edit</button>
                    <button className="flex-1 py-[7px] bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">Pause</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Create coupon form */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-bold text-[#141413] mb-4">Create New Coupon</p>
              <div className="grid grid-cols-3 gap-3.5 mb-4">
                <div>
                  <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Coupon Code</label>
                  <input placeholder="e.g. SAVE20" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Discount Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white cursor-pointer box-border">
                    <option value="">Select type…</option>
                    <option>Percentage Off</option>
                    <option>Fixed Amount Off</option>
                    <option>Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Value</label>
                  <input placeholder="e.g. 20 or 10.00" value={value} onChange={e => setValue(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Minimum Order ($)</label>
                  <input placeholder="0.00" value={minOrder} onChange={e => setMinOrder(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Usage Limit</label>
                  <input placeholder="Leave blank for unlimited" value={usageLimit} onChange={e => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Expiry Date</label>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                </div>
              </div>
              <button className="px-6 py-2.5 bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white cursor-pointer">
                Create Coupon
              </button>
            </div>
          </div>
        )}

        {/* ── Email Tab ── */}
        {tab === 'email' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold text-[#141413]">Email Campaigns</p>
              <button className="px-3.5 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
                + New Campaign
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CAMPAIGNS.map(campaign => {
                const st = statusStyle[campaign.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
                return (
                  <div key={campaign.name} className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-[#141413]">{campaign.name}</p>
                      <span
                        className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold shrink-0 ml-2"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8A82] mb-3.5">{campaign.info}</p>

                    {campaign.sent > 0 && (
                      <div className="grid grid-cols-4 gap-2 mb-3.5">
                        {[['Sent', campaign.sent.toLocaleString()],['Opened', campaign.opened.toLocaleString()],['Clicked', campaign.clicked.toLocaleString()],['Revenue', campaign.revenue]].map(([label, val]) => (
                          <div key={label} className="text-center bg-[#FAF9F5] rounded-lg py-2 px-1">
                            <p className="text-sm font-bold text-[#141413]">{val}</p>
                            <p className="text-[10px] text-[#8C8A82]">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="px-3.5 py-1.5 bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">Edit</button>
                      <button className="px-3.5 py-1.5 bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">View</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Coming Soon Tabs ── */}
        {(tab === 'cart' || tab === 'affiliate' || tab === 'giftcards') && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-brand-orange mb-4">
              {(() => { const found = TABS.find(t => t.id === tab); return found ? <found.Icon size={48} /> : null; })()}
            </div>
            <p className="text-base font-semibold text-[#141413] mb-1.5">
              {TABS.find(t => t.id === tab)?.label} — Coming Soon
            </p>
            <p className="text-[13px] text-[#8C8A82]">
              This feature is being built. Stay tuned for updates!
            </p>
          </div>
        )}

      </div>
    </>
  );
}
