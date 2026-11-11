import type { PlatformPlan, PlatformPlanLimits } from '@/api/services/platformPlans';
import { yearlyMonthlyEquivalent, yearlyTotal } from '@/utils/planPricing';

/** One plan-card line in plain words, with an optional short explanation underneath. */
export interface PlanFeature { title: string; hint?: string }

const unlimited = (n?: number) => n !== undefined && n !== null && n < 0;
const more = (n?: number, prev?: number) => n !== undefined && n !== null && n !== 0 && (prev === undefined || prev === null || unlimited(n) ? !unlimited(prev) : n > prev);
const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/**
 * The plan card's feature list, written for a first-time seller rather than in platform terms.
 * Built from the plan's REAL limits (the same ones the backend enforces), so the page can't promise
 * more than a plan gives. With `prev` (the tier below), only what is new or bigger is listed —
 * the card shows "Everything in <prev>, plus".
 */
export function planFeatures(plan: PlatformPlan, prev?: PlatformPlan | null): PlanFeature[] {
  const l: PlatformPlanLimits = plan.limits ?? {};
  const p: PlatformPlanLimits = prev?.limits ?? {};
  const first = !prev;
  const on = (k: keyof PlatformPlanLimits) => !!l[k] && (first || !p[k]);
  const out: PlanFeature[] = [];

  if (more(l.maxProducts, p.maxProducts)) out.push({ title: unlimited(l.maxProducts) ? 'Unlimited products' : `Sell up to ${plural(l.maxProducts!, 'product', 'products')}` });
  if (more(l.maxStaffAccounts, p.maxStaffAccounts)) {
    out.push(unlimited(l.maxStaffAccounts) ? { title: 'Unlimited staff logins' }
      : { title: first ? `${plural(l.maxStaffAccounts!, 'extra staff login', 'extra staff logins')}` : plural(l.maxStaffAccounts!, 'staff login', 'staff logins'), hint: first ? 'Let a helper manage orders' : undefined });
  }
  if (more(l.maxPosLocations, p.maxPosLocations)) {
    out.push({ title: unlimited(l.maxPosLocations) ? 'Unlimited locations'
      : l.maxPosLocations === 1 ? '1 shop location with the POS till' : `${l.maxPosLocations} shop / warehouse locations` });
  }
  if (more(l.aiCreditsPerMonth, p.aiCreditsPerMonth)) {
    out.push({ title: unlimited(l.aiCreditsPerMonth) ? 'Unlimited AI credits' : `${l.aiCreditsPerMonth!.toLocaleString('en-US')} AI credits a month`, hint: first ? 'AI Studio: product text, SEO, emails and price ideas. Renews monthly.' : undefined });
  }
  if (on('abandonedCartRecoveryAllowed')) out.push({ title: 'Recover abandoned carts', hint: 'Remind shoppers who leave without paying' });
  if (on('loyaltyProgramAllowed')) out.push({ title: 'Loyalty points', hint: 'Bring customers back for more' });
  if (on('whiteLabelAllowed')) out.push({ title: 'Remove Solvexo branding', hint: 'Your brand only, everywhere' });
  if (on('calculatedShippingRatesAllowed')) out.push({ title: 'Live courier rates at checkout' });
  if (on('customDomainAllowed')) out.push({ title: 'Your own web address', hint: 'e.g. yourshop.com' });
  if (on('emailCampaignsAllowed')) out.push({ title: 'Email marketing', hint: 'Send offers and automatic emails' });
  if (on('advancedSeoToolsAllowed')) out.push({ title: 'SEO tools', hint: 'Help Google find your store' });
  if (on('seoAiSuggestionsAllowed')) out.push({ title: 'AI SEO suggestions' });
  if (on('customRedirectsAllowed')) out.push({ title: 'Custom redirects', hint: 'Keep old links working' });
  if (on('searchConsoleIntegrationAllowed')) out.push({ title: 'Google Search Console connection' });

  // Sales/promotions and homepage banners are unlimited on every plan, so they are not a plan feature any more.
  if (more(l.monthlyEmailSends, p.monthlyEmailSends)) {
    out.push({ title: unlimited(l.monthlyEmailSends) ? 'Unlimited marketing emails' : `${l.monthlyEmailSends!.toLocaleString('en-US')} marketing emails a month`, hint: first ? 'Offers, newsletters and automatic emails' : undefined });
  }
  if (l.b2bWholesaleAllowed) {
    const catalogs = unlimited(l.maxB2BCatalogs) ? 'Unlimited wholesale catalogs' : l.maxB2BCatalogs ? plural(l.maxB2BCatalogs, 'wholesale catalog', 'wholesale catalogs') : null;
    if (on('b2bWholesaleAllowed')) out.push({ title: 'B2B wholesale prices', hint: catalogs ?? undefined });
    else if (catalogs && more(l.maxB2BCatalogs, p.maxB2BCatalogs)) out.push({ title: catalogs });
  }
  const digital = ([['digitalMembershipsAllowed', 'memberships'], ['digitalLicensesAllowed', 'license keys'], ['digitalCoursesAllowed', 'courses']] as const)
    .filter(([k]) => on(k)).map(([, label]) => label);
  if (digital.length) {
    const text = digital.length === 1 ? digital[0] : `${digital.slice(0, -1).join(', ')} & ${digital[digital.length - 1]}`;
    out.push({ title: `Sell ${text}`, hint: 'Digital products, paid plans and online courses' });
  }
  if (on('apiWebhooksAllowed')) out.push({ title: 'Webhooks & API', hint: 'Connect your store to other tools' });
  if (more(l.maxMarkets, p.maxMarkets)) out.push({ title: unlimited(l.maxMarkets) ? 'Unlimited currencies' : `Accept up to ${l.maxMarkets} currencies` });
  if (on('prioritySupport')) out.push({ title: 'Priority support', hint: 'Faster answers from our team' });
  if (on('dedicatedAccountManager')) out.push({ title: 'Your own account manager', hint: 'One person who knows your business' });
  return out;
}

