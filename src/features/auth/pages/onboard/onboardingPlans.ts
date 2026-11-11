import type { PlatformPlan } from '@/api/services/platformPlans';
import type { SiteLang } from '@/i18n/site/siteLanguage';

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

/** Arabic names of the four core plans, by the plan's stable `key`. */
const PLAN_NAME_AR: Record<string, string> = { basic: 'الأساسية', grow: 'النمو', advanced: 'المتقدمة', enterprise: 'المؤسسات' };

/** The plan's name in the page language — the API's own name for any plan without a known key, and always in English. */
export function planDisplayName(plan: Pick<PlatformPlan, 'key' | 'name'>, lang: SiteLang): string {
  if (lang !== 'ar') return plan.name;
  return (plan.key && PLAN_NAME_AR[plan.key.toLowerCase()]) || plan.name;
}
