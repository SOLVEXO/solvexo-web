import { describe, expect, it } from 'vitest';
import en from './locales/storefront.en.json';
import ur from './locales/storefront.ur.json';

function flatten(o: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, flatten(v as Record<string, unknown>, key));
    else out[key] = String(v);
  }
  return out;
}

describe('storefront locale bundles', () => {
  const e = flatten(en); const u = flatten(ur);
  it('en and ur define exactly the same keys', () => {
    expect(Object.keys(u).sort()).toEqual(Object.keys(e).sort());
  });
  it('no empty strings, and ur differs from en for real sentences', () => {
    for (const [k, v] of Object.entries(u)) expect(v.trim(), k).not.toBe('');
    expect(u['cart.checkout']).not.toBe(e['cart.checkout']);
  });
  it('interpolation tags match between en and ur', () => {
    const tags = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort().join(',');
    for (const k of Object.keys(e)) expect(tags(u[k]), k).toBe(tags(e[k]));
  });
});

describe('runtime lookup', () => {
  it('serves Urdu, plurals and copy defaults, and falls back to the English default', async () => {
    const { default: i18n } = await import('./index');
    const { tCopyDefault, ts } = await import('@/utils/tStatic');
    await i18n.changeLanguage('ur');
    expect(ts('cart.checkout', 'Checkout')).toBe(ur.cart.checkout);
    expect(tCopyDefault('Add to Cart')).toBe('کارٹ میں شامل کریں');
    expect(i18n.t('nav.cartAria', { ns: 'storefront', count: 2, defaultValue_other: 'x' })).toContain('2');
    expect(ts('not.a.key', 'English default')).toBe('English default');
    expect(tCopyDefault('Totally unknown copy')).toBe('Totally unknown copy');
    await i18n.changeLanguage('en');
    expect(ts('cart.checkout', 'Checkout')).toBe('Checkout');
  });
});
