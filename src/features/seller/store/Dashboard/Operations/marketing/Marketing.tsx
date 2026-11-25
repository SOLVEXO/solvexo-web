import { useEffect, useRef, useState } from 'react';
import { useRouteTabs } from '@/hooks/useRouteTabs';
import { NoTabAccess } from '@/components/comman/ui/NoTabAccess';
import { Navigate, useParams } from 'react-router-dom';
import { FEATURES } from '@/constants/features';
import { Mail, ShoppingCart, Handshake, Trash2, Plus, Target, Zap, type LucideIcon } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { EmptyState, SkeletonBox, Modal, Button, PlanFeatureLock, Select } from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import {
  apiGetAbandonedCartSettings, apiUpdateAbandonedCartSettings, apiGetAbandonedCartStats, apiListAbandonedCarts,
  type AbandonedCartSettings, type AbandonedCartStats, type AbandonedCartItem,
} from '@/api/services/abandonedCart';
import {
  apiListEmailCampaigns, apiDeleteEmailCampaign, apiSendEmailCampaignNow, apiScheduleEmailCampaign,
  type EmailCampaign, type EmailCampaignAudience, type EmailCampaignStatus,
} from '@/api/services/emailCampaigns';
import { EmailCampaignTestModal } from './EmailCampaignTestModal';
import { EmailCampaignReportModal } from './EmailCampaignReportModal';
import { EmailCampaignEditor } from './EmailCampaignEditor';
import { MarketingAutomations } from './MarketingAutomations';
import { AbandonedCartExtras } from './AbandonedCartExtras';
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

type Tab = 'email' | 'automations' | 'cart' | 'affiliate' | 'pixels';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'email',     label: 'Email Campaigns', Icon: Mail         },
  { id: 'automations', label: 'Automations',   Icon: Zap          },
  { id: 'cart',      label: 'Abandoned Cart',  Icon: ShoppingCart },
  // Hidden via FEATURES.affiliates (not built-in on Shopify) — to become an installable App later; code/data kept.
  ...(FEATURES.affiliates ? [{ id: 'affiliate' as Tab, label: 'Affiliate', Icon: Handshake }] : []),
  { id: 'pixels',    label: 'Tracking Pixels', Icon: Target       },
];

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50';


