import { describe, expect, it } from 'vitest';
import { basenameFromPathname, isRtlLocale, localeFromPathname, switchLocalePath, uiLanguageFor } from './localeConfig';

describe('localeConfig', () => {
  it('detects a locale prefix only for supported non-default codes', () => {
    expect(localeFromPathname('/ur/product/x')).toBe('ur');
    expect(localeFromPathname('/ur')).toBe('ur');
    expect(localeFromPathname('/en/cart')).toBeNull();
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
  });
  it('rtl + ui language fallback', () => {
    expect(isRtlLocale('ur')).toBe(true);
    expect(isRtlLocale('fr')).toBe(false);
    expect(uiLanguageFor('fr')).toBe('fr');
    expect(uiLanguageFor('he')).toBe('en'); // no bundle yet
    expect(uiLanguageFor('ur')).toBe('ur');
  });
});
