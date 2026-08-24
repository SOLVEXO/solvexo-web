import { describe, it, expect } from 'vitest';
import { buildCombinations, combinationKey, mergeExistingRows, type VariantCombination } from './variantMatrix';

describe('buildCombinations', () => {
  it('returns an empty matrix when there are no option types', () => {
    expect(buildCombinations([])).toEqual([]);
  });

  it('drops an option type with no real values', () => {
    expect(buildCombinations([{ name: 'Size', values: ['', '  '] }])).toEqual([]);
  });

  it('one option type with N values produces N combinations, in order', () => {
    const combos = buildCombinations([{ name: 'Size', values: ['S', 'M', 'L'] }]);
    expect(combos.map(c => c.options)).toEqual([
      [{ name: 'Size', value: 'S' }],
      [{ name: 'Size', value: 'M' }],
      [{ name: 'Size', value: 'L' }],
    ]);
  });

  it('two option types produce the full Cartesian product (Size x Color)', () => {
    const combos = buildCombinations([
      { name: 'Size', values: ['S', 'M'] },
      { name: 'Color', values: ['Red', 'Blue'] },
    ]);
    expect(combos).toHaveLength(4);
    expect(combos.map(c => c.options)).toEqual([
      [{ name: 'Size', value: 'S' }, { name: 'Color', value: 'Red' }],
      [{ name: 'Size', value: 'S' }, { name: 'Color', value: 'Blue' }],
      [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'Red' }],
      [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'Blue' }],
    ]);
  });

  it('three option types multiply correctly (2 x 2 x 2 = 8)', () => {
    const combos = buildCombinations([
      { name: 'Size', values: ['S', 'M'] },
      { name: 'Color', values: ['Red', 'Blue'] },
      { name: 'Material', values: ['Cotton', 'Silk'] },
    ]);
    expect(combos).toHaveLength(8);
  });

  it('trims whitespace and drops blank values without producing blank-valued combinations', () => {
    const combos = buildCombinations([{ name: '  Size  ', values: ['S', '', '  M  '] }]);
    expect(combos.map(c => c.options)).toEqual([
      [{ name: 'Size', value: 'S' }],
      [{ name: 'Size', value: 'M' }],
    ]);
  });

  it('every combination gets a stable, order-independent key', () => {
    const combos = buildCombinations([
      { name: 'Size', values: ['S'] },
      { name: 'Color', values: ['Red'] },
    ]);
    expect(combos[0].key).toBe(combinationKey([{ name: 'Color', value: 'Red' }, { name: 'Size', value: 'S' }]));
  });
});

describe('mergeExistingRows', () => {
  interface Row { key: string; price: number }

  it('preserves an existing row\'s data when its combination still exists after regeneration', () => {
    const combos: VariantCombination[] = buildCombinations([{ name: 'Size', values: ['S', 'M'] }]);
    const existing: Row[] = [{ key: combos[0].key, price: 25 }, { key: combos[1].key, price: 30 }];
    const merged = mergeExistingRows(combos, existing, () => ({ key: 'blank', price: 0 }));
    expect(merged).toEqual([{ key: combos[0].key, price: 25 }, { key: combos[1].key, price: 30 }]);
  });

  it('assigns a blank row only to a genuinely new combination', () => {
    const before = buildCombinations([{ name: 'Size', values: ['S'] }]);
    const after = buildCombinations([{ name: 'Size', values: ['S', 'M'] }]);
    const existing: Row[] = [{ key: before[0].key, price: 25 }];
    const merged = mergeExistingRows(after, existing, combo => ({ key: combo.key, price: -1 }));
    expect(merged).toEqual([{ key: before[0].key, price: 25 }, { key: after[1].key, price: -1 }]);
  });

  it('drops a row whose combination no longer exists (value removed)', () => {
    const before = buildCombinations([{ name: 'Size', values: ['S', 'M'] }]);
    const after = buildCombinations([{ name: 'Size', values: ['S'] }]);
    const existing: Row[] = [{ key: before[0].key, price: 25 }, { key: before[1].key, price: 30 }];
    const merged = mergeExistingRows(after, existing, combo => ({ key: combo.key, price: -1 }));
    expect(merged).toEqual([{ key: before[0].key, price: 25 }]);
  });
});
