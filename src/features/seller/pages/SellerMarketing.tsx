import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Tag as TagIcon, Mail, ShoppingCart, Handshake, Gift, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

type Tab = 'coupons' | 'email' | 'cart' | 'affiliate' | 'giftcards';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'coupons',   label: 'Coupons',         Icon: TagIcon      },
  { id: 'email',     label: 'Email Campaigns',  Icon: Mail         },
  { id: 'cart',      label: 'Abandoned Cart',   Icon: ShoppingCart },
  { id: 'affiliate', label: 'Affiliate',        Icon: Handshake    },
  { id: 'giftcards', label: 'Gift Cards',       Icon: Gift         },
];

const COUPONS = [
  {
    code:     'BACK2SCHOOL',
    type:     '20% Off',
    uses:     84,
    limit:    200,
    expires:  'Jun 30',
    revenue:  '$1,240',
    status:   'Active',
  },
  {
    code:     'NEWTEACHER10',
    type:     '$10 Off $50+',
    uses:     62,
    limit:    null,
    expires:  'Never',
    revenue:  '$820',
    status:   'Active',
  },
  {
    code:     'SUMMER30',
    type:     '30% Off',
    uses:     38,
    limit:    100,
    expires:  'Jul 31',
    revenue:  '$920',
    status:   'Active',
  },
];

const CAMPAIGNS = [
  {
    name:    'Back to School Sale',
    status:  'Sent',
    info:    'Sent May 15, 2025',
    sent:    2840,
    opened:  1136,
    clicked: 284,
    revenue: '$1,480',
  },
  {
    name:    'Welcome New Buyers',
    status:  'Active',
    info:    'Automated — ongoing',
    sent:    362,
    opened:  181,
    clicked: 54,
    revenue: '$620',
  },
  {
    name:    'Summer Discount Blast',
    status:  'Draft',
    info:    'Scheduled Jun 1, 2025',
    sent:    0,
    opened:  0,
    clicked: 0,
    revenue: '—',
  },
  {
    name:    'Re-engage At-Risk Buyers',
    status:  'Paused',
    info:    'Paused Apr 30, 2025',
    sent:    38,
    opened:  12,
    clicked: 4,
    revenue: '$180',
  },
];

const statusColor = (s: string) => {
  if (s === 'Sent' || s === 'Active') return 'green';
  if (s === 'Draft') return 'gray';
  if (s === 'Paused') return 'yellow';
  return 'gray';
};

