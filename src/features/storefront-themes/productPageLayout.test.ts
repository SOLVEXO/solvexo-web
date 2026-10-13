import { describe, it, expect } from 'vitest';
import type { Section } from '@/api/services/storefrontTypes';
import { PRODUCT_MAIN_BLOCKS, resolveProductMainLayout, splitProductTemplateSections } from './productPageLayout';

const block = (type: string, enabled?: boolean) => ({ type, ...(enabled === undefined ? {} : { enabled }) });
const section = (type: string, id?: string): Section => ({ _id: id, type: type as Section['type'], settings: {}, blocks: [] });

/** What a store saved before the optional blocks existed renders: the rating sits right under the title. */
const LEGACY_ORDER = ['product_title', 'product_rating', 'product_price', 'product_variant_picker', 'product_quantity', 'product_buy_buttons', 'product_description'];

describe('resolveProductMainLayout', () => {
  it('uses the default order when the template has no product_main (older stores)', () => {
    const r = resolveProductMainLayout(undefined);
    expect(r.mediaOn).toBe(true);
    expect(r.infoOrder).toEqual(LEGACY_ORDER);
  });

  it('keeps the seeded order identical to the old hardcoded page (rating still under the title)', () => {
    const r = resolveProductMainLayout({ blocks: PRODUCT_MAIN_BLOCKS.map(t => block(t, true)) });
    expect(r.infoOrder).toEqual(LEGACY_ORDER);
  });

  it('follows the order the seller arranged', () => {
    const r = resolveProductMainLayout({
      blocks: [
        block('product_media'), block('product_description'), block('product_title'), block('product_price'),
        block('product_buy_buttons'), block('product_variant_picker'), block('product_quantity'),
      ],
    });
    expect(r.infoOrder).toEqual([
      'product_description', 'product_title', 'product_rating', 'product_price', 'product_buy_buttons', 'product_variant_picker', 'product_quantity',
    ]);
  });

  it('drops hidden blocks and reports a hidden gallery', () => {
    const r = resolveProductMainLayout({
      blocks: PRODUCT_MAIN_BLOCKS.map(t => block(t, t !== 'product_quantity' && t !== 'product_media')),
    });
    expect(r.mediaOn).toBe(false);
    expect(r.infoOrder).not.toContain('product_quantity');
    expect(r.infoOrder).toContain('product_price');
  });

  it('treats a required block missing from the section as on, at its default position, after the listed ones', () => {
    const r = resolveProductMainLayout({ blocks: [block('product_price'), block('product_title')] });
    expect(r.infoOrder).toEqual([
      'product_price', 'product_title', 'product_rating', 'product_variant_picker', 'product_quantity', 'product_buy_buttons', 'product_description',
    ]);
  });

  it('ignores unknown block types and duplicates', () => {
    const r = resolveProductMainLayout({ blocks: [block('mystery'), block('product_price'), block('product_price', false)] });
    expect(r.infoOrder[0]).toBe('product_price');
    expect(r.infoOrder.filter(b => b === 'product_price')).toHaveLength(1);
  });

  describe('optional blocks', () => {
    it('stay off when the template has never had them (wishlist, share, SKU, specifications)', () => {
      const r = resolveProductMainLayout({ blocks: PRODUCT_MAIN_BLOCKS.map(t => block(t, true)) });
      for (const optional of ['product_sku', 'product_wishlist', 'product_share', 'product_specs']) expect(r.infoOrder).not.toContain(optional);
    });

    it('show where the seller put them once switched on', () => {
      const r = resolveProductMainLayout({
        blocks: [
          block('product_media'), block('product_title'), block('product_rating', true), block('product_price'), block('product_sku', true),
          block('product_variant_picker'), block('product_quantity'), block('product_buy_buttons'), block('product_wishlist', true),
          block('product_share', true), block('product_description'), block('product_specs', true),
        ],
      });
      expect(r.infoOrder).toEqual([
        'product_title', 'product_rating', 'product_price', 'product_sku', 'product_variant_picker', 'product_quantity',
        'product_buy_buttons', 'product_wishlist', 'product_share', 'product_description', 'product_specs',
      ]);
    });

    it('can be hidden again — and the rating can be hidden, which the old page never allowed', () => {
      const r = resolveProductMainLayout({
        blocks: [...PRODUCT_MAIN_BLOCKS.map(t => block(t, true)), block('product_rating', false), block('product_wishlist', false)],
      });
      expect(r.infoOrder).not.toContain('product_rating');
      expect(r.infoOrder).not.toContain('product_wishlist');
    });

    it('keeps showing the rating even when the title is hidden (as the old page did)', () => {
      const r = resolveProductMainLayout({ blocks: [block('product_title', false), block('product_price')] });
      expect(r.infoOrder.indexOf('product_rating')).toBe(0);
    });
  });
});

describe('splitProductTemplateSections', () => {
  it('puts everything below when product_main sits first (every existing store)', () => {
    const { before, after } = splitProductTemplateSections([section('product_main'), section('faq', 'a'), section('rich_text', 'b')]);
    expect(before).toEqual([]);
    expect(after.map(s => s._id)).toEqual(['a', 'b']);
  });

  it('splits around product_main', () => {
    const { before, after } = splitProductTemplateSections([
      section('rich_text', 'above'), section('product_main'), section('faq', 'below'),
    ]);
    expect(before.map(s => s._id)).toEqual(['above']);
    expect(after.map(s => s._id)).toEqual(['below']);
  });

  it('never hands a core section to the renderer', () => {
    const { before, after } = splitProductTemplateSections([section('product_main'), section('cart_items')]);
    expect([...before, ...after]).toEqual([]);
  });

  it('keeps every section below when there is no product_main at all', () => {
    const { before, after } = splitProductTemplateSections([section('faq', 'a')]);
    expect(before).toEqual([]);
    expect(after.map(s => s._id)).toEqual(['a']);
  });
});
