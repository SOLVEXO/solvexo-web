import { useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Pencil, Archive, TrendingUp, Users, DollarSign, Eye, Check, Package, Layers, RotateCcw, Clock, Sparkles, Unlock, Lock, CalendarPlus, ArrowRightLeft } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { Input, Textarea } from '@/components/comman/ui/Input';
import { SkeletonBox, Table, MetricCard, Card, Badge, AdminPageHeader, EmptyState, type TableColumn } from '@/components/comman/ui';
import { Toggle } from '@/components/comman/ui/Toggle';
import { ActionMenu } from '@/components/comman/ui/ActionMenu';
import {
  apiAdminListPlatformPlans, apiAdminCreatePlatformPlan, apiAdminUpdatePlatformPlan, apiAdminArchivePlatformPlan,
  apiAdminGetPlatformPlanRevenue, apiAdminGetPlatformPlanSubscribers, apiAdminListAddonPurchases,
  apiAdminRefundPlatformInvoice, apiAdminGetTrialSettings, apiAdminUpdateTrialSettings,
  apiAdminUnlockStore, apiAdminExtendSubscription, apiAdminAssignPlan, apiAdminLockStore,
  type PlatformPlan, type PlatformPlanLimits, type StorePlatformSubscription, type AddonPurchase, type TrialSettings,
} from '@/api/services/platformPlans';

const ADDON_LABELS: Record<string, string> = {
  extra_ai_credits: 'Extra AI Credits', extra_staff_seat: 'Extra Staff Seat',
  priority_marketplace_placement: 'Priority Marketplace Placement',
  advanced_tax_compliance: 'Advanced Tax Compliance', sms_notifications: 'SMS Notifications',
};

const DEFAULT_LIMITS: PlatformPlanLimits = {
  maxProducts: 25, maxStaffAccounts: 1, maxPosLocations: 1, aiCreditsPerMonth: 0, transactionFeeRate: 0.05,
  customDomainAllowed: false, whiteLabelAllowed: false, loyaltyProgramAllowed: false, subscriptionProductsAllowed: false,
  advancedAnalyticsAllowed: false, abandonedCartRecoveryAllowed: false, emailCampaignsAllowed: false,
  apiWebhooksAllowed: false, dedicatedAccountManager: false, prioritySupport: false, marketplaceFeaturedBadge: false,
  advancedSeoToolsAllowed: false, seoAiSuggestionsAllowed: false, searchConsoleIntegrationAllowed: false, customRedirectsAllowed: false,
  maxActiveStoreBanners: 4, maxActivePromotions: 1,
  calculatedShippingRatesAllowed: false, maxMarkets: 3,
};

// Plans saved before these two fields existed get the same defaults the
// backend applies (NEW_FIELD_DEFAULTS in entitlements.service.ts).
const NEW_LIMIT_DEFAULTS: PlatformPlanLimits = { calculatedShippingRatesAllowed: false, maxMarkets: 3 };

type BooleanKeys<T> = { [K in keyof T]-?: NonNullable<T[K]> extends boolean ? K : never }[keyof T];

// This list is the admin-editable feature checklist for a plan — the whole
// point is that anything toggled ON here must be either a real, enforced
// backend gate (so a buying seller genuinely gets it) or an explicit,
// intentional human/ops promise (dedicatedAccountManager/prioritySupport —
// real Shopify plans do this too: "priority support" is fulfilled by a
// person, not code). A toggle that does NOTHING at all is worse than not
// having it — it lets an admin build/sell a plan that lies to the seller.
// `advancedAnalyticsAllowed`, `apiWebhooksAllowed`, and
// `marketplaceFeaturedBadge` were REMOVED from this list for exactly that
// reason: no seller-facing "advanced" analytics tier, no seller API/webhooks
// system, and no reachable place left for a "featured" badge to actually
// show (its one consumer, admin marketplace-listing curation, was
// disconnected in the marketplace-to-standalone-store pivot) exist in this
// codebase to back them. The `PlatformPlanLimits` schema fields themselves
// are untouched (any existing plan that already had one of these `true`
// keeps that stored value, harmlessly unused) — only the admin UI's ability
// to toggle them going forward is removed. Don't re-add any of the three
// here until the underlying feature is actually built.
const BOOL_FLAGS: { key: BooleanKeys<PlatformPlanLimits>; label: string; soon?: boolean }[] = [
  { key: 'customDomainAllowed', label: 'Custom domain' },
  { key: 'whiteLabelAllowed', label: 'White label' },
  { key: 'loyaltyProgramAllowed', label: 'Loyalty program' },
  { key: 'subscriptionProductsAllowed', label: 'Store subscriptions' },
  { key: 'abandonedCartRecoveryAllowed', label: 'Abandoned cart recovery' },
  { key: 'emailCampaignsAllowed', label: 'Email campaigns' },
  { key: 'dedicatedAccountManager', label: 'Dedicated account manager' },
  { key: 'prioritySupport', label: 'Priority support' },
  { key: 'advancedSeoToolsAllowed', label: 'Advanced SEO tools' },
  { key: 'seoAiSuggestionsAllowed', label: 'AI SEO suggestions' },
  { key: 'searchConsoleIntegrationAllowed', label: 'Search Console integration' },
  { key: 'customRedirectsAllowed', label: 'Custom redirects' },
  // Shopify: third-party calculated (live carrier) rates at checkout — Advanced and up.
  { key: 'calculatedShippingRatesAllowed', label: 'Live shipping rates' },
];

