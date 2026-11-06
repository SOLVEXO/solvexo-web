import { describe, expect, it } from 'vitest';
import { getCountries } from 'react-phone-number-input';
import { COUNTRY_CODES } from './countryCodes';
import { COUNTRY_OPTIONS } from './countries';

describe('country list', () => {
  it('matches the phone-number library it was copied from', () => {
    expect([...COUNTRY_CODES].sort()).toEqual([...getCountries()].sort());
    expect(COUNTRY_OPTIONS.find(c => c.code === 'PK')?.name).toBe('Pakistan');
  });
});
