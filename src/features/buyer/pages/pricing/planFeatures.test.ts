import { describe, expect, it } from 'vitest';
import type { PlatformPlan } from '@/api/services/platformPlans';
import { displayPrice, gatewayFeeRange, money, planCopy, planFeatures } from './planFeatures';
import { arCount, AR_DAYS } from './arabicCount';

const plan = (over: Partial<PlatformPlan>): PlatformPlan => ({
  _id: over.name ?? 'p', key: null, name: 'Plan', description: null, badge: null, sortOrder: 1, isFree: false, isCustomPricing: false,
  monthlyPriceUSD: 10, yearlyPriceUSD: 100, trialDays: 0, featureBullets: [], limits: {}, status: 'active', isPubliclyVisible: true,
  createdAt: '', updatedAt: '', introOfferEnabled: false, introPriceUSD: null, introDurationCycles: null, gracePeriodDays: 3, ...over,
});

const basic = plan({ name: 'Basic', monthlyPriceUSD: 6, yearlyPriceUSD: 60, compareAtMonthlyPriceUSD: 10, compareAtYearlyPriceUSD: 100, limits: {
  maxProducts: 25, maxStaffAccounts: 1, maxPosLocations: 1, aiCreditsPerMonth: 0, maxMarkets: 3, maxActiveStoreBanners: -1, maxActivePromotions: -1,
  customDomainAllowed: true, emailCampaignsAllowed: true, advancedSeoToolsAllowed: true, abandonedCartRecoveryAllowed: true, customRedirectsAllowed: true,
  b2bWholesaleAllowed: false, maxB2BCatalogs: 1, monthlyEmailSends: 2000, transactionFeeRate: 0.02,
} });
const grow = plan({ name: 'Grow', monthlyPriceUSD: 29, yearlyPriceUSD: 282, compareAtMonthlyPriceUSD: 49, compareAtYearlyPriceUSD: 470, limits: {
  ...basic.limits, maxProducts: -1, maxStaffAccounts: 5, maxPosLocations: 3, aiCreditsPerMonth: 0, maxMarkets: 5, maxB2BCatalogs: 3, monthlyEmailSends: 10000,
  b2bWholesaleAllowed: true, loyaltyProgramAllowed: true, seoAiSuggestionsAllowed: false, prioritySupport: true,
  digitalMembershipsAllowed: true, digitalLicensesAllowed: true, digitalCoursesAllowed: true, transactionFeeRate: 0.01,
} });
const advanced = plan({ name: 'Advanced', limits: {
  ...grow.limits, maxStaffAccounts: 15, maxB2BCatalogs: 10, monthlyEmailSends: 50000, whiteLabelAllowed: false, apiWebhooksAllowed: true, searchConsoleIntegrationAllowed: true,
  calculatedShippingRatesAllowed: true, transactionFeeRate: 0.006,
} });
const titles = (p: PlatformPlan, prev?: PlatformPlan) => planFeatures(p, prev).map(f => f.title);

