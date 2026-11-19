import { describe, it, expect } from 'vitest';
import { featuredProductsQuery as q, featuredViewAllPath, needsPick } from './sectionProductQuery';

describe('featuredProductsQuery: the fixed lists (unchanged behaviour)', () => {
  it('maps every older source exactly as before', () => {
    expect(q({ source: 'bestsellers', limit: 4 })).toEqual({ limit: 4, sort: 'best_selling' });
    expect(q({ source: 'trending' })).toEqual({ limit: 8, sort: 'trending' });
    expect(q({ source: 'onSale' })).toEqual({ limit: 8, onSale: true, sort: 'newest' });
    expect(q({ source: 'category', categoryId: 'c1' })).toEqual({ limit: 8, categoryId: 'c1', sort: 'newest' });
    expect(q({ source: 'collection', collectionId: 'k1' })).toEqual({ limit: 8, collectionId: 'k1', sort: 'newest' });
    expect(q({ source: 'newArrivals' })).toEqual({ limit: 8, sort: 'newest' });
    expect(q({})).toEqual({ limit: 8, sort: 'newest' });
  });

  it('hand-picked keeps the ids in order; nothing picked shows nothing (never "all newest")', () => {
    expect(q({ source: 'manual', productIds: ['a', 'b'], limit: 5 })).toEqual({ ids: ['a', 'b'], limit: 5 });
    expect(q({ source: 'pinned', productIds: [] })).toEqual({ ids: ['000000000000000000000000'], limit: 8 });
    expect(q({ source: 'manual' })).toEqual({ ids: ['000000000000000000000000'], limit: 8 });
    expect(q({ source: 'collection' }).ids).toEqual(['000000000000000000000000']);
    expect(q({ source: 'category', categoryId: '' }).ids).toEqual(['000000000000000000000000']);
    expect(needsPick({ source: 'collection', collectionId: 'k1' })).toBe(false);
    expect(needsPick({ source: 'newArrivals' })).toBe(false);
    expect(q({ source: 'manual', productIds: [1, null, ' x '] as never })).toEqual({ ids: ['x'], limit: 8 });
  });

  it('limit: the section\'s own default, clamped to 1-24', () => {
    expect(q({ source: 'trending' }, 10).limit).toBe(10);
    expect(q({ source: 'trending', limit: 99 }).limit).toBe(24);
    expect(q({ source: 'trending', limit: -3 }, 10).limit).toBe(1);
    expect(q({ source: 'trending', limit: 'many' as never }, 6).limit).toBe(6);
  });
});

describe('featuredProductsQuery: rules', () => {
  it('no rule at all = every product, newest first', () => {
    expect(q({ source: 'rules' })).toEqual({ limit: 8, sort: 'newest' });
  });

  it('turns every rule into the products query', () => {
    expect(q({
      source: 'rules', limit: 12, ruleTags: ['summer', ' sale '], ruleVendors: ['Nike'], rulePriceMin: 10, rulePriceMax: 100,
      ruleType: 'physical', ruleStock: 'in_stock', ruleOnSale: true, ruleSort: 'price_asc', categoryId: 'c1', collectionId: 'k1',
    })).toEqual({
      limit: 12, sort: 'price_asc', categoryId: 'c1', collectionId: 'k1', tags: ['summer', 'sale'], vendors: ['Nike'], minPrice: 10, maxPrice: 100,
      type: 'physical', availability: 'in_stock', onSale: true,
    });
  });

  it('a price of 0 counts (free products), negatives and junk are ignored', () => {
    expect(q({ source: 'rules', rulePriceMin: 0 }).minPrice).toBe(0);
    const junk = q({ source: 'rules', rulePriceMin: -5, rulePriceMax: 'x' as never, ruleType: 'all', ruleStock: 'any', ruleOnSale: false, ruleSort: 'random' as never });
    expect(junk).toEqual({ limit: 8, sort: 'newest' });
  });

  it('tags / vendors: only real strings, at most 20', () => {
    const many = Array.from({ length: 30 }, (_, i) => `t${i}`);
    expect(q({ source: 'rules', ruleTags: many }).tags).toHaveLength(20);
    expect(q({ source: 'rules', ruleTags: [1, '', '  ', 'ok'] as never }).tags).toEqual(['ok']);
    expect(q({ source: 'rules', ruleTags: 'summer' as never }).tags).toBeUndefined();
  });

  it('rule fields are ignored for the fixed sources', () => {
    expect(q({ source: 'bestsellers', ruleTags: ['x'], rulePriceMin: 5 })).toEqual({ limit: 8, sort: 'best_selling' });
  });
});

describe('hide sold out (any source)', () => {
  it('asks for in-stock products only', () => {
    expect(q({ source: 'bestsellers', hideSoldOut: true })).toEqual({ limit: 8, sort: 'best_selling', availability: 'in_stock' });
    expect(q({ source: 'manual', productIds: ['a'], hideSoldOut: true })).toEqual({ ids: ['a'], limit: 8, availability: 'in_stock' });
    expect(q({ source: 'bestsellers', hideSoldOut: false })).not.toHaveProperty('availability');
  });
});

describe('featuredViewAllPath', () => {
  it('a collection list links to that collection; everything else to the shop search', () => {
    expect(featuredViewAllPath({ source: 'collection', collectionId: 'k1' })).toBe('/collections/k1');
    expect(featuredViewAllPath({ source: 'bestsellers' })).toBe('/search');
    expect(featuredViewAllPath({ source: 'collection' })).toBe('/search');
  });
  it('rules: the collection only when it is the whole list', () => {
    expect(featuredViewAllPath({ source: 'rules', collectionId: 'k1' })).toBe('/collections/k1');
    expect(featuredViewAllPath({ source: 'rules', collectionId: 'k1', ruleTags: ['sale'] })).toBe('/search');
    expect(featuredViewAllPath({ source: 'rules', collectionId: 'k1', ruleOnSale: true })).toBe('/search');
    expect(featuredViewAllPath({ source: 'rules' })).toBe('/search');
  });
});
