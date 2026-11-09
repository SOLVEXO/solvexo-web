import { describe, expect, it } from 'vitest';
import type { PlatformPlan } from '@/api/services/platformPlans';
import { displayPrice, gatewayFeeRange, money, planFeatures } from './planFeatures';

const plan = (over: Partial<PlatformPlan>): PlatformPlan => ({
  _id: over.name ?? 'p', key: null, name: 'Plan', description: null, badge: null, sortOrder: 1, isFree: false, isCustomPricing: false,
  monthlyPriceUSD: 10, yearlyPriceUSD: 100, trialDays: 0, featureBullets: [], limits: {}, status: 'active', isPubliclyVisible: true,
  createdAt: '', updatedAt: '', introOfferEnabled: false, introPriceUSD: null, introDurationCycles: null, gracePeriodDays: 3, ...over,
});

const basic = plan({ name: 'Basic', monthlyPriceUSD: 6, yearlyPriceUSD: 60, compareAtMonthlyPriceUSD: 10, compareAtYearlyPriceUSD: 100, limits: {
  maxProducts: 25, maxStaffAccounts: 1, maxPosLocations: 1, aiCreditsPerMonth: 100, maxMarkets: 3, maxActiveStoreBanners: 4, maxActivePromotions: 1,
  customDomainAllowed: true, emailCampaignsAllowed: true, advancedSeoToolsAllowed: true, transactionFeeRate: 0.02,
} });
const grow = plan({ name: 'Grow', monthlyPriceUSD: 29, yearlyPriceUSD: 282, compareAtMonthlyPriceUSD: 49, compareAtYearlyPriceUSD: 470, limits: {
  ...basic.limits, maxProducts: -1, maxStaffAccounts: 5, maxPosLocations: 3, aiCreditsPerMonth: 500, maxMarkets: 5, maxActiveStoreBanners: 10, maxActivePromotions: 5,
  abandonedCartRecoveryAllowed: true, loyaltyProgramAllowed: true, prioritySupport: true, transactionFeeRate: 0.01,
} });
const titles = (p: PlatformPlan, prev?: PlatformPlan) => planFeatures(p, prev).map(f => f.title);

describe('pricing page plan features', () => {
  it('lists everything on the first plan in plain words', () => {
    expect(titles(basic)).toEqual([
      'Sell up to 25 products', '1 extra staff login', '1 shop location with the POS till', '100 AI credits a month',
      'Your own web address', 'Email marketing', 'SEO tools', '1 sale running at a time · 4 homepage banners', 'Accept up to 3 currencies',
    ]);
    expect(planFeatures(basic).find(f => f.title === 'Your own web address')?.hint).toBe('e.g. yourshop.com');
  });

  it('lists only what is new or bigger on the next plan', () => {
    expect(titles(grow, basic)).toEqual([
      'Unlimited products', '5 staff logins', '3 shop / warehouse locations', '500 AI credits a month',
      'Recover abandoned carts', 'Loyalty points', '5 sales running at once · 10 homepage banners', 'Accept up to 5 currencies', 'Priority support',
    ]);
  });

  it('never lists a feature the plan does not include', () => {
    expect(titles(basic)).not.toContain('Recover abandoned carts');
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
