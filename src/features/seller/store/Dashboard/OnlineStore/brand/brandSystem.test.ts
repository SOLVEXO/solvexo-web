import { describe, expect, it } from 'vitest';
import { BRAND_PRESETS, checkBrand, contrast, derivePalette, hexToHsl, hslToHex, matchingPreset } from './brandSystem';

describe('colour maths', () => {
  it('contrast is 21 for black on white and 1 for the same colour', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#336699', '#336699')).toBeCloseTo(1, 5);
  });
  it('hsl round trip keeps the colour (within rounding)', () => {
    const [h, s, l] = hexToHsl('#d97757');
    const back = hslToHex(h, s, l);
    expect(contrast(back, '#d97757')).toBeCloseTo(1, 1);
  });
});

describe('derivePalette', () => {
  it.each(['#d97757', '#1d4ed8', '#16a34a', '#e11d48', '#111111', '#ffe600'])('gives readable text on the page for %s', c => {
    const p = derivePalette(c);
    for (const k of Object.values(p)) expect(k).toMatch(/^#[0-9a-f]{6}$/);
    expect(contrast(p.textColor, p.bgColor)).toBeGreaterThanOrEqual(7);
    expect(p.primaryColor).toBe(c);
  });
  it('keeps a red sale colour distinct for a red brand', () => {
    expect(derivePalette('#e11d48').saleColor).toBe('#b42318');
    expect(derivePalette('#1d4ed8').saleColor).toBe('#d92d20');
  });
  it('refuses a colour that is not 6-digit hex', () => {
    expect(() => derivePalette('red')).toThrow();
  });
});

describe('presets', () => {
  it('every preset sets every style key', () => {
    const keys = Object.keys(BRAND_PRESETS[0].style).sort();
    for (const p of BRAND_PRESETS) expect(Object.keys(p.style).sort()).toEqual(keys);
  });
  it('matchingPreset finds the preset the kit holds, and none after one change', () => {
    const kit = { ...BRAND_PRESETS[2].style };
    expect(matchingPreset(kit)?.id).toBe('soft');
    expect(matchingPreset({ ...kit, buttonRadius: 'none' })).toBeNull();
  });
});

describe('checkBrand', () => {
  const theme = { bgColor: '#ffffff', textColor: '#111111' };
  it('is happy with a well-contrasted kit', () => {
    const r = checkBrand({ primaryColor: '#1d4ed8' }, theme);
    expect(r).toEqual([{ id: 'ok', level: 'ok', text: expect.any(String) }]);
  });
  it('flags text that is too faint on the page, using the kit colours over the theme', () => {
    const r = checkBrand({ primaryColor: '#1d4ed8', textColor: '#dddddd' }, theme);
    expect(r.find(c => c.id === 'text')?.level).toBe('error');
  });
  it('warns when the main colour nearly matches the page', () => {
    const r = checkBrand({ primaryColor: '#fafafa' }, theme);
    expect(r.some(c => c.id === 'primary')).toBe(true);
  });
  it('warns about a faint link, price and sale colour', () => {
    const r = checkBrand({ primaryColor: '#1d4ed8', linkColor: '#eeeeee', priceColor: '#eeeeee', saleColor: '#eeeeee' }, theme);
    expect(r.map(c => c.id)).toEqual(expect.arrayContaining(['link', 'price', 'sale']));
  });
});
