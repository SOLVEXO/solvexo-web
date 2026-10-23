import { describe, expect, it } from 'vitest';
import { countryBasename, countryFromPathname, switchCountryPath } from './countryPrefix';

describe('countryPrefix', () => {
  it('reads a real country code at the start of the path', () => {
    expect(countryFromPathname('/pk/pricing')).toBe('pk');
    expect(countryFromPathname('/PK')).toBe('pk');
    expect(countryFromPathname('/ae/')).toBe('ae');
  });
  it('ignores anything that is not a country code', () => {
    expect(countryFromPathname('/')).toBeNull();
    expect(countryFromPathname('/login')).toBeNull();
    expect(countryFromPathname('/store/abc')).toBeNull();
    expect(countryFromPathname('/zz/x')).toBeNull();
  });
  it('builds the router basename', () => {
    expect(countryBasename('/pk/register')).toBe('/pk');
    expect(countryBasename('/register')).toBe('/');
  });
  it('switches country keeping the page, query and hash', () => {
    expect(switchCountryPath('/pk/pricing', '?a=1', '#x', 'ae')).toBe('/ae/pricing?a=1#x');
    expect(switchCountryPath('/pricing', '', '', 'GB')).toBe('/gb/pricing');
    expect(switchCountryPath('/pk', '', '', 'in')).toBe('/in/');
    expect(switchCountryPath('/', '', '', 'us')).toBe('/us/');
  });
});