/** Price shown per month for the chosen billing, and the crossed-out "was" price when the plan has one. */
export function displayPrice(plan: PlatformPlan, billing: 'monthly' | 'annual'): { now: number; was: number | null; percentOff: number } {
  const now = billing === 'annual' ? yearlyMonthlyEquivalent(plan) : (plan.monthlyPriceUSD ?? 0);
  const wasRaw = billing === 'annual'
    ? (plan.compareAtYearlyPriceUSD != null ? Math.round((plan.compareAtYearlyPriceUSD / 12) * 100) / 100 : null)
    : (plan.compareAtMonthlyPriceUSD ?? null);
  const was = wasRaw != null && wasRaw > now ? wasRaw : null;
  // From the real (unrounded) amounts, rounded DOWN so "40% off" is never more than the real cut.
  const [paid, list] = billing === 'annual' ? [yearlyTotal(plan), plan.compareAtYearlyPriceUSD ?? 0] : [now, was ?? 0];
  const percentOff = was ? Math.floor((1 - paid / list) * 100 + 1e-9) : 0;
  return { now, was, percentOff };
}

/** "$6", "$23.50", "$1,722" */
export function money(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Lowest and highest third-party gateway fee across the plans, as "0.2–2%" (or one value). */
export function gatewayFeeRange(plans: PlatformPlan[]): string | null {
  const rates = plans.map(p => p.limits?.transactionFeeRate).filter((r): r is number => typeof r === 'number');
  if (!rates.length) return null;
  const pct = (r: number) => `${Number((r * 100).toFixed(2))}`;
  const lo = Math.min(...rates), hi = Math.max(...rates);
  return lo === hi ? `${pct(lo)}%` : `${pct(lo)}–${pct(hi)}%`;
}
