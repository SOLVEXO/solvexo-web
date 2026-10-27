import { describe, it, expect } from 'vitest';
import { parseStatValue } from './statValue';

describe('parseStatValue', () => {
  it('splits a number from its prefix and suffix', () => {
    expect(parseStatValue('10k+')).toEqual({ prefix: '', target: 10, decimals: 0, grouped: false, suffix: 'k+' });
    expect(parseStatValue('$1,200')).toEqual({ prefix: '$', target: 1200, decimals: 0, grouped: true, suffix: '' });
    expect(parseStatValue('4.8 / 5')).toEqual({ prefix: '', target: 4.8, decimals: 1, grouped: false, suffix: ' / 5' });
  });
  it('leaves text without digits as typed', () => {
    expect(parseStatValue('Since forever')).toBeNull();
    expect(parseStatValue('')).toBeNull();
  });
});
