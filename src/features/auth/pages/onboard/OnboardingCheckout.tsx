import { useState, useEffect, Fragment } from 'react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, AlertTriangle, Check, ChevronDown, CreditCard, Globe, Loader2, Minus, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import {
  apiCreateOnboardingSetupIntent, apiConfirmOnboardingPaymentMethod,
  type PlatformPlan,
} from '@/api/services/platformPlans';
import { StripeCardSetup, isStripeConfigured } from './StripeCardSetup';
import { selectablePlans as selectable, pickCheckoutPlan, type OnboardingBilling } from './onboardingPlans';

/** Same-day-next-month arithmetic, clamped so Jan 31 + 1 month is Feb 28/29, not Mar 3. */
function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  r.setDate(Math.min(d.getDate(), new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()));
  return r;
}
const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Shopify-style checkout: dark panel (plan + offer) left, card form right ────
// Real full-viewport page outside the wizard's split layout. Submitting the
// card charges it immediately — `onSubscribe` (owned by OnboardingPage) creates
// the store if it doesn't exist yet and buys the plan with billImmediately.
export function OnboardingCheckoutPage({
  plans, selectedPlanId, billing, paidPlanId, trialDurationDays,
  onSubscribe, onContinue, onStartTrial, onViewPlans, onBack,
}: {
  plans: PlatformPlan[]; selectedPlanId: string | null; billing: OnboardingBilling;
  paidPlanId: string | null; trialDurationDays: number;
  /** Charges the plan now. Throws an Error whose message is shown to the seller. */
  onSubscribe: (planId: string) => Promise<void>;
  onContinue: () => void; onStartTrial?: () => void; onViewPlans: () => void; onBack?: () => void;
}) {
  const plan = pickCheckoutPlan(plans, selectedPlanId);
  const stripeReady = isStripeConfigured();
  const [clientSecret, setClientSecret] = useState('');
  const [intentError, setIntentError] = useState('');
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  // True once Stripe + our backend confirmed a card for this seller — a failed
  // charge can then be retried without re-typing the card.
  const [cardOnFile, setCardOnFile] = useState(false);
  const paid = !!plan && paidPlanId === plan._id;
  const needsCardForm = !!plan && !plan.isFree && !paid && !cardOnFile;

  useEffect(() => {
    if (!stripeReady || !needsCardForm) return;
    let cancelled = false;
    apiCreateOnboardingSetupIntent()
      .then(res => { if (!cancelled) setClientSecret(res.data.clientSecret); })
      .catch(() => { if (!cancelled) setIntentError('Could not load the card form right now — try again, or start with the free trial instead.'); });
    return () => { cancelled = true; };
  }, [stripeReady, needsCardForm]);

  const charge = async () => {
    if (!plan) return;
    setPaying(true); setPayError('');
    try {
      await onSubscribe(plan._id);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed — please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleConfirmed = async (setupIntentId: string) => {
    setPaying(true); setPayError('');
    try {
      await apiConfirmOnboardingPaymentMethod(setupIntentId);
      setCardOnFile(true);
    } catch {
      setPayError('We saved your card with Stripe, but could not confirm it on our side — try again.');
      setPaying(false);
      return;
    }
    setPaying(false);
    await charge();
  };

  const yearly = billing === 'annual';
  const monthly = plan?.monthlyPriceUSD ?? 0;
  const yearlyTotal = plan?.yearlyPriceUSD ?? monthly * 12;
  const hasIntro = !!plan && !yearly && plan.introOfferEnabled && plan.introPriceUSD != null && plan.introDurationCycles != null;
  const cycles = plan?.introDurationCycles ?? 0;
  const dueToday = !plan ? 0 : yearly ? yearlyTotal : hasIntro ? plan.introPriceUSD! : monthly;
  const payLabel = `Subscribe for $${dueToday} USD`;

  // Real dates, computed from today — what the seller would actually be billed
  // if they subscribed right now (same anchor the backend's monthly cycle uses).
  const today = new Date();
  const introEnd = addMonths(today, cycles);
  const nextCharge = yearly ? addMonths(today, 12) : addMonths(today, 1);
  const schedule: { when: string; what: string }[] = !plan || plan.isFree ? [] : yearly
    ? [{ when: 'Today', what: `$${yearlyTotal}` }, { when: fmtDate(nextCharge), what: `$${yearlyTotal}/yr, renews yearly` }]
    : hasIntro
      ? [
          ...Array.from({ length: cycles }, (_, i) => ({ when: i === 0 ? 'Today' : fmtDate(addMonths(today, i)), what: `$${plan.introPriceUSD}` })),
          { when: fmtDate(introEnd), what: `$${monthly}/mo, then every month` },
        ]
      : [{ when: 'Today', what: `$${monthly}` }, { when: fmtDate(nextCharge), what: `$${monthly}/mo, then every month` }];
  const firstFullCharge = hasIntro ? introEnd : nextCharge;

  const headline = !plan ? 'Start your free trial'
    : plan.isFree ? `Start on ${plan.name}`
    : hasIntro ? `Start ${plan.name} for $${plan.introPriceUSD}` : `Start on ${plan.name}`;
  const subline = !plan ? `Full platform access for ${trialDurationDays} days — no card needed.`
    : plan.isFree ? 'Free forever — active immediately, no trial.'
    : yearly ? `Pay $${yearlyTotal}/year — renews ${fmtDate(nextCharge)}.`
    : hasIntro ? `Pay $${plan.introPriceUSD}/month until ${fmtDate(introEnd)}.`
    : `Pay $${monthly}/month — next charge ${fmtDate(nextCharge)}.`;

  return (
    <div className="fixed inset-0 z-50 bg-cream overflow-y-auto" data-lenis-prevent>
      <div className="px-6 md:px-8 pt-6 flex items-center justify-between">
        <SolvexoLogo size={34} variant="dark" />
        {onBack && <button type="button" onClick={onBack} disabled={paying || !!paidPlanId}
          className="text-[12.5px] font-semibold text-slate hover:text-carbon disabled:opacity-40 inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer">
          <ArrowLeft size={13} /> Back
        </button>}
      </div>

      <div className="max-w-[980px] mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="grid md:grid-cols-2 md:h-[510px] md:p-2 md:pl-0 rounded-[26px] overflow-hidden border border-bone bg-gradient-to-br from-carbon via-[#241f1b] to-brand-deep-orange">
          {/* Left — plan + offer */}
          <div className="p-8 md:p-10 flex flex-col min-h-[320px]">
            <h1 className="text-[32px] md:text-[40px] leading-[1.08] font-normal tracking-[-0.02em] text-white mb-6 max-w-[440px]">{headline}</h1>
            <p className="text-[16px] text-white/85 mb-2">{subline}</p>
            <p className="text-[16px] text-white/85">No commitment, cancel anytime.</p>

            {schedule.length > 0 && (
              <ol className="mt-8 max-w-[360px]">
                {schedule.map((s, i) => (
                  <li key={i} className="relative flex items-baseline justify-between gap-6 pl-6 pb-5 last:pb-0 text-[14px]">
                    {/* timeline: dot per charge, hairline between them */}
                    <span className={clsx('absolute left-0 top-[7px] size-[9px] rounded-full', i === 0 ? 'bg-brand-orange' : 'bg-white/30')} />
                    {i < schedule.length - 1 && <span className="absolute left-[4px] top-[20px] bottom-[-2px] w-px bg-white/15" />}
                    <span className={i === 0 ? 'text-white' : 'text-white/60'}>{s.when}</span>
                    <span className={clsx('text-right', i === 0 ? 'text-white' : 'text-white/60')}>{s.what}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-auto pt-10">
              <button type="button" onClick={onViewPlans} disabled={paying || !!paidPlanId}
                className="text-[15px] font-semibold text-white underline underline-offset-4 bg-transparent border-0 cursor-pointer p-0 disabled:opacity-40">
                View all plans
              </button>
            </div>
          </div>

          {/* Right — payment */}
          <div className="bg-white rounded-[18px] p-6 md:px-7 md:py-4 flex flex-col justify-start md:overflow-y-auto">
            {plan && !plan.isFree && !paid && onStartTrial && (
              <div className="flex justify-end mb-2">
                <button type="button" onClick={onStartTrial} disabled={paying}
                  className="text-[12.5px] font-semibold text-slate hover:text-carbon disabled:opacity-40 bg-transparent border-0 cursor-pointer p-0">
                  Skip — start free {trialDurationDays}-day trial instead
                </button>
              </div>
            )}
            {plan && !plan.isFree && plan.limits.customDomainAllowed && (
              <div className="mb-2 rounded-xl bg-brand-pale-orange">
                <button type="button" onClick={() => setDomainOpen(o => !o)} aria-expanded={domainOpen}
                  className="w-full flex items-center gap-[10px] px-[14px] py-[8px] bg-transparent border-0 cursor-pointer text-left">
                  <Globe size={16} className="shrink-0 text-brand-deep-orange" />
                  <span className="flex-1 text-[13.5px] text-carbon">Includes custom domain</span>
                  <ChevronDown size={16} className={clsx('shrink-0 text-carbon transition-transform duration-300 ease-out', domainOpen && 'rotate-180')} />
                </button>
                {/* grid-rows 0fr → 1fr animates to the content's real height — a smooth
                    open/close with no fixed max-height guess. */}
                <div className={clsx(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  domainOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}>
                  <div className="overflow-hidden">
                    <p className="px-[14px] pb-3 text-[12.5px] text-charcoal leading-[1.5]">
                      Connect your own domain (like yourbrand.com) to your store — included with {plan.name}.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!plan ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-cream px-[14px] py-[12px] text-[13px] text-slate">
                  <CreditCard size={14} className="shrink-0" /> No paid plans are available right now.
                </div>
                {onStartTrial && <Button variant="primary" size="lg" fullWidth onClick={onStartTrial}>
                  Start free {trialDurationDays}-day trial <ArrowRight size={14} className="inline align-middle ml-1" />
                </Button>}
              </div>
            ) : plan.isFree ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-success-bg px-[14px] py-[12px]">
                  <ShieldCheck size={16} className="text-success shrink-0" />
                  <p className="text-[12.5px] text-success">{plan.name} is free — no card needed.</p>
                </div>
                <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
                  Continue <ArrowRight size={14} className="inline align-middle ml-1" />
                </Button>
              </div>
            ) : paid ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-success-bg px-[14px] py-[12px]">
                  <ShieldCheck size={16} className="text-success shrink-0" />
                  <p className="text-[12.5px] text-success">Payment successful — you're on {plan.name}.</p>
                </div>
                <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
                  Continue <ArrowRight size={14} className="inline align-middle ml-1" />
                </Button>
              </div>
            ) : !stripeReady ? (
              <div className="flex items-center gap-2 rounded-lg bg-cream px-[14px] py-[12px] text-[12.5px] text-slate">
                <CreditCard size={14} className="shrink-0" /> Card setup isn't available right now — start with the free trial instead.
              </div>
            ) : cardOnFile ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-cream px-[14px] py-[12px] text-[12.5px] text-carbon">
                  <CreditCard size={14} className="shrink-0 text-brand-orange" /> Card saved — ready to charge.
                </div>
                {payError && (
                  <div className="flex items-start gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] text-[12.5px] text-error">
                    <AlertTriangle size={14} className="shrink-0 mt-[2px]" /> {payError}
                  </div>
                )}
                <Button variant="primary" size="lg" fullWidth loading={paying} onClick={charge}>{payLabel}</Button>
                <button type="button" disabled={paying} onClick={() => { setClientSecret(''); setIntentError(''); setCardOnFile(false); setPayError(''); }}
                  className="text-[12.5px] font-semibold text-slate hover:text-carbon bg-transparent border-0 cursor-pointer">
                  Use a different card
                </button>
              </div>
            ) : intentError ? (
              <div className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] text-[12.5px] text-error">
                <AlertTriangle size={14} className="shrink-0" /> {intentError}
              </div>
            ) : clientSecret ? (
              <div>
                <StripeCardSetup
                  clientSecret={clientSecret}
                  onConfirmed={handleConfirmed}
                  submitLabel={payLabel}
                  footnote="Secured by Stripe — your card is charged right away"
                />
                {paying && <p className="text-[11px] text-slate mt-2 text-center">Processing payment…</p>}
                {payError && (
                  <div className="flex items-start gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] text-[12.5px] text-error mt-3">
                    <AlertTriangle size={14} className="shrink-0 mt-[2px]" /> {payError}
                  </div>
                )}
                <p className="text-[11px] text-slate text-center leading-[1.5] mt-2">
                  By subscribing, you agree to be charged ${yearly ? `${yearlyTotal}/yr` : `${monthly}/mo`} ({plan.name}) + taxes
                  starting on {fmtDate(firstFullCharge)}. Cancel anytime in Settings.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={22} className="text-brand-orange animate-spin" />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ── "View all plans" — Shopify-style: plan columns on top, "Compare plans" grid below ──
type Cell = string | boolean | null;
const num = (v: number | undefined, suffix = ''): Cell => v === undefined ? null : v < 0 ? 'Unlimited' : `${v}${suffix}`;
const flag = (v: boolean | undefined): Cell => v === undefined ? null : v;

const COMPARE: { group: string; rows: { label: string; get: (p: PlatformPlan) => Cell }[] }[] = [
  { group: 'Pricing', rows: [
    { label: 'Pay monthly', get: p => p.isFree ? 'Free' : `$${p.monthlyPriceUSD ?? 0}/mo` },
    { label: 'Pay yearly', get: p => p.isFree ? 'Free' : `$${Math.round((p.yearlyPriceUSD ?? (p.monthlyPriceUSD ?? 0) * 12) / 12)}/mo` },
  ] },
  { group: 'Core features', rows: [
    { label: 'Products', get: p => num(p.limits.maxProducts) },
    { label: 'Staff accounts', get: p => num(p.limits.maxStaffAccounts) },
    { label: 'POS locations', get: p => num(p.limits.maxPosLocations) },
    { label: 'Selling markets (currencies)', get: p => num(p.limits.maxMarkets) },
    { label: 'AI credits per month', get: p => num(p.limits.aiCreditsPerMonth) },
    { label: 'Subscription products', get: p => flag(p.limits.subscriptionProductsAllowed) },
    { label: 'Live carrier shipping rates', get: p => flag(p.limits.calculatedShippingRatesAllowed) },
  ] },
  { group: 'Marketing & growth', rows: [
    { label: 'Email campaigns', get: p => flag(p.limits.emailCampaignsAllowed) },
    { label: 'Abandoned checkout recovery', get: p => flag(p.limits.abandonedCartRecoveryAllowed) },
    { label: 'Loyalty program', get: p => flag(p.limits.loyaltyProgramAllowed) },
    { label: 'Active promotions', get: p => num(p.limits.maxActivePromotions) },
    { label: 'Active store banners', get: p => num(p.limits.maxActiveStoreBanners) },
    { label: 'Advanced SEO tools', get: p => flag(p.limits.advancedSeoToolsAllowed) },
    { label: 'Advanced analytics', get: p => flag(p.limits.advancedAnalyticsAllowed) },
  ] },
  { group: 'Customization', rows: [
    { label: 'Custom domain', get: p => flag(p.limits.customDomainAllowed) },
    { label: 'White label', get: p => flag(p.limits.whiteLabelAllowed) },
    { label: 'API & webhooks', get: p => flag(p.limits.apiWebhooksAllowed) },
    { label: 'Custom redirects', get: p => flag(p.limits.customRedirectsAllowed) },
  ] },
  { group: 'Support', rows: [
    { label: 'Priority support', get: p => flag(p.limits.prioritySupport) },
    { label: 'Dedicated account manager', get: p => flag(p.limits.dedicatedAccountManager) },
    { label: 'Uptime SLA', get: p => p.limits.slaUptimePercent ? `${p.limits.slaUptimePercent}%` : null },
  ] },
];

function CellView({ v }: { v: Cell }) {
  if (v === true) {
    return (
      <span className="inline-flex size-[24px] items-center justify-center rounded-full bg-success">
        <Check size={14} strokeWidth={3} className="text-white" />
      </span>
    );
  }
  if (v === false || v === null) return <Minus size={18} className="text-slate/50" />;
  return <span className="text-carbon">{v}</span>;
}

// Shopify's "Select a plan" page, in Solvexo's theme: a dark bar on top, a big
// rounded sheet below it holding the plan cards (one card per plan) and, under
// them, the "Compare plans" table — bare rows, a sticky header with the select
// buttons, filled check marks. Only the actions use Solvexo orange.
export function OnboardingPlansPage({ plans, selectedPlanId, billing, onBillingChange, onSelect, onClose, title = 'Select a plan' }: {
  plans: PlatformPlan[]; selectedPlanId: string | null;
  billing: OnboardingBilling; onBillingChange: (b: OnboardingBilling) => void;
  onSelect: (planId: string) => void;
  /** Omit to hide the close button (a blocking gate has nothing to go back to). */
  onClose?: () => void; title?: string;
}) {
  const list = selectable(plans);
  const current = pickCheckoutPlan(plans, selectedPlanId)?._id ?? null;
  // One label column + one column per plan — shared by the sticky header and every row.
  const cols = { gridTemplateColumns: `minmax(0,1.6fr) repeat(${list.length}, minmax(0,1fr))` };

  const introOf = (p: PlatformPlan) =>
    billing === 'monthly' && !p.isFree && p.introOfferEnabled && p.introPriceUSD != null && p.introDurationCycles != null
      ? { price: p.introPriceUSD, cycles: p.introDurationCycles } : null;

  const pickLabel = (p: PlatformPlan) => current === p._id ? `Continue with ${p.name}` : p.isFree ? 'Choose Free' : `Select ${p.name}`;
  const btn = 'rounded-full bg-brand-orange text-white font-semibold cursor-pointer border-0 transition-colors duration-200 hover:bg-brand-deep-orange';

  // `data-lenis-prevent` — this page renders `fixed`, outside RootLayout's flow,
  // so Lenis would otherwise swallow wheel/touch events instead of letting the
  // sheet's own `overflow-y-auto` scroll.
  return (
    // Slides up from the bottom over the checkout (and back down on close) —
    // the parent keeps the checkout mounted underneath and wraps this in
    // AnimatePresence so the exit animation plays too.
    <motion.div
      className="fixed inset-0 z-[60] bg-carbon"
      data-lenis-prevent
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="h-16 px-6 md:px-8 flex items-center">
        <SolvexoLogo size={32} variant="light" />
      </div>

      <div className="absolute inset-x-0 top-16 bottom-0 bg-cream rounded-t-[28px] overflow-y-auto scroll-smooth">
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close"
            className="fixed right-3 md:right-5 top-[84px] z-40 size-10 rounded-full bg-white border border-bone hover:bg-bone text-carbon flex items-center justify-center cursor-pointer transition-colors duration-200">
            <X size={18} />
          </button>
        )}

        <motion.div
          className="px-4 md:px-[88px] pt-10 pb-20 max-w-[1360px] mx-auto"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[26px] md:text-[34px] font-semibold tracking-[-0.01em] text-carbon text-center mb-6">{title}</h1>

          {list.some(p => !p.isFree) && (
            <div className="flex justify-center mb-8">
              <div className="relative inline-grid grid-cols-2 bg-white border border-bone rounded-full p-1" role="group" aria-label="Billing interval">
                {/* sliding pill */}
                <span
                  className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-brand-orange transition-transform duration-300 ease-out"
                  style={{ transform: billing === 'annual' ? 'translateX(100%)' : 'translateX(0)' }}
                />
                {(['monthly', 'annual'] as const).map(b => (
                  <button key={b} type="button" onClick={() => onBillingChange(b)} aria-pressed={billing === b}
                    className="relative z-10 px-7 py-2 rounded-full cursor-pointer flex items-center justify-center gap-[6px] border-0 bg-transparent">
                    <span className={clsx('text-[13px] capitalize transition-colors duration-300', billing === b ? 'font-semibold text-white' : 'font-medium text-slate')}>{b}</span>
                    {b === 'annual' && <span className={clsx('text-[10px] font-semibold transition-colors duration-300', billing === b ? 'text-white/90' : 'text-success')}>Save 20%</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* One card per plan */}
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
            {list.map(p => {
              const intro = introOf(p);
              const monthly = p.monthlyPriceUSD ?? 0;
              const annual = billing === 'annual';
              const yearlyTotal = p.yearlyPriceUSD ?? monthly * 12;
              const perMonth = annual ? Math.round(yearlyTotal / 12) : monthly;
              return (
                <div key={p._id} className={clsx(
                  'flex flex-col rounded-2xl bg-white border p-5',
                  current === p._id ? 'border-brand-orange' : 'border-bone',
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[18px] font-semibold text-carbon leading-tight">{p.name}</p>
                    {intro && (
                      <span className="shrink-0 text-[11px] font-medium text-success bg-success-bg rounded-full px-[9px] py-[3px]">
                        {intro.cycles}-month offer
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-slate mt-1 mb-4 min-h-[36px] leading-[1.4]">{p.description ?? ' '}</p>
                  <div className="flex items-baseline gap-[6px] mb-1">
                    {intro && <span className="text-[15px] text-slate line-through">${monthly}</span>}
                    <span className="text-[26px] font-semibold text-carbon leading-none">{p.isFree ? 'Free' : `$${intro ? intro.price : perMonth}`}</span>
                    {!p.isFree && <span className="text-[12px] text-slate">/mo</span>}
                  </div>
                  <p className="text-[12px] text-slate mb-4 min-h-[16px]">
                    {p.isFree ? ' ' : intro ? `for ${intro.cycles} month${intro.cycles === 1 ? '' : 's'}, then $${monthly}/mo` : annual ? `billed $${yearlyTotal} yearly` : ' '}
                  </p>
                  <button type="button" onClick={() => onSelect(p._id)} className={clsx(btn, 'w-full py-[11px] text-[14px] mb-5')}>
                    {pickLabel(p)}
                  </button>
                  <ul className="flex flex-col gap-[9px]">
                    {(p.featureBullets ?? []).slice(0, 5).map(f => (
                      <li key={f} className="text-[13px] text-charcoal leading-[1.4]">{f}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Compare plans — straight on the sheet, no card around it */}
          <div className="mt-14">
            <div className="sticky top-0 z-20 -mx-4 md:-mx-[88px] px-4 md:px-[88px] bg-cream border-b border-bone">
              <div className="grid items-center gap-x-7 gap-y-4 py-4" style={cols}>
                <h2 className="text-[20px] md:text-[26px] font-semibold tracking-[-0.01em] text-carbon">Compare plans</h2>
                {list.map(p => (
                  <button key={p._id} type="button" onClick={() => onSelect(p._id)}
                    className={clsx(btn, 'w-full py-[9px] md:py-[10px] px-2 text-[12px] md:text-[14px] truncate')}>
                    {pickLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {COMPARE.map(g => (
              <Fragment key={g.group}>
                <div className="pt-10 pb-4 text-[17px] font-medium text-carbon">{g.group}</div>
                {g.rows.map(r => (
                  <div key={r.label} className="grid items-center gap-x-7 py-[21px] border-t border-bone text-[14px] md:text-[16px] text-charcoal" style={cols}>
                    <span className="pr-2">{r.label}</span>
                    {list.map(p => <span key={p._id} className="flex justify-center text-center"><CellView v={r.get(p)} /></span>)}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>

          <p className="mt-14 text-[12px] text-slate leading-[1.6] max-w-[900px]">
            All prices are in USD and exclude taxes. Intro offers apply to the first billing months shown, after which the regular monthly price applies. You can change or cancel your plan any time from Billing.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
