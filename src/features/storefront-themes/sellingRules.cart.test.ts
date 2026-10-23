import { describe, expect, it } from 'vitest';
import { cartLineRules, clampQty, stepQty } from './sellingRules';

describe('cart quantity rules', () => {
  const r = cartLineRules({ orderMinQuantity: 5, orderQuantityStep: 5, orderMaxQuantity: 20 });
  it('resolves rules', () => expect(r).toEqual({ min: 5, max: 20, step: 5 }));
  it('+ adds step, stops at max', () => { expect(stepQty(5, 1, r)).toBe(10); expect(stepQty(20, 1, r)).toBeNull(); });
  it('- subtracts step, stops at min', () => { expect(stepQty(10, -1, r)).toBe(5); expect(stepQty(5, -1, r)).toBeNull(); });
  it('typed values snap to a legal quantity', () => { expect(clampQty(7, r)).toBe(5); expect(clampQty(8, r)).toBe(10); expect(clampQty(99, r)).toBe(20); expect(clampQty(1, r)).toBe(5); });
  it('no rules = by one, min 1', () => { const d = cartLineRules({}); expect(stepQty(1, -1, d)).toBeNull(); expect(stepQty(1, 1, d)).toBe(2); });
});
