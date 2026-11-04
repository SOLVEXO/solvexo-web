import { describe, expect, it } from 'vitest';
import { clampPageSize } from './useProductBrowse';

describe('clampPageSize', () => {
  it('keeps seller choices inside the range the API accepts (max 50)', () => {
    expect(clampPageSize(24)).toBe(24);
    expect(clampPageSize(1)).toBe(4);
    expect(clampPageSize(500)).toBe(48);
  });
  it('falls back to 12 for junk', () => {
    expect(clampPageSize(Number.NaN)).toBe(12);
    expect(clampPageSize(0)).toBe(12);
  });
});
