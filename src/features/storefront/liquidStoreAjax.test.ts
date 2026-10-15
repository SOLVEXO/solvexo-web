import { describe, expect, it } from 'vitest';
import type { PublicStoreProduct } from '@/api/services/store';
import { toShopifySearchJson, toShopifySearchSuggestion } from './liquidStoreAjax';

const product: PublicStoreProduct = {
  _id: 'p1', slug: 'linen-shirt', name: 'Linen Shirt', images: ['shirt.jpg'],
  defaultVariantPrice: 45, compareAtPrice: 60, inStock: true,
};

describe('liquidStoreAjax', () => {
  it('shapes one product like a Shopify predictive-search suggestion', () => {
    const json = toShopifySearchSuggestion(product, 'USD');
    expect(json).toMatchObject({ title: 'Linen Shirt', url: '/products/linen-shirt', price: 4500, compare_at_price: 6000, available: true, currency: 'USD' });
  });

  it('wraps a product list in Shopify\'s resources.results.products envelope', () => {
    const json = toShopifySearchJson([product], 'USD');
    expect(json.resources.results.products).toHaveLength(1);
    expect(json.resources.results.products[0].title).toBe('Linen Shirt');
  });
});
