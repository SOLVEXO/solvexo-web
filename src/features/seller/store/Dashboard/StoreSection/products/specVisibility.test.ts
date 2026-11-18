import { describe, expect, it } from 'vitest';
import { categorySummary, flattenCategories, moveBefore, moveStep, specAppliesTo } from './specVisibility';

const L = (...ids: string[]) => ids.map(_id => ({ _id }));
const ids = (l: { _id: string }[]) => l.map(x => x._id);

describe('specAppliesTo', () => {
  it('a spec with no categories is for every product', () => {
    expect(specAppliesTo({ categoryIds: [] }, [], false)).toBe(true);
    expect(specAppliesTo({}, ['c1'], false)).toBe(true);
    expect(specAppliesTo({ categoryIds: null }, [], false)).toBe(true);
  });
  it('a spec with categories shows only for products in them (category or sub-category)', () => {
    expect(specAppliesTo({ categoryIds: ['clothing'] }, ['clothing', 'shirts'], false)).toBe(true);
    expect(specAppliesTo({ categoryIds: ['shirts'] }, ['clothing', 'shirts'], false)).toBe(true);
    expect(specAppliesTo({ categoryIds: ['clothing'] }, ['electronics', ''], false)).toBe(false);
    expect(specAppliesTo({ categoryIds: ['clothing'] }, [], false)).toBe(false); // no category chosen yet
  });
  it('never hides a spec the product already has a value for', () => {
    expect(specAppliesTo({ categoryIds: ['clothing'] }, ['electronics'], true)).toBe(true);
  });
});

describe('moveBefore (drag and drop)', () => {
  it('puts the dragged one where the other was, both directions', () => {
    expect(ids(moveBefore(L('a', 'b', 'c', 'd'), 'd', 'b'))).toEqual(['a', 'd', 'b', 'c']);
    expect(ids(moveBefore(L('a', 'b', 'c', 'd'), 'a', 'c'))).toEqual(['b', 'c', 'a', 'd']);
  });
  it('leaves the list alone for the same item or an unknown id', () => {
    const l = L('a', 'b');
    expect(moveBefore(l, 'a', 'a')).toBe(l);
    expect(moveBefore(l, 'zz', 'a')).toBe(l);
    expect(moveBefore(l, 'a', 'zz')).toBe(l);
  });
});

describe('moveStep (Move up / Move down)', () => {
  it('swaps with the neighbour', () => {
    expect(ids(moveStep(L('a', 'b', 'c'), 'b', -1))).toEqual(['b', 'a', 'c']);
    expect(ids(moveStep(L('a', 'b', 'c'), 'b', 1))).toEqual(['a', 'c', 'b']);
  });
  it('does nothing at the ends', () => {
    const l = L('a', 'b', 'c');
    expect(moveStep(l, 'a', -1)).toBe(l);
    expect(moveStep(l, 'c', 1)).toBe(l);
  });
  it('steps over specs that are hidden for this product', () => {
    const hidden = new Set(['b']);
    expect(ids(moveStep(L('a', 'b', 'c'), 'c', -1, x => !hidden.has(x._id)))).toEqual(['c', 'b', 'a']);
  });
});

describe('categories list', () => {
  const tree = [{ _id: 'cl', name: 'Clothing', children: [{ _id: 'sh', name: 'Shirts', children: [] }] }, { _id: 'el', name: 'Electronics' }];
  it('flattens the tree with depth for indenting', () => {
    expect(flattenCategories(tree)).toEqual([{ id: 'cl', name: 'Clothing', depth: 0 }, { id: 'sh', name: 'Shirts', depth: 1 }, { id: 'el', name: 'Electronics', depth: 0 }]);
    expect(flattenCategories(null)).toEqual([]);
  });
  it('summarises the chosen ones', () => {
    const o = flattenCategories(tree);
    expect(categorySummary([], o)).toBe('');
    expect(categorySummary(['cl'], o)).toBe('Clothing');
    expect(categorySummary(['cl', 'sh', 'el'], o)).toBe('Clothing, Shirts +1');
    expect(categorySummary(['gone'], o)).toBe('');
  });
});
