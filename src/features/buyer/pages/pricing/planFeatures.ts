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

  if (more(l.maxProducts, p.maxProducts)) {
    out.push({ title: unlimited(l.maxProducts) ? 'Unlimited products' : `Sell up to ${plural(l.maxProducts!, 'product', 'products')}`,
      hint: unlimited(l.maxProducts) ? 'There is no limit on how many products you can list.' : `The most products you can have in your store at one time: ${l.maxProducts!.toLocaleString('en-US')}.` });
  }
  if (more(l.maxStaffAccounts, p.maxStaffAccounts)) {
    out.push(unlimited(l.maxStaffAccounts) ? { title: 'Unlimited staff logins', hint: 'Add as many helpers as you need. Each one gets their own login and only the access you give them.' }
      : { title: first ? `${plural(l.maxStaffAccounts!, 'extra staff login', 'extra staff logins')}` : plural(l.maxStaffAccounts!, 'staff login', 'staff logins'),
          hint: `Let up to ${l.maxStaffAccounts} helper${l.maxStaffAccounts === 1 ? '' : 's'} log in to manage orders and products. Each gets their own login and only the access you choose.` });
  }
  if (more(l.maxPosLocations, p.maxPosLocations)) {
    out.push({ title: unlimited(l.maxPosLocations) ? 'Unlimited locations'
      : l.maxPosLocations === 1 ? '1 shop location with the POS till' : `${l.maxPosLocations} shop / warehouse locations`,
      hint: unlimited(l.maxPosLocations) ? 'Sell from any number of shops and warehouses. Stock stays in step with your online store.'
        : `Sell in person with the Solvexo POS app from up to ${l.maxPosLocations} place${l.maxPosLocations === 1 ? '' : 's'}. Stock stays in step with your online store.` });
  }
  // Credits are spent only by AI SEO suggestions, so a plan that does not have them shows no credits line at all.
  if (l.seoAiSuggestionsAllowed && (!p.seoAiSuggestionsAllowed || more(l.aiCreditsPerMonth, p.aiCreditsPerMonth))) {
    const used = 'Used for AI SEO suggestions: AI proposes a page title and description for a product, you read it first and click Use this.';
    out.push({
      title: unlimited(l.aiCreditsPerMonth) ? 'Unlimited AI credits' : `${l.aiCreditsPerMonth!.toLocaleString('en-US')} AI credits a month`,
      hint: unlimited(l.aiCreditsPerMonth) ? `${used} There is no monthly limit.` : `${used} Each suggestion costs 5 credits. Credits renew every month.`,
    });
  }
  if (on('abandonedCartRecoveryAllowed')) out.push({ title: 'Recover abandoned carts', hint: 'When a shopper leaves items in the cart without paying, we email them a link back to that cart.' });
  if (on('loyaltyProgramAllowed')) out.push({ title: 'Loyalty points', hint: 'Customers earn points on their orders and swap them for rewards, so they come back to buy again.' });
  if (on('whiteLabelAllowed')) out.push({ title: 'Remove Solvexo branding', hint: 'Hide the Solvexo name and logo, so your customers only see your brand.' });
  if (on('calculatedShippingRatesAllowed')) out.push({ title: 'Live courier rates at checkout', hint: 'Checkout shows the real delivery price from the courier for each order, instead of one fixed price.' });
  if (on('customDomainAllowed')) out.push({ title: 'Your own web address', hint: 'Use your own address like yourshop.com for your store instead of a Solvexo one. A secure (https) lock is included.' });
  if (on('emailCampaignsAllowed')) out.push({ title: 'Email marketing', hint: 'Email your customers offers and news. Automatic emails too: welcome, forgotten cart, back in stock.' });
  if (on('advancedSeoToolsAllowed')) out.push({ title: 'SEO tools', hint: 'Page titles, descriptions, a sitemap and checks that help Google find and rank your products.' });
  if (on('seoAiSuggestionsAllowed')) out.push({ title: 'AI SEO suggestions', hint: 'AI proposes a page title and description for a product. You read it first and only click Use this if you like it.' });
  if (on('customRedirectsAllowed')) out.push({ title: 'Custom redirects', hint: 'When you change a page address, send the old link to the new one, so visitors never land on an error page.' });
  if (on('searchConsoleIntegrationAllowed')) out.push({ title: 'Google Search Console connection', hint: 'See which Google searches bring people to your store, right inside your dashboard.' });

  // Sales/promotions and homepage banners are unlimited on every plan, so they are not a plan feature any more.
  if (more(l.monthlyEmailSends, p.monthlyEmailSends)) {
    out.push({ title: unlimited(l.monthlyEmailSends) ? 'Unlimited marketing emails' : `${l.monthlyEmailSends!.toLocaleString('en-US')} marketing emails a month`, hint: 'How many offer and news emails you can send to your customers each month. One email to one customer counts as 1. The count starts again every month.' });
  }
  if (l.b2bWholesaleAllowed) {
    const catalogs = unlimited(l.maxB2BCatalogs) ? 'Unlimited wholesale catalogs' : l.maxB2BCatalogs ? plural(l.maxB2BCatalogs, 'wholesale catalog', 'wholesale catalogs') : null;
    const wholesaleHint = (n?: number) => `Set special prices for business buyers who order in bulk. A catalog is one separate price list${unlimited(n) ? '; you can make as many as you like.' : n ? `; this plan allows ${n}.` : '.'}`;
    if (on('b2bWholesaleAllowed')) out.push({ title: 'B2B wholesale prices', hint: catalogs ? wholesaleHint(l.maxB2BCatalogs) : 'Set special prices for business buyers who order in bulk.' });
    else if (catalogs && more(l.maxB2BCatalogs, p.maxB2BCatalogs)) out.push({ title: catalogs, hint: wholesaleHint(l.maxB2BCatalogs) });
  }
  const digital = ([['digitalMembershipsAllowed', 'memberships'], ['digitalLicensesAllowed', 'license keys'], ['digitalCoursesAllowed', 'courses']] as const)
    .filter(([k]) => on(k)).map(([, label]) => label);
  if (digital.length) {
    const text = digital.length === 1 ? digital[0] : `${digital.slice(0, -1).join(', ')} & ${digital[digital.length - 1]}`;
    const what: Record<string, string> = {
      memberships: 'memberships (customers pay to join and get members-only files and content)',
      'license keys': 'license keys (every buyer of your software gets their own code)',
      courses: 'online courses (lessons, quizzes and certificates)',
    };
    out.push({ title: `Sell ${text}`, hint: `Sell more than physical goods: ${digital.map(d => what[d]).join(', ')}.` });
  }
  if (on('apiWebhooksAllowed')) out.push({ title: 'Webhooks & API', hint: 'Send your store events, like a new order, to other tools, and read your store data from your own software.' });
  if (more(l.maxMarkets, p.maxMarkets)) {
    out.push({ title: unlimited(l.maxMarkets) ? 'Unlimited currencies' : `Accept up to ${l.maxMarkets} currencies`,
      hint: unlimited(l.maxMarkets) ? 'Show prices in any currency, so buyers in other countries see and pay in their own.' : `Show prices in up to ${l.maxMarkets} currencies, so buyers in other countries see and pay in their own.` });
  }
  if (on('prioritySupport')) out.push({ title: 'Priority support', hint: 'Your help requests are answered before the ones from the Basic plan. We do not promise an exact reply time.' });
  if (on('dedicatedAccountManager')) out.push({ title: 'Your own account manager', hint: 'One person from our team looks after your account and knows your business.' });
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
