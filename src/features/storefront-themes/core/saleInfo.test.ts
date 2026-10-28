import { describe, expect, it } from 'vitest';
import { saleInfo } from './money';

const base = { currency: 'USD', canConvert: () => true, convert: (n: number, _f?: string | null, ref?: { compare?: boolean } | null) => (ref?.compare ? n * 0.0035 : n * 0.0035) };

describe('saleInfo', () => {
  it('uses the store price and compare-at when no fixed price exists', () => {
    expect(saleInfo(base, 1500, 2000, 'PKR', { productId: 'p' })).toMatchObject({ onSale: true, percentOff: 25, compareAmount: 2000 });
    expect(saleInfo(base, 900, null, 'PKR', { productId: 'p' }).onSale).toBe(false);
  });

  it('shows a fixed market compare-at even when the store price has none', () => {
    const c = { ...base, fixedPriceFor: () => ({ price: 9.99, compareAt: 14.99 }) };
    const s = saleInfo(c, 900, null, 'PKR', { productId: 'p' });
    expect(s.onSale).toBe(true);
    expect(s.percentOff).toBe(33);
  });

  it('is not on sale when the fixed compare-at is not above the fixed price', () => {
    const c = { ...base, fixedPriceFor: () => ({ price: 9.99, compareAt: 9.99 }) };
    expect(saleInfo(c, 900, 1200, 'PKR', { productId: 'p' }).onSale).toBe(false);
  });
});
