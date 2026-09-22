import { describe, it, expect } from 'vitest';
import { COUNTRY_OPTIONS, isSameCountry } from './countries';

// Regression coverage for the real shipping-zone country-matching bug: a
// shipping zone's country and a buyer's address country must be reliably
// comparable, and the shared country list must be real (not empty/fake).
describe('countries util', () => {
  it('produces a real, non-empty list of countries with codes and names', () => {
    expect(COUNTRY_OPTIONS.length).toBeGreaterThan(190);
    const pakistan = COUNTRY_OPTIONS.find(c => c.code === 'PK');
    expect(pakistan?.name).toBe('Pakistan');
  });

  it('is sorted alphabetically by name', () => {
    const names = COUNTRY_OPTIONS.map(c => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  describe('isSameCountry', () => {
    it('matches identical strings', () => {
      expect(isSameCountry('Pakistan', 'Pakistan')).toBe(true);
    });
    it('matches case-insensitively (old free-typed zone data vs a dropdown pick)', () => {
      expect(isSameCountry('pakistan', 'Pakistan')).toBe(true);
      expect(isSameCountry('PAKISTAN', 'Pakistan')).toBe(true);
    });
    it('matches with surrounding whitespace ignored', () => {
      expect(isSameCountry(' Pakistan ', 'Pakistan')).toBe(true);
    });
    it('does not match different countries — the exact bug this fix closes', () => {
      expect(isSameCountry('Pakistan', 'Canada')).toBe(false);
    });
    it('never matches when either side is missing', () => {
      expect(isSameCountry(null, 'Pakistan')).toBe(false);
      expect(isSameCountry('Pakistan', null)).toBe(false);
      expect(isSameCountry(null, null)).toBe(false);
      expect(isSameCountry('', 'Pakistan')).toBe(false);
    });
  });
});
