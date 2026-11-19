import { describe, it, expect } from 'vitest';
import { cardSwatches } from './cardSwatches';
import { buildOptionValues, resolveOptionStyle } from './variantOptions';
import type { ProductVariant } from '@/api/services/marketplace';

const v = (value: string, images: string[] = []) => ({ options: [{ name: 'Color', value }], images });
const variants = [v('Royal Green', ['g.jpg']), v('Choclete'), v('Multi'), v('Royal Green')];

describe('cardSwatches: one colour logic for every card', () => {
  it('the seller\'s colour wins; names are guessed otherwise; unknown names have no colour (a text chip)', () => {
    const out = cardSwatches({ variants, optionSwatches: [{ option: 'Color', value: 'Choclete', color: '#7b3f00' }] });
    expect(out.map(s => [s.value, s.color])).toEqual([['Royal Green', '#43a047'], ['Choclete', '#7b3f00'], ['Multi', null]]);
    expect(out[0].image).toBe('g.jpg');
  });
  it('a product without a colour option has none', () => {
    expect(cardSwatches({ variants: [{ options: [{ name: 'Size', value: 'L' }] }] })).toEqual([]);
  });
});

describe('seller colours on the product page', () => {
  const full = [
    { _id: '1', options: [{ name: 'Color', value: 'Choclete' }], images: [], stock: 1, status: 'active' },
    { _id: '2', options: [{ name: 'Color', value: 'Gray' }], images: [], stock: 1, status: 'active' },
  ] as unknown as ProductVariant[];
  it('swatches by default once the seller chose a colour; buttons when nothing was chosen; an explicit choice always wins', () => {
    const withOwn = buildOptionValues(full, full[0], 'Color', false, [{ option: 'Color', value: 'Choclete', color: '#7b3f00' }]);
    expect(withOwn[0]).toMatchObject({ color: '#7b3f00', custom: true });
    expect(resolveOptionStyle(undefined, 'Color', withOwn)).toBe('swatches');
    expect(resolveOptionStyle('pills', 'Color', withOwn)).toBe('pills');
    const none = buildOptionValues(full, full[0], 'Color', false);
    expect(resolveOptionStyle(undefined, 'Color', none)).toBe('pills');
  });
});
