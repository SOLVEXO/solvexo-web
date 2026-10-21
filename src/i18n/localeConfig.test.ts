import { describe, expect, it } from 'vitest';
import { basenameFromPathname, isRtlLocale, localeFromPathname, switchLocalePath, uiLanguageFor } from './localeConfig';

describe('localeConfig', () => {
  it('detects a locale prefix for any supported code, English included', () => {
    expect(localeFromPathname('/ur/product/x')).toBe('ur');
    expect(localeFromPathname('/ur')).toBe('ur');
    expect(localeFromPathname('/en/cart')).toBe('en');
    expect(localeFromPathname('/xx/cart')).toBeNull();
    expect(localeFromPathname('/about-us')).toBeNull();
    expect(localeFromPathname('/')).toBeNull();
  });
  it('basename', () => {
    expect(basenameFromPathname('/fr/cart')).toBe('/fr');
    expect(basenameFromPathname('/cart')).toBe('/');
  });
  it('switches the prefix', () => {
    expect(switchLocalePath('/cart', '?a=1', '', 'ur')).toBe('/ur/cart?a=1');
    expect(switchLocalePath('/ur/cart', '', '#x', 'en')).toBe('/cart#x');
    expect(switchLocalePath('/ur', '', '', 'en')).toBe('/');
    expect(switchLocalePath('/', '', '', 'ur')).toBe('/ur/');
    expect(switchLocalePath('/ur/cart', '', '', 'fr')).toBe('/fr/cart');
    // a store written in Urdu: Urdu has no prefix, English does
    expect(switchLocalePath('/cart', '', '', 'en', 'ur')).toBe('/en/cart');
    expect(switchLocalePath('/en/cart', '', '', 'ur', 'ur')).toBe('/cart');
  });
  it('rtl + ui language fallback', () => {
    expect(isRtlLocale('ur')).toBe(true);
    expect(isRtlLocale('fr')).toBe(false);
    expect(uiLanguageFor('fr')).toBe('fr');
    expect(uiLanguageFor('he')).toBe('he'); // bundle generated on demand
    expect(uiLanguageFor('xx')).toBe('en');
    expect(uiLanguageFor('ur')).toBe('ur');
  });
});
