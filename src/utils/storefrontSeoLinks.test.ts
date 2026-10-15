import { describe, expect, it } from 'vitest';
import { buildCanonicalUrl, buildHreflangLinks, localizedUrl, stripLocalePrefix } from './storefrontSeoLinks';

describe('seo helpers', () => {
  it('strips the prefix', () => {
    expect(stripLocalePrefix('/ur/product/a')).toBe('/product/a');
    expect(stripLocalePrefix('/ur')).toBe('/');
    expect(stripLocalePrefix('/product/a')).toBe('/product/a');
  });
  it('builds localized urls with no prefix for the default language', () => {
    expect(localizedUrl('https://s.com', '/cart', 'en')).toBe('https://s.com/cart');
    expect(localizedUrl('https://s.com', '/cart', 'ur')).toBe('https://s.com/ur/cart');
    expect(localizedUrl('https://s.com/', '/', 'ur')).toBe('https://s.com/ur/');
  });
  it('hreflang only for offered languages, x-default = default', () => {
    expect(buildHreflangLinks('https://s.com', '/ur/cart', ['en'])).toEqual([]);
    expect(buildHreflangLinks('https://s.com', '/ur/cart', ['en', 'ur'])).toEqual([
      { hreflang: 'en', href: 'https://s.com/cart' },
      { hreflang: 'ur', href: 'https://s.com/ur/cart' },
      { hreflang: 'x-default', href: 'https://s.com/cart' },
    ]);
  });
  it('canonical is self-referencing per language', () => {
    expect(buildCanonicalUrl('https://s.com', '/ur/cart', 'ur')).toBe('https://s.com/ur/cart');
    expect(buildCanonicalUrl('https://s.com', '/cart', 'en')).toBe('https://s.com/cart');
  });
});
