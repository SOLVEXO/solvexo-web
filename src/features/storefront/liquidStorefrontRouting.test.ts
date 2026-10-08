import { describe, expect, it } from 'vitest';
import { isLiquidStorefrontRoute, resolveLiquidStorefrontPath } from './liquidStorefrontRouting';

describe('Liquid storefront route integration', () => {
  it.each([
    ['/products/linen-shirt?variant=abc', '/product/linen-shirt?variant=abc'],
    ['/pages/about-us#story', '/about-us#story'],
    ['/collections/summer', '/collections/summer'],
    ['/blogs/news/new-arrivals', '/blogs/news/new-arrivals'],
    ['/cart', '/cart'],
  ])('maps Shopify path %s to Solvexo path %s', (source, expected) => {
    expect(resolveLiquidStorefrontPath(source)).toBe(expected);
  });

  it.each(['https://evil.example', '//evil.example/path', '/\\evil.example', '/x\nheader'])(
    'rejects unsafe navigation path %s',
    (path) => expect(resolveLiquidStorefrontPath(path)).toBeNull(),
  );

  it('uses Liquid pages for online-store URLs but keeps Solvexo checkout and account flows native', () => {
    expect(isLiquidStorefrontRoute('/product/mug')).toBe(true);
    expect(isLiquidStorefrontRoute('/about-us')).toBe(true);
    expect(isLiquidStorefrontRoute('/checkout')).toBe(false);
    expect(isLiquidStorefrontRoute('/account')).toBe(false);
  });
});
