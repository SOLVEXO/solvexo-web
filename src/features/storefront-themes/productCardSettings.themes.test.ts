import { describe, expect, it } from 'vitest';
import { CARD_BADGE_POSITIONS, CARD_INFO_LINES } from './productCardExtras';
import { fashionThemeManifest } from './theme-03-fashion/theme.manifest';
import { techThemeManifest } from './theme-04-tech/theme.manifest';
import { ledupThemeManifest } from './theme-05-ledup/theme.manifest';
import { applyMerchantThemeOverrides as applyFashion, fashionTheme } from './theme-03-fashion/theme.config';
import { applyMerchantThemeOverrides as applyTech, baseTheme as techTheme } from './theme-04-tech/theme.base';
import { applyMerchantThemeOverrides as applyLedup, baseTheme as ledupTheme } from './theme-05-ledup/theme.base';

// Every theme must give the seller the same product-card controls (info line, badge position, badge shape) and must honour them.
const THEMES = [
  { name: 'Fashion', manifest: fashionThemeManifest, apply: applyFashion as (c: unknown) => void, tokens: fashionTheme as any },
  { name: 'Tech', manifest: techThemeManifest, apply: applyTech as (c: unknown) => void, tokens: techTheme as any },
  { name: 'LedUp', manifest: ledupThemeManifest, apply: applyLedup as (c: unknown) => void, tokens: ledupTheme as any },
];

const optionValues = (manifest: { themeSettingsFields: { key: string; control: any }[] }, key: string) => {
  const f = manifest.themeSettingsFields.find(x => x.key === key);
  return f ? (f.control.options as { value: string }[]).map(o => o.value) : null;
};

describe.each(THEMES)('$name: product card settings', ({ manifest, apply, tokens }) => {
  it('offers the info line, badge position and badge shape controls under "Product cards"', () => {
    for (const key of ['cardInfoLine', 'cardBadgePosition', 'badgeStyle', 'cardTag']) {
      const f = manifest.themeSettingsFields.find(x => x.key === key);
      expect(f, `${key} control`).toBeTruthy();
      expect(f!.group).toBe('Product cards');
    }
  });

  it('lists exactly the values the card code understands', () => {
    expect(optionValues(manifest, 'cardInfoLine')).toEqual([...CARD_INFO_LINES]);
    expect(optionValues(manifest, 'cardBadgePosition')).toEqual([...CARD_BADGE_POSITIONS]);
  });

  it('applies the seller\'s choices to the theme', () => {
    apply({ cardInfoLine: 'subcategory_category', cardBadgePosition: 'bottom-left', badgeStyle: 'square' });
    expect(tokens.cardInfoLine).toBe('subcategory_category');
    expect(tokens.cardBadgePosition).toBe('bottom-left');
    expect(tokens.badgeStyle).toBe('square');
  });

  it('falls back to the old behaviour (vendor line, top-left) when nothing is set', () => {
    apply({});
    expect(tokens.cardInfoLine).toBe('vendor');
    expect(tokens.cardBadgePosition).toBe('top-left');
  });
});
