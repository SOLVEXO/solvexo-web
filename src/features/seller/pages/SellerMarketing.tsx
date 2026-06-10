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

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, outline: 'none', fontFamily: poppins, color: '#2C2A28', background: '#fff', boxSizing: 'border-box' as const };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 5, display: 'block', fontFamily: poppins };

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
          <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
            + Create Campaign
          </button>
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
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: 'none', fontFamily: poppins,
              background: 'transparent', transition: 'all 0.12s',
              borderBottom: `2px solid ${tab === t.id ? '#D97757' : 'transparent'}`,
              color: tab === t.id ? '#D97757' : '#8C8A82',
              marginBottom: -1,
            }}>
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Coupons Tab ── */}
        {tab === 'coupons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#141413' }}>Active Coupons</p>
              <button style={{ padding: '7px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                + New Coupon
              </button>
            </div>

            {/* Coupon cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {COUPONS.map(coupon => (
                <div key={coupon.code} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ padding: '5px 12px', borderRadius: 8, border: '2px dashed #D97757', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#B95A3A', background: '#FBECE4' }}>
                      {coupon.code}
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#E3F4EA', color: '#1E7A3C' }}>
                      {coupon.status}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 12 }}>{coupon.type}</p>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
                    <tbody>
                      {[['Uses', `${coupon.uses} / ${coupon.limit ?? 'Unlimited'}`],['Expires', coupon.expires],['Revenue', coupon.revenue]].map(([label, val], i, arr) => (
                        <tr key={label} style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0EEE6' : 'none' }}>
                          <td style={{ padding: '6px 0', color: '#8C8A82', fontFamily: poppins }}>{label}</td>
                          <td style={{ padding: '6px 0', fontWeight: 600, color: '#141413', textAlign: 'right', fontFamily: poppins }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {coupon.limit && (
                    <div style={{ height: 5, background: '#E8E6DC', borderRadius: 3, marginBottom: 14, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${(coupon.uses / coupon.limit) * 100}%`, background: '#D97757' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, padding: '7px 0', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Edit</button>
                    <button style={{ flex: 1, padding: '7px 0', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Pause</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Create coupon form */}
            <div style={cardStyle}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 16 }}>Create New Coupon</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Coupon Code</label>
                  <input placeholder="e.g. SAVE20" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Discount Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select type…</option>
                    <option>Percentage Off</option>
                    <option>Fixed Amount Off</option>
                    <option>Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Value</label>
                  <input placeholder="e.g. 20 or 10.00" value={value} onChange={e => setValue(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Minimum Order ($)</label>
                  <input placeholder="0.00" value={minOrder} onChange={e => setMinOrder(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Usage Limit</label>
                  <input placeholder="Leave blank for unlimited" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expiry Date</label>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <button style={{ padding: '10px 24px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
                Create Coupon
              </button>
            </div>
          </div>
        )}

        {/* ── Email Tab ── */}
        {tab === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#141413' }}>Email Campaigns</p>
              <button style={{ padding: '7px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                + New Campaign
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {CAMPAIGNS.map(campaign => {
                const st = statusStyle[campaign.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
                return (
                  <div key={campaign.name} style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#141413' }}>{campaign.name}</p>
                      <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, flexShrink: 0, marginLeft: 8 }}>
                        {campaign.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#8C8A82', marginBottom: 14 }}>{campaign.info}</p>

                    {campaign.sent > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                        {[['Sent', campaign.sent.toLocaleString()],['Opened', campaign.opened.toLocaleString()],['Clicked', campaign.clicked.toLocaleString()],['Revenue', campaign.revenue]].map(([label, val]) => (
                          <div key={label} style={{ textAlign: 'center', background: '#FAF9F5', borderRadius: 8, padding: '8px 4px' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', fontFamily: poppins }}>{val}</p>
                            <p style={{ fontSize: 10, color: '#8C8A82', fontFamily: poppins }}>{label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Edit</button>
                      <button style={{ padding: '6px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>View</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Coming Soon Tabs ── */}
        {(tab === 'cart' || tab === 'affiliate' || tab === 'giftcards') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
            <div style={{ color: '#D97757', marginBottom: 16 }}>
              {(() => { const found = TABS.find(t => t.id === tab); return found ? <found.Icon size={48} /> : null; })()}
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#141413', marginBottom: 6, fontFamily: poppins }}>
              {TABS.find(t => t.id === tab)?.label} — Coming Soon
            </p>
            <p style={{ fontSize: 13, color: '#8C8A82', fontFamily: poppins }}>
              This feature is being built. Stay tuned for updates!
            </p>
          </div>
        )}

      </div>
    </>
  );
}