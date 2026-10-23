import { describe, expect, it } from 'vitest';
import { paletteFromPixels } from './brandPalette';

type Rgba = [number, number, number, number];
/** Builds RGBA pixel data from a list of [colour, how many pixels] runs. */
const pixels = (runs: [Rgba, number][]) => Uint8ClampedArray.from(runs.flatMap(([c, n]) => Array.from({ length: n }, () => c).flat()));
const hexToRgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const near = (hex: string, target: string, tol = 12) => hexToRgb(hex).every((v, i) => Math.abs(v - hexToRgb(target)[i]) <= tol);

const WHITE: Rgba = [255, 255, 255, 255];
const GREY: Rgba = [128, 128, 128, 255];
const RED: Rgba = [198, 40, 40, 255];       // #c62828
const BLUE: Rgba = [21, 101, 192, 255];     // #1565c0  (same brightness as the red — the original bug)
const PINK: Rgba = [227, 149, 149, 255];    // red half-blended with the white background (anti-aliased edge)

describe('paletteFromPixels (logo → suggested brand colours)', () => {
  const logo = pixels([[WHITE, 2000], [RED, 900], [BLUE, 600], [GREY, 300], [PINK, 250]]);
  const palette = paletteFromPixels(logo);

  it('returns the two real brand colours, most-used first', () => {
    expect(palette).toHaveLength(2);
    expect(near(palette[0], '#c62828')).toBe(true);
    expect(near(palette[1], '#1565c0')).toBe(true);
  });

  it('does not drop blue just because it is as bright as red (distinctness is by colour distance, not luminance)', () => {
    expect(palette.some(c => near(c, '#1565c0'))).toBe(true);
  });

  it('ignores the white background, greys and pale anti-aliased edge pixels', () => {
    expect(palette.some(c => near(c, '#ffffff', 30) || near(c, '#808080', 30) || near(c, '#e39595', 30))).toBe(false);
  });

  it('ignores transparent pixels', () => {
    const transparentRed = pixels([[[198, 40, 40, 0], 5000], [BLUE, 800]]);
    expect(paletteFromPixels(transparentRed).map(c => near(c, '#1565c0'))).toEqual([true]);
  });

  it('ignores tiny specks (< 2% of the coloured area)', () => {
    const speck = pixels([[RED, 5000], [BLUE, 40]]);
    expect(paletteFromPixels(speck)).toHaveLength(1);
  });

  it('collapses near-identical shades into one suggestion', () => {
    const shades = pixels([[RED, 2000], [[205, 48, 48, 255], 1500], [[190, 35, 35, 255], 1200]]);
    expect(paletteFromPixels(shades)).toHaveLength(1);
  });

  it('suggests at most 5 colours', () => {
    const many = pixels([
      [[220, 30, 30, 255], 1000], [[30, 160, 40, 255], 900], [[30, 60, 200, 255], 800],
      [[230, 190, 20, 255], 700], [[160, 30, 200, 255], 600], [[20, 190, 190, 255], 500], [[240, 120, 20, 255], 400],
    ]);
    expect(paletteFromPixels(many).length).toBeLessThanOrEqual(5);
  });

  it('returns nothing for an all-white / all-grey image', () => {
    expect(paletteFromPixels(pixels([[WHITE, 3000], [GREY, 1000]]))).toEqual([]);
  });

  it('returns nothing for an empty image', () => {
    expect(paletteFromPixels(new Uint8ClampedArray(0))).toEqual([]);
  });
});
