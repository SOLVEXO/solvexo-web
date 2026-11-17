import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ProductVariant } from '@/api/services/marketplace';
import { buildOptionValues, colorForValue, isColorOptionName, resolveOptionStyle, type OptionValueInfo } from './variantOptions';
import { VariantOptionPicker, type PickerTokens } from './VariantOptionPicker';

afterEach(cleanup);

const variant = (id: string, options: [string, string][], over: Partial<ProductVariant> = {}): ProductVariant => ({
  _id: id, productId: 'p', sku: id, price: 10, compareAtPrice: null, stock: 5, shippingWeight: null, images: [], status: 'active',
  options: options.map(([name, value]) => ({ name, value })), ...over,
}) as ProductVariant;

describe('colorForValue', () => {
  it('reads hex codes (with #) and plain colour names, any case', () => {
    expect(colorForValue('#FF0000')).toBe('#ff0000');
    expect(colorForValue('#0af')).toBe('#00aaff');
    expect(colorForValue('Black')).toBe('#000000');
    expect(colorForValue('  WHITE ')).toBe('#ffffff');
  });
  it('understands two-word names: the shade word decides, modifiers are skipped', () => {
    expect(colorForValue('Navy Blue')).toBe(colorForValue('navy'));
    expect(colorForValue('Sky Blue')).toBe(colorForValue('sky'));
    expect(colorForValue('Light Grey')).toBe(colorForValue('grey'));
    expect(colorForValue('Dark-Green')).toBe(colorForValue('green'));
  });
  it('does not mistake ordinary words for colours (hex digits without # are just letters)', () => {
    for (const w of ['bad', 'facade', 'Large', 'XL', '42', 'Cotton', 'One size', '']) expect(colorForValue(w)).toBeNull();
  });
  it('recognises colour option names', () => {
    expect(['Color', 'Colour', 'Shade', 'colors', 'رنگ'].every(isColorOptionName)).toBe(true);
    expect(['Size', 'Material'].some(isColorOptionName)).toBe(false);
  });
});

describe('buildOptionValues', () => {
  const variants = [
    variant('1', [['Color', 'Red'], ['Size', 'S']], { images: ['https://cdn/red.jpg'] }),
    variant('2', [['Color', 'Red'], ['Size', 'M']], { images: ['https://cdn/red.jpg'] }),
    variant('3', [['Color', 'Blue'], ['Size', 'S']], { stock: 0 }),
    variant('4', [['Color', 'Blue'], ['Size', 'M']], { stock: 0 }),
  ];
  it('lists each value once, in order, with its colour and its picture', () => {
    const vals = buildOptionValues(variants, variants[0], 'Color', false);
    expect(vals.map(v => v.value)).toEqual(['Red', 'Blue']);
    expect(vals[0]).toMatchObject({ color: '#e53935', image: 'https://cdn/red.jpg' });
    expect(vals[1].image).toBeNull();
  });
  it('a picture only stands for a value when every variant with it shows that same photo (Size never borrows the picture of one colour)', () => {
    const mixed = [
      variant('1', [['Color', 'Red'], ['Size', 'S']], { images: ['https://cdn/red.jpg'] }),
      variant('2', [['Color', 'Blue'], ['Size', 'S']], { images: ['https://cdn/blue.jpg'] }),
      variant('3', [['Color', 'Red'], ['Size', 'M']], { images: ['https://cdn/red.jpg'] }),
      variant('4', [['Color', 'Blue'], ['Size', 'M']], { images: ['https://cdn/blue.jpg'] }),
    ];
    expect(buildOptionValues(mixed, mixed[0], 'Color', false).map(v => v.image)).toEqual(['https://cdn/red.jpg', 'https://cdn/blue.jpg']);
    expect(buildOptionValues(mixed, mixed[0], 'Size', false).map(v => v.image)).toEqual([null, null]);
    // a variant without a photo breaks it
    const partial = [variant('1', [['Color', 'Red']], { images: ['https://cdn/red.jpg'] }), variant('2', [['Color', 'Red']])];
    expect(buildOptionValues(partial, partial[0], 'Color', false)[0].image).toBeNull();
  });
  it('a value nobody can buy (with the other chosen options) is marked unavailable but kept', () => {
    const vals = buildOptionValues(variants, variants[0], 'Color', false);
    expect(vals.find(v => v.value === 'Blue')?.available).toBe(false);
    expect(vals.find(v => v.value === 'Red')?.available).toBe(true);
  });
});

describe('resolveOptionStyle', () => {
  const val = (value: string, color: string | null, image: string | null = null): OptionValueInfo => ({ value, available: true, color, image });
  it('keeps buttons and dropdown as asked; an unknown or missing style is buttons', () => {
    expect(resolveOptionStyle('dropdown', 'Size', [val('S', null)])).toBe('dropdown');
    expect(resolveOptionStyle('pills', 'Size', [val('S', null)])).toBe('pills');
    expect(resolveOptionStyle(undefined, 'Size', [val('S', null)])).toBe('pills');
    expect(resolveOptionStyle('grid', 'Size', [val('S', null)])).toBe('pills');
  });
  it('swatches only suit colour options: by name, or when most values are colours', () => {
    expect(resolveOptionStyle('swatches', 'Size', [val('S', null), val('M', null)])).toBe('pills');
    expect(resolveOptionStyle('swatches', 'Color', [val('Red', '#e53935')])).toBe('swatches');
    expect(resolveOptionStyle('swatches', 'Finish', [val('Black', '#000'), val('White', '#fff'), val('Matt', null)])).toBe('swatches'); // 2 of 3
    expect(resolveOptionStyle('swatches', 'Finish', [val('Black', '#000'), val('Matt', null), val('Gloss', null)])).toBe('pills');
    expect(resolveOptionStyle('swatches', 'Color', [val('Zebra', null)])).toBe('pills'); // a colour option with no known colour
  });
  it('picture tiles need a picture on every value', () => {
    expect(resolveOptionStyle('images', 'Color', [val('Red', null, 'https://x/a.jpg'), val('Blue', null, 'https://x/b.jpg')])).toBe('images');
    expect(resolveOptionStyle('images', 'Color', [val('Red', null, 'https://x/a.jpg'), val('Blue', null)])).toBe('pills');
  });
});

