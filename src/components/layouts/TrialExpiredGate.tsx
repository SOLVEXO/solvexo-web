import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  apiBrowsePlatformPlans, apiChangePlatformPlan, apiGetPublicTrialSettings,
  type PlatformPlan,
} from '@/api/services/platformPlans';
import { OnboardingCheckoutPage, OnboardingPlansPage } from '@/features/auth/pages/onboard/OnboardingCheckout';
import { pickCheckoutPlan, type OnboardingBilling } from '@/features/auth/pages/onboard/onboardingPlans';

// Shopify's "Your trial has expired. Select a plan." — a blocking full-screen
// page shown over a store workspace whose trial ended (or that is locked). It
// reuses the onboarding plans sheet and Stripe checkout exactly as they are,
// only pointed at THIS existing store: picking a plan opens the checkout, and
// paying it calls the same mid-trial change-plan endpoint the Billing Center
// uses (billImmediately: true). Once paid the page reloads so every part of
// the workspace (sidebar card, banner, entitlements) picks up the new plan.
export default function TrialExpiredGate({ storeId }: { storeId: string }) {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [trialDays, setTrialDays] = useState(3);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billing, setBilling] = useState<OnboardingBilling>('monthly');
  const [view, setView] = useState<'plans' | 'checkout'>('plans');
  const [paidPlanId, setPaidPlanId] = useState<string | null>(null);
  // Bumped after every failed charge so a retry gets a fresh Stripe idempotency
  // key (a reused key would just replay the failed response).
  const chargeAttempt = useRef(0);

  useEffect(() => {
    apiBrowsePlatformPlans().then(res => setPlans(res.data)).catch(() => {});
    apiGetPublicTrialSettings().then(res => setTrialDays(res.data.durationDays)).catch(() => {});
  }, []);

  const interval = billing === 'annual' ? 'yearly' : 'monthly';

  const subscribe = async (planId: string) => {
    try {
      await apiChangePlatformPlan(storeId, planId, interval, true,
        `platform-plan-gate-${storeId}-${planId}-${chargeAttempt.current}`);
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
      try { await apiChangePlatformPlan(storeId, plan._id, 'monthly', true, `platform-plan-gate-${storeId}-${plan._id}-free`); }
      catch { return; }
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {view === 'checkout' && (
        <OnboardingCheckoutPage
          plans={plans}
          selectedPlanId={selectedPlanId}
          billing={billing}
          paidPlanId={paidPlanId}
          trialDurationDays={trialDays}
          onSubscribe={subscribe}
          onContinue={finish}
          onViewPlans={() => setView('plans')}
          onBack={() => setView('plans')}
        />
      )}
      <AnimatePresence>
        {view === 'plans' && (
          <OnboardingPlansPage
            key="gate-plans"
            title="Your trial has expired. Select a plan."
            plans={plans}
            selectedPlanId={selectedPlanId}
            billing={billing}
            onBillingChange={setBilling}
            onSelect={planId => { setSelectedPlanId(planId); setView('checkout'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
