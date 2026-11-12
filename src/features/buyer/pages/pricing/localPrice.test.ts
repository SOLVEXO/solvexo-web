import { describe, expect, it } from 'vitest';
import { formatLocal, localCurrencyCode, pickLocalCurrency } from './localPrice';

const rates = { USD: { ratePerUSD: 1, effectiveFrom: '', source: 'admin' as const }, PKR: { ratePerUSD: 276.541346, effectiveFrom: '', source: 'provider' as const } };

describe('pricing page local currency', () => {
  it('uses the country in the URL, only when a rate exists', () => {
    expect(localCurrencyCode('/pk/pricing')).toBe('PKR');
    expect(localCurrencyCode('/pricing')).toBeNull();
    expect(pickLocalCurrency('/pk/pricing', rates)).toEqual({ code: 'PKR', ratePerUSD: 276.541346 });
    expect(pickLocalCurrency('/ae/pricing', rates)).toBeNull(); // no AED rate yet → US$ only
    expect(pickLocalCurrency('/us/pricing', rates)).toBeNull();
    expect(pickLocalCurrency('/pk/pricing', null)).toBeNull();
  });

  it('rounds to a friendly rupee figure', () => {
    const pk = { code: 'PKR', ratePerUSD: 276.541346 };
    expect([6, 29, 59, 179, 1].map(n => formatLocal(n, pk))).toEqual(['Rs 1,660', 'Rs 8,020', 'Rs 16,320', 'Rs 49,500', 'Rs 280']);
    expect(formatLocal(0.2, pk)).toBe('Rs 55');
  });
});

describe('Arabic site currency labels', () => {
  it('writes the amount first with the Arabic currency name', () => {
    expect(formatLocal(29, { code: 'AED', ratePerUSD: 3.6725 }, 'ar')).toBe('110 د.إ');
    expect(formatLocal(6, { code: 'SAR', ratePerUSD: 3.75 }, 'ar')).toBe('23 ر.س');
    expect(formatLocal(29, { code: 'AED', ratePerUSD: 3.6725 })).toBe('AED 110');
  });
});
