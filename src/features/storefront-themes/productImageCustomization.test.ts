import { afterEach, describe, expect, it } from 'vitest';
import { atelierTheme, applyMerchantThemeOverrides as applyAtelierOverrides } from './theme-01-atelier/theme.config';
import { atelierThemeManifest } from './theme-01-atelier/theme.manifest';
import { novaTheme, applyMerchantThemeOverrides as applyNovaOverrides } from './theme-02-nova/theme.config';
import { novaThemeManifest } from './theme-02-nova/theme.manifest';
import './theme-01-atelier/sections/FeaturedProductsSection';
import './theme-01-atelier/sections/FaqSection';
import './theme-01-atelier/sections/ImageWithTextSection';
import './theme-01-atelier/sections/NewsletterSection';
import './theme-01-atelier/sections/TestimonialsSection';
import './theme-02-nova/sections/FeaturedProductsSection';
import './theme-02-nova/sections/FaqSection';
import './theme-02-nova/sections/ImageWithTextSection';
import './theme-02-nova/sections/NewsletterSection';
import './theme-02-nova/sections/TestimonialsSection';

afterEach(() => {
  applyAtelierOverrides(null);
  applyNovaOverrides(null);
});

describe('product image hover customization', () => {
  it('exposes none, zoom, and second-image on both theme settings panels', () => {
    for (const manifest of [atelierThemeManifest, novaThemeManifest]) {
      const field = manifest.themeSettingsFields.find(item => item.key === 'productImageHover');
      expect(field?.control.kind).toBe('select');
      if (field?.control.kind === 'select') {
        expect(field.control.options.map(option => option.value)).toEqual(['none', 'zoom', 'second-image']);
      }
    }
  });

  it('applies every selected hover mode to both theme render configurations', () => {
    const applyBoth = (productImageHover: 'none' | 'zoom' | 'second-image') => {
      applyAtelierOverrides({ productImageHover });
      applyNovaOverrides({ productImageHover });
      expect(atelierTheme.productImageHover).toBe(productImageHover);
      expect(novaTheme.productImageHover).toBe(productImageHover);
    };

    applyBoth('none');
    applyBoth('zoom');
    applyBoth('second-image');
  });
});
