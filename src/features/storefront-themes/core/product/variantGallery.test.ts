import { describe, expect, it } from 'vitest';
import { variantGallery } from './variantGallery';

const product = ['common', 'b1', 'b2', 'p1', 'p2'];
const black = { images: ['b1', 'b2'] };
const pink = { images: ['p1', 'p2'] };
const none = { images: [] as string[] };

describe('variantGallery', () => {
  it('shows only the chosen colour photos first, then the shared ones', () => {
    expect(variantGallery(pink, [black, pink], product)).toEqual(['p1', 'p2', 'common']);
    expect(variantGallery(black, [black, pink], product)).toEqual(['b1', 'b2', 'common']);
  });

  it('a variant with no photos of its own (and old products) shows the whole gallery', () => {
    expect(variantGallery(none, [black, pink, none], product)).toEqual(product);
    expect(variantGallery(null, [], product)).toEqual(product);
  });

  it('a photo linked to several variants shows for each of them (every size of one colour)', () => {
    const pinkS = { images: ['p1', 'p2'] };
    const pinkM = { images: ['p1', 'p2'] };
    expect(variantGallery(pinkM, [black, pinkS, pinkM], product)).toEqual(['p1', 'p2', 'common']);
  });

  it('keeps the seller order of the gallery and tolerates a photo missing from the product list', () => {
    expect(variantGallery({ images: ['p2', 'gone', 'p1'] }, [pink], product)).toEqual(['p1', 'p2', 'gone', 'common', 'b1', 'b2']);
  });
});