describe('pricing page plan features', () => {
  it('lists everything on the first plan in plain words', () => {
    expect(titles(basic)).toEqual([
      'Sell up to 25 products', '1 extra staff login', 'Recover abandoned carts', 'Your own web address', 'Email marketing',
      '2,000 marketing emails a month', 'Accept up to 3 currencies',
    ]);
    expect(planFeatures(basic).find(f => f.title === 'Your own web address')?.hint).toContain('yourshop.com');
    expect(titles(basic)).not.toContain('B2B wholesale prices'); // wholesale starts at Grow
  });

  it('every line on every plan card carries an explanation for the ? icon', () => {
    for (const plan of [basic, grow]) {
      const prev = plan === basic ? null : basic;
      for (const f of planFeatures(plan, prev)) expect(`${f.title}: ${f.hint ?? ''}`.length > f.title.length + 5).toBe(true);
    }
  });

  it('no plan card ever advertises AI credits, AI SEO suggestions or white-label branding (they are not sold)', () => {
    const all = [...titles(basic), ...titles(grow, basic), ...titles(advanced, grow)].join(' | ');
    expect(all).not.toMatch(/AI credits|AI SEO|Solvexo branding|white-label/i);
    // even if an old plan row still carried the flags, nothing is printed for them
    const stale = plan({ limits: { ...grow.limits, aiCreditsPerMonth: 500, seoAiSuggestionsAllowed: true, whiteLabelAllowed: true } });
    expect(titles(stale, basic).join(' | ')).not.toMatch(/AI credits|AI SEO|Solvexo branding/i);
  });

  it('never prints banner or promotion lines, even when they are unlimited', () => {
    const all = [...titles(basic), ...titles(grow, basic), ...titles(advanced, grow)].join(' | ').toLowerCase();
    expect(all).not.toMatch(/banner|sales running|sale running|sales at once/);
  });

  it('lists only what is new or bigger on the next plan', () => {
    expect([...titles(grow, basic)].sort()).toEqual([
      'Unlimited products', '5 staff logins', '3 shop / warehouse locations',
      'Loyalty points', 'B2B wholesale prices', '3 wholesale catalogs', 'Sell digital memberships', 'Sell software license keys', 'Sell online courses',
      '10,000 marketing emails a month', 'Accept up to 5 currencies', 'Lower gateway fee: 1% (was 2%)', 'Priority support',
    ].sort());
  });

  it('cards list only each plan own lines (nothing every plan has), and no POS wording', () => {
    expect(titles(basic).join(' ')).not.toMatch(/Two-step|Khata|Discount codes|Orders, returns/);
    expect(titles(grow, basic).length).toBeGreaterThanOrEqual(12);
    const all = [...planFeatures(basic), ...planFeatures(grow, basic)].map(f => `${f.title} ${f.hint ?? ''}`).join(' ');
    expect(all).not.toMatch(/POS/);
  });

  it('shows premium-only items on the plan that first has them', () => {
    const t = titles(advanced, grow);
    expect(t).toEqual(expect.arrayContaining(['Webhooks & API', 'Live courier rates at checkout', 'Google Search Console connection']));
    expect(t).not.toContain('Sell digital memberships');
  });

  it('never lists a feature the plan does not include', () => {
    expect(titles(basic)).not.toContain('Loyalty points');
    expect(titles(basic).join(' ')).not.toMatch(/memberships|Webhooks/);
    expect(titles(plan({ limits: { maxStaffAccounts: 0 } })).join(' ')).not.toMatch(/staff|Loyalty|Webhooks/);
  });
});

describe('pricing page in Arabic', () => {
  it('writes the feature lines in Arabic with the right noun for each number', () => {
    expect(titles(basic).length).toBe(planFeatures(basic, null, 'ar').length);
    expect(planFeatures(basic, null, 'ar').map(f => f.title)).toContain('بيع ما يصل إلى 25 منتجًا');
    expect(planFeatures(grow, basic, 'ar').map(f => f.title)).toContain('منتجات غير محدودة');
    expect([1, 2, 7, 14, 100].map(n => arCount(n, AR_DAYS))).toEqual(['يوم واحد', 'يومين', '7 أيام', '14 يومًا', '100 يوم']);
  });

  it('names the core plans in Arabic by key and keeps any other plan or reworded description as the API sent it', () => {
    const core = plan({ key: 'grow', name: 'Grow', description: 'For growing sellers who want more reach, more staff and marketing tools.', badge: 'Most Popular' });
    expect(planCopy(core, 'ar')).toEqual({ name: 'النمو', description: 'للتجار في مرحلة النمو الذين يريدون وصولًا أوسع وموظفين أكثر وأدوات تسويق.', badge: 'الأكثر طلبًا' });
    expect(planCopy({ ...core, description: 'Edited by the admin' }, 'ar').description).toBe('Edited by the admin');
    expect(planCopy(plan({ key: null, name: 'Custom deal' }), 'ar').name).toBe('Custom deal');
    expect(planCopy(core)).toEqual({ name: 'Grow', description: core.description, badge: 'Most Popular' });
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
