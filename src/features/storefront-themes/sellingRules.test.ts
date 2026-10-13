import { describe, it, expect } from 'vitest';
import { clampQty, preorderLabel, qtyRuleHint, resolveQtyRules } from './sellingRules';

describe('sellingRules', () => {
  it('defaults to 1 / stock / 1', () => {
    expect(resolveQtyRules(undefined, 9)).toEqual({ min: 1, max: 9, step: 1 });
  });
  it('seller max lowers the stock cap and respects the step', () => {
    expect(resolveQtyRules({ orderMinQuantity: 2, orderMaxQuantity: 11, orderQuantityStep: 3 }, 50)).toEqual({ min: 2, max: 11, step: 3 });
    expect(resolveQtyRules({ orderMinQuantity: 2, orderMaxQuantity: 12, orderQuantityStep: 3 }, 50).max).toBe(11);
    expect(resolveQtyRules({ orderMinQuantity: 2 }, 1).max).toBe(2);
  });
  it('clamps to a legal value', () => {
    const r = { min: 2, max: 8, step: 2 };
    expect([1, 3, 5, 99].map(q => clampQty(q, r))).toEqual([2, 4, 6, 8]);
  });
  it('hint and pre-order label', () => {
    expect(qtyRuleHint({ min: 1, max: 5, step: 1 })).toBeNull();
    expect(qtyRuleHint({ min: 6, max: 60, step: 6 })).toBe('Minimum 6, sold in multiples of 6');
    expect(preorderLabel({ preorder: { enabled: true } })).toBe('Pre-order');
    expect(preorderLabel({ preorder: { enabled: false } })).toBeNull();
  });
});