export function SellerMarketing() {
  usePageTitle('Marketing');
  const [tab, setTab] = useState<Tab>('coupons');
  const [couponCode, setCouponCode]     = useState('');
  const [discountType, setDiscountType] = useState('');
  const [value, setValue]               = useState('');
  const [minOrder, setMinOrder]         = useState('');
  const [usageLimit, setUsageLimit]     = useState('');
  const [expiryDate, setExpiryDate]     = useState('');

  return (
    <>
      <SellerPageHeader
        title="Marketing"
        subtitle="Drive traffic, recover sales, and reward customers."
        actions={
          <Button variant="primary" size="sm">+ Create Campaign</Button>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        {/* Metrics */}
        <div style={{ display: 'flex', gap: '14px' }}>
          <MetricCard label="Marketing Revenue"    value="$4,280" trend="+22%"                trendUp />
          <MetricCard label="Active Campaigns"     value="3"      sub="2 email · 1 coupon" />
          <MetricCard label="Coupon Redemptions"   value="184"    trend="Last 30 days"         trendUp />
          <MetricCard label="Cart Recovery"        value="$640"   trend="12 carts recovered"   trendUp />
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-bone">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all cursor-pointer"
              style={{
                borderColor: tab === t.id ? '#D97757' : 'transparent',
                color:       tab === t.id ? '#D97757' : '#8C8A82',
              }}
            >
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Coupons tab */}
        {tab === 'coupons' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold text-carbon">Active Coupons</p>
              <Button variant="secondary" size="sm">+ New Coupon</Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {COUPONS.map(coupon => (
                <Card key={coupon.code}>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="px-3 py-1.5 rounded-lg border-2 border-dashed font-mono text-[13px] font-bold"
                      style={{ borderColor: '#D97757', color: '#B95A3A', background: '#FBECE4' }}
                    >
                      {coupon.code}
                    </div>
                    <Badge color="green">{coupon.status}</Badge>
                  </div>
                  <p className="text-[13px] font-semibold text-carbon mb-3">{coupon.type}</p>
                  <table className="w-full text-[12px] mb-4">
                    <tbody>
                      <tr className="border-b border-bone">
                        <td className="py-1.5 text-slate">Uses</td>
                        <td className="py-1.5 font-semibold text-carbon text-right">
                          {coupon.uses} / {coupon.limit ?? 'Unlimited'}
                        </td>
                      </tr>
                      <tr className="border-b border-bone">
                        <td className="py-1.5 text-slate">Expires</td>
                        <td className="py-1.5 font-semibold text-carbon text-right">{coupon.expires}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate">Revenue</td>
                        <td className="py-1.5 font-semibold text-carbon text-right">{coupon.revenue}</td>
                      </tr>
                    </tbody>
                  </table>
                  {coupon.limit && (
                    <div className="mb-4">
                      <div className="h-1.5 rounded-full" style={{ background: '#E8E6DC' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(coupon.uses / coupon.limit) * 100}%`, background: '#D97757' }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="ghost"     size="sm" fullWidth>Edit</Button>
                    <Button variant="secondary" size="sm" fullWidth>Pause</Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Create coupon form */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Create New Coupon</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Input
                  label="Coupon Code"
                  placeholder="e.g. SAVE20"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                />
                <Select label="Discount Type" value={discountType} onChange={e => setDiscountType(e.target.value)}>
                  <option value="">Select type…</option>
                  <option>Percentage Off</option>
                  <option>Fixed Amount Off</option>
                  <option>Free Shipping</option>
                </Select>
                <Input
                  label="Value"
                  placeholder="e.g. 20 or 10.00"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
                <Input
                  label="Minimum Order ($)"
                  placeholder="0.00"
                  value={minOrder}
                  onChange={e => setMinOrder(e.target.value)}
                />
                <Input
                  label="Usage Limit"
                  placeholder="Leave blank for unlimited"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                />
              </div>
              <Button variant="primary" size="md">Create Coupon</Button>
            </Card>
          </div>
        )}

        {/* Email tab */}
        {tab === 'email' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold text-carbon">Email Campaigns</p>
              <Button variant="secondary" size="sm">+ New Campaign</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CAMPAIGNS.map(campaign => (
                <Card key={campaign.name}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] font-semibold text-carbon">{campaign.name}</p>
                    <Badge color={statusColor(campaign.status) as any}>{campaign.status}</Badge>
                  </div>
                  <p className="text-[12px] text-slate mb-4">{campaign.info}</p>
                  {campaign.sent > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Sent',    value: campaign.sent.toLocaleString() },
                        { label: 'Opened',  value: campaign.opened.toLocaleString() },
                        { label: 'Clicked', value: campaign.clicked.toLocaleString() },
                        { label: 'Revenue', value: campaign.revenue },
                      ].map(stat => (
                        <div key={stat.label} className="text-center rounded-lg p-2" style={{ background: '#FAF9F5' }}>
                          <p className="text-[14px] font-bold text-carbon">{stat.value}</p>
                          <p className="text-[10px] text-slate">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="ghost"     size="sm">Edit</Button>
                    <Button variant="secondary" size="sm">View</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs */}
        {(tab === 'cart' || tab === 'affiliate' || tab === 'giftcards') && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4" style={{ color: '#D97757' }}>
              {(() => { const found = TABS.find(t => t.id === tab); return found ? <found.Icon size={48} /> : null; })()}
            </div>
            <p className="text-[16px] font-semibold text-carbon mb-2">
              {TABS.find(t => t.id === tab)?.label} — Coming Soon
            </p>
            <p className="text-[13px] text-slate">
              This feature is being built. Stay tuned for updates!
            </p>
          </div>
        )}
      </div>
    </>
  );
}
