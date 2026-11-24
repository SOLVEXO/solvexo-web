import { describe, expect, it } from 'vitest';
import { ssrRouteFor } from './ssrRoutes';

describe('ssrRouteFor', () => {
  it('maps addresses to the page that renders them', () => {
    const key = (p: string) => ssrRouteFor(p)?.key;
    expect(key('/')).toBe('home');
    expect(key('/product/blue-shirt')).toBe('product');
    expect(key('/product/blue-shirt/')).toBe('product');
    expect(key('/collections')).toBe('collections');
    expect(key('/collections/summer')).toBe('collection');
    expect(key('/category/shoes')).toBe('category');
    expect(key('/blog')).toBe('blogIndex');
    expect(key('/blogs/news')).toBe('blogIndex');
    expect(key('/blog/hello')).toBe('blogPost');
    expect(key('/blogs/news/hello')).toBe('blogPost');
    expect(key('/faqs')).toBe('faqs');
    expect(key('/about-us')).toBe('customPage');
  });

  it('never turns an app route into a seller page', () => {
    for (const p of ['/cart', '/checkout', '/login', '/register', '/account', '/orders', '/wishlist', '/search', '/gift-cards', '/library', '/CART']) {
      expect(ssrRouteFor(p), p).toBeNull();
    }
  });

  it('knows nothing about deeper or unknown shapes', () => {
    expect(ssrRouteFor('/a/b/c')).toBeNull();
    expect(ssrRouteFor('/product/a/b')).toBeNull();
    expect(ssrRouteFor('/collections/a/b')).toBeNull();
  });
});
