import { describe, expect, it } from 'vitest';
import { columnCount, MAX_COLUMNS, responsiveGridColumnsClass, sectionGridColumnsClass } from './gridLayout';

describe('responsiveGridColumnsClass', () => {
  it.each([
    [2, 'grid-cols-2 md:grid-cols-2'],
    [3, 'grid-cols-2 md:grid-cols-3'],
    [4, 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'],
  ] as const)('uses two columns on mobile and %i columns from tablet width', (columns, expected) => {
    expect(responsiveGridColumnsClass(columns)).toBe(expected);
  });

  it('keeps the established responsive layout when no setting is saved', () => {
    expect(responsiveGridColumnsClass()).toBe('grid-cols-2 md:grid-cols-3 lg:grid-cols-4');
  });

  it('supports 1 and 5 to 8 columns on wide screens', () => {
    expect(responsiveGridColumnsClass(1)).toBe('grid-cols-1');
    expect(responsiveGridColumnsClass(5)).toContain('lg:grid-cols-5');
    expect(responsiveGridColumnsClass(8)).toContain('xl:grid-cols-8');
    for (let n = 1; n <= MAX_COLUMNS; n++) expect(responsiveGridColumnsClass(n)).not.toBe('');
  });
});

describe('sectionGridColumnsClass', () => {
  it('keeps the earlier 2, 3 and 4 column layouts', () => {
    expect(sectionGridColumnsClass(2)).toBe('grid-cols-2');
    expect(sectionGridColumnsClass(3)).toBe('grid-cols-2 lg:grid-cols-3');
    expect(sectionGridColumnsClass(4)).toBe('grid-cols-2 lg:grid-cols-4');
    expect(sectionGridColumnsClass()).toBe('grid-cols-2 lg:grid-cols-4');
  });
  it('adds 1 and 5 to 8 columns', () => {
    expect(sectionGridColumnsClass(1)).toBe('grid-cols-1');
    expect(sectionGridColumnsClass(6)).toContain('xl:grid-cols-6');
    expect(sectionGridColumnsClass(8)).toContain('xl:grid-cols-8');
  });
});

describe('columnCount', () => {
  it('accepts whole numbers from 1 to 8 (also typed as text)', () => {
    expect(columnCount(1, 4)).toBe(1);
    expect(columnCount(6, 4)).toBe(6);
    expect(columnCount('8', 4)).toBe(8);
  });
  it('falls back for empty, zero, too big, fractions and text', () => {
    for (const bad of [undefined, null, '', 0, 9, 2.5, -1, 'abc', NaN]) expect(columnCount(bad, 3)).toBe(3);
  });
  it('can require a higher minimum', () => {
    expect(columnCount(1, 2, 2)).toBe(2);
    expect(columnCount(2, 3, 2)).toBe(2);
  });
});
