import { describe, it, expect } from 'vitest';
import { planStatusLabel, complimentaryReviewAt } from './planStatus';

describe('planStatusLabel', () => {
  it('turns raw statuses into friendly wording', () => {
    expect(planStatusLabel('past_due').label).toBe('Payment due');
    expect(planStatusLabel('trial_ended').label).toBe('Choose a plan');
    expect(planStatusLabel('locked').label).toBe('Store paused');
    expect(planStatusLabel('canceled').label).toBe('Subscription ended');
    expect(planStatusLabel('trialing').label).toBe('Free trial');
    expect(planStatusLabel('active').label).toBe('Active');
  });
  it('never shows the raw "past_due" text to the seller', () => {
    for (const s of ['active', 'trialing', 'trial_ended', 'past_due', 'locked', 'canceled', 'something_new']) {
      expect(planStatusLabel(s).label).not.toMatch(/_/);
    }
  });
  it('complimentary and cancel-pending override an active plan', () => {
    expect(planStatusLabel('active', { complimentary: true }).label).toBe('Provided by Solvexo support');
    expect(planStatusLabel('active', { cancelPending: true }).label).toBe('Canceling');
  });
});

describe('complimentaryReviewAt', () => {
  const now = new Date('2026-11-20T00:00:00Z');
  it('adds the preset days, and is null for "no review date" / unknown', () => {
    expect(complimentaryReviewAt('30', now)).toBe('2026-12-20T00:00:00.000Z');
    expect(complimentaryReviewAt('90', now)).toBe('2027-02-18T00:00:00.000Z');
    expect(complimentaryReviewAt('none', now)).toBeNull();
    expect(complimentaryReviewAt('bogus', now)).toBeNull();
  });
});
