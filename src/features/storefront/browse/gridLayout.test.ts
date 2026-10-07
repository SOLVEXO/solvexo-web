import { describe, expect, it } from 'vitest';
import { responsiveGridColumnsClass } from './gridLayout';

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
});
