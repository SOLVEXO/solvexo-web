import { useEffect, useState } from 'react';
import { Tag as TagIcon, Mail, ShoppingCart, Handshake, Megaphone, Building2, User, Trash2, Plus, Target, Lock, type LucideIcon } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { EmptyState, SkeletonBox, Modal, Button } from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import {
  apiGetCoupons, apiCreateCoupon, apiUpdateCoupon, apiDeleteCoupon,
  apiGetJoinableCampaigns, apiJoinCampaign, apiLeaveCampaign,
  type Coupon, type DiscountType, type JoinableCampaign,
} from '@/api/services/marketing';
import {
  apiGetAbandonedCartSettings, apiUpdateAbandonedCartSettings, apiGetAbandonedCartStats, apiListAbandonedCarts,
  type AbandonedCartSettings, type AbandonedCartStats, type AbandonedCartItem,
} from '@/api/services/abandonedCart';
import {
  apiCreateEmailCampaign, apiListEmailCampaigns, apiPreviewEmailCampaignAudience, apiDeleteEmailCampaign, apiSendEmailCampaignNow, apiScheduleEmailCampaign,
  type EmailCampaign, type EmailCampaignAudience, type EmailCampaignStatus,
} from '@/api/services/emailCampaigns';
import {
  apiGetAffiliateProgram, apiUpdateAffiliateProgram, apiGetAffiliateStats, apiListAffiliateReferrals,
  apiCreateAffiliate, apiListAffiliates, apiUpdateAffiliate, apiDeleteAffiliate, apiPayAffiliate,
  type AffiliateProgram, type Affiliate, type AffiliateStats, type AffiliateReferral, type CommissionType,
} from '@/api/services/affiliate';
import {
  apiGetTrackingPixelSettings, apiUpdateTrackingPixelSettings,
  type TrackingPixelSettings,
} from '@/api/services/trackingPixels';
// Discounts and Gift Cards each moved to their own dedicated pages
// (Manage/StoreDiscounts.tsx, Manage/StoreGiftCards.tsx) — this tab used to
// carry a second, fully duplicate copy of both against the exact same
// backend endpoints. Removed here to stop maintaining two copies of the
// same feature; the dedicated pages are untouched and still fully wired.

type Tab = 'coupons' | 'platform' | 'email' | 'cart' | 'affiliate' | 'pixels';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'coupons',   label: 'Coupons',        Icon: TagIcon      },
  { id: 'platform',  label: 'Platform Sales', Icon: Megaphone    },
  { id: 'email',     label: 'Email Campaigns', Icon: Mail         },
  { id: 'cart',      label: 'Abandoned Cart',  Icon: ShoppingCart },
  { id: 'affiliate', label: 'Affiliate',       Icon: Handshake    },
  { id: 'pixels',    label: 'Tracking Pixels', Icon: Target       },
];

const emptyForm = { code: '', discountType: '' as DiscountType | '', value: '', minOrder: '', usageLimit: '', startDate: '', expiryDate: '' };

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50';

/** Same "Requires the X plan" convention as StoreSettings.tsx's Custom
 *  Domain/White Label fields — here replacing a whole tab's content, since
 *  Abandoned Cart Recovery / Email Campaigns are each a full feature rather
 *  than a single settings field. */
function LockedFeatureCard({ label, description, requiredPlan }: { label: string; description: string; requiredPlan: string | null }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] px-6 py-10 flex flex-col items-center text-center gap-2.5">
      <div className="w-10 h-10 rounded-full bg-[#f3f2ec] flex items-center justify-center text-slate">
        <Lock size={17} />
      </div>
      <p className="text-[14.5px] font-bold text-carbon">{label} is locked on your plan</p>
      <p className="text-[12.5px] text-slate max-w-[420px]">{description}</p>
      <p className="text-[12px] font-semibold text-brand-orange mt-1">Requires the {requiredPlan ?? 'a higher'} plan — upgrade from Billing.</p>
    </div>
  );
}

function EmailCampaignFormModal({ storeId, onClose, onSaved }: { storeId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', subject: '', message: '', audience: 'all' as EmailCampaignAudience });
  const [audiencePreview, setAudiencePreview] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiPreviewEmailCampaignAudience(storeId, form.audience)
      .then(res => setAudiencePreview(res.data.recipientCount))
      .catch(() => setAudiencePreview(null));
  }, [storeId, form.audience]);

  async function submit() {
    if (!form.name || !form.subject || !form.message) { setError('Please fill in name, subject and message.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiCreateEmailCampaign(storeId, form);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="New Email Campaign"
      onClose={onClose}
      mobileSheet
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create Draft</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Campaign name (internal only)</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="September clearance blast" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Send to</label>
          <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value as EmailCampaignAudience }))}
            className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
            <option value="all">All customers</option>
            <option value="buyers">Past buyers only</option>
            <option value="abandoned">Abandoned cart (didn't buy)</option>
          </select>
          {audiencePreview !== null && (
            <p className="text-[11px] text-slate mt-1">~{audiencePreview.toLocaleString()} recipient{audiencePreview === 1 ? '' : 's'} right now</p>
          )}
        </div>
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Email subject</label>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="20% off everything this weekend only" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Email message</label>
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} className={`${INPUT_CLS} resize-none`} placeholder="Hi {{customerName}}, ..." />
          <p className="text-[11px] text-slate mt-1">Use {'{{customerName}}'} and {'{{storeName}}'} — replaced automatically for each recipient.</p>
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

