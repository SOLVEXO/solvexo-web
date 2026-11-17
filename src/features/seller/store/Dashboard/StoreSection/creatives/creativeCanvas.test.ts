import { describe, expect, it } from 'vitest';
import { buildCaption, FORMATS, readableOn, safeColor, wrapLines } from './creativeCanvas';

const measure = (s: string) => s.length * 10;

describe('creativeCanvas helpers', () => {
  it('has the four sizes incl. WhatsApp status 1080x1920', () => {
    expect(FORMATS.whatsapp).toMatchObject({ w: 1080, h: 1920 });
    expect(FORMATS.square.w).toBe(FORMATS.square.h);
    expect(FORMATS.banner.w).toBeGreaterThan(FORMATS.banner.h);
  });
  it('only accepts #rrggbb colours', () => {
    expect(safeColor('#112233')).toBe('#112233');
    expect(safeColor('red; background:url(x)')).toBe('#C2410C');
    expect(safeColor(null)).toBe('#C2410C');
  });
  it('picks readable text colour', () => {
    expect(readableOn('#000000')).toBe('#FFFFFF');
    expect(readableOn('#FFFFFF')).toBe('#111111');
  });
  it('wraps and cuts long names with an ellipsis', () => {
    expect(wrapLines(measure, 'Blue shirt', 200, 3)).toEqual(['Blue shirt']);
    const out = wrapLines(measure, 'one two three four five six seven eight', 80, 2);
    expect(out).toHaveLength(2);
    expect(out[1].endsWith('…')).toBe(true);
    expect(out.every((l) => measure(l) <= 80)).toBe(true);
  });
  it('builds a caption with the product link', () => {
    expect(buildCaption('Shirt', '$10', 'https://s.example/product/1', 'Shop')).toBe('Shirt — $10\nAvailable now at Shop\nhttps://s.example/product/1');
  });
});
