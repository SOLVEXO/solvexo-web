import { afterEach, describe, expect, it } from 'vitest';
import { capturePartnerCode, getPartnerCode, getSellerAcquisitionFields } from './sellerAcquisitionAttribution';

afterEach(() => localStorage.clear());

describe('partner referral code', () => {
  it('keeps the first partner link for the sign-up, cleaned up', () => {
    capturePartnerCode('?partner=kamran1');
    capturePartnerCode('?partner=OTHER');
    expect(getPartnerCode()).toBe('KAMRAN1');
    expect(getSellerAcquisitionFields()).toEqual({ partnerCode: 'KAMRAN1' });
  });

  it('forgets it after 60 days', () => {
    localStorage.setItem('solvexo:partnerRef', JSON.stringify({ code: 'OLD', expiresAt: Date.now() - 1 }));
    expect(getPartnerCode()).toBeNull();
  });
});