// ── Trial Settings — the ONE platform-wide "Solvexo Free Trial" policy.
// Deliberately a separate section from Plans below: trial is not the name of
// any plan (no "Pro Trial") — every new store gets this same trial,
// independent of which plan it later chooses. ────────────────────────────
function TrialSettingsCard() {
  const [settings, setSettings] = useState<TrialSettings | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [durationDays, setDurationDays] = useState('3');
  const [paymentMethodRequired, setPaymentMethodRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiAdminGetTrialSettings()
      .then(res => {
        setSettings(res.data);
        setEnabled(res.data.enabled);
        setDurationDays(String(res.data.durationDays));
        setPaymentMethodRequired(res.data.paymentMethodRequired);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load trial settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await apiAdminUpdateTrialSettings({
        enabled, durationDays: Math.max(0, Number(durationDays) || 0), paymentMethodRequired,
      });
      setSettings(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trial settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-[14px] border-b border-bone flex items-center gap-2">
        <Clock size={15} className="text-brand-orange shrink-0" />
        <div>
          <p className="text-[14px] font-bold text-charcoal">Trial Settings</p>
          <p className="text-[11px] text-slate">Applies to every new store — not tied to any specific plan.</p>
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 2 }).map((_, i) => <SkeletonBox key={i} height={36} rounded="6px" />)}</div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12.5px] font-medium text-charcoal">Offer a free trial on new stores</p>
                <p className="text-[11px] text-slate">{enabled ? 'ON — new stores get a trial automatically' : 'OFF — new stores skip straight to choosing a plan'}</p>
              </div>
              <Toggle checked={enabled} onChange={setEnabled} ariaLabel="Offer a free trial on new stores" />
            </div>
            {enabled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Trial duration (days)" type="number" min={0} value={durationDays} onChange={e => setDurationDays(e.target.value)} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12.5px] text-charcoal">Require a payment method to start the trial</p>
                  <Toggle checked={paymentMethodRequired} onChange={setPaymentMethodRequired} ariaLabel="Require a payment method to start the trial" size="sm" />
                </div>
                <p className="text-[11px] text-slate leading-[1.5]">
                  During the trial, a store gets full access to every module regardless of which plan it later
                  chooses. When the trial ends, the seller is asked to choose a plan — nothing is auto-charged.
                </p>
              </>
            )}
            {!enabled && (
              <p className="text-[11px] text-slate leading-[1.5]">
                New stores will go straight to choosing a plan — no free trial period.
              </p>
            )}
            {error && <p className="text-[12px] text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">{error}</p>}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={save} loading={saving}>Save Trial Settings</Button>
              {saved && <span className="text-[11.5px] font-medium text-success">Saved</span>}
              {settings && <span className="text-[10.5px] text-slate ml-auto">Last updated {new Date(settings.updatedAt).toLocaleString()}</span>}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function PlanFormModal({ plan, duplicateFrom, onClose, onSaved }: {
  plan: PlatformPlan | 'new'; duplicateFrom?: PlatformPlan; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = plan !== 'new';
  // `duplicateFrom` pre-fills every field from an existing plan, but `isEdit`
  // stays false — submit() below always creates a brand-new plan document.
  const p = isEdit ? plan : (duplicateFrom ?? null);
  const [name, setName] = useState(p ? (isEdit ? p.name : `${p.name} (Copy)`) : '');
  const [description, setDescription] = useState(p?.description ?? '');
  const [badge, setBadge] = useState(p?.badge ?? '');
  const [isFree, setIsFree] = useState(p?.isFree ?? false);
  const [monthlyPrice, setMonthlyPrice] = useState(p?.monthlyPriceUSD != null ? String(p.monthlyPriceUSD) : '');
  const [yearlyPrice, setYearlyPrice] = useState(p?.yearlyPriceUSD != null ? String(p.yearlyPriceUSD) : '');
  const [sortOrder, setSortOrder] = useState(p ? String(p.sortOrder ?? 0) : '0');
  const [isPubliclyVisible, setIsPubliclyVisible] = useState(p?.isPubliclyVisible ?? true);
  const [featuresText, setFeaturesText] = useState(p?.featureBullets?.join('\n') ?? '');
  const [limits, setLimits] = useState<PlatformPlanLimits>(p?.limits ? { ...NEW_LIMIT_DEFAULTS, ...p.limits } : DEFAULT_LIMITS);
  const [introOfferEnabled, setIntroOfferEnabled] = useState(p?.introOfferEnabled ?? false);
  const [introPriceUSD, setIntroPriceUSD] = useState(p?.introPriceUSD != null ? String(p.introPriceUSD) : '');
  const [introDurationCycles, setIntroDurationCycles] = useState(p?.introDurationCycles != null ? String(p.introDurationCycles) : '3');
  const [gracePeriodDays, setGracePeriodDays] = useState(p?.gracePeriodDays != null ? String(p.gracePeriodDays) : '3');
  // A core plan (Basic/Grow/Advanced/Enterprise) is defined by the platform: its kind, order and
  // feature text are fixed; the admin sets price, offer, naming, visibility and limit values.
  const isCore = isEdit && !!(plan as PlatformPlan).key;
  const isCustom = !!p?.isCustomPricing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setLimit = <K extends keyof PlatformPlanLimits>(k: K, v: PlatformPlanLimits[K]) => setLimits(prev => ({ ...prev, [k]: v }));

  // A guided, one-thing-at-a-time wizard instead of one long dense form — the
  // single-page version was confirmed confusing for a non-technical admin to
  // fill out correctly. Every field/state variable above is unchanged and
  // shared across all 4 steps; only the LAYOUT is split by `wizardStep`.
  const WIZARD_STEPS = ['Basics', 'Pricing', 'Limits & Features', 'Review'] as const;
  const [wizardStep, setWizardStep] = useState(1);

  function validateStep(step: number): string {
    if (step === 1 && !name.trim()) return 'Plan name is required.';
    if (step === 2 && !isFree && !isCustom && !monthlyPrice.trim()) {
      return 'Monthly price is required for a paid plan — or turn on "Free plan" if it should cost nothing.';
    }
    if (step === 2 && !isCustom && introOfferEnabled && (!introPriceUSD || !introDurationCycles)) {
      return 'Intro price and duration are both required when the intro offer is on.';
    }
    if (step === 2 && introOfferEnabled && monthlyPrice && Number(introPriceUSD) >= Number(monthlyPrice)) {
      return 'Intro price should be lower than the regular monthly price — otherwise it isn\'t really an intro discount.';
    }
    return '';
  }
  function goNext() {
    const err = validateStep(wizardStep);
    if (err) { setError(err); return; }
    setError('');
    setWizardStep(s => Math.min(s + 1, WIZARD_STEPS.length));
  }
  function goBack() {
    setError('');
    setWizardStep(s => Math.max(s - 1, 1));
  }

  async function submit() {
    if (!name.trim()) { setError('Plan name is required.'); return; }
    if (!isFree && !isCustom && !monthlyPrice.trim()) {
      setError('Monthly price is required for a paid plan — or check "Free plan" if it should cost nothing.');
      return;
    }
    if (introOfferEnabled && (!introPriceUSD || !introDurationCycles)) {
      setError('Intro price and duration are both required when the intro offer is on.');
      return;
    }
    if (introOfferEnabled && monthlyPrice && Number(introPriceUSD) >= Number(monthlyPrice)) {
      setError('Intro price should be lower than the regular monthly price — otherwise it isn\'t really an intro discount.');
      return;
    }
    // Limit/feature changes reach every store already on the plan immediately — make the admin say yes to that.
    const onPlan = isEdit ? (plan as PlatformPlan).subscriberCount ?? 0 : 0;
    if (isEdit && onPlan > 0 && !window.confirm(
      `${onPlan} store${onPlan === 1 ? ' is' : 's are'} on "${(plan as PlatformPlan).name}". Changes to its limits and features apply to them right away (a new price only affects new subscribers). Save these changes?`,
    )) return;
    setError(''); setSaving(true);
    try {
      const payload = {
        name: name.trim(), description: description.trim() || undefined, badge: badge.trim() || undefined,
        isFree, monthlyPriceUSD: monthlyPrice ? Number(monthlyPrice) : undefined,
        yearlyPriceUSD: yearlyPrice ? Number(yearlyPrice) : undefined,
        sortOrder: Number(sortOrder) || 0,
        isPubliclyVisible,
        featureBullets: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
        limits,
        introOfferEnabled,
        introPriceUSD: introOfferEnabled && introPriceUSD ? Number(introPriceUSD) : undefined,
        introDurationCycles: introOfferEnabled && introDurationCycles ? Number(introDurationCycles) : undefined,
        gracePeriodDays: gracePeriodDays.trim() === '' ? undefined : Number(gracePeriodDays),
      };
      if (isEdit) await apiAdminUpdatePlatformPlan(p!._id, payload);
      else await apiAdminCreatePlatformPlan(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan.');
    } finally { setSaving(false); }
  }

  return (
    <Modal mobileSheet title={isEdit ? 'Edit Platform Plan' : 'Create Platform Plan'} width={640} onClose={onClose}
      footer={
        <>
          {wizardStep > 1 && <Button variant="outline" onClick={goBack}>Back</Button>}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {wizardStep < WIZARD_STEPS.length ? (
            <Button onClick={goNext}>Next</Button>
          ) : (
            <Button onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Create Plan'}</Button>
          )}
        </>
      }>
      <div className="flex flex-col gap-5">
        {/* Progress header — one thing at a time instead of one long dense
           form, since a single-page version was confirmed confusing to fill
           out correctly by a non-technical admin. */}
        <div className="flex items-center gap-2">
          {WIZARD_STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === wizardStep;
            const isDone = stepNum < wizardStep;
            return (
              <div key={label} className={clsx('flex items-center gap-2', stepNum < WIZARD_STEPS.length ? 'flex-1' : '')}>
                <div className={clsx('flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap', isActive ? 'text-brand-orange' : isDone ? 'text-success' : 'text-slate')}>
                  <span className={clsx(
                    'size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                    isActive ? 'bg-brand-orange text-white' : isDone ? 'bg-success text-white' : 'bg-bone text-slate',
                  )}>
                    {isDone ? <Check size={11} /> : stepNum}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {stepNum < WIZARD_STEPS.length && <div className={clsx('h-px flex-1', isDone ? 'bg-success' : 'bg-bone')} />}
              </div>
            );
          })}
        </div>

        {/* ── Step 1 — Basics ── */}
        {wizardStep === 1 && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Plan Name" value={name} onChange={e => setName(e.target.value)} />
              <Input label="Badge (optional)" placeholder="Popular" value={badge} onChange={e => setBadge(e.target.value)} />
            </div>
            <Textarea label="Description" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        )}

        {/* ── Step 2 — Pricing ── */}
        {wizardStep === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              {!isCore && (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12.5px] font-medium text-charcoal">Free plan (no charge)</p>
                    <p className="text-[11px] text-slate mt-1 leading-[1.5]">
                      Only turn this on if you want a permanent $0 tier. It's a one-way door — a free plan can't be archived later
                      (the platform always needs a fallback).
                    </p>
                  </div>
                  <Toggle checked={isFree} onChange={setIsFree} ariaLabel="Free plan (no charge)" />
                </div>
              )}
              {isCustom ? (
                <div className="text-[12px] text-slate bg-cream/60 border border-bone rounded-lg px-3 py-2.5 leading-[1.5]">
                  This is a Contact Sales plan — it has no self-serve price. Agree the deal with the customer, then assign this plan to their store.
                </div>
              ) : isFree ? (
                <div className="text-[12px] text-slate bg-cream/60 border border-bone rounded-lg px-3 py-2.5">
                  This plan is free — sellers on it are never billed, so pricing fields are hidden.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Monthly $" type="number" min={0} value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} />
                  <Input label="Yearly $ (optional)" type="number" min={0} value={yearlyPrice} onChange={e => setYearlyPrice(e.target.value)} />
                </div>
              )}
              <p className="text-[11px] text-slate bg-cream/60 border border-bone rounded-lg px-3 py-2 leading-[1.5]">
                Free-trial length is no longer set per plan — it's one platform-wide setting now.
                See <strong>Trial Settings</strong> above.
              </p>
            </div>

            {!isFree && !isCustom && (
              <div>
                <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-brand-orange" /> Intro offer (optional)
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12.5px] font-medium text-charcoal">Offer a discounted intro price (e.g. "$1/mo for 3 months, then full price")</p>
                    <Toggle checked={introOfferEnabled} onChange={setIntroOfferEnabled} ariaLabel="Offer a discounted intro price" />
                  </div>
                  {introOfferEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Intro price $/mo" type="number" min={0} value={introPriceUSD} onChange={e => setIntroPriceUSD(e.target.value)} />
                      <Input label="Duration (months)" type="number" min={1} value={introDurationCycles} onChange={e => setIntroDurationCycles(e.target.value)} />
                    </div>
                  )}
                  <p className="text-[11px] text-slate leading-[1.5]">
                    Monthly billing only — matches how this kind of intro pricing normally works. A seller who chooses
                    yearly billing always pays the regular price.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3 — Limits & Features ── */}
        {wizardStep === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-1">Limits</p>
              <p className="text-[11px] text-slate mb-2.5">Enter <span className="font-semibold text-charcoal">-1</span> in any limit field for unlimited.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                <Input label="Max products (-1=∞)" type="number" value={limits.maxProducts ?? ''} onChange={e => setLimit('maxProducts', Number(e.target.value))} />
                <Input label="Max staff (-1=∞)" type="number" value={limits.maxStaffAccounts ?? ''} onChange={e => setLimit('maxStaffAccounts', Number(e.target.value))} />
                <Input label="Max POS locations" type="number" value={limits.maxPosLocations ?? ''} onChange={e => setLimit('maxPosLocations', Number(e.target.value))} />
                <Input label="AI credits/mo" type="number" value={limits.aiCreditsPerMonth ?? ''} onChange={e => setLimit('aiCreditsPerMonth', Number(e.target.value))} />
                <Input
                  label="Solvexo's fee (%)" type="number" step="0.1" min={0} max={100}
                  value={limits.transactionFeeRate != null ? Math.round(limits.transactionFeeRate * 1000) / 10 : ''}
                  onChange={e => setLimit('transactionFeeRate', e.target.value === '' ? 0 : Number(e.target.value) / 100)}
                />
                <Input
                  label="Uptime guarantee % (optional)" type="number" step="0.1" min={0} max={100}
                  value={limits.slaUptimePercent ?? ''} onChange={e => setLimit('slaUptimePercent', e.target.value === '' ? undefined : Number(e.target.value))}
                />
                <Input label="Max store banners (-1=∞)" type="number" value={limits.maxActiveStoreBanners ?? ''} onChange={e => setLimit('maxActiveStoreBanners', Number(e.target.value))} />
                <Input label="Max active promotions (-1=∞)" type="number" value={limits.maxActivePromotions ?? ''} onChange={e => setLimit('maxActivePromotions', Number(e.target.value))} />
                <Input label="Max markets / currencies (-1=∞)" type="number" min={-1} value={limits.maxMarkets ?? ''} onChange={e => setLimit('maxMarkets', Number(e.target.value))} />
                <Input label="Grace period (days)" type="number" min={0} value={gracePeriodDays} onChange={e => setGracePeriodDays(e.target.value)} />
              </div>
              <p className="text-[11px] text-slate leading-[1.5] -mt-1 mb-3">
                <span className="font-semibold text-charcoal">Grace period</span> — how many days a store on this plan stays browsable to buyers after payment fails/trial ends before its storefront is hidden. Selling/checkout is blocked immediately either way; this only controls browsing.
              </p>
              <p className="text-[11px] text-slate leading-[1.5]">
                <span className="font-semibold text-charcoal">Solvexo's fee</span> is the cut Solvexo keeps from every sale a
                seller makes on this plan — e.g. 5 means Solvexo keeps $5 out of every $100 sold. <span className="font-semibold text-charcoal">Uptime guarantee</span> is
                just a marketing number shown to sellers (e.g. "99.9% uptime") — leave it blank to not show one.
              </p>
              <p className="text-[11px] text-slate leading-[1.5] mt-1.5">
                <span className="font-semibold text-charcoal">Max markets</span> — how many currencies a store can sell in at checkout, its own currency included (Store Settings → Markets). Minimum 1.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5">Features</p>
              <p className="text-[11px] text-slate mb-1.5">Tap a feature below to turn it on (orange) or off for this plan:</p>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-bone bg-cream/50">
                {BOOL_FLAGS.map(f => {
                  const active = !!limits[f.key];
                  return (
                    <button key={f.key} type="button" onClick={() => setLimit(f.key, !active)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-colors duration-fast"
                      style={{ background: active ? '#D97757' : '#fff', color: active ? '#fff' : '#5A5852', borderColor: active ? '#D97757' : '#E8E6DC' }}>
                      {active && <Check size={11} className="shrink-0" />}
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10.5px] text-slate mt-1.5">
                Every feature above is a real, enforced gate — a seller on this plan gets exactly what's toggled on, nothing more.
              </p>
            </div>

            {isCore ? (
              <div className="text-[12px] text-slate bg-cream/60 border border-bone rounded-lg px-3 py-2.5 leading-[1.5]">
                The feature list on the plan card and the compare table is generated from the limits and features above, so it can never disagree with what a seller really gets.
              </div>
            ) : (
              <Textarea label="Feature bullets (one per line — shown as a checklist on the plan card)" rows={3} value={featuresText} onChange={e => setFeaturesText(e.target.value)} />
            )}
          </div>
        )}

        {/* ── Step 4 — Review ── */}
        {wizardStep === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5">Display &amp; visibility</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Input
                    label="Sort order (lower = shown first)" type="number" value={sortOrder} disabled={isCore}
                    onChange={e => setSortOrder(e.target.value)}
                  />
                  <p className="text-[11px] text-slate mt-1">Controls left-to-right order on the pricing page and plan cards here.</p>
                </div>
                <div>
                  <p className="block text-[12px] font-medium text-charcoal mb-1.5">Visibility</p>
                  <div className="flex items-center justify-between gap-2 text-[12.5px] text-charcoal h-[38px] px-3 rounded-lg border border-bone bg-cream/60">
                    Show on public pricing page
                    <Toggle checked={isPubliclyVisible} onChange={setIsPubliclyVisible} ariaLabel="Show on public pricing page" size="sm" />
                  </div>
                  <p className="text-[11px] text-slate mt-1">Turn off to keep a plan usable (e.g. for one seller) without listing it publicly.</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5">Live preview — what a seller will see</p>
              <div className="rounded-xl border border-bone bg-cream/40 px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[14px] font-bold text-carbon">{name.trim() || 'Plan name'}</p>
                  {badge.trim() && <Badge color="orange" size="sm">{badge.trim()}</Badge>}
                </div>
                <p className="flex items-baseline gap-1 mb-1">
                  {isFree ? (
                    <span className="text-[20px] font-bold text-brand-orange">Free</span>
                  ) : (
                    <>
                      <span className="text-[20px] font-bold text-brand-orange">${monthlyPrice || 0}</span>
                      <span className="text-[11px] text-slate">/mo</span>
                    </>
                  )}
                </p>
                {!isFree && introOfferEnabled && introPriceUSD && introDurationCycles && (
                  <p className="text-[11.5px] font-medium text-success mb-1">
                    ${introPriceUSD}/mo for {introDurationCycles} month{Number(introDurationCycles) === 1 ? '' : 's'}, then ${monthlyPrice}/mo
                  </p>
                )}
                {description.trim() && <p className="text-[11.5px] text-slate mb-2">{description.trim()}</p>}
                <ul className="flex flex-col gap-1 list-none p-0">
                  {featuresText.split('\n').map(f => f.trim()).filter(Boolean).slice(0, 4).map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-[11.5px] text-graphite">
                      <Check size={12} className="text-success shrink-0 mt-[2px]" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-[12px] text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">{error}</p>}
      </div>
    </Modal>
  );
}

// Real support tools for a specific store's subscription — before these
// existed, unlocking a wrongly-locked store, comping a plan, extending a
// period, or force-locking a store required a direct database edit. Every
// action requires a real backend admin-only endpoint (never a client-side
// fake) and is logged server-side via ActivityLogService.
type AdminSubAction = 'unlock' | 'extend' | 'assign' | 'lock';

// ── Subscribers modal ────────────────────────────────────────────────────────
function SubscribersModal({ plan, allPlans, onClose }: { plan: PlatformPlan; allPlans: PlatformPlan[]; onClose: () => void }) {
  const [subs, setSubs] = useState<StorePlatformSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState(false);

  const [actionTarget, setActionTarget] = useState<{ sub: StorePlatformSubscription; action: AdminSubAction } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDays, setActionDays] = useState('7');
  const [actionPlanId, setActionPlanId] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  function refresh() {
    setLoading(true);
    apiAdminGetPlatformPlanSubscribers(plan._id, { limit: 50 }).then(res => setSubs(res.data.subscribers ?? [])).finally(() => setLoading(false));
  }
  useEffect(refresh, [plan._id]);

  function openAction(sub: StorePlatformSubscription, action: AdminSubAction) {
    setActionTarget({ sub, action });
    setActionReason('');
    setActionDays('7');
    setActionPlanId(allPlans.find(p => p._id !== sub.platformPlanId)?._id ?? '');
    setActionError('');
  }

  async function submitAction() {
    if (!actionTarget) return;
    setActionBusy(true);
    setActionError('');
    try {
      const { sub, action } = actionTarget;
      if (action === 'unlock') await apiAdminUnlockStore(sub.storeId, actionReason.trim() || undefined);
      else if (action === 'lock') await apiAdminLockStore(sub.storeId, actionReason.trim() || undefined);
      else if (action === 'extend') {
        const days = Number(actionDays);
        if (!Number.isFinite(days) || days <= 0) { setActionError('Enter a valid number of days.'); setActionBusy(false); return; }
        await apiAdminExtendSubscription(sub.storeId, days, actionReason.trim() || undefined);
      } else if (action === 'assign') {
        if (!actionPlanId) { setActionError('Choose a plan to assign.'); setActionBusy(false); return; }
        await apiAdminAssignPlan(sub.storeId, actionPlanId, actionReason.trim() || undefined);
      }
      setActionTarget(null);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActionBusy(false);
    }
  }

  const ACTION_TITLE: Record<AdminSubAction, string> = {
    unlock: 'Unlock Store', lock: 'Lock Store', extend: 'Extend Billing Period', assign: 'Assign Plan (No Charge)',
  };

  function openRefund() {
    setInvoiceId('');
    setAmount('');
    setRefundError('');
    setRefundSuccess(false);
    setRefunding(true);
  }

  async function submitRefund() {
    if (!invoiceId.trim()) { setRefundError('Invoice ID is required.'); return; }
    setRefundBusy(true);
    setRefundError('');
    try {
      await apiAdminRefundPlatformInvoice(invoiceId.trim(), amount.trim() ? parseFloat(amount.trim()) : undefined);
      setRefundSuccess(true);
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : 'Refund failed.');
    } finally {
      setRefundBusy(false);
    }
  }

  return (
    <Modal mobileSheet title={`Subscribers — ${plan.name}`} width={560} onClose={onClose}>
      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={40} rounded="6px" />)}</div>
      ) : subs.length === 0 ? (
        <p className="text-[13px] text-slate">No subscribers on this plan.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {subs.map(s => (
            <div key={s._id} className="flex items-center justify-between text-[12.5px] bg-cream rounded-lg px-3 py-2.5">
              <div>
                <p className="font-semibold text-charcoal">Store {s.storeId.slice(-6).toUpperCase()}</p>
                <p className="text-[11px] text-slate">{s.billingInterval} — ${s.amountUSD.toFixed(2)} — {s.status}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={openRefund} className="px-2.5 py-1 bg-white border border-bone rounded-[6px] text-[11px] text-error cursor-pointer">Refund…</button>
                <ActionMenu
                  ariaLabel={`Support actions for store ${s.storeId}`}
                  items={[
                    ['locked', 'trial_ended', 'past_due'].includes(s.status)
                      ? { label: 'Unlock Store', icon: <Unlock size={13} />, onClick: () => openAction(s, 'unlock') }
                      : { label: 'Force Lock', icon: <Lock size={13} />, danger: true, onClick: () => openAction(s, 'lock') },
                    { label: 'Extend Period…', icon: <CalendarPlus size={13} />, onClick: () => openAction(s, 'extend') },
                    { label: 'Assign Plan (No Charge)…', icon: <ArrowRightLeft size={13} />, onClick: () => openAction(s, 'assign') },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {refunding && (
        <Modal mobileSheet
          title="Refund Invoice"
          onClose={() => setRefunding(false)}
          footer={refundSuccess ? (
            <Button onClick={() => setRefunding(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setRefunding(false)} disabled={refundBusy}>Cancel</Button>
              <Button variant="danger" onClick={submitRefund} loading={refundBusy}>Refund</Button>
            </>
          )}
        >
          {refundSuccess ? (
            <p className="text-[13px] text-success">Refund processed.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <Input label="Invoice ID" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} placeholder="Paste the invoice ID to refund" />
              <Input label="Amount (USD)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Leave blank for full remaining amount" />
              {refundError && <p className="text-[12px] text-error">{refundError}</p>}
            </div>
          )}
        </Modal>
      )}

      {actionTarget && (
        <Modal mobileSheet
          title={ACTION_TITLE[actionTarget.action]}
          onClose={() => setActionTarget(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setActionTarget(null)} disabled={actionBusy}>Cancel</Button>
              <Button variant={actionTarget.action === 'lock' ? 'danger' : 'primary'} onClick={submitAction} loading={actionBusy}>
                {ACTION_TITLE[actionTarget.action]}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-[12.5px] text-slate">
              Store {actionTarget.sub.storeId.slice(-6).toUpperCase()} — currently <strong>{actionTarget.sub.status}</strong>.
            </p>
            {actionTarget.action === 'extend' && (
              <Input label="Extend by (days)" type="number" min={1} value={actionDays} onChange={e => setActionDays(e.target.value)} />
            )}
            {actionTarget.action === 'assign' && (
              <div>
                <label className="block text-[12px] font-medium text-charcoal mb-1.5">Plan to assign</label>
                <select value={actionPlanId} onChange={e => setActionPlanId(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border">
                  <option value="">Choose a plan…</option>
                  {allPlans.filter(p => p.status === 'active').map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <p className="text-[11px] text-slate mt-1">No charge is made — any live Stripe subscription for this store is cancelled first.</p>
              </div>
            )}
            <Textarea label="Reason (logged for support/audit, not shown to the seller verbatim)" value={actionReason} onChange={e => setActionReason(e.target.value)} rows={2} />
            {actionError && <p className="text-[12px] text-error">{actionError}</p>}
          </div>
        </Modal>
      )}
    </Modal>
  );
}

// ── Add-on purchases panel ────────────────────────────────────────────────────
function AddonsPanel() {
  const [addons, setAddons] = useState<AddonPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiAdminListAddonPurchases({ limit: 50 }).then(res => setAddons(res.data.addons ?? [])).finally(() => setLoading(false));
  }, []);

  const columns: TableColumn<AddonPurchase>[] = [
    { key: 'storeId', header: 'Store', render: a => <span className="text-charcoal">{a.storeId.slice(-6).toUpperCase()}</span> },
    { key: 'addonType', header: 'Add-on', render: a => <span className="text-graphite">{ADDON_LABELS[a.addonType] ?? a.addonType}</span> },
    { key: 'quantity', header: 'Qty', render: a => <span className="text-graphite">{a.quantity}</span> },
    { key: 'priceUSD', header: 'Amount', render: a => <span className="font-semibold text-success">${(a.priceUSD ?? 0).toFixed(2)}{a.recurring ? '/mo' : ''}</span> },
    { key: 'status', header: 'Status', render: a => <Badge color={a.status === 'active' ? 'green' : a.status === 'canceled' ? 'gray' : 'orange'} size="sm" className="capitalize">{a.status}</Badge> },
    { key: 'createdAt', header: 'Date', render: a => <span className="text-slate whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <Table
      columns={columns}
      data={addons}
      keyExtractor={a => a._id}
      loading={loading}
      emptyState={{
        icon: <Package size={28} className="text-slate/50" />,
        title: 'No add-on purchases yet.',
        description: 'When a seller buys extra AI credits, staff seats, or other add-ons, they’ll show up here.',
      }}
    />
  );
}

interface AdminPlatformPlansProps {
  /** true when rendered as a tab inside AdminBilling.tsx — suppresses this
   *  page's own title/header since the parent page already owns those (same
   *  convention as AdminModeration's own `embedded` prop). */
  embedded?: boolean;
}

export function AdminPlatformPlans({ embedded = false }: AdminPlatformPlansProps = {}) {
  usePageTitle(embedded ? '' : 'Platform Plans');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [revenue, setRevenue] = useState<{ mrr: number; arr: number; activeSubscribers: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<PlatformPlan | 'new' | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<PlatformPlan | null>(null);
  const [viewingSubscribersFor, setViewingSubscribersFor] = useState<PlatformPlan | null>(null);
  const [showAddons, setShowAddons] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError('');
    Promise.all([apiAdminListPlatformPlans(true), apiAdminGetPlatformPlanRevenue()])
      .then(([plansRes, revRes]) => { setPlans(plansRes.data ?? []); setRevenue(revRes.data); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load platform plans.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const [archiving, setArchiving] = useState<PlatformPlan | null>(null);
  const [archiveError, setArchiveError] = useState('');
  const [archiveForceNeeded, setArchiveForceNeeded] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleArchive(force = false) {
    if (!archiving) return;
    setArchiveBusy(true);
    setArchiveError('');
    try {
      await apiAdminArchivePlatformPlan(archiving._id, force);
      setArchiving(null);
      setArchiveForceNeeded(false);
      load();
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : 'Failed to archive plan.');
      setArchiveForceNeeded(true);
    } finally {
      setArchiveBusy(false);
    }
  }

  /** Un-archives a plan — makes it active (and, if isPubliclyVisible, listed) again. There's no separate "restore" endpoint: archiving only ever flips `status`, so reversing it is the same admin-update call with `status: 'active'`. */
  async function handleRestore(plan: PlatformPlan) {
    setRestoringId(plan._id);
    setError('');
    try {
      await apiAdminUpdatePlatformPlan(plan._id, { status: 'active' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore plan.');
    } finally {
      setRestoringId(null);
    }
  }

  const metrics = revenue ? [
    { label: 'Platform MRR', value: `$${revenue.mrr.toFixed(2)}`, Icon: TrendingUp },
    { label: 'Platform ARR', value: `$${revenue.arr.toFixed(2)}`, Icon: DollarSign },
    { label: 'Active Subscribers', value: String(revenue.activeSubscribers), Icon: Users },
  ] : [];

  return (
    <div>
      {!embedded && (
        <AdminPageHeader
          title="Platform Plans"
          subtitle="Manage prices, intro offers and limits for the platform's plans. What each plan includes is defined by the platform."
          actions={
            <>
              <Button variant="outline" size="sm" icon={<Package size={13} />} onClick={() => setShowAddons(s => !s)}>
                {showAddons ? 'Hide Add-ons' : 'Add-on Purchases'}
              </Button>
            </>
          }
        />
      )}
      {embedded && (
        <div className="px-4 sm:px-7 pt-5 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" icon={<Package size={13} />} onClick={() => setShowAddons(s => !s)}>
            {showAddons ? 'Hide Add-ons' : 'Add-on Purchases'}
          </Button>
        </div>
      )}

      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-5">
        {error && <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">{error}</p>}

        {showAddons && (
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-[14px] border-b border-bone flex items-center gap-2">
              <Package size={15} className="text-brand-orange shrink-0" />
              <p className="text-[14px] font-bold text-charcoal">Add-on Purchases</p>
            </div>
            <AddonsPanel />
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(loading && !revenue)
            ? Array.from({ length: 3 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)
            : metrics.map(m => (
              <MetricCard key={m.label} label={m.label} value={m.value} icon={<m.Icon size={16} />} />
            ))}
        </div>

        <TrialSettingsCard />

        <div>
          <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-3 flex items-center gap-1.5">
            <Layers size={13} /> Plans{!loading && plans.length > 0 && <span className="text-slate/70 font-medium normal-case tracking-normal">({plans.length})</span>}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex flex-col gap-3">
                  <SkeletonBox width="60%" height={16} rounded="4px" />
                  <SkeletonBox width="40%" height={20} rounded="4px" />
                  <div className="flex flex-col gap-1.5">
                    <SkeletonBox width="90%" height={11} rounded="4px" />
                    <SkeletonBox width="80%" height={11} rounded="4px" />
                    <SkeletonBox width="70%" height={11} rounded="4px" />
                  </div>
                  <SkeletonBox width="100%" height={34} rounded="8px" />
                </Card>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <Card padding="none">
              <EmptyState
                icon={<Layers size={28} className="text-slate/50" />}
                title="No platform plans yet."
                description="The platform's four plans (Basic, Grow, Advanced, Enterprise) are created automatically when the server starts. If none appear, the server hasn't synced yet — check the API logs."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => {
                const isHighlighted = !!plan.badge && plan.status !== 'archived';
                return (
                  <Card
                    key={plan._id}
                    padding="none"
                    hover
                    className={`relative flex flex-col overflow-hidden ${isHighlighted ? 'ring-2 ring-brand-orange' : ''}`}
                  >
                    {isHighlighted && <div className="h-[3px] w-full bg-gradient-to-r from-brand-orange to-brand-deep-orange shrink-0" />}
                    <div className="px-5 pt-4 pb-4 flex flex-col grow">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-[15px] font-bold text-carbon">{plan.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {plan.isPubliclyVisible === false && <Badge color="gray" size="sm">Hidden</Badge>}
                          {plan.key && <Badge color="blue" size="sm">Core plan</Badge>}
                          {plan.isFree && <Badge color="blue" size="sm">Always available</Badge>}
                          {plan.badge && <Badge color="orange" size="sm">{plan.badge}</Badge>}
                        </div>
                      </div>

                      <p className="flex items-baseline gap-1 mb-3">
                        {plan.isFree ? (
                          <span className="text-[22px] font-bold text-brand-orange">Free</span>
                        ) : plan.isCustomPricing ? (
                          <span className="text-[22px] font-bold text-brand-orange">Custom</span>
                        ) : (
                          <>
                            <span className="text-[22px] font-bold text-brand-orange">${plan.monthlyPriceUSD}</span>
                            <span className="text-[12px] font-medium text-slate">/mo</span>
                          </>
                        )}
                      </p>

                      <ul className="flex flex-col gap-1.5 mb-4 p-0 list-none">
                        {(plan.featureBullets ?? []).slice(0, 4).map(f => (
                          <li key={f} className="flex items-start gap-1.5 text-[12px] text-graphite leading-[1.4]">
                            <Check size={13} className="text-success shrink-0 mt-[2px]" />
                            <span>{f}</span>
                          </li>
                        ))}
                        {(plan.featureBullets ?? []).length === 0 && (
                          <li className="text-[12px] text-slate/70 italic">No feature bullets added yet.</li>
                        )}
                      </ul>

                      <div className="flex items-center justify-between py-2.5 border-t border-[#f0eee6] mb-3 mt-auto text-[11px] text-slate">
                        <span className="flex items-center gap-1"><Users size={11} /> {plan.subscriberCount ?? 0} sellers</span>
                        <span className="font-semibold text-success">${(plan.mrrUSD ?? 0).toFixed(2)}/mo</span>
                        <Badge color={plan.status === 'active' ? 'green' : 'gray'} size="sm" dot className="capitalize">{plan.status}</Badge>
                      </div>

                      <div className="flex gap-2">
                        {/* Only ONE text button stays inline — "Edit" (the action
                           an admin needs most). Subscribers/Duplicate/Archive/
                           Restore all live in the kebab menu instead, so this row
                           is exactly 2 items (one fullWidth text button + one
                           fixed 32px icon button) and can never overflow a
                           card, regardless of how narrow the grid column gets.
                           An earlier version tried 3-4 inline buttons — on a
                           real ~300px card two of them silently overflowed
                           outside the clipped card boundary, which is exactly
                           why Archive was reported as "nowhere to be found." */}
                        {/* `flex-1` here, NOT the `fullWidth` prop — `fullWidth` sets
                           `width: 100%`, which in a flex row claims the ENTIRE
                           row's width regardless of the ActionMenu sibling next
                           to it, pushing that sibling out past the Card's
                           `overflow-hidden` boundary (invisible, not just
                           squeezed) — the real reason the kebab menu never
                           showed up no matter how few buttons were in the row.
                           `flex-1` grows to fill only the space left over
                           after the fixed-width sibling, which is what this
                           row actually needs. */}
                        <Button variant="outline" size="sm" className="flex-1" icon={<Pencil size={12} />} onClick={() => setEditing(plan)}>Edit</Button>
                        <ActionMenu
                          className="shrink-0"
                          ariaLabel={`More actions for ${plan.name}`}
                          items={[
                            { label: 'Subscribers', icon: <Eye size={13} />, onClick: () => setViewingSubscribersFor(plan) },
                            plan.status === 'archived'
                              ? {
                                  label: restoringId === plan._id ? 'Restoring…' : 'Restore', icon: <RotateCcw size={13} />,
                                  disabled: restoringId === plan._id, onClick: () => handleRestore(plan),
                                }
                              : {
                                  label: 'Archive', icon: <Archive size={13} />, danger: true,
                                  disabled: plan.isFree || !!plan.key, title: plan.key ? "Core plans can't be archived — turn off \"visible to sellers\" to hide one" : plan.isFree ? 'The free/default plan cannot be archived' : undefined,
                                  onClick: () => { setArchiving(plan); setArchiveError(''); setArchiveForceNeeded(false); },
                                },
                          ]}
                        />
                      </div>
                      {plan.status === 'archived' && (
                        <p className="text-[10.5px] text-slate mt-2 text-center">
                          Archived — hidden from new sellers. Existing subscribers on it are unaffected.
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editing && <PlanFormModal plan={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {duplicateSource && (
        <PlanFormModal
          plan="new" duplicateFrom={duplicateSource}
          onClose={() => setDuplicateSource(null)}
          onSaved={() => { setDuplicateSource(null); load(); }}
        />
      )}
      {viewingSubscribersFor && <SubscribersModal plan={viewingSubscribersFor} allPlans={plans} onClose={() => setViewingSubscribersFor(null)} />}

      {archiving && (
        <Modal mobileSheet
          title="Archive Plan"
          onClose={() => setArchiving(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setArchiving(null)} disabled={archiveBusy}>Cancel</Button>
              <Button variant="danger" onClick={() => handleArchive(archiveForceNeeded)} loading={archiveBusy}>
                {archiveForceNeeded ? 'Archive Anyway' : 'Archive'}
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            Archive "<strong>{archiving.name}</strong>"?
          </p>
          {archiveError && (
            <p className="text-[12px] text-error mt-2">
              {archiveError}{archiveForceNeeded ? ' Choose "Archive Anyway" to proceed regardless.' : ''}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
