import { describe, it, expect } from 'vitest';
import type { Section } from '@/api/services/storefrontTypes';
import { PRODUCT_MAIN_BLOCKS, resolveProductMainLayout, splitProductTemplateSections } from './productPageLayout';

const block = (type: string, enabled?: boolean) => ({ type, ...(enabled === undefined ? {} : { enabled }) });
const section = (type: string, id?: string): Section => ({ _id: id, type: type as Section['type'], settings: {}, blocks: [] });

describe('resolveProductMainLayout', () => {
  it('uses the default order when the template has no product_main (older stores)', () => {
    const r = resolveProductMainLayout(undefined);
    expect(r.mediaOn).toBe(true);
    expect(r.infoOrder).toEqual(PRODUCT_MAIN_BLOCKS.filter(b => b !== 'product_media'));
  });

  it('keeps the seeded order identical to the old hardcoded page', () => {
    const r = resolveProductMainLayout({ blocks: PRODUCT_MAIN_BLOCKS.map(t => block(t, true)) });
    expect(r.infoOrder).toEqual([
      'product_title', 'product_price', 'product_variant_picker', 'product_quantity', 'product_buy_buttons', 'product_description',
    ]);
  });

  it('follows the order the seller arranged', () => {
    const r = resolveProductMainLayout({
      blocks: [
        block('product_media'), block('product_description'), block('product_title'), block('product_price'),
        block('product_buy_buttons'), block('product_variant_picker'), block('product_quantity'),
      ],
    });
    expect(r.infoOrder).toEqual([
      'product_description', 'product_title', 'product_price', 'product_buy_buttons', 'product_variant_picker', 'product_quantity',
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

  it('treats a block missing from the section as on, at its default position, after the listed ones', () => {
    const r = resolveProductMainLayout({ blocks: [block('product_price'), block('product_title')] });
    expect(r.infoOrder).toEqual([
      'product_price', 'product_title', 'product_variant_picker', 'product_quantity', 'product_buy_buttons', 'product_description',
    ]);
  });

  it('ignores unknown block types and duplicates', () => {
    const r = resolveProductMainLayout({ blocks: [block('mystery'), block('product_price'), block('product_price', false)] });
    expect(r.infoOrder[0]).toBe('product_price');
    expect(r.infoOrder.filter(b => b === 'product_price')).toHaveLength(1);
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
