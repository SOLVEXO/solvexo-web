import { useEffect, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Tag as TagIcon, Mail, ShoppingCart, Handshake, Gift, Megaphone, Building2, User, type LucideIcon } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { EmptyState, SkeletonBox, Modal, Button } from '@/components/comman/ui';
import {
  apiGetCoupons, apiCreateCoupon, apiUpdateCoupon, apiDeleteCoupon,
  apiGetJoinableCampaigns, apiJoinCampaign, apiLeaveCampaign,
  type Coupon, type DiscountType, type JoinableCampaign,
} from '@/api/services/marketing';

type Tab = 'coupons' | 'platform' | 'email' | 'cart' | 'affiliate' | 'giftcards';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'coupons',   label: 'Coupons',        Icon: TagIcon      },
  { id: 'platform',  label: 'Platform Sales', Icon: Megaphone    },
  { id: 'email',     label: 'Email Campaigns', Icon: Mail         },
  { id: 'cart',      label: 'Abandoned Cart',  Icon: ShoppingCart },
  { id: 'affiliate', label: 'Affiliate',       Icon: Handshake    },
  { id: 'giftcards', label: 'Gift Cards',      Icon: Gift         },
];

const CAMPAIGNS = [
  { name: 'Back to School Sale',      status: 'Sent',   info: 'Sent May 15, 2025',     sent: 2840, opened: 1136, clicked: 284, revenue: '$1,480' },
  { name: 'Welcome New Buyers',       status: 'Active', info: 'Automated — ongoing',    sent: 362,  opened: 181,  clicked: 54,  revenue: '$620'   },
  { name: 'Summer Discount Blast',    status: 'Draft',  info: 'Scheduled Jun 1, 2025', sent: 0,    opened: 0,    clicked: 0,   revenue: '—'      },
  { name: 'Re-engage At-Risk Buyers', status: 'Paused', info: 'Paused Apr 30, 2025',   sent: 38,   opened: 12,   clicked: 4,   revenue: '$180'   },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Sent:   { bg: '#E3F4EA', color: '#1E7A3C' },
  Active: { bg: '#E3F4EA', color: '#1E7A3C' },
  Draft:  { bg: '#F0EEE6', color: '#5A5852' },
  Paused: { bg: '#FFF4DC', color: '#B36200' },
};

const emptyForm = { code: '', discountType: '' as DiscountType | '', value: '', minOrder: '', usageLimit: '', expiryDate: '' };

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50';

