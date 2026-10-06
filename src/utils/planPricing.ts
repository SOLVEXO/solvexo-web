import type { PlatformPlan } from '../api/services/platformPlans';

type Priced = Pick<PlatformPlan, 'monthlyPriceUSD' | 'yearlyPriceUSD' | 'isFree' | 'isCustomPricing'>;

/** Yearly price of a plan; falls back to 12 x monthly (the same fallback the backend charges). */
export function yearlyTotal(plan: Priced): number {
  return plan.yearlyPriceUSD ?? Math.round((plan.monthlyPriceUSD ?? 0) * 12 * 100) / 100;
}

/** What a yearly plan costs per month, to the cent (Shopify shows "$19/month, billed yearly"). */
export function yearlyMonthlyEquivalent(plan: Priced): number {
  return Math.round((yearlyTotal(plan) / 12) * 100) / 100;
}

/** "$7.50" / "$49" — drops the cents only when they are zero. */
export function formatUsd(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Whole-percent discount a yearly plan gives vs paying monthly for 12 months, or 0 when there is none. */
export function yearlySavingsPercent(plan: Priced): number {
  const m = plan.monthlyPriceUSD ?? 0;
  if (plan.isFree || plan.isCustomPricing || m <= 0) return 0;
  const pct = (1 - yearlyTotal(plan) / (m * 12)) * 100;
  return pct > 0 ? Math.round(pct) : 0;
}

/** The headline "Save N%" for a billing toggle: the best discount across the visible paid plans (0 = show nothing). */
export function maxYearlySavingsPercent(plans: Priced[]): number {
  return plans.reduce((best, p) => Math.max(best, yearlySavingsPercent(p)), 0);
}
