import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Archive, TrendingUp, Users, DollarSign, Eye, Check, Package, Layers, RotateCcw, Copy, Clock, Sparkles } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { Input, Textarea } from '@/components/comman/ui/Input';
import { SkeletonBox, Table, MetricCard, Card, Badge, AdminPageHeader, EmptyState, type TableColumn } from '@/components/comman/ui';
import {
  apiAdminListPlatformPlans, apiAdminCreatePlatformPlan, apiAdminUpdatePlatformPlan, apiAdminArchivePlatformPlan,
  apiAdminGetPlatformPlanRevenue, apiAdminGetPlatformPlanSubscribers, apiAdminListAddonPurchases,
  apiAdminRefundPlatformInvoice, apiAdminGetTrialSettings, apiAdminUpdateTrialSettings,
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
};

type BooleanKeys<T> = { [K in keyof T]-?: NonNullable<T[K]> extends boolean ? K : never }[keyof T];

// `soon: true` = verified (by grepping every call site in the backend) that
// NO feature module actually checks this flag yet — the underlying feature
// (abandoned-cart recovery, email campaigns, seller-facing API/webhooks,
// tiered analytics, marketplace-featured-badge placement) doesn't exist in
// the codebase at all today. Toggling it in the admin form saves the value
// but changes nothing for the seller — marked "(soon)" so admin never
// mistakes it for a working gate. `dedicatedAccountManager`/`prioritySupport`
// are deliberately NOT marked `soon` — those are real ops/human promises
// (route a seller to priority support queue, assign an account manager),
// exactly like Shopify's own plan tiers, never meant to be code-enforced.
const BOOL_FLAGS: { key: BooleanKeys<PlatformPlanLimits>; label: string; soon?: boolean }[] = [
  { key: 'customDomainAllowed', label: 'Custom domain' },
  { key: 'whiteLabelAllowed', label: 'White label' },
  { key: 'loyaltyProgramAllowed', label: 'Loyalty program' },
  { key: 'subscriptionProductsAllowed', label: 'Store subscriptions' },
  { key: 'advancedAnalyticsAllowed', label: 'Advanced analytics', soon: true },
  { key: 'abandonedCartRecoveryAllowed', label: 'Abandoned cart recovery', soon: true },
  { key: 'emailCampaignsAllowed', label: 'Email campaigns', soon: true },
  { key: 'apiWebhooksAllowed', label: 'API & webhooks', soon: true },
  { key: 'dedicatedAccountManager', label: 'Dedicated account manager' },
  { key: 'prioritySupport', label: 'Priority support' },
  { key: 'marketplaceFeaturedBadge', label: 'Marketplace featured badge', soon: true },
  { key: 'advancedSeoToolsAllowed', label: 'Advanced SEO tools' },
  { key: 'seoAiSuggestionsAllowed', label: 'AI SEO suggestions' },
  { key: 'searchConsoleIntegrationAllowed', label: 'Search Console integration' },
  { key: 'customRedirectsAllowed', label: 'Custom redirects' },
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
            <label className="flex items-center gap-2 text-[12.5px] font-medium text-charcoal">
              <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
              Offer a free trial on new stores
            </label>
            {enabled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Trial duration (days)" type="number" min={0} value={durationDays} onChange={e => setDurationDays(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-[12.5px] text-charcoal">
                  <input type="checkbox" checked={paymentMethodRequired} onChange={e => setPaymentMethodRequired(e.target.checked)} />
                  Require a payment method to start the trial
                </label>
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
  const [limits, setLimits] = useState<PlatformPlanLimits>(p?.limits ?? DEFAULT_LIMITS);
  const [introOfferEnabled, setIntroOfferEnabled] = useState(p?.introOfferEnabled ?? false);
  const [introPriceUSD, setIntroPriceUSD] = useState(p?.introPriceUSD != null ? String(p.introPriceUSD) : '');
  const [introDurationCycles, setIntroDurationCycles] = useState(p?.introDurationCycles != null ? String(p.introDurationCycles) : '3');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setLimit = <K extends keyof PlatformPlanLimits>(k: K, v: PlatformPlanLimits[K]) => setLimits(prev => ({ ...prev, [k]: v }));

  async function submit() {
    if (!name.trim()) { setError('Plan name is required.'); return; }
    if (!isFree && !monthlyPrice.trim()) {
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
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Create Plan'}</Button></>}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5">Basics</p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Plan Name" value={name} onChange={e => setName(e.target.value)} />
              <Input label="Badge (optional)" placeholder="Popular" value={badge} onChange={e => setBadge(e.target.value)} />
            </div>
            <Textarea label="Description" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5">Pricing</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="flex items-center gap-2 text-[12.5px] font-medium text-charcoal">
                <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} /> Free plan (no charge)
              </label>
              <p className="text-[11px] text-slate mt-1 leading-[1.5]">
                Only check this if you want a permanent $0 tier. It's a one-way door — a free plan can't be archived later
                (the platform always needs a fallback).
              </p>
            </div>
            {isFree ? (
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
        </div>

        {!isFree && (
          <div>
            <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand-orange" /> Intro offer (optional)
            </p>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-[12.5px] font-medium text-charcoal">
                <input type="checkbox" checked={introOfferEnabled} onChange={e => setIntroOfferEnabled(e.target.checked)} />
                Offer a discounted intro price (e.g. "$1/mo for 3 months, then full price")
              </label>
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

        {!isFree && monthlyPrice && (
          <div>
            <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5">Live preview — what a seller will see</p>
            <div className="rounded-xl border border-bone bg-cream/40 px-4 py-3.5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[14px] font-bold text-carbon">{name.trim() || 'Plan name'}</p>
                {badge.trim() && <Badge color="orange" size="sm">{badge.trim()}</Badge>}
              </div>
              <p className="flex items-baseline gap-1 mb-1">
                <span className="text-[20px] font-bold text-brand-orange">${monthlyPrice || 0}</span>
                <span className="text-[11px] text-slate">/mo</span>
              </p>
              {introOfferEnabled && introPriceUSD && introDurationCycles && (
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
        )}

        <div>
          <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-2.5">Display &amp; visibility</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Sort order (lower = shown first)" type="number" value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
              />
              <p className="text-[11px] text-slate mt-1">Controls left-to-right order on the pricing page and plan cards here.</p>
            </div>
            <div>
              <p className="block text-[12px] font-medium text-charcoal mb-1.5">Visibility</p>
              <label className="flex items-center gap-2 text-[12.5px] text-charcoal h-[38px] px-3 rounded-lg border border-bone bg-cream/60">
                <input type="checkbox" checked={isPubliclyVisible} onChange={e => setIsPubliclyVisible(e.target.checked)} />
                Show on public pricing page
              </label>
              <p className="text-[11px] text-slate mt-1">Turn off to keep a plan usable (e.g. for one seller) without listing it publicly.</p>
            </div>
          </div>
        </div>

        <Textarea label="Feature bullets (one per line)" rows={3} value={featuresText} onChange={e => setFeaturesText(e.target.value)} />

        <div>
          <p className="text-[11px] font-bold text-slate uppercase tracking-[0.06em] mb-1">Limits &amp; feature access</p>
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
          </div>
          <p className="text-[11px] text-slate mb-2.5 leading-[1.5]">
            <span className="font-semibold text-charcoal">Solvexo's fee</span> is the cut Solvexo keeps from every sale a
            seller makes on this plan — e.g. 5 means Solvexo keeps $5 out of every $100 sold. <span className="font-semibold text-charcoal">Uptime guarantee</span> is
            just a marketing number shown to sellers (e.g. "99.9% uptime") — leave it blank to not show one.
          </p>
          <p className="text-[11px] text-slate mb-1.5">Tap a feature below to turn it on (orange) or off for this plan:</p>
          <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-bone bg-cream/50">
            {BOOL_FLAGS.map(f => {
              const active = !!limits[f.key];
              return (
                <button key={f.key} type="button" onClick={() => setLimit(f.key, !active)}
                  title={f.soon ? 'Not built yet — turning this on saves the setting but doesn\'t unlock anything for the seller today.' : undefined}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-colors duration-fast"
                  style={{ background: active ? '#D97757' : '#fff', color: active ? '#fff' : '#5A5852', borderColor: active ? '#D97757' : '#E8E6DC' }}>
                  {active && <Check size={11} className="shrink-0" />}
                  {f.label}
                  {f.soon && <span className="opacity-70">(soon)</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[10.5px] text-slate mt-1.5">
            "(soon)" tags aren't built yet — toggling them saves the setting but doesn't change anything for the seller today.
          </p>
        </div>
        {error && <p className="text-[12px] text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Subscribers modal ────────────────────────────────────────────────────────
function SubscribersModal({ plan, onClose }: { plan: PlatformPlan; onClose: () => void }) {
  const [subs, setSubs] = useState<StorePlatformSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState(false);

  useEffect(() => {
    apiAdminGetPlatformPlanSubscribers(plan._id, { limit: 50 }).then(res => setSubs(res.data.subscribers ?? [])).finally(() => setLoading(false));
  }, [plan._id]);

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
              <button onClick={openRefund} className="px-2.5 py-1 bg-white border border-bone rounded-[6px] text-[11px] text-error cursor-pointer">Refund…</button>
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
    { key: 'amountUSD', header: 'Amount', render: a => <span className="font-semibold text-success">${(a.amountUSD ?? 0).toFixed(2)}</span> },
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

export function AdminPlatformPlans() {
  usePageTitle('Platform Plans');
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
      <AdminPageHeader
        title="Platform Plans"
        subtitle="Seller-to-Solvexo billing tiers, limits, and add-ons."
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Package size={13} />} onClick={() => setShowAddons(s => !s)}>
              {showAddons ? 'Hide Add-ons' : 'Add-on Purchases'}
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing('new')}>Create Plan</Button>
          </>
        }
      />

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
                description="Create your first plan — sellers pick one during onboarding and it drives every product, staff and feature limit."
                action={{ label: 'Create Plan', icon: <Plus size={14} />, onClick: () => setEditing('new') }}
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
                        <Button variant="outline" size="sm" fullWidth icon={<Pencil size={12} />} onClick={() => setEditing(plan)}>Edit</Button>
                        <Button variant="outline" size="sm" fullWidth icon={<Eye size={12} />} onClick={() => setViewingSubscribersFor(plan)}>Subscribers</Button>
                        <Button variant="outline" size="sm" icon={<Copy size={12} />} aria-label="Duplicate plan" onClick={() => setDuplicateSource(plan)} />
                        {plan.status === 'archived' ? (
                          <Button
                            variant="outline" size="sm" icon={<RotateCcw size={12} />}
                            loading={restoringId === plan._id}
                            aria-label="Restore plan"
                            onClick={() => handleRestore(plan)}
                          />
                        ) : !plan.isFree && (
                          <Button
                            variant="outline" size="sm" icon={<Archive size={12} />}
                            aria-label="Archive plan"
                            onClick={() => { setArchiving(plan); setArchiveError(''); setArchiveForceNeeded(false); }}
                          />
                        )}
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
      {viewingSubscribersFor && <SubscribersModal plan={viewingSubscribersFor} onClose={() => setViewingSubscribersFor(null)} />}

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
