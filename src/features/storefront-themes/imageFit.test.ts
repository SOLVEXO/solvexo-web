import { describe, expect, it } from 'vitest';
import { mobileHeightOf } from './imageFit';

describe('mobileHeightOf', () => {
  it('follows the desktop height unless the phone has its own', () => {
    expect(mobileHeightOf('large', undefined)).toBe('large');
    expect(mobileHeightOf('large', 'same')).toBe('large');
    expect(mobileHeightOf('large', 'small')).toBe('small');
  });
  it('knows the custom height on both desktop and phone', () => {
    expect(mobileHeightOf('custom', undefined)).toBe('custom');
    expect(mobileHeightOf('large', 'custom')).toBe('custom');
    expect(mobileHeightOf('medium', 'bogus')).toBe('medium');
  });
});