export function StoreMarketing() {
  usePageTitle('Marketing');
  const { storeId } = useStoreWorkspace();
  const [tab, setTab] = useState<Tab>('coupons');

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    apiGetCoupons(storeId)
      .then(res => setCoupons(res.data.coupons ?? []))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load coupons.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  // Platform-wide sale campaigns (admin-created) this store can opt into
  const [campaigns, setCampaigns] = useState<JoinableCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState('');
  const [campaignBusyId, setCampaignBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId || tab !== 'platform') return;
    setCampaignsLoading(true);
    apiGetJoinableCampaigns(storeId)
      .then(res => setCampaigns(res.data ?? []))
      .catch(err => setCampaignsError(err instanceof Error ? err.message : 'Failed to load campaigns.'))
      .finally(() => setCampaignsLoading(false));
  }, [storeId, tab]);

  async function toggleCampaign(campaign: JoinableCampaign) {
    setCampaignBusyId(campaign._id);
    setCampaignsError('');
    try {
      if (campaign.isJoined) await apiLeaveCampaign(storeId, campaign._id);
      else await apiJoinCampaign(storeId, campaign._id);
      setCampaigns(prev => prev.map(c => c._id === campaign._id ? { ...c, isJoined: !c.isJoined } : c));
    } catch (err) {
      setCampaignsError(err instanceof Error ? err.message : 'Failed to update campaign.');
    } finally {
      setCampaignBusyId(null);
    }
  }

  function startEdit(c: Coupon) {
    setEditingId(c._id);
    setForm({
      code: c.code,
      discountType: c.discountType,
      value: String(c.discountValue),
      minOrder: c.minOrderAmount != null ? String(c.minOrderAmount) : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      expiryDate: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    });
  }

  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function togglePause(c: Coupon) {
    setError('');
    try {
      const res = await apiUpdateCoupon(storeId, c._id, { isActive: !c.isActive });
      setCoupons(prev => prev.map(x => x._id === c._id ? res.data : x));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update coupon.');
    }
  }

  async function handleSubmit() {
    if (!form.code || !form.discountType || !form.value) return;
    setError('');
    const payload = {
      code: form.code,
      discountType: form.discountType as DiscountType,
      discountValue: Number(form.value),
      minOrderAmount: form.minOrder ? Number(form.minOrder) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      expiresAt: form.expiryDate || undefined,
    };
    try {
      if (editingId) {
        const res = await apiUpdateCoupon(storeId, editingId, payload);
        setCoupons(prev => prev.map(c => c._id === editingId ? res.data : c));
      } else {
        const res = await apiCreateCoupon(storeId, payload);
        setCoupons(prev => [res.data, ...prev]);
      }
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coupon.');
    }
  }

  async function confirmDelete() {
    if (!deletingCoupon) return;
    setDeleteBusy(true);
    setError('');
    try {
      await apiDeleteCoupon(storeId, deletingCoupon._id);
      setCoupons(prev => prev.filter(c => c._id !== deletingCoupon._id));
      setDeletingCoupon(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const activeCount = coupons.filter(c => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.usageCount, 0);

  return (
    <>
      <StorePageHeader
        title="Marketing"
        subtitle="Drive traffic, recover sales, and reward customers."
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* Metrics — coupon numbers are real; email/cart features below have no backend yet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white border border-bone rounded-[10px] px-5 py-4">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">Active Coupons</p>
            <p className="text-[28px] font-bold text-carbon leading-[1.15]">{activeCount}</p>
          </div>
          <div className="bg-white border border-bone rounded-[10px] px-5 py-4">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">Total Redemptions</p>
            <p className="text-[28px] font-bold text-carbon leading-[1.15]">{totalRedemptions}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 border-b border-bone">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium cursor-pointer border-none bg-transparent -mb-px transition-colors duration-150 hover:text-brand-orange rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
              style={{ borderBottom: `2px solid ${tab === t.id ? '#D97757' : 'transparent'}`, color: tab === t.id ? '#D97757' : '#8C8A82' }}
            >
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Coupons Tab */}
        {tab === 'coupons' && (
          <div className="flex flex-col gap-5">
            <p className="text-[15px] font-bold text-carbon">Active Coupons</p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white border border-bone rounded-[10px] px-[22px] py-5 flex flex-col gap-3">
                    <SkeletonBox width="45%" height={26} rounded="8px" />
                    <SkeletonBox width="60%" height={16} />
                    <SkeletonBox width="100%" height={40} rounded="6px" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-xs text-error">{error}</p>
            ) : coupons.length === 0 ? (
              <EmptyState
                icon={<TagIcon size={28} className="text-brand-orange opacity-55" />}
                title="No coupons yet"
                description="Create your first coupon using the form below."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(coupon => (
                  <div key={coupon._id} className="bg-white border border-bone rounded-[10px] px-[22px] py-5 transition-transform duration-200 hover:-translate-y-[1px]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="px-3 py-[5px] rounded-lg border-2 border-dashed border-brand-orange font-mono text-[13px] font-bold text-[#B95A3A] bg-brand-pale-orange">
                        {coupon.code}
                      </div>
                      <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: coupon.isActive ? '#E3F4EA' : '#F0EEE6', color: coupon.isActive ? '#1E7A3C' : '#5A5852' }}>
                        {coupon.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-carbon mb-3">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `$${coupon.discountValue} Off`}
                    </p>
                    <table className="w-full border-collapse text-xs mb-3">
                      <tbody>
                        {[
                          ['Uses', `${coupon.usageCount} / ${coupon.usageLimit ?? 'Unlimited'}`],
                          ['Expires', coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'],
                        ].map(([label, val], i) => (
                          <tr key={label} style={{ borderBottom: i === 0 ? '1px solid #F0EEE6' : 'none' }}>
                            <td className="py-1.5 text-slate">{label}</td>
                            <td className="py-1.5 font-semibold text-carbon text-right">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(coupon)} className="flex-1 py-[7px] bg-white border border-bone rounded-[7px] text-xs text-graphite cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50">Edit</button>
                      <button onClick={() => togglePause(coupon)} className="flex-1 py-[7px] bg-white border border-bone rounded-[7px] text-xs text-graphite cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50">{coupon.isActive ? 'Pause' : 'Activate'}</button>
                      <button onClick={() => setDeletingCoupon(coupon)} className="flex-1 py-[7px] bg-white border border-bone rounded-[7px] text-xs text-error cursor-pointer transition-colors duration-150 hover:bg-error hover:text-white hover:border-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create / Edit coupon form */}
            <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5">
              <p className="text-sm font-bold text-carbon mb-4">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-4">
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Coupon Code</label>
                  <input placeholder="e.g. SAVE20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className={INPUT_CLS} />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Discount Type</label>
                  <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as DiscountType }))}
                    className={`${INPUT_CLS} cursor-pointer`}>
                    <option value="">Select type…</option>
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed">Fixed Amount Off</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Value</label>
                  <input placeholder="e.g. 20 or 10.00" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    className={INPUT_CLS} />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Minimum Order ($)</label>
                  <input placeholder="0.00" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                    className={INPUT_CLS} />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Usage Limit</label>
                  <input placeholder="Leave blank for unlimited" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                    className={INPUT_CLS} />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                    className={INPUT_CLS} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmit} className="px-6 py-2.5 bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-colors duration-150 hover:bg-brand-deep-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-orange/50">
                  {editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
                {editingId && (
                  <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="px-6 py-2.5 bg-white border border-bone rounded-lg text-[13px] font-medium text-graphite cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-orange/50">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Platform Sales Tab — admin-created campaigns this store can opt into */}
        {tab === 'platform' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[15px] font-bold text-carbon">Platform Sale Campaigns</p>
              <p className="text-[12.5px] text-slate mt-0.5">
                Solvexo-wide sale events. Join one to get your products featured in the marketplace deals banner for its duration.
              </p>
            </div>

            {campaignsError && <p className="text-xs text-error">{campaignsError}</p>}

            {campaignsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <SkeletonBox key={i} height={120} rounded="10px" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <EmptyState
                icon={<Megaphone size={28} className="text-brand-orange opacity-55" />}
                title="No active campaigns right now"
                description="When the Solvexo team launches a platform-wide sale, it'll show up here for you to join."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {campaigns.map(c => (
                  <div key={c._id} className="bg-white border border-bone rounded-[10px] px-[22px] py-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-carbon">{c.name}</p>
                      {c.isJoined && c.sponsorType !== 'platform' && (
                        <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold shrink-0 ml-2 bg-success-bg text-success">Joined</span>
                      )}
                    </div>
                    {c.description && <p className="text-xs text-slate mb-2">{c.description}</p>}
                    <p className="text-[11px] text-slate mb-2">
                      {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                      {c.discountType && c.discountValue != null && (
                        <> · {c.discountType === 'percentage' ? `${c.discountValue}% off` : `$${c.discountValue} off`}</>
                      )}
                    </p>
                    {c.sponsorType === 'platform' ? (
                      <div className="flex items-start gap-1.5 mb-3 px-2.5 py-2 rounded-[7px] bg-success-bg">
                        <Building2 size={13} className="text-success shrink-0 mt-[1px]" />
                        <p className="text-[11px] text-success font-medium leading-snug">
                          Platform sponsored — Solvexo covers this discount. Your store is automatically included, no action needed.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 mb-3 px-2.5 py-2 rounded-[7px] bg-cream">
                        <User size={13} className="text-slate shrink-0 mt-[1px]" />
                        <p className="text-[11px] text-slate leading-snug">
                          Seller sponsored — this discount comes out of your own payout for orders placed during the sale.
                        </p>
                      </div>
                    )}
                    {c.sponsorType === 'platform' ? (
                      <div className="w-full py-2 rounded-[7px] text-xs font-semibold text-center border border-bone bg-cream text-slate">
                        Automatically Included
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleCampaign(c)}
                        disabled={campaignBusyId === c._id}
                        className={`w-full py-2 rounded-[7px] text-xs font-semibold cursor-pointer transition-colors duration-150 border disabled:opacity-50 ${
                          c.isJoined
                            ? 'bg-white border-bone text-graphite hover:bg-cream'
                            : 'bg-brand-orange border-transparent text-white hover:bg-brand-deep-orange'
                        }`}
                      >
                        {campaignBusyId === c._id ? 'Updating…' : c.isJoined ? 'Leave Campaign' : 'Join Campaign'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Email Tab — no backend yet, static preview */}
        {tab === 'email' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold text-carbon">Email Campaigns</p>
              <button className="px-3.5 py-[7px] bg-white border border-bone rounded-lg text-xs font-medium text-graphite cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50">
                + New Campaign
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CAMPAIGNS.map(campaign => {
                const st = statusStyle[campaign.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
                return (
                  <div key={campaign.name} className="bg-white border border-bone rounded-[10px] px-[22px] py-5 transition-transform duration-200 hover:-translate-y-[1px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-carbon">{campaign.name}</p>
                      <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold shrink-0 ml-2" style={{ background: st.bg, color: st.color }}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate mb-3.5">{campaign.info}</p>
                    {campaign.sent > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3.5">
                        {[['Sent', campaign.sent.toLocaleString()],['Opened', campaign.opened.toLocaleString()],['Clicked', campaign.clicked.toLocaleString()],['Revenue', campaign.revenue]].map(([label, val]) => (
                          <div key={label} className="text-center bg-cream rounded-lg py-2 px-1">
                            <p className="text-sm font-bold text-carbon">{val}</p>
                            <p className="text-[10px] text-slate">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button className="px-3.5 py-1.5 bg-white border border-bone rounded-[7px] text-xs text-graphite cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50">Edit</button>
                      <button className="px-3.5 py-1.5 bg-white border border-bone rounded-[7px] text-xs text-graphite cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50">View</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coming Soon Tabs */}
        {(tab === 'cart' || tab === 'affiliate' || tab === 'giftcards') && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-brand-orange mb-4">
              {(() => { const found = TABS.find(t => t.id === tab); return found ? <found.Icon size={48} /> : null; })()}
            </div>
            <p className="text-base font-semibold text-carbon mb-1.5">
              {TABS.find(t => t.id === tab)?.label} — Coming Soon
            </p>
            <p className="text-[13px] text-slate">
              This feature is being built. Stay tuned for updates!
            </p>
          </div>
        )}

      </div>

      {deletingCoupon && (
        <Modal title="Delete Coupon" onClose={() => setDeletingCoupon(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingCoupon(null)} disabled={deleteBusy}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteBusy}>Delete Coupon</Button>
          </>
        }>
          <p className="text-[13px] text-charcoal">
            Delete coupon <strong>{deletingCoupon.code}</strong>? {deletingCoupon.usageCount > 0 && `It has been redeemed ${deletingCoupon.usageCount} time${deletingCoupon.usageCount !== 1 ? 's' : ''}. `}This cannot be undone.
          </p>
          {error && <p className="text-[12px] text-error mt-2">{error}</p>}
        </Modal>
      )}
    </>
  );
}
