import { describe, expect, it } from 'vitest';
import { storeLiveStatus } from './storeLiveStatus';

describe('storeLiveStatus', () => {
  it('is only live for an active, public store on a plan', () => {
    expect(storeLiveStatus({ storeStatus: 'active', privacyMode: 'public', planStatus: 'active' })).toEqual({ live: true, label: 'Store is live' });
  });

  it('says checkout is closed while trialing, after the trial, or when locked, whatever the visibility', () => {
    for (const planStatus of ['trialing', 'trial_ended', 'locked']) {
      expect(storeLiveStatus({ storeStatus: 'active', privacyMode: 'public', planStatus })).toEqual({
        live: false, label: 'Not taking orders yet — choose a plan to open checkout',
      });
    }
  });

  it('reports a hidden storefront on a plan', () => {
    expect(storeLiveStatus({ storeStatus: 'active', privacyMode: 'coming_soon', planStatus: 'active' }).label).toBe('Storefront shows "Coming soon"');
    expect(storeLiveStatus({ storeStatus: 'active', privacyMode: 'password', planStatus: 'past_due' }).label).toBe('Storefront is password protected');
  });

  it('keeps the review statuses first', () => {
    expect(storeLiveStatus({ storeStatus: 'pending', planStatus: 'active' }).label).toBe('Store is pending review');
    expect(storeLiveStatus({ storeStatus: 'suspended' }).label).toBe('Store is suspended');
    expect(storeLiveStatus({ storeStatus: undefined }).live).toBe(false);
  });
});
