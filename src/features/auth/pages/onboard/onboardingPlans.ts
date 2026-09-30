import type { PlatformPlan } from '@/api/services/platformPlans';

export type OnboardingBilling = 'monthly' | 'annual';

/** Plans a seller can actually pick (custom-priced ones are contact-sales), in display order. */
export const selectablePlans = (plans: PlatformPlan[]) =>
  plans.filter(p => !p.isCustomPricing).sort((a, b) => a.sortOrder - b.sortOrder);

/** The plan the checkout shows: the seller's pick, else the cheapest paid plan
 *  (Shopify pre-selects a plan the same way) — null if only free plans exist. */
export function pickCheckoutPlan(plans: PlatformPlan[], selectedPlanId: string | null): PlatformPlan | null {
  const list = selectablePlans(plans);
  return list.find(p => p._id === selectedPlanId) ?? list.find(p => !p.isFree) ?? null;
}
