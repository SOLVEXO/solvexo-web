import { describe, expect, it } from 'vitest';
import { arrivalText } from './deliveryText';

const today = new Date('2026-10-20T12:00:00Z');

describe('arrivalText', () => {
  it('writes a date range from the zone\'s own delivery days', () => {
    expect(arrivalText(3, 5, 'en', today)).toBe('Arrives Oct 23 - Oct 25');
  });
  it('writes one date when min and max are the same, and uses either bound alone', () => {
    expect(arrivalText(2, 2, 'en', today)).toBe('Arrives Oct 22');
    expect(arrivalText(null, 4, 'en', today)).toBe('Arrives Oct 24');
    expect(arrivalText(4, undefined, 'en', today)).toBe('Arrives Oct 24');
  });
  it('promises nothing when the store set no delivery days', () => {
    expect(arrivalText(null, null, 'en', today)).toBeNull();
    expect(arrivalText(undefined, undefined, 'en', today)).toBeNull();
  });
});
