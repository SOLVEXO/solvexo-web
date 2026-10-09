import { describe, expect, it } from 'vitest';
import { buildNavImageLookup, isMegaItem, normalizeNavItems } from './megaNav';
import { resolveStorefrontLink, type StorefrontNavItemSettings } from '@/features/storefront/StorefrontContext';
import type { CategoryNode } from '@/api/services/categories';
import type { PublicCollectionSummary } from '@/api/services/collections';

const cat = (over: Partial<CategoryNode>): CategoryNode => ({
  _id: 'c', name: 'C', slug: 'c', parentId: null, storeId: 's', image: null, description: null, sortOrder: 0,
  status: 'active', isDelete: false, createdBy: null, createdByRole: null, createdAt: '', updatedAt: '', children: [], ...over,
});

describe('megaNav', () => {
  it('builds an image lookup that includes nested categories and collections', () => {
    const lookup = buildNavImageLookup(
      [cat({ _id: 'a', image: 'https://x/a.jpg', children: [cat({ _id: 'b', image: 'https://x/b.jpg' })] })],
      [{ _id: 'col', image: 'https://x/col.jpg' } as PublicCollectionSummary],
    );
    expect(lookup.category.get('a')).toBe('https://x/a.jpg');
    expect(lookup.category.get('b')).toBe('https://x/b.jpg');
    expect(lookup.collection.get('col')).toBe('https://x/col.jpg');
  });

  it('normalizes three levels, gives idless items positional ids, defaults to dropdown', () => {
    const items: StorefrontNavItemSettings[] = [{
      label: 'Shop', linkType: 'home',
      children: [{ label: 'Room', linkType: 'home', children: [{ label: 'Sofas', linkType: 'page', pageSlug: 'sofas' }] }],
    }];
    const [top] = normalizeNavItems(items, resolveStorefrontLink);
    expect(top.id).toBe('nav-0');
    expect(top.menuStyle).toBe('dropdown');
    expect(top.children[0].id).toBe('nav-0-0');
    expect(top.children[0].children[0].link).toEqual({ to: '/sofas' });
    expect(isMegaItem(top)).toBe(false);
  });

  it('prefers the seller image, falls back to the linked category image, else null', () => {
    const lookup = buildNavImageLookup([cat({ _id: 'a', image: 'https://x/a.jpg' })], []);
    const [top] = normalizeNavItems([{
      label: 'Shop', linkType: 'home', menuStyle: 'mega',
      children: [
        { label: 'Own', linkType: 'category', categoryId: 'a', imageUrl: 'https://x/own.jpg' },
        { label: 'Linked', linkType: 'category', categoryId: 'a' },
        { label: 'None', linkType: 'home' },
      ],
    }], resolveStorefrontLink, lookup);
    expect(top.children.map(c => c.imageUrl)).toEqual(['https://x/own.jpg', 'https://x/a.jpg', null]);
    expect(isMegaItem(top)).toBe(true);
  });

  it('a mega item with no children is not treated as mega', () => {
    const [top] = normalizeNavItems([{ label: 'Sale', linkType: 'home', menuStyle: 'mega' }], resolveStorefrontLink);
    expect(isMegaItem(top)).toBe(false);
  });
});
