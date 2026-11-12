import type { PlatformPlan, PlatformPlanLimits } from '@/api/services/platformPlans';
import { yearlyMonthlyEquivalent, yearlyTotal } from '@/utils/planPricing';
import type { SiteLang } from '@/i18n/site/siteLanguage';
import { PLAN_BADGES_AR, PLAN_FEATURES_TEXT, PLAN_NAMES_AR } from './planFeatures.text';

/** One plan-card line in plain words, with an optional short explanation underneath. */
export interface PlanFeature { title: string; hint?: string }

const unlimited = (n?: number) => n !== undefined && n !== null && n < 0;
const more = (n?: number, prev?: number) => n !== undefined && n !== null && n !== 0 && (prev === undefined || prev === null || unlimited(n) ? !unlimited(prev) : n > prev);

/**
 * The plan card's feature list, written for a first-time seller rather than in platform terms.
 * Built from the plan's REAL limits (the same ones the backend enforces), so the page can't promise
 * more than a plan gives. With `prev` (the tier below), only what is new or bigger is listed —
 * the card shows "Everything in <prev>, plus". `lang` picks the site language (English by default).
 */
export function planFeatures(plan: PlatformPlan, prev?: PlatformPlan | null, lang: SiteLang = 'en'): PlanFeature[] {
  const t = PLAN_FEATURES_TEXT[lang];
  const l: PlatformPlanLimits = plan.limits ?? {};
  const p: PlatformPlanLimits = prev?.limits ?? {};
  const first = !prev;
  const on = (k: keyof PlatformPlanLimits) => !!l[k] && (first || !p[k]);
  const out: PlanFeature[] = [];

  if (more(l.maxProducts, p.maxProducts)) {
    out.push({ title: unlimited(l.maxProducts) ? t.unlimitedProducts : t.products(l.maxProducts!),
      hint: unlimited(l.maxProducts) ? t.unlimitedProductsHint : t.productsHint(l.maxProducts!) });
  }
  if (more(l.maxStaffAccounts, p.maxStaffAccounts)) {
    out.push(unlimited(l.maxStaffAccounts) ? { title: t.unlimitedStaff, hint: t.unlimitedStaffHint }
      : { title: first ? t.extraStaff(l.maxStaffAccounts!) : t.staff(l.maxStaffAccounts!), hint: t.staffLimitHint(l.maxStaffAccounts!) });
  }
  if (more(l.maxPosLocations, p.maxPosLocations)) {
    out.push({ title: unlimited(l.maxPosLocations) ? t.unlimitedLocations
      : l.maxPosLocations === 1 ? t.oneLocation : t.locations(l.maxPosLocations!),
      hint: unlimited(l.maxPosLocations) ? t.unlimitedLocationsHint : t.locationsHint(l.maxPosLocations!) });
  }
  // Credits are spent only by AI SEO suggestions, so a plan that does not have them shows no credits line at all.
  if (l.seoAiSuggestionsAllowed && (!p.seoAiSuggestionsAllowed || more(l.aiCreditsPerMonth, p.aiCreditsPerMonth))) {
    out.push({
      title: unlimited(l.aiCreditsPerMonth) ? t.unlimitedAi : t.ai(l.aiCreditsPerMonth!),
      hint: unlimited(l.aiCreditsPerMonth) ? t.aiUnlimitedHint : t.aiLimitedHint,
    });
  }
  if (on('abandonedCartRecoveryAllowed')) out.push({ title: t.abandoned, hint: t.abandonedHint });
  if (on('loyaltyProgramAllowed')) out.push({ title: t.loyalty, hint: t.loyaltyHint });
  if (on('whiteLabelAllowed')) out.push({ title: t.whiteLabel, hint: t.whiteLabelHint });
  if (on('calculatedShippingRatesAllowed')) out.push({ title: t.courierRates, hint: t.courierRatesHint });
  if (on('customDomainAllowed')) out.push({ title: t.domain, hint: t.domainHint });
  if (on('emailCampaignsAllowed')) out.push({ title: t.email, hint: t.emailHint });
  if (on('advancedSeoToolsAllowed')) out.push({ title: t.seo, hint: t.seoHint });
  if (on('seoAiSuggestionsAllowed')) out.push({ title: t.seoAi, hint: t.seoAiHint });
  if (on('customRedirectsAllowed')) out.push({ title: t.redirects, hint: t.redirectsHint });
  if (on('searchConsoleIntegrationAllowed')) out.push({ title: t.searchConsole, hint: t.searchConsoleHint });

  // Sales/promotions and homepage banners are unlimited on every plan, so they are not a plan feature any more.
  if (more(l.monthlyEmailSends, p.monthlyEmailSends)) {
    out.push({ title: unlimited(l.monthlyEmailSends) ? t.unlimitedEmails : t.emails(l.monthlyEmailSends!), hint: t.emailsHint });
  }
  if (l.b2bWholesaleAllowed) {
    const catalogs = unlimited(l.maxB2BCatalogs) ? t.unlimitedCatalogs : l.maxB2BCatalogs ? t.catalogs(l.maxB2BCatalogs) : null;
    if (on('b2bWholesaleAllowed')) out.push({ title: t.wholesalePrices, hint: catalogs ? t.wholesaleHint(l.maxB2BCatalogs) : t.wholesalePricesShort });
    else if (catalogs && more(l.maxB2BCatalogs, p.maxB2BCatalogs)) out.push({ title: catalogs, hint: t.wholesaleHint(l.maxB2BCatalogs) });
  }
  const digital = ([['digitalMembershipsAllowed', t.digitalMemberships, t.digitalMembershipsWhat], ['digitalLicensesAllowed', t.digitalLicenses, t.digitalLicensesWhat], ['digitalCoursesAllowed', t.digitalCourses, t.digitalCoursesWhat]] as const)
    .filter(([k]) => on(k));
  if (digital.length) {
    const names = digital.map(d => d[1]);
    const text = names.length === 1 ? names[0] : `${names.slice(0, -1).join(t.comma)}${t.and}${names[names.length - 1]}`;
    out.push({ title: t.sellDigital(text), hint: t.sellDigitalHint(digital.map(d => d[2]).join(t.comma)) });
  }
  if (on('apiWebhooksAllowed')) out.push({ title: t.webhooks, hint: t.webhooksHint });
  if (more(l.maxMarkets, p.maxMarkets)) {
    out.push({ title: unlimited(l.maxMarkets) ? t.unlimitedCurrencies : t.currencies(l.maxMarkets!),
      hint: unlimited(l.maxMarkets) ? t.unlimitedCurrenciesHint : t.currenciesHint(l.maxMarkets!) });
  }
  if (on('prioritySupport')) out.push({ title: t.priority, hint: t.priorityHint });
  if (on('dedicatedAccountManager')) out.push({ title: t.manager, hint: t.managerHint });
  return out;
}

/**
 * A plan's name, description and badge in the site language. The four core plans (by key) have Arabic copy;
 * a description the admin has reworded since (or any other plan) keeps the API's English text.
 */
export function planCopy(plan: Pick<PlatformPlan, 'key' | 'name' | 'description' | 'badge'>, lang: SiteLang = 'en'): { name: string; description: string | null; badge: string | null } {
  const ar = lang === 'ar' && plan.key ? PLAN_NAMES_AR[plan.key] : undefined;
  if (lang !== 'ar') return { name: plan.name, description: plan.description, badge: plan.badge };
  return {
    name: ar?.name ?? plan.name,
    description: (ar && plan.description && ar.descriptions[plan.description.trim()]) || plan.description,
    badge: plan.badge ? PLAN_BADGES_AR[plan.badge] ?? plan.badge : plan.badge,
  };
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
