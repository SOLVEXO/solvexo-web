import { describe, expect, it } from 'vitest';
import { cartLineNotes, checkoutPreorderNotes, productPreorderNote } from './purchaseNotes';

const pre = { label: 'Pre-order', expectedDate: null, message: 'Ships in May', remaining: 3, soldOut: false };

describe('purchase notes', () => {
  it('product-level pre-order wins over the variant', () => {
    expect(productPreorderNote({ preorder: { enabled: true, availableOn: null } }, { preorder: pre })).toBeTruthy();
  });
  it('variant pre-order is used when the product has none', () => {
    const n = productPreorderNote({ preorder: null }, { preorder: pre });
    expect(n).toContain('Ships in May');
  });
  it('null for a normal product', () => {
    expect(productPreorderNote({ preorder: null }, { preorder: null })).toBeNull();
  });
  it('cart line notes: pre-order and bundle', () => {
    expect(cartLineNotes({})).toEqual({ preorder: null, bundle: false });
    expect(cartLineNotes({ preorder: pre, isBundle: true }).bundle).toBe(true);
    expect(cartLineNotes({ preorder: pre }).preorder).toContain('Ships in May');
  });
  it('checkout notes are keyed by variant id', () => {
    const m = checkoutPreorderNotes([{ productVariantId: 'a', preorder: pre }, { productVariantId: 'b' }]);
    expect(m.get('a')).toContain('Ships in May');
    expect(m.get('b')).toBeNull();
  });
});