function EmailCampaignScheduleModal({ storeId, campaign, onClose, onScheduled }: { storeId: string; campaign: EmailCampaign; onClose: () => void; onScheduled: () => void }) {
  const [scheduledAt, setScheduledAt] = useState('');
  // Earliest pickable moment (local time), fixed when the dialog opens.
  const [minLocal] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!scheduledAt) { setError('Please pick a date and time.'); return; }
    if (new Date(scheduledAt).getTime() <= Date.now()) { setError('Pick a time in the future.'); return; }
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
          <input type="datetime-local" value={scheduledAt} min={minLocal} onChange={e => setScheduledAt(e.target.value)} className={INPUT_CLS} />
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
              <Select value={form.commissionType} onChange={e => setForm(f => ({ ...f, commissionType: e.target.value as CommissionType }))} wrapperClassName="w-full">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </Select>
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
  const { tab: rawTab } = useParams<{ tab?: string }>();
  const MARKETING_PERMS: Record<string, string[]> = {
    email: ['marketing.manage'],
    automations: ['marketing.manage'], cart: ['marketing.manage'], affiliate: ['marketing.manage'], pixels: ['settings.pixels.manage'],
  };
  const { visibleTabs, activeTab, openTab, redirectTo, blocked } = useRouteTabs({
    tabs: TABS.map(t => ({ id: t.id, label: t.label })), base: 'marketing', permissions: MARKETING_PERMS,
  });
  const tab = (activeTab === 'none' ? 'email' : activeTab) as Tab;
  const setTab = (id: Tab) => openTab(id);
  // Every tab below lives in this ONE component (never unmounted on switch) —
  // its own useEffect gates on `tab === 'x'`, but without this guard, that
  // effect re-fires (and refetches) every single time the tab is revisited,
  // since `tab` is in its own dependency array. This tracks which tabs have
  // already loaded once so a repeat visit is instant, no refetch/skeleton.
  const loadedTabsRef = useRef(new Set<Tab>());

  // Plan entitlements — gates the Abandoned Cart / Email Campaigns tabs below
  // (both are real, fully working features whose only actual restriction is
  // the plan's own abandonedCartRecoveryAllowed/emailCampaignsAllowed flag;
  // the backend already rejects the underlying action either way, this just
  // stops a seller building/sending on a tab that will fail rather than
  // finding out only after the fact).
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  const [entitlementsLoaded, setEntitlementsLoaded] = useState(false);
  useEffect(() => {
    if (!storeId) return;
    apiGetStoreEntitlements(storeId).then(res => setEntitlements(res.data)).catch(() => {}).finally(() => setEntitlementsLoaded(true));
  }, [storeId]);
  const cartFeature = entitlements?.abandonedCartRecoveryAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;
  const emailFeature = entitlements?.emailCampaignsAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;

  // Abandoned Cart Recovery
  const [cartSettings, setCartSettings] = useState<AbandonedCartSettings | null>(null);
  const [cartSettingsLoading, setCartSettingsLoading] = useState(true);
  const [cartSettingsSaving, setCartSettingsSaving] = useState(false);
  const [cartSettingsError, setCartSettingsError] = useState('');
  const [cartSettingsSaved, setCartSettingsSaved] = useState(false);
  const [cartStats, setCartStats] = useState<AbandonedCartStats | null>(null);
  const [cartItems, setCartItems] = useState<AbandonedCartItem[]>([]);
  const [cartItemsLoading, setCartItemsLoading] = useState(true);
  const [cartLoadError, setCartLoadError] = useState('');

  function loadCartTab() {
    setCartLoadError('');
    setCartSettingsLoading(true);
    apiGetAbandonedCartSettings(storeId)
      .then(res => setCartSettings(res.data))
      .catch(err => setCartLoadError(err instanceof Error ? err.message : 'Failed to load abandoned cart settings.'))
      .finally(() => setCartSettingsLoading(false));
    apiGetAbandonedCartStats(storeId).then(res => setCartStats(res.data)).catch(() => {});
    setCartItemsLoading(true);
    apiListAbandonedCarts(storeId, { limit: 20 })
      .then(res => setCartItems(res.data.items ?? []))
      .catch(err => setCartLoadError(err instanceof Error ? err.message : 'Failed to load abandoned carts.'))
      .finally(() => setCartItemsLoading(false));
  }

  useEffect(() => {
    if (!storeId || tab !== 'cart' || loadedTabsRef.current.has('cart')) return;
    loadedTabsRef.current.add('cart');
    loadCartTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, tab]);

  async function saveCartSettings() {
    if (!cartSettings) return;
    if (!Number.isFinite(cartSettings.delayMinutes) || cartSettings.delayMinutes < 5) {
      setCartSettingsError('Wait at least 5 minutes before sending the reminder.');
      return;
    }
    setCartSettingsSaving(true);
    setCartSettingsError('');
    setCartSettingsSaved(false);
    try {
      const res = await apiUpdateAbandonedCartSettings(storeId, {
        enabled: cartSettings.enabled,
        delayMinutes: cartSettings.delayMinutes,
        subject: cartSettings.subject,
        message: cartSettings.message,
        discountCode: cartSettings.discountCode ?? '',
        secondReminderEnabled: cartSettings.secondReminderEnabled ?? false,
        secondReminderDelayHours: cartSettings.secondReminderDelayHours ?? 24,
        secondSubject: cartSettings.secondSubject ?? '',
        secondMessage: cartSettings.secondMessage ?? '',
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

  // Email Campaigns
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [emailCampaignsLoading, setEmailCampaignsLoading] = useState(true);
  const [emailCampaignsError, setEmailCampaignsError] = useState('');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [schedulingCampaign, setSchedulingCampaign] = useState<EmailCampaign | null>(null);
  const [campaignActionBusyId, setCampaignActionBusyId] = useState<string | null>(null);
  const [testingCampaign, setTestingCampaign] = useState<EmailCampaign | null>(null);
  const [reportCampaign, setReportCampaign] = useState<EmailCampaign | null>(null);

  function refreshEmailCampaigns() {
    setEmailCampaignsLoading(true);
    apiListEmailCampaigns(storeId, { limit: 50 })
      .then(res => { setEmailCampaigns(res.data.campaigns ?? []); setEmailCampaignsError(''); })
      .catch(err => setEmailCampaignsError(err instanceof Error ? err.message : 'Failed to load campaigns.'))
      .finally(() => setEmailCampaignsLoading(false));
  }

  useEffect(() => {
    if (!storeId || tab !== 'email' || loadedTabsRef.current.has('email')) return;
    loadedTabsRef.current.add('email');
    refreshEmailCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, tab]);

  async function handleSendCampaignNow(c: EmailCampaign) {
    if (!window.confirm(`Send "${c.name}" now? It goes to your real subscribers straight away and cannot be undone.`)) return;
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
    if (!window.confirm(`Delete the campaign "${c.name}"? This cannot be undone.`)) return;
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
    all: 'All subscribers', buyers: 'Subscribed buyers', abandoned: 'Subscribed, abandoned cart',
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
    if (!storeId || tab !== 'affiliate' || loadedTabsRef.current.has('affiliate')) return;
    loadedTabsRef.current.add('affiliate');
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

  const [pixelLoadError, setPixelLoadError] = useState('');

  function loadPixelSettings() {
    setPixelLoadError('');
    setPixelSettingsLoading(true);
    apiGetTrackingPixelSettings(storeId)
      .then(res => setPixelSettings(res.data))
      .catch(err => setPixelLoadError(err instanceof Error ? err.message : 'Failed to load tracking pixel settings.'))
      .finally(() => setPixelSettingsLoading(false));
  }

  useEffect(() => {
    if (!storeId || tab !== 'pixels' || loadedTabsRef.current.has('pixels')) return;
    loadedTabsRef.current.add('pixels');
    loadPixelSettings();
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

  // Coupons moved to the Discounts page (Shopify keeps discount codes there) — old bookmarks still land in the right place.
  if (rawTab === 'coupons') return <Navigate to={`/store/${storeId}/discounts`} replace />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  if (blocked) return <NoTabAccess title="Email & automations" />;

  return (
    <>
      <StorePageHeader
        title="Email & automations"
        subtitle="Email campaigns, automations, abandoned cart recovery and tracking pixels."
      />

      <div className="px-4 lg:px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* Tab bar — horizontally scrollable so 9 tabs never wrap/get cut off on narrower screens */}
        <div className="border-b border-bone overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0.5 w-max">
            {TABS.filter(t => visibleTabs.some(v => v.id === t.id)).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-[13px] font-medium cursor-pointer border-none bg-transparent -mb-px transition-colors duration-150 hover:text-brand-orange rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
                style={{ borderBottom: `2px solid ${tab === t.id ? '#D97757' : 'transparent'}`, color: tab === t.id ? '#D97757' : '#8C8A82' }}
              >
                <t.Icon size={14} className="shrink-0" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'cart' && !entitlementsLoaded ? (
          <SkeletonBox height={280} rounded="10px" />
        ) : tab === 'cart' && cartFeature && !cartFeature.allowed ? (
          <PlanFeatureLock
            label="Abandoned Cart Recovery"
            description="A buyer who leaves items in their cart would get an automatic reminder email once your delay has passed."
            requiredPlan={cartFeature.requiredPlan}
          />
        ) : tab === 'cart' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[15px] font-bold text-carbon">Abandoned Cart Recovery</p>
              <p className="text-[12.5px] text-slate mt-0.5">
                A buyer who leaves items in their cart gets an automatic reminder email once your delay below has passed, and, if you switch it on, one more later. You can add a discount code to the email. On by default — same as Shopify's own abandoned checkout recovery.
              </p>
            </div>

            {cartStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Abandoned', cartStats.abandonedCount.toLocaleString()],
                  ['Emails Sent', cartStats.emailsSent.toLocaleString()],
                  ['Clicked', cartStats.clicked.toLocaleString()],
                  ['Recovered', `${cartStats.recovered.toLocaleString()} · ${currencySymbol(store?.baseCurrency)}${cartStats.recoveredRevenue.toFixed(2)}`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white border border-bone rounded-[10px] px-3.5 py-3">
                    <p className="text-[10px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{label}</p>
                    <p className="text-[18px] font-bold text-carbon leading-[1.15]">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {cartLoadError && (
              <div className="flex items-center justify-between gap-3 bg-error-bg border border-bone rounded-[10px] px-4 py-3">
                <p className="text-[12px] text-error">{cartLoadError}</p>
                <Button variant="outline" onClick={loadCartTab}>Retry</Button>
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
                    onChange={e => { setCartSettingsSaved(false); setCartSettings(s => s && ({ ...s, enabled: e.target.checked })); }}
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite mb-[5px] block">Wait before sending (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={cartSettings.delayMinutes}
                    onChange={e => { setCartSettingsSaved(false); setCartSettings(s => s && ({ ...s, delayMinutes: Math.max(0, Math.floor(Number(e.target.value)) || 0) })); }}
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
                <AbandonedCartExtras storeId={storeId} settings={cartSettings} onChange={patch => setCartSettings(s => s && ({ ...s, ...patch }))} />
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
                            <td className="px-3.5 py-2.5 text-charcoal">{currencySymbol(item.currency)}{' '}{item.cartValue.toFixed(2)}</td>
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
        {tab === 'email' && !entitlementsLoaded ? (
          <SkeletonBox height={280} rounded="10px" />
        ) : tab === 'email' && emailFeature && !emailFeature.allowed ? (
          <PlanFeatureLock
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

            {emailCampaignsError && (
              <div className="flex items-center justify-between gap-3 bg-error-bg border border-bone rounded-[10px] px-4 py-3">
                <p className="text-[12px] text-error">{emailCampaignsError}</p>
                <Button variant="outline" onClick={refreshEmailCampaigns}>Retry</Button>
              </div>
            )}

            {emailCampaignsLoading ? (
              <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={56} rounded="8px" />)}</div>
            ) : emailCampaigns.length === 0 && emailCampaignsError ? null : emailCampaigns.length === 0 ? (
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
                                  <button onClick={() => setEditingCampaign(c)} disabled={busy} className="text-[11px] font-semibold text-charcoal hover:underline disabled:opacity-50">Edit</button>
                                  <button onClick={() => handleSendCampaignNow(c)} disabled={busy} className="text-[11px] font-semibold text-brand-orange hover:underline disabled:opacity-50">Send Now</button>
                                  <button onClick={() => setSchedulingCampaign(c)} disabled={busy} className="text-[11px] font-semibold text-charcoal hover:underline disabled:opacity-50">Schedule</button>
                                </>
                              )}
                              {['sending', 'sent'].includes(c.status) && (
                                <button onClick={() => setReportCampaign(c)} className="text-[11px] font-semibold text-brand-orange hover:underline">Report</button>
                              )}
                              <button onClick={() => setTestingCampaign(c)} className="text-[11px] font-semibold text-charcoal hover:underline">Send test</button>
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

        {(showCampaignModal || editingCampaign) && (
          <EmailCampaignEditor
            storeId={storeId}
            store={store}
            campaign={editingCampaign}
            onClose={() => { setShowCampaignModal(false); setEditingCampaign(null); refreshEmailCampaigns(); }}
            onSaved={() => refreshEmailCampaigns()}
          />
        )}

        {testingCampaign && (
          <EmailCampaignTestModal storeId={storeId} campaign={testingCampaign} onClose={() => setTestingCampaign(null)} />
        )}

        {reportCampaign && (
          <EmailCampaignReportModal storeId={storeId} campaign={reportCampaign} onClose={() => setReportCampaign(null)} />
        )}

        {tab === 'automations' && <MarketingAutomations storeId={storeId} emailFeature={emailFeature} />}

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
                    <Select value={affiliateProgram.commissionType} onChange={e => setAffiliateProgram(p => p && ({ ...p, commissionType: e.target.value as CommissionType }))} wrapperClassName="w-full">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </Select>
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

            {pixelLoadError && (
              <div className="flex items-center justify-between gap-3 bg-error-bg border border-bone rounded-[10px] px-4 py-3 max-w-[560px]">
                <p className="text-[12px] text-error">{pixelLoadError}</p>
                <Button variant="outline" onClick={loadPixelSettings}>Retry</Button>
              </div>
            )}

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

    </>
  );
}
