import { describe, expect, it } from 'vitest';
import { stockState, variantCanBuy } from './variantAvailability';
import type { ProductVariant } from '@/api/services/marketplace';

const v = (over: Record<string, unknown>) => ({ stock: 0, committedStock: 0, ...over }) as unknown as ProductVariant;

describe('stockState with pre-order (regression: "Sold out" shown next to an active Pre-order button)', () => {
  it('a sold-out variant that is open for pre-order is a pre-order, not sold out', () => {
    const variant = v({ preorder: { enabled: true, soldOut: false, remaining: 3 } });
    expect(stockState(variant, false)).toBe('preorder');
    expect(variantCanBuy(variant, false)).toBe(true);
  });
  it('a pre-order that is full is sold out; a normal sold-out variant is sold out; stock wins over pre-order', () => {
    expect(stockState(v({ preorder: { enabled: true, soldOut: true } }), false)).toBe('sold_out');
    expect(stockState(v({}), false)).toBe('sold_out');
    expect(stockState(v({ stock: 5, preorder: { enabled: true, soldOut: false } }), false)).toBe('in_stock');
  });
  it('backorder is unchanged', () => { expect(stockState(v({ allowBackorder: true }), false)).toBe('backorder'); });
});
