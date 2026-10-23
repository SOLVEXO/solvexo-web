/* eslint-disable @typescript-eslint/no-explicit-any -- tests poke into loosely typed JSON-LD output */
import { describe, expect, it } from 'vitest';
import {
  ITEM_LIST_CAP, absImage, articleJsonLd, blogJsonLd, breadcrumbJsonLd, clean, collectionJsonLd, pageUrlBuilder, plainText, productJsonLd, serializeJsonLd,
} from './jsonLd';

const origin = 'https://shop.example.com';

describe('jsonLd builders', () => {
  it('clean drops undefined, null, empty values', () => {
    expect(clean({ a: 1, b: undefined, c: '', d: [], e: { f: undefined }, g: null, h: ['x', ''] })).toEqual({ a: 1, h: ['x'] });
  });

  it('serialises without a way to close the script tag', () => {
    const s = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(s).not.toContain('<');
    expect(JSON.parse(s).name).toBe('</script><script>alert(1)</script>');
  });

  it('strips html from text', () => {
    expect(plainText('<p>Hello <b>world</b></p>&nbsp;!')).toBe('Hello world !');
    expect(plainText('<br>')).toBeUndefined();
  });

  it('keeps the language prefix when building urls', () => {
    expect(pageUrlBuilder(origin, '/ur/product/x')('/product/y')).toBe(`${origin}/ur/product/y`);
    expect(pageUrlBuilder(origin, '/product/x')('/')).toBe(`${origin}/`);
  });

  it('makes images absolute or drops them', () => {
    expect(absImage('/a.png', origin)).toBe(`${origin}/a.png`);
    expect(absImage('https://c.io/a.png', origin)).toBe('https://c.io/a.png');
    expect(absImage('data:xx', origin)).toBeUndefined();
  });

  it('collection: CollectionPage with capped ItemList', () => {
    const products = Array.from({ length: 40 }, (_, i) => ({ slug: `p${i}`, name: `P${i}`, images: ['/i.png'] }));
    const ld = collectionJsonLd({ name: 'Shirts', description: '<p>Nice</p>', url: `${origin}/collections/shirts`, origin, products, urlFor: pageUrlBuilder(origin, '/ur/collections/shirts') }) as any;
    expect(ld['@type']).toBe('CollectionPage');
    expect(ld.description).toBe('Nice');
    expect(ld.mainEntity.itemListElement).toHaveLength(ITEM_LIST_CAP);
    expect(ld.mainEntity.itemListElement[1]).toMatchObject({ position: 2, url: `${origin}/ur/product/p1`, image: `${origin}/i.png` });
  });

  it('collection without products has no ItemList', () => {
    const ld = collectionJsonLd({ name: 'A', url: origin, origin, products: [], urlFor: pageUrlBuilder(origin, '/') }) as any;
    expect(ld.mainEntity).toBeUndefined();
  });

  it('product: offer, brand, rating only when real', () => {
    const base = { name: 'Tee', images: ['https://c.io/1.png'], price: 19.999, currency: 'usd', inStock: true, url: `${origin}/product/tee`, origin };
    const ld = productJsonLd({ ...base, vendor: 'Acme', sku: 'T1', rating: { value: 4.46, count: 3 } }) as any;
    expect(ld.offers).toMatchObject({ price: 20, priceCurrency: 'USD', availability: 'https://schema.org/InStock' });
    expect(ld.brand.name).toBe('Acme');
    expect(ld.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 3 });
    const bare = productJsonLd({ ...base, inStock: false, rating: { value: 0, count: 0 } }) as any;
    expect(bare.aggregateRating).toBeUndefined();
    expect(bare.brand).toBeUndefined();
    expect(bare.sku).toBeUndefined();
    expect(bare.offers.availability).toBe('https://schema.org/OutOfStock');
    expect(JSON.stringify(bare)).not.toContain('undefined');
    expect((productJsonLd({ ...base, currency: '' }) as any).offers).toBeUndefined();
  });

  it('article: author, publisher with logo, mainEntityOfPage', () => {
    const ld = articleJsonLd({ headline: 'Hi', image: '/c.png', datePublished: '2026-01-01', author: 'Ann', storeName: 'Store', logo: '/l.png', url: `${origin}/blog/hi`, origin }) as any;
    expect(ld['@type']).toBe('Article');
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Ann' });
    expect(ld.publisher.logo.url).toBe(`${origin}/l.png`);
    expect(ld.dateModified).toBe('2026-01-01');
    expect(ld.mainEntityOfPage['@id']).toBe(`${origin}/blog/hi`);
    expect((articleJsonLd({ headline: 'x', storeName: 'S', url: origin, origin }) as any).author['@type']).toBe('Organization');
  });

  it('blog: caps entries', () => {
    const posts = Array.from({ length: 20 }, (_, i) => ({ slug: `s${i}`, title: `T${i}` }));
    const ld = blogJsonLd({ name: 'Journal', url: `${origin}/blog`, origin, posts, postUrl: s => `${origin}/blog/${s}` }) as any;
    expect(ld.blogPost).toHaveLength(12);
    expect(ld.blogPost[0].url).toBe(`${origin}/blog/s0`);
  });

  it('breadcrumb: positions and needs 2+ items', () => {
    const ld = breadcrumbJsonLd([{ name: 'Home', url: `${origin}/` }, { name: 'Tee', url: `${origin}/product/tee` }]) as any;
    expect(ld.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
    expect(breadcrumbJsonLd([{ name: 'Home', url: origin }])).toBeNull();
  });
});
