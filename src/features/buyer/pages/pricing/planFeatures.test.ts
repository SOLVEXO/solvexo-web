import { describe, expect, it } from 'vitest';
import type { PlatformPlan } from '@/api/services/platformPlans';
import { displayPrice, gatewayFeeRange, money, planFeatures } from './planFeatures';

const plan = (over: Partial<PlatformPlan>): PlatformPlan => ({
  _id: over.name ?? 'p', key: null, name: 'Plan', description: null, badge: null, sortOrder: 1, isFree: false, isCustomPricing: false,
  monthlyPriceUSD: 10, yearlyPriceUSD: 100, trialDays: 0, featureBullets: [], limits: {}, status: 'active', isPubliclyVisible: true,
  createdAt: '', updatedAt: '', introOfferEnabled: false, introPriceUSD: null, introDurationCycles: null, gracePeriodDays: 3, ...over,
});

const basic = plan({ name: 'Basic', monthlyPriceUSD: 6, yearlyPriceUSD: 60, compareAtMonthlyPriceUSD: 10, compareAtYearlyPriceUSD: 100, limits: {
  maxProducts: 25, maxStaffAccounts: 1, maxPosLocations: 1, aiCreditsPerMonth: 100, maxMarkets: 3, maxActiveStoreBanners: -1, maxActivePromotions: -1,
  customDomainAllowed: true, emailCampaignsAllowed: true, advancedSeoToolsAllowed: true, abandonedCartRecoveryAllowed: true, customRedirectsAllowed: true,
  b2bWholesaleAllowed: true, maxB2BCatalogs: 1, monthlyEmailSends: 2000, transactionFeeRate: 0.02,
} });
const grow = plan({ name: 'Grow', monthlyPriceUSD: 29, yearlyPriceUSD: 282, compareAtMonthlyPriceUSD: 49, compareAtYearlyPriceUSD: 470, limits: {
  ...basic.limits, maxProducts: -1, maxStaffAccounts: 5, maxPosLocations: 3, aiCreditsPerMonth: 500, maxMarkets: 5, maxB2BCatalogs: 3, monthlyEmailSends: 10000,
  loyaltyProgramAllowed: true, seoAiSuggestionsAllowed: true, prioritySupport: true,
  digitalMembershipsAllowed: true, digitalLicensesAllowed: true, digitalCoursesAllowed: true, transactionFeeRate: 0.01,
} });
const advanced = plan({ name: 'Advanced', limits: {
  ...grow.limits, maxStaffAccounts: 15, maxB2BCatalogs: 10, monthlyEmailSends: 50000, whiteLabelAllowed: true, apiWebhooksAllowed: true, searchConsoleIntegrationAllowed: true,
  calculatedShippingRatesAllowed: true, transactionFeeRate: 0.006,
} });
const titles = (p: PlatformPlan, prev?: PlatformPlan) => planFeatures(p, prev).map(f => f.title);

describe('pricing page plan features', () => {
  it('lists everything on the first plan in plain words', () => {
    expect(titles(basic)).toEqual([
      'Sell up to 25 products', '1 extra staff login', '1 shop location with the POS till', '100 AI credits a month',
      'Recover abandoned carts', 'Your own web address', 'Email marketing', 'SEO tools', 'Custom redirects',
      '2,000 marketing emails a month', 'B2B wholesale prices', 'Accept up to 3 currencies',
    ]);
    expect(planFeatures(basic).find(f => f.title === 'Your own web address')?.hint).toContain('yourshop.com');
    expect(planFeatures(basic).find(f => f.title === 'B2B wholesale prices')?.hint).toContain('this plan allows 1');
  });

  it('every line on every plan card carries an explanation for the ? icon', () => {
    for (const plan of [basic, grow]) {
      const prev = plan === basic ? null : basic;
      for (const f of planFeatures(plan, prev)) expect(`${f.title}: ${f.hint ?? ''}`.length > f.title.length + 5).toBe(true);
    }
  });

  it('never prints banner or promotion lines, even when they are unlimited', () => {
    const all = [...titles(basic), ...titles(grow, basic), ...titles(advanced, grow)].join(' | ').toLowerCase();
    expect(all).not.toMatch(/banner|sales running|sale running|sales at once/);
  });

  it('lists only what is new or bigger on the next plan', () => {
    expect(titles(grow, basic)).toEqual([
      'Unlimited products', '5 staff logins', '3 shop / warehouse locations', '500 AI credits a month',
      'Loyalty points', 'AI SEO suggestions', '10,000 marketing emails a month', '3 wholesale catalogs',
      'Sell memberships, license keys & courses', 'Accept up to 5 currencies', 'Priority support',
    ]);
  });

  it('shows premium-only items on the plan that first has them', () => {
    const t = titles(advanced, grow);
    expect(t).toEqual(expect.arrayContaining(['Remove Solvexo branding', 'Webhooks & API', 'Live courier rates at checkout', 'Google Search Console connection']));
    expect(t).not.toContain('Sell memberships, license keys & courses');
  });

  it('never lists a feature the plan does not include', () => {
    expect(titles(basic)).not.toContain('Loyalty points');
    expect(titles(basic).join(' ')).not.toMatch(/memberships|Webhooks/);
    expect(titles(plan({ limits: { maxStaffAccounts: 0 } }))).toEqual([]);
  });
});

describe('pricing page prices', () => {
  it('shows the crossed-out "was" price and a percentage that is never more than the real cut', () => {
    expect(displayPrice(basic, 'monthly')).toEqual({ now: 6, was: 10, percentOff: 40 });
    expect(displayPrice(grow, 'monthly')).toEqual({ now: 29, was: 49, percentOff: 40 }); // 40.8% → 40
    expect(displayPrice(grow, 'annual')).toEqual({ now: 23.5, was: 39.17, percentOff: 40 });
    // $60 vs $100 a year is exactly 40%, even though $5 vs $8.33 a month rounds to 39.98%.
    expect(displayPrice(basic, 'annual')).toEqual({ now: 5, was: 8.33, percentOff: 40 });
  });

  it('shows no discount when the plan has no "was" price, or one that is not higher', () => {
    expect(displayPrice(plan({ monthlyPriceUSD: 10 }), 'monthly')).toEqual({ now: 10, was: null, percentOff: 0 });
    expect(displayPrice(plan({ monthlyPriceUSD: 10, compareAtMonthlyPriceUSD: 10 }), 'monthly').was).toBeNull();
  });

  it('formats money and the gateway fee range', () => {
    expect([money(6), money(23.5), money(1722)]).toEqual(['$6', '$23.50', '$1,722']);
    expect(gatewayFeeRange([basic, grow])).toBe('1–2%');
    expect(gatewayFeeRange([])).toBeNull();
  });
});
