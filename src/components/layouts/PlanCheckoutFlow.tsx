import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import {
  apiBrowsePlatformPlans, apiChangePlatformPlan, apiGetOnboardingProgress, apiGetPublicTrialSettings,
  type PlatformPlan,
} from '@/api/services/platformPlans';
import { OnboardingCheckoutPage, OnboardingPlansPage } from '@/features/auth/pages/onboard/OnboardingCheckout';
import { pickCheckoutPlan, type OnboardingBilling } from '@/features/auth/pages/onboard/onboardingPlans';

// The Shopify-style "select a plan" sheet + Stripe checkout, pointed at an
// EXISTING store. Used in two places:
//   • TrialExpiredGate (StoreLayout) — blocking full page once a trial ends;
//     starts on the plans sheet, no close button.
//   • Billing Center (StorePlanBilling) — opened over the page when a seller picks
//     a paid plan that needs a card (no card yet / still on trial / on the free
//     plan); starts straight on the checkout for that plan, closable.
// Paying calls the same change-plan endpoint the old confirm modal used
// (billImmediately: true), then reloads so every part of the workspace (sidebar
// card, banners, entitlements, billing tab) picks up the new plan.
export default function PlanCheckoutFlow({
  storeId, title, initialPlanId, initialBilling = 'monthly', onClose,
}: {
  storeId: string;
  /** Heading on the plans sheet. */
  title?: string;
  /** Skip the plans sheet and open the checkout for this plan. */
  initialPlanId?: string;
  initialBilling?: OnboardingBilling;
  /** Omit for a blocking gate (nothing to go back to). */
  onClose?: () => void;
}) {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [trialDays, setTrialDays] = useState(3);
  // null until we know whether the seller already has a card saved, so the
  // checkout can offer one-click "Subscribe" instead of asking for it again.
  const [cardOnFile, setCardOnFile] = useState<boolean | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId ?? null);
  const [billing, setBilling] = useState<OnboardingBilling>(initialBilling);
  const [view, setView] = useState<'plans' | 'checkout'>(initialPlanId ? 'checkout' : 'plans');
  const [paidPlanId, setPaidPlanId] = useState<string | null>(null);
  // Bumped after every failed charge so a retry gets a fresh Stripe idempotency
  // key (a reused key would just replay the failed response).
  const chargeAttempt = useRef(0);

  useEffect(() => {
    apiBrowsePlatformPlans().then(res => setPlans(res.data)).catch(() => {});
    apiGetPublicTrialSettings().then(res => setTrialDays(res.data.durationDays)).catch(() => {});
    apiGetOnboardingProgress()
      .then(res => setCardOnFile(!!res.data.hasPlatformPaymentMethod))
      .catch(() => setCardOnFile(false));
  }, []);

  const interval = billing === 'annual' ? 'yearly' : 'monthly';

  const subscribe = async (planId: string) => {
    try {
      await apiChangePlatformPlan(storeId, planId, interval, true,
        `platform-plan-checkout-${storeId}-${planId}-${interval}-${chargeAttempt.current}`);
    } catch (err) {
      chargeAttempt.current += 1;
      throw new Error(err instanceof Error && err.message ? err.message : 'Your card was declined — please try again or use a different card.', { cause: err });
    }
    setPaidPlanId(planId);
  };

  // "Continue" on the checkout: after a paid plan the charge already happened;
  // a free plan has no card step, so it's applied here. Then reload.
  const finish = async () => {
    const plan = pickCheckoutPlan(plans, selectedPlanId);
    if (plan && plan.isFree && paidPlanId !== plan._id) {
      try { await apiChangePlatformPlan(storeId, plan._id, 'monthly', true, `platform-plan-checkout-${storeId}-${plan._id}-free`); }
      catch { return; }
    }
    window.location.reload();
  };

  if (cardOnFile === null) {
    return (
      <div className="fixed inset-0 z-[70] bg-cream flex items-center justify-center">
        <Loader2 size={24} className="text-brand-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70]">
      {view === 'checkout' && (
        <OnboardingCheckoutPage
          plans={plans}
          selectedPlanId={selectedPlanId}
          billing={billing}
          paidPlanId={paidPlanId}
          trialDurationDays={trialDays}
          hasCardOnFile={cardOnFile}
          onSubscribe={subscribe}
          onContinue={finish}
          onViewPlans={() => setView('plans')}
          onBack={() => setView('plans')}
        />
      )}
      <AnimatePresence>
        {view === 'plans' && (
          <OnboardingPlansPage
            key="plan-flow-plans"
            title={title}
            plans={plans}
            selectedPlanId={selectedPlanId}
            billing={billing}
            onBillingChange={setBilling}
            onSelect={planId => { setSelectedPlanId(planId); setView('checkout'); }}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
