import { beforeEach, describe, expect, it } from 'vitest';
import { clearSavedDiscountCode, isValidDiscountCode, readSavedDiscountCode, safeRedirectPath, saveDiscountCode } from './discountLink';

describe('shareable discount link helpers', () => {
  beforeEach(() => { localStorage.clear(); });

  it('remembers a code (upper-case) until checkout uses it, then forgets it', () => {
    saveDiscountCode('summer20');
    expect(readSavedDiscountCode()).toBe('SUMMER20');
    clearSavedDiscountCode();
    expect(readSavedDiscountCode()).toBeNull();
  });

  it('refuses anything that is not a plain code', () => {
    expect(isValidDiscountCode('SAVE-10_a')).toBe(true);
    for (const bad of ['', 'a b', '<script>', 'x'.repeat(41), null, undefined]) expect(isValidDiscountCode(bad as never)).toBe(false);
    saveDiscountCode('<script>alert(1)</script>');
    expect(readSavedDiscountCode()).toBeNull();
  });

  it('only follows same-site paths after the link', () => {
    expect(safeRedirectPath('/product/shoes')).toBe('/product/shoes');
    expect(safeRedirectPath('/cart?x=1')).toBe('/cart?x=1');
    for (const bad of [null, '', 'https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)']) expect(safeRedirectPath(bad)).toBe('/');
  });
});
