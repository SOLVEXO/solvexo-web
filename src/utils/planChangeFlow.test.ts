import { describe, it, expect, vi } from 'vitest';
import type { StorePlatformSubscription } from '@/api/services/platformPlans';
import { PlanStillActivatingError, completePlanChange, isPlanGateStatus, planProblemBanner, shouldBillImmediately } from './planChangeFlow';

const sub = (over: Partial<StorePlatformSubscription> = {}): StorePlatformSubscription => ({
  _id: 's1', storeId: 'st1', platformPlanId: null, billingInterval: 'monthly', amountUSD: 0, status: 'trial_ended',
  startedAt: '', trialEndsAt: null, currentPeriodEnd: '', nextBillingDate: '', cancelAtPeriodEnd: false, cancelReason: null,
  failedPaymentAttempts: 0, creditBalanceUSD: 0, stripeCustomerId: null, legacyFreeEligible: false, ...over,
});
const noSleep = () => Promise.resolve();

describe('completePlanChange', () => {
  it('confirms the card with the returned clientSecret and only succeeds once the plan is active (refetched)', async () => {
    const confirmCard = vi.fn().mockResolvedValue(undefined);
    const fetchSub = vi.fn()
      .mockResolvedValueOnce(sub({ pendingPlanChange: { kind: 'first_purchase', planId: 'p1', interval: 'monthly', amountUSD: 29 } }))
      .mockResolvedValue(sub({ platformPlanId: 'p1', status: 'active', pendingPlanChange: null }));
    const res = await completePlanChange('p1', true, {
      change: async () => ({ data: { pending: true, requiresAction: true, clientSecret: 'cs_1' } }),
      confirmCard, confirmPending: vi.fn().mockResolvedValue({}), fetchSub, sleep: noSleep,
    });
    expect(confirmCard).toHaveBeenCalledWith('cs_1');
    expect(res.status).toBe('active');
    expect(fetchSub.mock.calls.length).toBeGreaterThan(1);
  });

  it('does NOT show success when the card fails — the error propagates and nothing is polled', async () => {
    const fetchSub = vi.fn();
    await expect(completePlanChange('p1', true, {
      change: async () => ({ data: { pending: true, requiresAction: true, clientSecret: 'cs_1' } }),
      confirmCard: vi.fn().mockRejectedValue(new Error('Your card was declined.')),
      confirmPending: vi.fn(), fetchSub, sleep: noSleep,
    })).rejects.toThrow('Your card was declined.');
    expect(fetchSub).not.toHaveBeenCalled();
  });

  it('does NOT show success on HTTP 200 alone: plan never activates → throws with the stored failure reason', async () => {
    await expect(completePlanChange('p1', true, {
      change: async () => ({ data: { pending: true } }),
      confirmCard: vi.fn(), confirmPending: vi.fn().mockResolvedValue({}),
      fetchSub: async () => sub({ lastBillingError: 'Insufficient funds' }), sleep: noSleep, pollAttempts: 2,
    })).rejects.toThrow('Insufficient funds');
  });

  it('supports a 3DS upgrade: confirms with the secret then asks the server to verify + apply', async () => {
    const order: string[] = [];
    await completePlanChange('p2', true, {
      change: async () => ({ data: { pending: true, requiresAction: true, clientSecret: 'cs_3ds' } }),
      confirmCard: async () => { order.push('card'); },
      confirmPending: async () => { order.push('server'); },
      fetchSub: async () => sub({ platformPlanId: 'p2', status: 'active' }), sleep: noSleep,
    });
    expect(order).toEqual(['card', 'server']);
  });

  it('keeps asking the server to confirm while it waits, so a late provider notification never blocks a paid plan', async () => {
    const confirmPending = vi.fn().mockResolvedValue({});
    let calls = 0;
    const fetchSub = vi.fn(async () => (++calls >= 6 ? sub({ platformPlanId: 'p1', status: 'active' }) : sub()));
    const res = await completePlanChange('p1', true, {
      change: async () => ({ data: { pending: true, requiresAction: true, clientSecret: 'cs_1' } }),
      confirmCard: vi.fn().mockResolvedValue(undefined), confirmPending, fetchSub, sleep: noSleep,
    });
    expect(res.status).toBe('active');
    expect(confirmPending.mock.calls.length).toBeGreaterThan(1);
  });

  it('after a successful card payment that is still activating, says so and never asks the seller to pay again', async () => {
    const err = await completePlanChange('p1', true, {
      change: async () => ({ data: { pending: true, requiresAction: true, clientSecret: 'cs_1' } }),
      confirmCard: vi.fn().mockResolvedValue(undefined), confirmPending: vi.fn().mockResolvedValueOnce({}).mockRejectedValue(new Error('x')),
      fetchSub: async () => sub(), sleep: noSleep, pollAttempts: 3,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PlanStillActivatingError);
    expect((err as Error).message).toContain('please do not pay again');
  });

  it('a trial commitment (not paid now) succeeds once the pending commitment is recorded', async () => {
    const res = await completePlanChange('p1', false, {
      change: async () => ({ data: { pending: true } }),
      confirmCard: vi.fn(), confirmPending: vi.fn().mockResolvedValue({}),
      fetchSub: async () => sub({ status: 'trialing', pendingPlanChange: { kind: 'trial_conversion', planId: 'p1', interval: 'monthly', amountUSD: 29 } }),
      sleep: noSleep,
    });
    expect(res.status).toBe('trialing');
  });
});

describe('shouldBillImmediately', () => {
  const now = Date.parse('2026-11-20T00:00:00Z');
  it('is false while a trial still has time left', () => {
    expect(shouldBillImmediately({ status: 'trialing', trialEndsAt: '2026-11-22T00:00:00Z' }, now)).toBe(false);
  });
  it('is true once the trial is over or there never was one', () => {
    expect(shouldBillImmediately({ status: 'trial_ended', trialEndsAt: '2026-11-10T00:00:00Z' }, now)).toBe(true);
    expect(shouldBillImmediately({ status: 'trialing', trialEndsAt: '2026-11-10T00:00:00Z' }, now)).toBe(true);
    expect(shouldBillImmediately({ status: 'active', trialEndsAt: null }, now)).toBe(true);
    expect(shouldBillImmediately(null, now)).toBe(true);
  });
});

describe('isPlanGateStatus', () => {
  it('gates trial_ended, locked and canceled — not active/past_due/trialing', () => {
    for (const s of ['trial_ended', 'locked', 'canceled']) expect(isPlanGateStatus(s)).toBe(true);
    for (const s of ['active', 'past_due', 'trialing', null, undefined]) expect(isPlanGateStatus(s)).toBe(false);
  });
});

describe('planProblemBanner', () => {
  it("shows the 'subscription ended' banner for canceled", () => {
    expect(planProblemBanner(sub({ status: 'canceled' }))?.text).toMatch(/subscription has ended/);
  });
  it('shows the failure reason for a trialing/active seller whose purchase failed (plan unchanged)', () => {
    for (const status of ['trialing', 'active']) {
      expect(planProblemBanner(sub({ status, lastBillingError: 'Card declined' }))?.text).toMatch(/Card declined/);
    }
  });
  it('shows nothing for a healthy sub, and leaves gate/past_due states to their own UI', () => {
    expect(planProblemBanner(sub({ status: 'active' }))).toBeNull();
    expect(planProblemBanner(sub({ status: 'past_due', lastBillingError: 'x' }))).toBeNull();
    expect(planProblemBanner(sub({ status: 'trial_ended', lastBillingError: 'x' }))).toBeNull();
    expect(planProblemBanner(null)).toBeNull();
  });
});
