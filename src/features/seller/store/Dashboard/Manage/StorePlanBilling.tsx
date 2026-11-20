import { useEffect, useState, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import {
  Check, Users, Package, Sparkles, MonitorSmartphone, AlertTriangle, Clock, CreditCard,
  XCircle, RotateCcw, Loader2, LayoutGrid, Percent, ReceiptText, CircleDollarSign, type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StorePageHeader, useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import { Button } from '@/components/comman/ui/Button';
import { SettingsCard } from '@/components/comman/settings';
import { Modal } from '@/components/comman/ui/Modal';
import { usePlatformCardOnFile } from '@/hooks/usePlatformCardOnFile';
import { confirmPaymentIntentWithSecret } from '@/components/comman/ui/StripeCardPayment';
import { completePlanChange, shouldBillImmediately } from '@/utils/planChangeFlow';
import { PLAN_STATUS_TONE_CLASS, planStatusLabel } from '@/utils/planStatus';
import { useLocalCurrencyForCountry } from '@/features/buyer/pages/pricing/localPrice';
import { LocalPriceNote } from '@/components/comman/LocalPriceNote';
import { priceOnly, priceWithUsd } from '@/utils/localPlanPrice';
import { Textarea } from '@/components/comman/ui/Input';
import {
  apiBrowsePlatformPlans, apiGetStorePlatformPlan, apiGetStoreEntitlements, apiChangePlatformPlan, apiConfirmPendingPlanChange,
  apiPreviewPlatformPlanChange, apiCancelScheduledPlanChange, apiCancelPlatformPlan, apiReactivatePlatformPlan, apiCreatePlatformBillingPortalSession,
  apiGetTransactionFees,
  type PlatformPlan, type StorePlatformSubscription, type EntitlementsSummary,
  type PlanChangePreview, type TransactionFeesOverview,
} from '@/api/services/platformPlans';

import { yearlyTotal, yearlyMonthlyEquivalent, yearlySavingsPercent } from '@/utils/planPricing';

// Shopify-style select-plan + Stripe checkout, loaded only when a seller actually needs a card.
import { PlatformTaxNote } from '@/components/comman/PlatformTaxNote';
import { salesMailto } from '@/utils/contact';
import { FeeBillPayment } from './FeeBillPayment';
const PlanCheckoutFlow = lazy(() => import('@/components/layouts/PlanCheckoutFlow'));


const FEE_BILL_STATUS_STYLE: Record<string, string> = {
  paid: 'bg-success-bg text-success',
  invoiced: 'bg-warning-bg text-warning',
  awaiting_payment: 'bg-warning-bg text-warning',
  creating: 'bg-warning-bg text-warning',
  payment_failed: 'bg-error-bg text-error',
  failed: 'bg-error-bg text-error',
};

/**
 * Shopify's "third-party transaction fee": a plan-based % on sales paid through a gateway that isn't
 * the platform's own card rail (the store's own gateway, or a custom rate). It is NOT taken from any
 * sales balance — it accrues here and is billed once a month with the plan bill.
 */
function TransactionFeesCard({ storeId }: { storeId: string }) {
  const [data, setData] = useState<TransactionFeesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true); setError('');
    apiGetTransactionFees(storeId)
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load transaction fees.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, reloadKey]);

  const accrued = data?.accrued;
  return (
    <SettingsCard
      title="Transaction fees"
      icon={<Percent size={14} />}
      divided
      description="Charged on sales paid through a third-party gateway. Billed once a month with your plan — never deducted from your sales."
      bodyClassName="px-0 pb-0"
    >
      {loading ? null : error ? (
        <p role="alert" className="px-5 py-5 text-[13px] text-error">{error}</p>
      ) : (
        <>
          <div className="px-5 py-4 border-b border-fog flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-slate uppercase tracking-wide">Accrued this period</p>
              <p className="text-[20px] font-bold text-carbon">
                {accrued && accrued.estimatedUSD != null ? `${accrued.estimatedUSD.toFixed(2)}` : '—'}
              </p>
              <p className="text-[11px] text-slate">
                {accrued?.saleCount ?? 0} sale(s)
                {accrued && accrued.byCurrency.length > 0 && ' · ' + accrued.byCurrency.map(c => `${c.amount.toFixed(2)} ${c.currency}`).join(', ')}
              </p>
            </div>
            <p className="text-[11px] text-slate">
              Next bill: {accrued ? new Date(accrued.nextBillingDate).toLocaleDateString() : '—'}
              {accrued && ` (totals under ${accrued.minimumBillableUSD.toFixed(2)} roll into the next month)`}
            </p>
          </div>
          {(data?.bills ?? []).length === 0 ? (
            <p className="px-5 py-5 text-center text-[13px] text-slate">No transaction-fee bills yet.</p>
          ) : (
            <div className="flex flex-col">
              {data!.bills.map(b => (
                <div key={b._id} className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 border-b border-fog last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-charcoal">{b.periodKey}</p>
                    <p className="text-[11px] text-slate">${b.amountUSD.toFixed(2)}{(b.taxAmountUSD ?? 0) > 0 ? ` + $${b.taxAmountUSD!.toFixed(2)} tax` : ''} · {b.saleCount} sale(s)</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-[11px] font-semibold px-2 py-[3px] rounded-full capitalize ${FEE_BILL_STATUS_STYLE[b.status] ?? 'bg-bone text-slate'}`}>
                      {b.status === 'awaiting_payment' ? 'Payment due' : b.status.replace('_', ' ')}
                    </span>
                    {b.hostedInvoiceUrl && (
                      <a href={b.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-brand-orange hover:underline">View invoice</a>
                    )}
                  </div>
                  {b.status === 'awaiting_payment' && (
                    <FeeBillPayment storeId={storeId} bill={b} payTo={data?.payTo ?? null} onReported={() => setReloadKey(k => k + 1)} />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </SettingsCard>
  );
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

function UsageBar({ label, used, max, Icon }: { label: string; used: number; max: number; Icon: LucideIcon }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / Math.max(1, max)) * 100);
  const near = !unlimited && pct >= 85;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[12.5px] text-graphite"><Icon size={13} className="text-slate" />{label}</span>
        <span className="text-[12px] font-semibold text-carbon">{used}{unlimited ? '' : ` / ${max}`}</span>
      </div>
      {!unlimited && (
        <div className="h-[6px] bg-mist rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${near ? 'bg-error' : 'bg-brand-orange'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default function StorePlanBilling({ embedded = false }: { embedded?: boolean } = {}) {
  const { storeId, store } = useStoreWorkspace();
  // Display only: a Pakistani store sees Rs amounts (its own country); everything is billed in US$.
  const local = useLocalCurrencyForCountry(store?.country);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [current, setCurrent] = useState<StorePlatformSubscription | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  // Staff with only 'View billing and receive billing emails' get a read-only page (backend enforces too).
  const canManage = hasNavPermission(TokenStorage.getUser() as Parameters<typeof hasNavPermission>[0], 'settings.billing.manage');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changingId, setChangingId] = useState<string | null>(null);
  const [interval, setInterval_] = useState<'monthly' | 'yearly'>('monthly');
  const [confirmingPlan, setConfirmingPlan] = useState<PlatformPlan | null>(null);
  // Set when the seller picks a paid plan that needs a card — opens the full checkout.
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  // A store with no card on file needs the full checkout to buy a plan (the proration modal can only charge a saved card).
  const { cardOnFile } = usePlatformCardOnFile();
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);
  const [reactivateBusy, setReactivateBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [scheduledBusy, setScheduledBusy] = useState(false);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    Promise.all([apiBrowsePlatformPlans(), apiGetStorePlatformPlan(storeId), apiGetStoreEntitlements(storeId)])
      .then(([plansRes, curRes, entRes]) => {
        setPlans(plansRes.data); setCurrent(curRes.data); setEntitlements(entRes.data);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load plan & billing.'))
      .finally(() => setLoading(false));
  }, [storeId]);
  useEffect(load, [load]);

  // A fresh key per confirm-modal open (not per component mount — this page
  // stays mounted across many unrelated plan-change attempts over time, so a
  // single component-lifetime key would make the backend's
  // IdempotencyInterceptor wrongly replay a cached response from a PRIOR,
  // different plan change). Reused across retries of the same attempt while
  // this modal stays open, which is the actual double-charge case this
  // guards against (a slow request the seller retries, or a network-level
  // auto-retry).
  const changePlanIdempotencyKeyRef = useRef<string | null>(null);

  // ── Confirm-plan-change modal — fetch the exact proration preview the moment it opens ──
  useEffect(() => {
    if (!confirmingPlan) { setPreview(null); changePlanIdempotencyKeyRef.current = null; return; }
    changePlanIdempotencyKeyRef.current = `platform-plan-change-${storeId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let cancelled = false;
    setPreviewLoading(true);
    apiPreviewPlatformPlanChange(storeId, confirmingPlan._id, interval)
      .then(res => { if (!cancelled) setPreview(res.data); })
      .catch(err => { if (!cancelled) setActionError(err instanceof Error ? err.message : 'Failed to calculate proration.'); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [confirmingPlan, interval, storeId]);

  async function submitChangePlan() {
    if (!confirmingPlan) return;
    setChangingId(confirmingPlan._id);
    setActionError('');
    try {
      // Trialing → commit now, charge at trial end; otherwise charge now. Success only once the plan really activated (3DS handled).
      const billNow = shouldBillImmediately(current);
      await completePlanChange(confirmingPlan._id, billNow, {
        change: () => apiChangePlatformPlan(storeId, confirmingPlan._id, interval, billNow, changePlanIdempotencyKeyRef.current ?? undefined),
        confirmCard: confirmPaymentIntentWithSecret,
        confirmPending: () => apiConfirmPendingPlanChange(storeId),
        fetchSub: () => apiGetStorePlatformPlan(storeId).then(r => r.data),
      });
      setConfirmingPlan(null);
      load();
    } catch (err) {
      // A failed/declined attempt must retry with a fresh Idempotency-Key, or the replayed response would repeat the failure.
      changePlanIdempotencyKeyRef.current = `platform-plan-change-${storeId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setActionError(err instanceof Error ? err.message : 'Failed to change plan.');
    } finally {
      setChangingId(null);
    }
  }

  async function submitCancelSubscription() {
    setCancelBusy(true);
    setActionError('');
    try {
      await apiCancelPlatformPlan(storeId, cancelReason.trim() || undefined);
      setCancelModal(false);
      setCancelReason('');
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel subscription.');
    } finally {
      setCancelBusy(false);
    }
  }

  async function submitCancelScheduledChange() {
    setScheduledBusy(true);
    setActionError('');
    try {
      await apiCancelScheduledPlanChange(storeId);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel the scheduled plan change.');
    } finally {
      setScheduledBusy(false);
    }
  }

  async function submitReactivate() {
    setReactivateBusy(true);
    setActionError('');
    try {
      await apiReactivatePlatformPlan(storeId);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reactivate subscription.');
    } finally {
      setReactivateBusy(false);
    }
  }

  async function openBillingPortal() {
    setPortalBusy(true);
    setActionError('');
    try {
      const res = await apiCreatePlatformBillingPortalSession(storeId, window.location.href);
      window.location.href = res.data.url;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No billing portal is available yet — subscribe to a paid plan first.');
      setPortalBusy(false);
    }
  }

  const trialDaysLeft = current?.trialEndsAt ? daysUntil(current.trialEndsAt) : null;
  const isTrialing = current?.status === 'trialing';
  const isTrialEnded = current?.status === 'trial_ended';
  const isLocked = current?.status === 'locked';
  const isPastDue = current?.status === 'past_due';
  const isCancelPending = !!current?.cancelAtPeriodEnd;
  const scheduledChange = current?.scheduledPlanChange ?? null;

  const banner = useMemo(() => {
    // Distinct from `isLocked` purely in framing — nothing was ever charged
    // here (no plan was ever attached during the trial), so "payment
    // failed"/"locked" copy would be a false claim. Same restriction, same
    // "choose a plan" action.
    if (isTrialEnded) {
      return {
        tone: 'error' as const, Icon: AlertTriangle,
        text: 'Your free trial has ended — choose a plan below to continue selling. Every product, order, and setting is untouched.',
        actionLabel: 'Choose a plan',
        onAction: () => document.getElementById('platform-plans-list')?.scrollIntoView({ behavior: 'smooth' }),
      };
    }
    if (isLocked) {
      return {
        tone: 'error' as const, Icon: AlertTriangle,
        text: 'This store is locked — choose a plan and complete payment below to resume selling. Every product, order, and setting is untouched.',
        actionLabel: 'Choose a plan',
        onAction: () => document.getElementById('platform-plans-list')?.scrollIntoView({ behavior: 'smooth' }),
      };
    }
    if (isPastDue) {
      return {
        tone: 'error' as const, Icon: AlertTriangle,
        text: `We couldn't process your last payment. ${current?.lockDate ? `Pay by ${new Date(current.lockDate).toDateString()} or this store will be locked.` : 'Update your payment method to avoid losing your plan.'}`,
        actionLabel: 'Update payment method', onAction: openBillingPortal,
      };
    }
    if (isCancelPending && current) {
      const endDate = new Date(current.currentPeriodEnd).toDateString();
      const outcome = current.legacyFreeEligible
        ? `move to the free tier on ${endDate}`
        : `end on ${endDate}, and selling will be paused until you choose a new plan`;
      return {
        tone: 'warning' as const, Icon: XCircle,
        text: `Your plan will ${outcome}. You keep full access until then.`,
        actionLabel: 'Reactivate', onAction: submitReactivate,
      };
    }
    if (scheduledChange && current) {
      return {
        tone: 'info' as const, Icon: Clock,
        text: `Your plan changes to ${scheduledChange.planName} (${scheduledChange.interval}) on ${new Date(current.currentPeriodEnd).toDateString()}. You keep your current plan until then.`,
        actionLabel: 'Keep current plan', onAction: submitCancelScheduledChange,
      };
    }
    if (isTrialing && trialDaysLeft != null && trialDaysLeft <= 7) {
      return {
        tone: 'info' as const, Icon: Clock,
        text: `Your free trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}. Choose a plan below before then to keep selling without interruption.`,
        actionLabel: 'Choose a plan',
        onAction: () => document.getElementById('platform-plans-list')?.scrollIntoView({ behavior: 'smooth' }),
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrialEnded, isLocked, isPastDue, isCancelPending, isTrialing, trialDaysLeft, current, scheduledChange]);

  const BANNER_STYLE = {
    error:   { bg: 'bg-error-bg', border: 'border-error-border', text: 'text-error', icon: 'text-error' },
    warning: { bg: 'bg-warning-bg', border: 'border-warning/30', text: 'text-warning', icon: 'text-warning' },
    info:    { bg: 'bg-info-bg', border: 'border-info/25', text: 'text-info', icon: 'text-info' },
  };

  if (loading && !current) return null;

  return (
    <>
      {!embedded && (
        <StorePageHeader title="Billing Center" subtitle="Your store's Solvexo subscription, usage limits, payment method, and billing history." />
      )}

      <div className="px-4 lg:px-7 py-6 flex flex-col gap-5">
        {error && <p className="text-[13px] text-error">{error}</p>}
        {actionError && (
          <div className="flex items-center justify-between gap-3 text-[13px] text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} className="text-[11px] font-semibold text-error bg-transparent border-none cursor-pointer shrink-0">Dismiss</button>
          </div>
        )}

        {!canManage && (
          <p className="text-[12px] text-slate">You can view billing and receive billing emails. Changing the plan or payment method needs the "Manage plan & billing" permission.</p>
        )}

        {banner && (() => {
          const s = BANNER_STYLE[banner.tone];
          return (
            <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border ${s.bg} ${s.border}`}>
              <span className={`flex items-center gap-2 text-[12.5px] font-medium ${s.text}`}>
                <banner.Icon size={15} className={`shrink-0 ${s.icon}`} />
                {banner.text}
              </span>
              {canManage && (
                <Button size="sm" variant="outline" loading={reactivateBusy || portalBusy || scheduledBusy} onClick={banner.onAction}>
                  {banner.actionLabel}
                </Button>
              )}
            </div>
          );
        })()}

        {entitlements && current && (
          <SettingsCard
            title={`Current Plan — ${entitlements.currentPlanName}`}
            icon={<CircleDollarSign size={14} />}
            description={(
              <>
                {current.complimentary
                  ? 'Provided by Solvexo support — no billing'
                  : !current.platformPlanId && current.status !== 'trialing'
                  ? 'Choose a plan below to keep selling'
                  : (<>
                    {current.amountUSD > 0 ? `${priceWithUsd(current.amountUSD, local)}/${current.billingInterval === 'yearly' ? 'yr' : 'mo'} · ` : ''}
                    {isCancelPending ? 'Ends' : 'Renews'} {new Date(isCancelPending ? current.currentPeriodEnd : current.nextBillingDate).toLocaleDateString()}
                  </>)}
              </>
            )}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
              {(() => {
                const st = planStatusLabel(current.status, { cancelPending: isCancelPending, complimentary: !!current.complimentary });
                return <span className={`text-[11px] font-semibold px-2 py-[3px] rounded-full ${PLAN_STATUS_TONE_CLASS[st.tone]}`}>{st.label}</span>;
              })()}
              <div className="flex items-center gap-2 flex-wrap">
                {canManage && current.stripeCustomerId && (
                  <Button size="sm" variant="outline" icon={<CreditCard size={13} />} loading={portalBusy} onClick={openBillingPortal}>
                    Payment method
                  </Button>
                )}
                {canManage && current.amountUSD > 0 && !current.complimentary && (
                  isCancelPending ? (
                    <Button size="sm" variant="outline" icon={<RotateCcw size={13} />} loading={reactivateBusy} onClick={submitReactivate}>
                      Reactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" icon={<XCircle size={13} />} onClick={() => { setCancelModal(true); setActionError(''); }}>
                      Cancel plan
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UsageBar label="Products" used={entitlements.maxProducts.used} max={entitlements.maxProducts.limit} Icon={Package} />
              <UsageBar label="Staff Accounts" used={entitlements.maxStaffAccounts.used} max={entitlements.maxStaffAccounts.limit} Icon={Users} />
              <UsageBar
                label="AI Credits (balance)"
                used={entitlements.aiCredits.monthlyAllowance === -1 ? entitlements.aiCredits.balance : Math.max(0, entitlements.aiCredits.monthlyAllowance - entitlements.aiCredits.balance)}
                max={entitlements.aiCredits.monthlyAllowance}
                Icon={Sparkles}
              />
              <UsageBar label="POS Locations" used={entitlements.maxPosLocations.used} max={entitlements.maxPosLocations.limit} Icon={MonitorSmartphone} />
            </div>
          </SettingsCard>
        )}

        <SettingsCard
          title="Available Plans"
          icon={<LayoutGrid size={14} />}
          description="What each plan costs at the billing interval you pick, and what it includes."
          actions={(
            <div className="inline-flex bg-white rounded-full p-1 border border-bone">
              {(['monthly', 'yearly'] as const).map(iv => (
                <button key={iv} onClick={() => setInterval_(iv)}
                  className={`px-3.5 py-[6px] rounded-full text-[11.5px] font-semibold cursor-pointer border-none capitalize ${interval === iv ? 'bg-carbon text-white' : 'bg-transparent text-slate'}`}>
                  {iv}
                </button>
              ))}
            </div>
          )}
        >
          <div id="platform-plans-list" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map(plan => {
              const isCurrent = current?.platformPlanId === plan._id;
              // Mirrors the backend's own computeProration: a yearly interval
              // with no explicit yearlyPriceUSD is charged monthly x 12, never
              // the bare monthly figure — this card must show that same number
              // or it understates what "Switch to this plan" will actually bill.
              const price = interval === 'yearly' ? yearlyTotal(plan) : plan.monthlyPriceUSD;
              const isScheduled = scheduledChange?.planId === plan._id;
              const savings = yearlySavingsPercent(plan);
              return (
                <div key={plan._id} className={`bg-white rounded-xl px-4 py-4 flex flex-col border transition-colors ${isCurrent ? 'border-2 border-brand-orange' : 'border-bone hover:border-border-hover'}`}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[14px] font-semibold text-charcoal">{plan.name}</p>
                    {plan.badge && <span className="text-[10px] font-bold px-2 py-[2px] rounded-full bg-brand-pale-orange text-brand-deep-orange">{plan.badge}</span>}
                  </div>
                  <p className="text-[20px] font-bold text-brand-orange">
                    {plan.isFree ? 'Free' : plan.isCustomPricing ? 'Custom' : interval === 'yearly' ? `${priceOnly(yearlyMonthlyEquivalent(plan), local)}/mo` : `${priceOnly(price ?? 0, local)}/mo`}
                  </p>
                  {interval === 'yearly' && !plan.isFree && !plan.isCustomPricing && (
                    <p className="text-[11.5px] text-slate -mt-0.5">Billed {priceWithUsd(yearlyTotal(plan), local)} yearly{savings > 0 ? ` · save ${savings}%` : ''}</p>
                  )}
                  {/* Intro offer (monthly only — same rule the backend applies when it creates the subscription). */}
                  <p className="text-[11.5px] font-medium text-success mb-2 min-h-[16px]">
                    {interval === 'monthly' && !isCurrent && !plan.isFree && plan.introOfferEnabled && plan.introPriceUSD != null && plan.introDurationCycles != null
                      ? `Start at ${priceWithUsd(plan.introPriceUSD, local)}/mo for ${plan.introDurationCycles} month${plan.introDurationCycles === 1 ? '' : 's'}, then ${priceOnly(plan.monthlyPriceUSD ?? 0, local)}/mo`
                      : ' '}
                  </p>
                  <ul className="flex flex-col gap-1.5 mb-4 p-0 list-none flex-1">
                    {plan.featureBullets.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-[12px] text-graphite"><Check size={12} className="text-brand-orange mt-[2px] shrink-0" />{f}</li>
                    ))}
                  </ul>
                  <Button size="sm" variant={isCurrent ? 'outline' : 'primary'} disabled={!canManage || isCurrent || isScheduled} loading={changingId === plan._id} onClick={() => {
                    setActionError('');
                    // Enterprise has no self-serve checkout — it's agreed with sales and assigned by an admin.
                    if (plan.isCustomPricing) { window.location.href = salesMailto(`${plan.name} Plan Inquiry`); return; }
                    // First paid purchase (no Stripe customer yet, still on trial/locked, or coming
                    // from the free plan) needs a card → full checkout. An already-paying store
                    // keeps the proration confirm modal.
                    // A store that is "active" but has no card saved (e.g. assigned its plan by an admin)
                    // also needs the checkout — the proration modal can only charge a card already on file.
                    const needsCheckout = !plan.isFree && !plan.isCustomPricing
                      && (!current?.stripeCustomerId || current.status !== 'active' || !!current.plan?.isFree || cardOnFile === false);
                    if (needsCheckout) setCheckoutPlanId(plan._id); else setConfirmingPlan(plan);
                  }}>
                    {isCurrent ? 'Current Plan' : isScheduled ? 'Starts next cycle' : plan.isCustomPricing ? 'Contact sales' : 'Switch to this plan'}
                  </Button>
                </div>
              );
            })}
          </div>
          <LocalPriceNote local={local} className="mt-4 text-[11.5px] leading-[1.5] text-slate" />
        </SettingsCard>

        <SettingsCard
          title="Billing activity & invoices"
          icon={<ReceiptText size={14} />}
          description="Every plan change, payment, failed attempt and refund, plus your invoices — with the card used and a line-by-line breakdown."
          actions={<Link to={`/store/${storeId}/billing-activity`}><Button size="sm" variant="outline" icon={<ReceiptText size={13} />}>View billing activity</Button></Link>}
        >
          <p className="text-[12.5px] text-slate">Open the full record in one place: the timeline on one side, your invoices on the other. You can filter by month and export it as CSV.</p>
        </SettingsCard>

        <TransactionFeesCard storeId={storeId} />
      </div>

      {checkoutPlanId && (
        <Suspense fallback={null}>
          <PlanCheckoutFlow
            storeId={storeId}
            initialPlanId={checkoutPlanId}
            initialBilling={interval === 'yearly' ? 'annual' : 'monthly'}
            onClose={() => setCheckoutPlanId(null)}
          />
        </Suspense>
      )}

      {confirmingPlan && (
        <Modal title="Confirm Plan Change" width={440} onClose={() => setConfirmingPlan(null)}
          footer={<>
            <Button variant="outline" onClick={() => setConfirmingPlan(null)} disabled={changingId === confirmingPlan._id}>Cancel</Button>
            <Button onClick={submitChangePlan} loading={changingId === confirmingPlan._id} disabled={previewLoading || !preview}>{preview && !preview.effectiveImmediately ? 'Confirm & schedule' : 'Confirm & Switch'}</Button>
          </>}
        >
          <p className="text-[13px] text-charcoal mb-3">
            Switch to <strong>{confirmingPlan.name}</strong> ({interval})?
          </p>
          {preview && <PlatformTaxNote storeId={storeId} amountUSD={preview.newAmountUSD} className="text-[12px] text-slate -mt-1.5 mb-3" />}

          {previewLoading ? (
            <div className="flex items-center gap-2 text-[12.5px] text-slate py-3">
              <Loader2 size={14} className="animate-spin" /> Calculating exact proration…
            </div>
          ) : preview && !preview.effectiveImmediately ? (
            <div className="bg-cream border border-bone rounded-lg p-3.5 flex flex-col gap-[6px]">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate">New plan price</span>
                <span className="text-charcoal font-medium">{priceWithUsd(preview.newAmountUSD, local)}/{preview.newBillingInterval === 'yearly' ? 'yr' : 'mo'}</span>
              </div>
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate">Starts on</span>
                <span className="text-charcoal font-medium">{preview.effectiveAt ? new Date(preview.effectiveAt).toLocaleDateString() : 'next renewal'}</span>
              </div>
              <p className="text-[11.5px] text-slate pt-[6px] mt-[2px] border-t border-bone">
                Nothing is charged or refunded today. You keep {preview.currentPlanName} until then — plans are billed in advance.
              </p>
            </div>
          ) : preview ? (
            <div className="bg-cream border border-bone rounded-lg p-3.5 flex flex-col gap-[6px]">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate">New plan price</span>
                <span className="text-charcoal font-medium">{priceWithUsd(preview.newAmountUSD, local)}/{preview.newBillingInterval === 'yearly' ? 'yr' : 'mo'}</span>
              </div>
              {preview.unusedCreditFromCurrentPlanUSD > 0 && (
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-slate">Unused credit ({preview.remainingDaysInCurrentPeriod} day{preview.remainingDaysInCurrentPeriod === 1 ? '' : 's'} left)</span>
                  <span className="text-success">−{priceWithUsd(preview.unusedCreditFromCurrentPlanUSD, local)}</span>
                </div>
              )}
              {preview.existingCreditBalanceUSD > 0 && (
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-slate">Existing account credit</span>
                  <span className="text-success">−{priceWithUsd(preview.existingCreditBalanceUSD, local)}</span>
                </div>
              )}
              <div className="flex justify-between text-[13.5px] font-bold pt-[6px] mt-[2px] border-t border-bone">
                <span className="text-carbon">{preview.creditAppliedToBalanceUSD > 0 ? 'Credited to your account' : 'Due today'}</span>
                <span className={preview.creditAppliedToBalanceUSD > 0 ? 'text-success' : 'text-brand-orange'}>
                  {priceWithUsd(preview.creditAppliedToBalanceUSD > 0 ? preview.creditAppliedToBalanceUSD : preview.amountDueTodayUSD, local)}
                </span>
              </div>
              <LocalPriceNote local={local} className="text-[11px] leading-[1.5] text-slate pt-[6px]" />
            </div>
          ) : null}

          {preview && preview.usageWarnings.length > 0 && (
            <div className="mt-3 bg-error-bg border border-error-border rounded-lg p-3 flex flex-col gap-1.5">
              <p className="text-[12px] font-semibold text-error flex items-center gap-1.5">
                <AlertTriangle size={13} className="shrink-0" /> You're currently over this plan's limits
              </p>
              {preview.usageWarnings.map(w => (
                <p key={w.label} className="text-[11.5px] text-error/90 pl-[19px]">
                  {w.label}: you have {w.used}, {w.newLimit === -1 ? 'unlimited' : w.newLimit} allowed on this plan
                </p>
              ))}
              <p className="text-[11px] text-error/80 pl-[19px]">
                Nothing will be deleted — you just won't be able to add more until you're back under the limit.
              </p>
            </div>
          )}

          {preview && (preview.lostFeatures?.length ?? 0) > 0 && (
            <div className="mt-3 bg-warning-bg border border-warning/30 rounded-lg p-3 flex flex-col gap-1.5">
              <p className="text-[12px] font-semibold text-warning flex items-center gap-1.5">
                <AlertTriangle size={13} className="shrink-0" /> This plan does not include
              </p>
              <ul className="list-disc pl-[34px] text-[11.5px] text-warning/90 m-0">
                {preview.lostFeatures!.map(f => <li key={f}>{f}</li>)}
              </ul>
              <p className="text-[11px] text-warning/80 pl-[19px]">
                Your data stays safe. These tools stop working on this plan, and come back if you upgrade again.
              </p>
            </div>
          )}

          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}

      {cancelModal && (
        <Modal title="Cancel Subscription" width={440} onClose={() => setCancelModal(false)}
          footer={<>
            <Button variant="outline" onClick={() => setCancelModal(false)} disabled={cancelBusy}>Keep my plan</Button>
            <Button variant="danger" onClick={submitCancelSubscription} loading={cancelBusy}>Cancel at period end</Button>
          </>}
        >
          <p className="text-[13px] text-charcoal mb-3">
            You'll keep full access to <strong>{entitlements?.currentPlanName}</strong> until{' '}
            {current && new Date(current.currentPeriodEnd).toDateString()}, then{' '}
            {current?.legacyFreeEligible
              ? 'your store moves to the free plan.'
              : 'selling will be paused until you choose a new plan.'}
            {' '}You can reactivate any time before that.
          </p>
          <label className="block text-[11.5px] font-medium text-slate mb-1.5">Reason (optional — helps us improve)</label>
          <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Too expensive, missing a feature, switching platforms…" />
          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}

    </>
  );
}
