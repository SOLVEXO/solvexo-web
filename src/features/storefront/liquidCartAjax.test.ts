import { describe, expect, it } from 'vitest';
import type { Cart } from '@/api/services/cart';
import { findChangeTarget, parseAddPayload, parseUpdatePayload, toShopifyCartJson } from './liquidCartAjax';

const cart: Cart = {
  userId: 'u1',
  totalItems: 3,
  totalPrice: 45,
  items: [
    { productId: 'p1', productVariantId: 'v1', name: 'Mug', images: ['img1.jpg'], unitPrice: 15, quantity: 2, itemTotal: 30, currency: 'USD', type: 'physical' },
    { productId: 'p2', productVariantId: 'v2', name: 'Tee', price: 15, quantity: 1, itemTotal: 15, currency: 'USD', type: 'physical' },
  ],
};

describe('liquidCartAjax', () => {
  it('shapes the cart like Shopify /cart.js', () => {
    const json = toShopifyCartJson(cart);
    expect(json.item_count).toBe(3);
    expect(json.total_price).toBe(4500);
    expect(json.items[0]).toMatchObject({ id: 'v1', variant_id: 'v1', product_id: 'p1', quantity: 2, price: 1500, line_price: 3000, image: 'img1.jpg' });
  });

  it('returns an empty, valid cart when there is none yet', () => {
    expect(toShopifyCartJson(null)).toMatchObject({ item_count: 0, total_price: 0, items: [] });
  });

  it('parses both single and multi-item /cart/add.js bodies', () => {
    expect(parseAddPayload({ id: 'v1', quantity: 2 })).toEqual([{ variantId: 'v1', quantity: 2 }]);
    expect(parseAddPayload({ items: [{ id: 'v1', quantity: 1 }, { id: 'v2', quantity: 3 }] })).toEqual([
      { variantId: 'v1', quantity: 1 }, { variantId: 'v2', quantity: 3 },
    ]);
    expect(parseAddPayload({ id: 'v1', quantity: 0 })).toEqual([]); // invalid quantity dropped, never silently clamped to 1
    expect(parseAddPayload(undefined)).toEqual([]);
  });

  it('finds the /cart/change.js target by variant id or 1-based line number', () => {
    expect(findChangeTarget(cart, { id: 'v2', quantity: 5 })?.productId).toBe('p2');
    expect(findChangeTarget(cart, { line: 1, quantity: 5 })?.productId).toBe('p1');
    expect(findChangeTarget(cart, { line: 99, quantity: 5 })).toBeNull();
  });

  it('parses /cart/update.js both as a keyed map and a line-indexed array', () => {
    expect(parseUpdatePayload(cart, { updates: { v2: 4 } })).toEqual([{ item: cart.items[1], quantity: 4 }]);
    expect(parseUpdatePayload(cart, { updates: [9, 0] })).toEqual([{ item: cart.items[0], quantity: 9 }, { item: cart.items[1], quantity: 0 }]);
    expect(parseUpdatePayload(cart, { updates: { missing: 4 } })).toEqual([]);
  });
});