describe('VariantOptionPicker', () => {
  const tokens: PickerTokens = { ink: '#111111', inkMuted: '#777777', border: '#dddddd', selected: '#7a1f2b', selectedInk: '#ffffff', bg: '#ffffff', radius: 9999, buttonLook: 'filled' };
  const colours: OptionValueInfo[] = [
    { value: 'Red', available: true, color: '#e53935', image: null },
    { value: 'Blue', available: false, color: '#1e88e5', image: null },
    { value: 'Zebra', available: true, color: null, image: null },
  ];
  const mount = (over: Partial<Parameters<typeof VariantOptionPicker>[0]> = {}) => {
    const onPick = vi.fn();
    const r = render(<VariantOptionPicker name="Color" current="Red" values={colours} style="swatches" tokens={tokens} onPick={onPick} soldOutLabel="Sold out" {...over} />);
    return { onPick, ...r };
  };

  it('swatches: a round colour button per value, the chosen one marked, sold out named for screen readers', () => {
    const { container, onPick } = mount();
    const sw = container.querySelectorAll('[data-swatch]');
    expect(sw).toHaveLength(2); // Zebra has no colour: it stays a text button
    expect((sw[0] as HTMLElement).style.background).toBe('rgb(229, 57, 53)');
    expect((sw[0] as HTMLElement).style.borderRadius).toBe('9999px');
    expect(sw[0].getAttribute('aria-pressed')).toBe('true');
    expect(sw[1].getAttribute('aria-label')).toBe('Color: Blue (Sold out)');
    expect(screen.getByText('Zebra').tagName).toBe('BUTTON');
    fireEvent.click(sw[1]);
    expect(onPick).toHaveBeenCalledWith('Blue'); // a sold-out value is still selectable
  });

  it('swatch shape and size', () => {
    const { container } = mount({ shape: 'square', size: 'lg' });
    const first = container.querySelector('[data-swatch]') as HTMLElement;
    expect(first.style.borderRadius).toBe('6px');
    expect(first.style.width).toBe('44px');
  });

  it('shows the chosen value next to the name', () => {
    mount();
    expect(screen.getByText('Color:').textContent).toContain('Color:');
    expect(screen.getByText('Red').tagName).toBe('SPAN');
  });

  it('picture tiles', () => {
    const { container, onPick } = mount({ style: 'images', values: [{ value: 'Red', available: true, color: null, image: 'https://cdn/r.jpg' }, { value: 'Blue', available: true, color: null, image: 'https://cdn/b.jpg' }] });
    const tiles = container.querySelectorAll('[data-image-tile]');
    expect(tiles).toHaveLength(2);
    expect(tiles[1].querySelector('img')?.getAttribute('src')).toBe('https://cdn/b.jpg');
    fireEvent.click(tiles[1]);
    expect(onPick).toHaveBeenCalledWith('Blue');
  });

  it('buttons: filled look fills the chosen one, outlined look only colours its border; sold out is struck through', () => {
    const { container, rerender, onPick } = mount({ name: 'Size', style: 'pills', values: [{ value: 'S', available: true, color: null, image: null }, { value: 'M', available: false, color: null, image: null }], current: 'S' });
    const [s, m] = Array.from(container.querySelectorAll('button')) as HTMLElement[];
    expect(s.style.background).toBe('rgb(122, 31, 43)');
    expect(s.style.color).toBe('rgb(255, 255, 255)');
    expect(m.style.textDecoration).toBe('line-through');
    fireEvent.click(m);
    expect(onPick).toHaveBeenCalledWith('M');
    rerender(<VariantOptionPicker name="Size" current="S" values={[{ value: 'S', available: true, color: null, image: null }]} style="pills" tokens={{ ...tokens, buttonLook: 'outlined' }} onPick={onPick} soldOutLabel="Sold out" />);
    const outlined = container.querySelector('button') as HTMLElement;
    expect(outlined.style.background).toBe('rgb(255, 255, 255)');
    expect(outlined.style.color).toBe('rgb(122, 31, 43)');
  });

  it('dropdown: a select with sold-out values named', () => {
    const { container, onPick } = mount({ name: 'Size', style: 'dropdown', current: 'S', values: [{ value: 'S', available: true, color: null, image: null }, { value: 'M', available: false, color: null, image: null }] });
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(Array.from(select.options).map(o => o.textContent)).toEqual(['S', 'M — Sold out']);
    fireEvent.change(select, { target: { value: 'M' } });
    expect(onPick).toHaveBeenCalledWith('M');
  });

  it('a size option asked for swatches falls back to buttons (never empty circles)', () => {
    const { container } = mount({ name: 'Size', values: [{ value: 'S', available: true, color: null, image: null }, { value: 'M', available: true, color: null, image: null }], current: 'S' });
    expect(container.querySelectorAll('[data-swatch]')).toHaveLength(0);
    expect(screen.getByText('M').tagName).toBe('BUTTON');
  });
});
