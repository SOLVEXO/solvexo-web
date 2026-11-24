import { describe, expect, it } from 'vitest';
import type { StoreThemeData } from '@/api/services/storeTheme';
import { bootPalette } from './bootPalette';

const defaults = { bg: '#FAFAFA', ink: '#09090B', accent: '#112233' };
const theme = (t: Record<string, unknown>) => ({ theme: t }) as unknown as StoreThemeData;

describe('bootPalette', () => {
  it('uses the seller colours when they are valid hex', () => {
    const p = bootPalette(theme({ bgColor: '#ffffff', textColor: '#000', primaryColor: '#b87333' }), defaults);
    expect(p).toMatchObject({ bg: '#ffffff', ink: '#000', accent: '#b87333' });
  });

  it('falls back to the theme defaults for missing or unsafe values', () => {
    expect(bootPalette(null, defaults)).toMatchObject(defaults);
    const p = bootPalette(theme({ bgColor: 'red; background:url(x)', textColor: 12, primaryColor: '' }), defaults);
    expect(p).toMatchObject(defaults);
  });

  it('derives block and line tints from the page colours', () => {
    const p = bootPalette(null, defaults);
    expect(p.block).toContain('#09090B');
    expect(p.line).toContain('#FAFAFA');
  });
});
