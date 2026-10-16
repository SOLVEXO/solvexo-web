import { afterEach, describe, expect, it } from 'vitest';
import { fashionTheme, applyMerchantThemeOverrides } from './theme-03-fashion/theme.config';
import { fashionThemeManifest } from './theme-03-fashion/theme.manifest';

afterEach(() => applyMerchantThemeOverrides(null));

describe('product image hover customization', () => {
  it('exposes none, zoom, and second-image on the theme settings panel', () => {
    const field = fashionThemeManifest.themeSettingsFields.find(item => item.key === 'productImageHover');
    expect(field?.control.kind).toBe('select');
    if (field?.control.kind === 'select') {
      expect(field.control.options.map(option => option.value)).toEqual(['none', 'zoom', 'second-image']);
    }
  });

  it('applies every selected hover mode to the render configuration', () => {
    for (const productImageHover of ['none', 'zoom', 'second-image'] as const) {
      applyMerchantThemeOverrides({ productImageHover });
      expect(fashionTheme.productImageHover).toBe(productImageHover);
    }
  });
});
