import { describe, expect, it } from 'vitest';
import { resolveSellerDestination } from './sellerRouting';
import { isPlanUsable, planBadge } from './storePlanState';
import type { MyStoreItem } from '@/api/services/store';

const store = (id: string, planStatus: string | null, status = 'active') => ({ _id: id, status, planStatus }) as unknown as MyStoreItem;
const dash = (id: string) => `/store/${id}/dashboard`;

describe('resolveSellerDestination (a seller with several stores, each with its own plan)', () => {
  it('sends a seller with no store to onboarding', () => {
    expect(resolveSellerDestination([], [])).toBe('/onboard');
  });

  it('skips a trial-ended first store and lands on the first store that can be worked in', () => {
    expect(resolveSellerDestination([store('A', 'trial_ended'), store('B', 'trialing'), store('C', 'active')], [])).toBe(dash('B'));
  });

  it('skips a locked store too', () => {
    expect(resolveSellerDestination([store('A', 'locked'), store('B', 'active')], [])).toBe(dash('B'));
  });

  it('prefers the store used last when its plan is fine', () => {
    expect(resolveSellerDestination([store('A', 'active'), store('B', 'active')], ['B', 'A'])).toBe(dash('B'));
  });

  it('ignores a last-used store whose trial ended', () => {
    expect(resolveSellerDestination([store('A', 'active'), store('B', 'trial_ended')], ['B', 'A'])).toBe(dash('A'));
  });

  it('keeps a past-due store usable (it only shows a banner)', () => {
    expect(resolveSellerDestination([store('A', 'past_due')], [])).toBe(dash('A'));
  });

  it('opens the plan gate (last used, else first) when every store needs a plan', () => {
    const all = [store('A', 'trial_ended'), store('B', 'locked')];
    expect(resolveSellerDestination(all, ['B'])).toBe(dash('B'));
    expect(resolveSellerDestination(all, [])).toBe(dash('A'));
  });

  it('still sends a single pending/rejected legacy store to verification', () => {
    expect(resolveSellerDestination([store('A', null, 'pending')], [])).toBe('/store/A/verification');
    expect(resolveSellerDestination([store('A', null, 'rejected')], [])).toBe('/store/A/verification');
  });

  it('treats a store with no known plan state as usable', () => {
    expect(resolveSellerDestination([store('A', null)], [])).toBe(dash('A'));
  });
});

describe('plan state helpers', () => {
  it('only trial_ended and locked block a store', () => {
    expect(['trial_ended', 'locked'].map(s => isPlanUsable(s))).toEqual([false, false]);
    expect(['trialing', 'active', 'past_due', 'canceled', null, undefined].every(s => isPlanUsable(s))).toBe(true);
  });

  it('labels the states the switcher shows', () => {
    expect(planBadge('trial_ended')).toEqual({ label: 'Trial ended', tone: 'bad' });
    expect(planBadge('locked')?.tone).toBe('bad');
    expect(planBadge('past_due')?.tone).toBe('warn');
    expect(planBadge('active')).toBeNull();
  });
});
