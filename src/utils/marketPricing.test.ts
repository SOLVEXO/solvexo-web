import { describe, it, expect } from 'vitest';
import { applyRounding, previewMarketPrice, validateSubfolder, validateMarketDomain } from './marketPricing';

describe('applyRounding', () => {
  it('.99 and .95 keep the whole unit', () => {
    expect(applyRounding(10.01, '0.99', 2)).toBe(9.99);
    expect(applyRounding(10.99, '0.99', 2)).toBe(10.99);
    expect(applyRounding(10.97, '0.95', 2)).toBe(10.95);
    expect(applyRounding(0.2, '0.99', 2)).toBe(0.99);
  });
  it('1.00 / nearest round to a whole unit', () => {
    expect(applyRounding(10.5, '1.00', 2)).toBe(11);
    expect(applyRounding(10.4, 'nearest', 2)).toBe(10);
  });
  it('falls back to nearest for 0 and 3 decimal currencies', () => {
    expect(applyRounding(1234.4, '0.99', 0)).toBe(1234);
    expect(applyRounding(5.6, '0.95', 3)).toBe(6);
  });
});

describe('previewMarketPrice', () => {
  it('plain conversion', () => {
    expect(previewMarketPrice({ amount: 1000, rate: 0.0036, currency: 'USD', rule: { type: 'auto' } })).toBe(3.6);
  });
  it('percentage + fee + rounding', () => {
    const p = previewMarketPrice({ amount: 100, rate: 1, currency: 'USD', rule: { type: 'percentage', percentageAdjustment: 10, conversionFee: 5, useRounding: true, roundingRule: '0.99' } });
    expect(p).toBe(115.99); // 100*1.1*1.05 = 115.5 -> 115.99
  });
  it('ignores percentage when type is not percentage', () => {
    expect(previewMarketPrice({ amount: 100, rate: 1, currency: 'USD', rule: { type: 'auto', percentageAdjustment: 50 } })).toBe(100);
  });
  it('rounds to the currency decimals (PKR has none)', () => {
    expect(previewMarketPrice({ amount: 1, rate: 278.456, currency: 'PKR', rule: { type: 'auto' } })).toBe(278);
  });
});

describe('validators', () => {
  it('subfolder', () => {
    expect(validateSubfolder('en-ca')).toBe('');
    expect(validateSubfolder('-ca')).not.toBe('');
    expect(validateSubfolder('EN')).not.toBe('');
    expect(validateSubfolder('a')).not.toBe('');
  });
  it('domain', () => {
    expect(validateMarketDomain('eu.mystore.com')).toBe('');
    expect(validateMarketDomain('https://eu.mystore.com')).not.toBe('');
    expect(validateMarketDomain('nodots')).not.toBe('');
  });
});
