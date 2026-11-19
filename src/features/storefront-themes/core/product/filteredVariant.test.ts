import { describe, it, expect } from 'vitest';
import { firstMatchingVariant } from './filteredVariant';

const variants = [
  { _id: 'a', options: [{ name: 'Color', value: 'Brown' }], images: ['brown.jpg'] },
  { _id: 'b', options: [{ name: 'Color', value: 'Gray' }], images: ['gray.jpg'] },
  { _id: 'c', options: [{ name: 'Color', value: 'Gray' }, { name: 'Size', value: 'L' }], images: [] },
];

describe('firstMatchingVariant (Shopify storefront filtering)', () => {
  it('no option filter = nothing changes', () => { expect(firstMatchingVariant(variants, {})).toBeNull(); });
  it('a Color filter picks the first variant of that colour', () => {
    expect(firstMatchingVariant(variants, { Color: ['Gray'] })?._id).toBe('b');
    expect(firstMatchingVariant(variants, { color: ['gray', 'brown'] })?._id).toBe('a');
  });
  it('every filtered option must match; no match = null', () => {
    expect(firstMatchingVariant(variants, { Color: ['Gray'], Size: ['L'] })?._id).toBe('c');
    expect(firstMatchingVariant(variants, { Color: ['Red'] })).toBeNull();
  });
});
