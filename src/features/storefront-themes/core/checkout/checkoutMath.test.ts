import { describe, expect, it } from 'vitest';
import { cartSignature, isStaleCheckoutError, moneyText, parseBuyNow, placedTotal, reconcileSummary, roundMoney, validateAddress } from './checkoutMath';

const base = { currency: 'USD', subtotal: 100, shipping: 10, tax: 8, coupon: 0, giftCard: 0, storeCredit: 0, total: 118 };

describe('moneyText', () => {
  it('formats in the given currency without converting', () => {
    expect(moneyText(1234.5, 'USD')).toBe('$1,234.50');
    expect(moneyText(-5, 'USD')).toBe('-$5.00');
  });
  it('uses zero decimals for PKR and a spaced letter symbol', () => {
    expect(moneyText(1200, 'PKR')).toBe('Rs 1,200');
  });
  it('is empty for missing amounts', () => {
    expect(moneyText(null, 'USD')).toBe('');
    expect(moneyText(Number.NaN, 'USD')).toBe('');
  });
});

describe('roundMoney', () => {
  it('rounds to the currency minor unit', () => {
    expect(roundMoney(1.005 + 0.0001, 'USD')).toBe(1.01);
    expect(roundMoney(10.4, 'PKR')).toBe(10);
  });
});

describe('reconcileSummary', () => {
  it('leaves a consistent summary alone', () => {
    expect(reconcileSummary(base)).toEqual({ tax: 8, adjustment: 0 });
  });
  it('ignores sub-cent rounding noise', () => {
    expect(reconcileSummary({ ...base, total: 118.004 })).toEqual({ tax: 8, adjustment: 0 });
  });
  it('subtracts every discount layer', () => {
    const r = reconcileSummary({ ...base, coupon: 10, giftCard: 5, storeCredit: 3, total: 100 });
    expect(r).toEqual({ tax: 8, adjustment: 0 });
  });
  it('attributes a coupon-driven tax re-quote to tax', () => {
    // coupon 10 -> server re-quoted tax 8 -> 7.2; response total = 100 - 10 + 10 + 7.2 = 107.2
    const r = reconcileSummary({ ...base, coupon: 10, total: 107.2 });
    expect(r.tax).toBeCloseTo(7.2, 2);
    expect(r.adjustment).toBe(0);
  });
  it('shows an adjustment when there is no tax to absorb the difference', () => {
    expect(reconcileSummary({ ...base, tax: 0, total: 105 })).toEqual({ tax: 0, adjustment: -5 });
  });
  it('shows an adjustment instead of a negative tax', () => {
    const r = reconcileSummary({ ...base, total: 90 });
    expect(r.tax).toBe(8);
    expect(r.adjustment).toBe(-28);
  });
});

describe('parseBuyNow / cartSignature', () => {
  it('parses a buy-now pair and rejects partial values', () => {
    expect(parseBuyNow('p1:v1')).toEqual({ productId: 'p1', variantId: 'v1' });
    expect(parseBuyNow('p1:')).toBeNull();
    expect(parseBuyNow('')).toBeNull();
    expect(parseBuyNow(null)).toBeNull();
  });
  it('signs a cart independent of line order', () => {
    expect(cartSignature([{ productVariantId: 'b', quantity: 1 }, { productVariantId: 'a', quantity: 2 }])).toBe('ax2,bx1');
  });
});

describe('isStaleCheckoutError', () => {
  it('detects expired / completed / cancelled checkouts', () => {
    expect(isStaleCheckoutError('Checkout has expired')).toBe(true);
    expect(isStaleCheckoutError('This checkout was already completed')).toBe(true);
    expect(isStaleCheckoutError('Checkout is cancelled')).toBe(true);
    expect(isStaleCheckoutError('Card declined')).toBe(false);
    expect(isStaleCheckoutError(null)).toBe(false);
  });
});

describe('validateAddress', () => {
  const ok = { label: 'Home', recipientName: 'A', phoneNumber: '+92 300 1234567', addressLine1: 'x', state: 's', city: 'c', zipCode: '1', country: 'Pakistan' };
  it('accepts a complete address', () => expect(validateAddress(ok)).toEqual({}));
  it('flags each missing field', () => {
    const e = validateAddress({ ...ok, recipientName: ' ', phoneNumber: '12', city: '', country: '' });
    expect(Object.keys(e).sort()).toEqual(['city', 'country', 'phoneNumber', 'recipientName']);
  });
});

describe('placedTotal', () => {
  it('sums orders and labels with the first currency', () => {
    expect(placedTotal([{ currency: 'USD', summary: { total: 10 } }, { currency: 'USD', summary: { total: 5.5 } }])).toEqual({ amount: 15.5, currency: 'USD' });
  });
});
