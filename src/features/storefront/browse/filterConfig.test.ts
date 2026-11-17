import { describe, it, expect } from 'vitest';
import { arrangeFilterGroups, visibleSorts } from './filterConfig';

const g = (id: string, count = 0) => ({ id, count });
const groups = [g('availability'), g('price'), g('type'), g('opt:Size'), g('opt:Color'), g('tag')];

describe('arrangeFilterGroups', () => {
  it('no config = untouched', () => {
    expect(arrangeFilterGroups(groups, undefined)).toBe(groups);
    expect(arrangeFilterGroups(groups, [])).toBe(groups);
  });
  it('hides switched-off filters, keeps those without a switch (product type)', () => {
    const out = arrangeFilterGroups(groups, [{ key: 'availability', enabled: false }, { key: 'price', enabled: true }, { key: 'tags', enabled: false }, { key: 'options', enabled: true }]);
    expect(out.map(x => x.id)).toEqual(['price', 'opt:Size', 'opt:Color', 'type']);
  });
  it('follows the seller order; all option groups move together; unknown stay last', () => {
    const out = arrangeFilterGroups(groups, [{ key: 'tags', enabled: true }, { key: 'options', enabled: true }, { key: 'price', enabled: true }, { key: 'availability', enabled: true }]);
    expect(out.map(x => x.id)).toEqual(['tag', 'opt:Size', 'opt:Color', 'price', 'availability', 'type']);
  });
  it('a filter the shopper already applied stays visible even if switched off', () => {
    const out = arrangeFilterGroups([g('tag', 1), g('price')], [{ key: 'tags', enabled: false }, { key: 'price', enabled: false }]);
    expect(out.map(x => x.id)).toEqual(['tag']);
  });
});

describe('visibleSorts', () => {
  const opts = [{ value: 'newest' }, { value: 'best_selling' }, { value: 'price_asc' }, { value: 'price_desc' }];
  it('no config = untouched', () => { expect(visibleSorts(opts, undefined)).toBe(opts); });
  it('hides off sorts and orders by the seller', () => {
    const out = visibleSorts(opts, [{ key: 'newest', enabled: true }, { key: 'price_desc', enabled: true }, { key: 'price_asc', enabled: true }, { key: 'best_selling', enabled: false }]);
    expect(out.map(o => o.value)).toEqual(['newest', 'price_desc', 'price_asc']);
  });
  it('keeps the sort the shopper is on', () => {
    expect(visibleSorts(opts, [{ key: 'best_selling', enabled: false }], 'best_selling').map(o => o.value)).toContain('best_selling');
  });
});