function EmailCampaignScheduleModal({ storeId, campaign, onClose, onScheduled }: { storeId: string; campaign: EmailCampaign; onClose: () => void; onScheduled: () => void }) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!scheduledAt) { setError('Please pick a date and time.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiScheduleEmailCampaign(storeId, campaign._id, new Date(scheduledAt).toISOString());
      onScheduled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule campaign.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Schedule "${campaign.name}"`}
      onClose={onClose}
      mobileSheet
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Schedule</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Send at</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={INPUT_CLS} />
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

function AffiliateFormModal({ storeId, onClose, onSaved }: { storeId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', useCustomRate: false, commissionType: 'percentage' as CommissionType, commissionValue: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!form.name || !form.email) { setError('Please fill in name and email.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiCreateAffiliate(storeId, {
        name: form.name,
        email: form.email,
        ...(form.useCustomRate ? { commissionType: form.commissionType, commissionValue: Number(form.commissionValue) || 0 } : {}),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add affiliate.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add Affiliate"
      onClose={onClose}
      mobileSheet
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Add Affiliate</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Creator" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-charcoal mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" className={INPUT_CLS} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-charcoal">Custom commission rate for this affiliate</span>
          <input type="checkbox" checked={form.useCustomRate} onChange={e => setForm(f => ({ ...f, useCustomRate: e.target.checked }))} className="cursor-pointer" />
        </div>
        {form.useCustomRate && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-charcoal mb-1.5">Type</label>
              <select value={form.commissionType} onChange={e => setForm(f => ({ ...f, commissionType: e.target.value as CommissionType }))}
                className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-charcoal mb-1.5">{form.commissionType === 'percentage' ? 'Rate (%)' : 'Amount ($)'}</label>
              <input type="number" min={0} value={form.commissionValue} onChange={e => setForm(f => ({ ...f, commissionValue: e.target.value }))} className={INPUT_CLS} />
            </div>
          </div>
        )}
        {!form.useCustomRate && <p className="text-[11px] text-slate -mt-2">Uses your program's default rate unless overridden here.</p>}
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

export function StoreMarketing() {
  const { store, storeId } = useStoreWorkspace();
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

  // Plan entitlements — gates the Abandoned Cart / Email Campaigns tabs below
  // (both are real, fully working features whose only actual restriction is
  // the plan's own abandonedCartRecoveryAllowed/emailCampaignsAllowed flag;
  // the backend already rejects the underlying action either way, this just
  // stops a seller building/sending on a tab that will fail rather than
  // finding out only after the fact).
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  useEffect(() => {
    if (!storeId) return;
    apiGetStoreEntitlements(storeId).then(res => setEntitlements(res.data)).catch(() => {});
  }, [storeId]);
  const cartFeature = entitlements?.abandonedCartRecoveryAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;
  const emailFeature = entitlements?.emailCampaignsAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;

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

  // Abandoned Cart Recovery
  const [cartSettings, setCartSettings] = useState<AbandonedCartSettings | null>(null);
  const [cartSettingsLoading, setCartSettingsLoading] = useState(true);
  const [cartSettingsSaving, setCartSettingsSaving] = useState(false);
  const [cartSettingsError, setCartSettingsError] = useState('');
  const [cartSettingsSaved, setCartSettingsSaved] = useState(false);
  const [cartStats, setCartStats] = useState<AbandonedCartStats | null>(null);
  const [cartItems, setCartItems] = useState<AbandonedCartItem[]>([]);
  const [cartItemsLoading, setCartItemsLoading] = useState(true);

  useEffect(() => {
    if (!storeId || tab !== 'cart') return;
    setCartSettingsLoading(true);
    apiGetAbandonedCartSettings(storeId)
      .then(res => setCartSettings(res.data))
      .catch(() => {})
      .finally(() => setCartSettingsLoading(false));
    apiGetAbandonedCartStats(storeId).then(res => setCartStats(res.data)).catch(() => {});
    setCartItemsLoading(true);
    apiListAbandonedCarts(storeId, { limit: 20 })
      .then(res => setCartItems(res.data.items ?? []))
      .catch(() => {})
      .finally(() => setCartItemsLoading(false));
  }, [storeId, tab]);

  async function saveCartSettings() {
    if (!cartSettings) return;
    setCartSettingsSaving(true);
    setCartSettingsError('');
    setCartSettingsSaved(false);
    try {
      const res = await apiUpdateAbandonedCartSettings(storeId, {
        enabled: cartSettings.enabled,
        delayMinutes: cartSettings.delayMinutes,
        subject: cartSettings.subject,
        message: cartSettings.message,
      });
      setCartSettings(res.data);
      setCartSettingsSaved(true);
    } catch (err) {
      setCartSettingsError(err instanceof Error ? err.message : 'Failed to save abandoned cart settings.');
    } finally {
      setCartSettingsSaving(false);
    }
  }

  const CART_STATUS_STYLE: Record<AbandonedCartItem['recoveryStatus'], { bg: string; color: string; label: string }> = {
    pending:   { bg: '#F0EEE6', color: '#5A5852', label: 'Not sent yet' },
    sent:      { bg: '#FDF3E7', color: '#9A6A17', label: 'Reminder sent' },
    clicked:   { bg: '#EAF1FB', color: '#1D5EAE', label: 'Clicked' },
    recovered: { bg: '#EAF7EF', color: '#1E7A3C', label: 'Recovered' },
  };

  // Email Campaigns — distinct state from the platform "Joinable Campaigns"
  // (`campaigns`/`campaignsLoading`/`campaignsError`/`refreshCampaigns`) above,
  // which is an unrelated feature (admin sale campaigns a seller opts into).
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [emailCampaignsLoading, setEmailCampaignsLoading] = useState(true);
  const [emailCampaignsError, setEmailCampaignsError] = useState('');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [schedulingCampaign, setSchedulingCampaign] = useState<EmailCampaign | null>(null);
  const [campaignActionBusyId, setCampaignActionBusyId] = useState<string | null>(null);

  function refreshEmailCampaigns() {
    setEmailCampaignsLoading(true);
    apiListEmailCampaigns(storeId, { limit: 50 })
      .then(res => setEmailCampaigns(res.data.campaigns ?? []))
      .catch(() => {})
      .finally(() => setEmailCampaignsLoading(false));
  }

  useEffect(() => {
    if (!storeId || tab !== 'email') return;
    refreshEmailCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, tab]);

  async function handleSendCampaignNow(c: EmailCampaign) {
    setEmailCampaignsError('');
    setCampaignActionBusyId(c._id);
    try {
      await apiSendEmailCampaignNow(storeId, c._id);
      refreshEmailCampaigns();
    } catch (err) {
      setEmailCampaignsError(err instanceof Error ? err.message : 'Failed to send campaign.');
    } finally {
      setCampaignActionBusyId(null);
    }
  }

  async function handleDeleteCampaign(c: EmailCampaign) {
    setEmailCampaignsError('');
    setCampaignActionBusyId(c._id);
    try {
      await apiDeleteEmailCampaign(storeId, c._id);
      setEmailCampaigns(prev => prev.filter(x => x._id !== c._id));
    } catch (err) {
      setEmailCampaignsError(err instanceof Error ? err.message : 'Failed to delete campaign.');
    } finally {
      setCampaignActionBusyId(null);
    }
  }

  const EMAIL_CAMPAIGN_STATUS_STYLE: Record<EmailCampaignStatus, { bg: string; color: string; label: string }> = {
    draft:     { bg: '#F0EEE6', color: '#5A5852', label: 'Draft' },
    scheduled: { bg: '#FDF3E7', color: '#9A6A17', label: 'Scheduled' },
    sending:   { bg: '#EAF1FB', color: '#1D5EAE', label: 'Sending' },
    sent:      { bg: '#EAF7EF', color: '#1E7A3C', label: 'Sent' },
    failed:    { bg: '#FBEAEA', color: '#B3261E', label: 'Failed' },
  };

  const EMAIL_CAMPAIGN_AUDIENCE_LABEL: Record<EmailCampaignAudience, string> = {
    all: 'All customers', buyers: 'Past buyers', abandoned: "Abandoned cart (didn't buy)",
  };

  // Affiliate Program
  const [affiliateProgram, setAffiliateProgram] = useState<AffiliateProgram | null>(null);
  const [affiliateProgramLoading, setAffiliateProgramLoading] = useState(true);
  const [affiliateProgramSaving, setAffiliateProgramSaving] = useState(false);
  const [affiliateProgramError, setAffiliateProgramError] = useState('');
  const [affiliateProgramSaved, setAffiliateProgramSaved] = useState(false);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);
  const [affiliatesError, setAffiliatesError] = useState('');
  const [affiliateReferrals, setAffiliateReferrals] = useState<AffiliateReferral[]>([]);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [affiliateActionBusyId, setAffiliateActionBusyId] = useState<string | null>(null);

  function refreshAffiliateData() {
    setAffiliateProgramLoading(true);
    apiGetAffiliateProgram(storeId)
      .then(res => setAffiliateProgram(res.data))
      .catch(() => {})
      .finally(() => setAffiliateProgramLoading(false));
    apiGetAffiliateStats(storeId).then(res => setAffiliateStats(res.data)).catch(() => {});
    setAffiliatesLoading(true);
    apiListAffiliates(storeId, { limit: 50 })
      .then(res => setAffiliates(res.data.affiliates ?? []))
      .catch(() => {})
      .finally(() => setAffiliatesLoading(false));
    apiListAffiliateReferrals(storeId, { limit: 20 }).then(res => setAffiliateReferrals(res.data.referrals ?? [])).catch(() => {});
  }

  useEffect(() => {
    if (!storeId || tab !== 'affiliate') return;
    refreshAffiliateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, tab]);

  async function saveAffiliateProgram() {
    if (!affiliateProgram) return;
    setAffiliateProgramSaving(true);
    setAffiliateProgramError('');
    setAffiliateProgramSaved(false);
    try {
      const res = await apiUpdateAffiliateProgram(storeId, {
        enabled: affiliateProgram.enabled,
        commissionType: affiliateProgram.commissionType,
        commissionValue: affiliateProgram.commissionValue,
        cookieWindowDays: affiliateProgram.cookieWindowDays,
      });
      setAffiliateProgram(res.data);
      setAffiliateProgramSaved(true);
    } catch (err) {
      setAffiliateProgramError(err instanceof Error ? err.message : 'Failed to save affiliate program settings.');
    } finally {
      setAffiliateProgramSaving(false);
    }
  }

  async function handleToggleAffiliateActive(a: Affiliate) {
    setAffiliatesError('');
    setAffiliateActionBusyId(a._id);
    try {
      const res = await apiUpdateAffiliate(storeId, a._id, { isActive: !a.isActive });
      setAffiliates(prev => prev.map(x => x._id === a._id ? res.data : x));
    } catch (err) {
      setAffiliatesError(err instanceof Error ? err.message : 'Failed to update affiliate.');
    } finally {
      setAffiliateActionBusyId(null);
    }
  }

  async function handleRemoveAffiliate(a: Affiliate) {
    setAffiliatesError('');
    setAffiliateActionBusyId(a._id);
    try {
      await apiDeleteAffiliate(storeId, a._id);
      setAffiliates(prev => prev.filter(x => x._id !== a._id));
    } catch (err) {
      setAffiliatesError(err instanceof Error ? err.message : 'Failed to remove affiliate.');
    } finally {
      setAffiliateActionBusyId(null);
    }
  }

  async function handlePayAffiliate(a: Affiliate) {
    setAffiliatesError('');
    setAffiliateActionBusyId(a._id);
    try {
      const res = await apiPayAffiliate(storeId, a._id);
      setAffiliates(prev => prev.map(x => x._id === a._id ? res.data : x));
      apiGetAffiliateStats(storeId).then(r => setAffiliateStats(r.data)).catch(() => {});
    } catch (err) {
      setAffiliatesError(err instanceof Error ? err.message : 'Failed to mark affiliate paid.');
    } finally {
      setAffiliateActionBusyId(null);
    }
  }

  function copyReferralLink(link: string) {
    navigator.clipboard?.writeText(link).catch(() => {});
  }

  // Tracking Pixels
  const [pixelSettings, setPixelSettings] = useState<TrackingPixelSettings | null>(null);
  const [pixelSettingsLoading, setPixelSettingsLoading] = useState(true);
  const [pixelSettingsSaving, setPixelSettingsSaving] = useState(false);
  const [pixelSettingsError, setPixelSettingsError] = useState('');
  const [pixelSettingsSaved, setPixelSettingsSaved] = useState(false);

  useEffect(() => {
    if (!storeId || tab !== 'pixels') return;
    setPixelSettingsLoading(true);
    apiGetTrackingPixelSettings(storeId)
      .then(res => setPixelSettings(res.data))
      .catch(() => {})
      .finally(() => setPixelSettingsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, tab]);

  async function savePixelSettings() {
    if (!pixelSettings) return;
    setPixelSettingsSaving(true);
    setPixelSettingsError('');
    setPixelSettingsSaved(false);
    try {
      const res = await apiUpdateTrackingPixelSettings(storeId, {
        facebookPixelId: pixelSettings.facebookPixelId ?? '',
        googleAnalyticsId: pixelSettings.googleAnalyticsId ?? '',
        googleAdsId: pixelSettings.googleAdsId ?? '',
        googleAdsConversionLabel: pixelSettings.googleAdsConversionLabel ?? '',
        tiktokPixelId: pixelSettings.tiktokPixelId ?? '',
      });
      setPixelSettings(res.data);
      setPixelSettingsSaved(true);
    } catch (err) {
      setPixelSettingsError(err instanceof Error ? err.message : 'Failed to save tracking pixel settings.');
    } finally {
      setPixelSettingsSaving(false);
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
      startDate: c.startsAt ? c.startsAt.slice(0, 10) : '',
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
      startsAt: form.startDate || undefined,
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

      <div className="px-4 lg:px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* Metrics — top-level coupon stats; each tab below (abandoned cart,
            email campaigns) has its own real stats strip in its own section */}
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

        {/* Tab bar — horizontally scrollable so 9 tabs never wrap/get cut off on narrower screens */}
        <div className="border-b border-bone overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0.5 w-max">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-[13px] font-medium cursor-pointer border-none bg-transparent -mb-px transition-colors duration-150 hover:text-brand-orange rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
                style={{ borderBottom: `2px solid ${tab === t.id ? '#D97757' : 'transparent'}`, color: tab === t.id ? '#D97757' : '#8C8A82' }}
              >
                <t.Icon size={14} className="shrink-0" /> {t.label}
              </button>
            ))}
          </div>
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
                      <div className="px-3 py-[5px] rounded-lg border-2 border-dashed border-brand-orange font-mono text-[13px] font-bold text-brand-deep-orange bg-brand-pale-orange">
                        {coupon.code}
                      </div>
                      {(() => {
                        const isExpired = !!coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                        const isScheduled = !isExpired && coupon.isActive && !!coupon.startsAt && new Date(coupon.startsAt) > new Date();
                        const label = isExpired ? 'Expired' : isScheduled ? 'Scheduled' : coupon.isActive ? 'Active' : 'Paused';
                        const colors = isExpired ? { bg: '#F0EEE6', fg: '#8C8A82' } : isScheduled ? { bg: '#FBECE4', fg: '#B95A3A' } : coupon.isActive ? { bg: '#E3F4EA', fg: '#1E7A3C' } : { bg: '#F0EEE6', fg: '#5A5852' };
                        return (
                          <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: colors.bg, color: colors.fg }}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[13px] font-semibold text-carbon mb-3">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `${currencySymbol(store?.baseCurrency)}${coupon.discountValue} Off`}
                    </p>
                    <table className="w-full border-collapse text-xs mb-3">
                      <tbody>
                        {[
                          ['Uses', `${coupon.usageCount} / ${coupon.usageLimit ?? 'Unlimited'}`],
                          ...(coupon.startsAt ? [['Starts', new Date(coupon.startsAt).toLocaleDateString()]] : []),
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
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className={INPUT_CLS} />
                  <p className="text-[10px] text-slate mt-1">Leave blank to activate immediately.</p>
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
                        <> · {c.discountType === 'percentage' ? `${c.discountValue}% off` : `${currencySymbol(c.currency ?? 'USD')}${c.discountValue} off`}</>
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

        {/* Abandoned Cart Recovery Tab */}
        {tab === 'cart' && cartFeature && !cartFeature.allowed ? (
          <LockedFeatureCard
            label="Abandoned Cart Recovery"
            description="A buyer who leaves items in their cart would get one automatic reminder email once your delay has passed."
            requiredPlan={cartFeature.requiredPlan}
          />
        ) : tab === 'cart' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[15px] font-bold text-carbon">Abandoned Cart Recovery</p>
              <p className="text-[12.5px] text-slate mt-0.5">
                A buyer who leaves items in their cart gets one automatic reminder email once your delay below has passed. On by default — same as Shopify's own abandoned checkout recovery.
              </p>
            </div>

            {cartStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Abandoned', cartStats.abandonedCount.toLocaleString()],
                  ['Emails Sent', cartStats.emailsSent.toLocaleString()],
                  ['Clicked', cartStats.clicked.toLocaleString()],
                  ['Recovered', `${cartStats.recovered.toLocaleString()} · $${cartStats.recoveredRevenue.toFixed(2)}`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white border border-bone rounded-[10px] px-3.5 py-3">
                    <p className="text-[10px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{label}</p>
                    <p className="text-[18px] font-bold text-carbon leading-[1.15]">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {cartSettingsLoading ? (
              <SkeletonBox height={280} rounded="10px" />
            ) : cartSettings && (
              <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-charcoal">Send recovery emails</span>
                  <input
                    type="checkbox"
                    checked={cartSettings.enabled}
                    onChange={e => setCartSettings(s => s && ({ ...s, enabled: e.target.checked }))}
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Wait before sending (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={cartSettings.delayMinutes}
                    onChange={e => setCartSettings(s => s && ({ ...s, delayMinutes: Number(e.target.value) }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Email subject</label>
                  <input
                    value={cartSettings.subject}
                    onChange={e => setCartSettings(s => s && ({ ...s, subject: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Email message</label>
                  <textarea
                    value={cartSettings.message}
                    onChange={e => setCartSettings(s => s && ({ ...s, message: e.target.value }))}
                    rows={3}
                    className={`${INPUT_CLS} resize-none`}
                  />
                  <p className="text-[11px] text-slate mt-1">Use {'{{customerName}}'}, {'{{storeName}}'} and {'{{cartUrl}}'} — replaced automatically when each email is sent.</p>
                </div>
                {cartSettingsError && <p className="text-[12px] text-error">{cartSettingsError}</p>}
                {cartSettingsSaved && <p className="text-[12px] text-success">Saved.</p>}
                <div>
                  <Button onClick={saveCartSettings} loading={cartSettingsSaving}>Save Settings</Button>
                </div>
              </div>
            )}

            <div>
              <p className="text-[13px] font-semibold text-carbon mb-2">Recent Abandoned Carts</p>
              {cartItemsLoading ? (
                <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={48} rounded="8px" />)}</div>
              ) : cartItems.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart size={28} className="text-brand-orange opacity-55" />}
                  title="No abandoned carts yet"
                  description="When a buyer leaves items in their cart, it'll show up here once it's old enough to count as abandoned."
                />
              ) : (
                <div className="bg-white border border-bone rounded-[10px] overflow-x-auto">
                  <table className="w-full border-collapse text-xs min-w-[560px]">
                    <thead>
                      <tr className="border-b border-bone">
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Customer</th>
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Items</th>
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Value</th>
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Abandoned</th>
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map(item => {
                        const status = CART_STATUS_STYLE[item.recoveryStatus];
                        return (
                          <tr key={item.checkoutId} className="border-b border-bone last:border-0">
                            <td className="px-3.5 py-2.5">
                              <p className="text-charcoal font-medium">{item.customerName}</p>
                              {item.customerEmail && <p className="text-slate text-[11px]">{item.customerEmail}</p>}
                            </td>
                            <td className="px-3.5 py-2.5 text-charcoal">{item.itemCount}</td>
                            <td className="px-3.5 py-2.5 text-charcoal">{currencySymbol(item.currency)}{item.cartValue.toFixed(2)}</td>
                            <td className="px-3.5 py-2.5 text-slate">{new Date(item.abandonedAt).toLocaleDateString()}</td>
                            <td className="px-3.5 py-2.5">
                              <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: status.bg, color: status.color }}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Campaigns Tab */}
        {tab === 'email' && emailFeature && !emailFeature.allowed ? (
          <LockedFeatureCard
            label="Email Campaigns"
            description="Compose and send a real bulk email to a segment of your own store's customers."
            requiredPlan={emailFeature.requiredPlan}
          />
        ) : tab === 'email' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[15px] font-bold text-carbon">Email Campaigns</p>
                <p className="text-[12.5px] text-slate mt-0.5">
                  Compose and send a real bulk email to a segment of your own store's customers — same as Shopify Email.
                </p>
              </div>
              <Button onClick={() => setShowCampaignModal(true)}><Plus size={14} className="mr-1" />New Campaign</Button>
            </div>

            {emailCampaigns.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Campaigns', emailCampaigns.length.toLocaleString()],
                  ['Recipients', emailCampaigns.reduce((s, c) => s + c.recipientCount, 0).toLocaleString()],
                  ['Opens', emailCampaigns.reduce((s, c) => s + c.openCount, 0).toLocaleString()],
                  ['Clicks', emailCampaigns.reduce((s, c) => s + c.clickCount, 0).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white border border-bone rounded-[10px] px-3.5 py-3">
                    <p className="text-[10px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{label}</p>
                    <p className="text-[18px] font-bold text-carbon leading-[1.15]">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {emailCampaignsError && <p className="text-[12px] text-error">{emailCampaignsError}</p>}

            {emailCampaignsLoading ? (
              <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={56} rounded="8px" />)}</div>
            ) : emailCampaigns.length === 0 ? (
              <EmptyState
                icon={<Mail size={28} className="text-brand-orange opacity-55" />}
                title="No campaigns yet"
                description="Create your first email campaign to reach your customers directly."
              />
            ) : (
              <div className="bg-white border border-bone rounded-[10px] overflow-x-auto">
                <table className="w-full border-collapse text-xs min-w-[720px]">
                  <thead>
                    <tr className="border-b border-bone">
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Campaign</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Audience</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Status</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Recipients</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Opens / Clicks</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailCampaigns.map(c => {
                      const status = EMAIL_CAMPAIGN_STATUS_STYLE[c.status];
                      const busy = campaignActionBusyId === c._id;
                      return (
                        <tr key={c._id} className="border-b border-bone last:border-0">
                          <td className="px-3.5 py-2.5">
                            <p className="text-charcoal font-medium">{c.name}</p>
                            <p className="text-slate text-[11px]">{c.subject}</p>
                          </td>
                          <td className="px-3.5 py-2.5 text-charcoal">{EMAIL_CAMPAIGN_AUDIENCE_LABEL[c.audience]}</td>
                          <td className="px-3.5 py-2.5">
                            <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                            {c.status === 'scheduled' && c.scheduledAt && (
                              <p className="text-slate text-[11px] mt-0.5">{new Date(c.scheduledAt).toLocaleString()}</p>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-charcoal">{c.recipientCount.toLocaleString()}</td>
                          <td className="px-3.5 py-2.5 text-charcoal">{c.openCount.toLocaleString()} / {c.clickCount.toLocaleString()}</td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {c.status === 'draft' && (
                                <>
                                  <button onClick={() => handleSendCampaignNow(c)} disabled={busy} className="text-[11px] font-semibold text-brand-orange hover:underline disabled:opacity-50">Send Now</button>
                                  <button onClick={() => setSchedulingCampaign(c)} disabled={busy} className="text-[11px] font-semibold text-charcoal hover:underline disabled:opacity-50">Schedule</button>
                                </>
                              )}
                              {['draft', 'scheduled'].includes(c.status) && (
                                <button onClick={() => handleDeleteCampaign(c)} disabled={busy} className="text-slate hover:text-error disabled:opacity-50" title="Delete">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showCampaignModal && (
          <EmailCampaignFormModal
            storeId={storeId}
            onClose={() => setShowCampaignModal(false)}
            onSaved={() => { setShowCampaignModal(false); refreshEmailCampaigns(); }}
          />
        )}

        {schedulingCampaign && (
          <EmailCampaignScheduleModal
            storeId={storeId}
            campaign={schedulingCampaign}
            onClose={() => setSchedulingCampaign(null)}
            onScheduled={() => { setSchedulingCampaign(null); refreshEmailCampaigns(); }}
          />
        )}

        {/* Affiliate Program Tab */}
        {tab === 'affiliate' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[15px] font-bold text-carbon">Affiliate Program</p>
              <p className="text-[12.5px] text-slate mt-0.5">
                Add creators or partners who earn a real commission for every sale they refer — same idea as Shopify's affiliate apps.
              </p>
            </div>

            {affiliateProgramLoading ? (
              <SkeletonBox height={220} rounded="10px" />
            ) : affiliateProgram && (
              <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-charcoal">Affiliate program enabled</span>
                  <input
                    type="checkbox"
                    checked={affiliateProgram.enabled}
                    onChange={e => setAffiliateProgram(p => p && ({ ...p, enabled: e.target.checked }))}
                    className="cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Commission type</label>
                    <select value={affiliateProgram.commissionType} onChange={e => setAffiliateProgram(p => p && ({ ...p, commissionType: e.target.value as CommissionType }))}
                      className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">{affiliateProgram.commissionType === 'percentage' ? 'Default rate (%)' : 'Default amount ($)'}</label>
                    <input type="number" min={0} value={affiliateProgram.commissionValue}
                      onChange={e => setAffiliateProgram(p => p && ({ ...p, commissionValue: Number(e.target.value) }))}
                      className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Cookie window (days)</label>
                    <input type="number" min={1} value={affiliateProgram.cookieWindowDays}
                      onChange={e => setAffiliateProgram(p => p && ({ ...p, cookieWindowDays: Number(e.target.value) }))}
                      className={INPUT_CLS} />
                  </div>
                </div>
                {affiliateProgramError && <p className="text-[12px] text-error">{affiliateProgramError}</p>}
                {affiliateProgramSaved && <p className="text-[12px] text-success">Saved.</p>}
                <div>
                  <Button onClick={saveAffiliateProgram} loading={affiliateProgramSaving}>Save Settings</Button>
                </div>
              </div>
            )}

            {affiliateStats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  ['Affiliates', affiliateStats.affiliateCount.toLocaleString()],
                  ['Clicks', affiliateStats.totalClicks.toLocaleString()],
                  ['Conversions', affiliateStats.totalConversions.toLocaleString()],
                  ['Owed', `$${affiliateStats.totalOwedUSD.toFixed(2)}`],
                  ['Paid', `$${affiliateStats.totalPaidUSD.toFixed(2)}`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white border border-bone rounded-[10px] px-3.5 py-3">
                    <p className="text-[10px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{label}</p>
                    <p className="text-[18px] font-bold text-carbon leading-[1.15]">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[13px] font-semibold text-carbon">Affiliates</p>
              <Button onClick={() => setShowAffiliateModal(true)}><Plus size={14} className="mr-1" />Add Affiliate</Button>
            </div>

            {affiliatesError && <p className="text-[12px] text-error">{affiliatesError}</p>}

            {affiliatesLoading ? (
              <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={56} rounded="8px" />)}</div>
            ) : affiliates.length === 0 ? (
              <EmptyState
                icon={<Handshake size={28} className="text-brand-orange opacity-55" />}
                title="No affiliates yet"
                description="Add a creator or partner to start tracking their referral sales."
              />
            ) : (
              <div className="bg-white border border-bone rounded-[10px] overflow-x-auto">
                <table className="w-full border-collapse text-xs min-w-[760px]">
                  <thead>
                    <tr className="border-b border-bone">
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Affiliate</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Referral Link</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Clicks / Conversions</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Owed / Paid</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Status</th>
                      <th className="text-left font-medium text-slate px-3.5 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map(a => {
                      const owed = a.totalEarningsUSD - a.totalPaidUSD;
                      const busy = affiliateActionBusyId === a._id;
                      return (
                        <tr key={a._id} className="border-b border-bone last:border-0">
                          <td className="px-3.5 py-2.5">
                            <p className="text-charcoal font-medium">{a.name}</p>
                            <p className="text-slate text-[11px]">{a.email}</p>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <button onClick={() => copyReferralLink(a.referralLink)} className="text-[11px] font-semibold text-brand-orange hover:underline">
                              Copy link
                            </button>
                          </td>
                          <td className="px-3.5 py-2.5 text-charcoal">{a.totalClicks.toLocaleString()} / {a.totalConversions.toLocaleString()}</td>
                          <td className="px-3.5 py-2.5 text-charcoal">${owed.toFixed(2)} / ${a.totalPaidUSD.toFixed(2)}</td>
                          <td className="px-3.5 py-2.5">
                            <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: a.isActive ? '#EAF7EF' : '#F0EEE6', color: a.isActive ? '#1E7A3C' : '#5A5852' }}>
                              {a.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {owed > 0 && (
                                <button onClick={() => handlePayAffiliate(a)} disabled={busy} className="text-[11px] font-semibold text-brand-orange hover:underline disabled:opacity-50">Pay ${owed.toFixed(2)}</button>
                              )}
                              <button onClick={() => handleToggleAffiliateActive(a)} disabled={busy} className="text-[11px] font-semibold text-charcoal hover:underline disabled:opacity-50">
                                {a.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleRemoveAffiliate(a)} disabled={busy} className="text-slate hover:text-error disabled:opacity-50" title="Remove">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {affiliateReferrals.length > 0 && (
              <div>
                <p className="text-[13px] font-semibold text-carbon mb-2">Recent Referrals</p>
                <div className="bg-white border border-bone rounded-[10px] overflow-x-auto">
                  <table className="w-full border-collapse text-xs min-w-[560px]">
                    <thead>
                      <tr className="border-b border-bone">
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Affiliate</th>
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Order Revenue</th>
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Commission</th>
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Status</th>
                        <th className="text-left font-medium text-slate px-3.5 py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliateReferrals.map(r => (
                        <tr key={r._id} className="border-b border-bone last:border-0">
                          <td className="px-3.5 py-2.5 text-charcoal">{r.affiliateName}</td>
                          <td className="px-3.5 py-2.5 text-charcoal">${r.orderRevenueUSD.toFixed(2)}</td>
                          <td className="px-3.5 py-2.5 text-charcoal">${r.commissionUSD.toFixed(2)}</td>
                          <td className="px-3.5 py-2.5">
                            <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: r.status === 'paid' ? '#EAF7EF' : '#FDF3E7', color: r.status === 'paid' ? '#1E7A3C' : '#9A6A17' }}>
                              {r.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate">{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {showAffiliateModal && (
          <AffiliateFormModal
            storeId={storeId}
            onClose={() => setShowAffiliateModal(false)}
            onSaved={() => { setShowAffiliateModal(false); refreshAffiliateData(); }}
          />
        )}

        {/* Tracking Pixels Tab */}
        {tab === 'pixels' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[15px] font-bold text-carbon">Tracking Pixels</p>
              <p className="text-[12.5px] text-slate mt-0.5">
                Connect your own Facebook, Google and TikTok ad accounts so their pixels fire real PageView, Add to Cart and Purchase events on your storefront — same as Shopify's Pixels settings. Paste in ids straight from your own ad accounts; Solvexo doesn't need any credentials of its own.
              </p>
            </div>

            {pixelSettingsLoading ? (
              <SkeletonBox height={280} rounded="10px" />
            ) : pixelSettings && (
              <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 flex flex-col gap-3.5 max-w-[560px]">
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Facebook Pixel ID</label>
                  <input type="text" placeholder="e.g. 123456789012345" value={pixelSettings.facebookPixelId ?? ''}
                    onChange={e => setPixelSettings(p => p && ({ ...p, facebookPixelId: e.target.value }))}
                    className={INPUT_CLS} />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Google Analytics ID</label>
                  <input type="text" placeholder="e.g. G-XXXXXXXXXX" value={pixelSettings.googleAnalyticsId ?? ''}
                    onChange={e => setPixelSettings(p => p && ({ ...p, googleAnalyticsId: e.target.value }))}
                    className={INPUT_CLS} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Google Ads ID</label>
                    <input type="text" placeholder="e.g. AW-XXXXXXXXX" value={pixelSettings.googleAdsId ?? ''}
                      onChange={e => setPixelSettings(p => p && ({ ...p, googleAdsId: e.target.value }))}
                      className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Google Ads Conversion Label</label>
                    <input type="text" placeholder="optional" value={pixelSettings.googleAdsConversionLabel ?? ''}
                      onChange={e => setPixelSettings(p => p && ({ ...p, googleAdsConversionLabel: e.target.value }))}
                      className={INPUT_CLS} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">TikTok Pixel ID</label>
                  <input type="text" placeholder="e.g. CXXXXXXXXXXXXXXXXXXX" value={pixelSettings.tiktokPixelId ?? ''}
                    onChange={e => setPixelSettings(p => p && ({ ...p, tiktokPixelId: e.target.value }))}
                    className={INPUT_CLS} />
                </div>
                {pixelSettingsError && <p className="text-[12px] text-error">{pixelSettingsError}</p>}
                {pixelSettingsSaved && <p className="text-[12px] text-success">Saved.</p>}
                <div>
                  <Button onClick={savePixelSettings} loading={pixelSettingsSaving}>Save Settings</Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {deletingCoupon && (
        <Modal title="Delete Coupon" onClose={() => setDeletingCoupon(null)} mobileSheet footer={
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
