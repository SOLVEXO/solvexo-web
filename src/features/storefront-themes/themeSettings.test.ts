import { describe, expect, it } from 'vitest';
import type { StorefrontColors } from '@/api/services/storeTheme';
import { customThemeSetting, readThemeSetting, themeSettingPatch } from './themeManifest';

const colors = { primaryColor: '#000000', themeSettings: { showBadge: true, label: 'New' } } as unknown as StorefrontColors;

describe('theme-declared (custom.*) settings', () => {
  it('reads shared keys and custom keys the same way', () => {
    expect(readThemeSetting(colors, { key: 'primaryColor' })).toBe('#000000');
    expect(readThemeSetting(colors, { key: 'custom.label' })).toBe('New');
    expect(readThemeSetting(colors, { key: 'custom.missing' })).toBeUndefined();
  });

  it('patches a shared key directly and merges a custom key into themeSettings', () => {
    expect(themeSettingPatch(colors, { key: 'primaryColor' }, '#ffffff')).toEqual({ primaryColor: '#ffffff' });
    expect(themeSettingPatch(colors, { key: 'custom.label' }, 'Sale')).toEqual({ themeSettings: { showBadge: true, label: 'Sale' } });
  });

  it('removes a custom key on null and does not mutate the source', () => {
    expect(themeSettingPatch(colors, { key: 'custom.label' }, null)).toEqual({ themeSettings: { showBadge: true } });
    expect(colors.themeSettings).toEqual({ showBadge: true, label: 'New' });
  });

  it('falls back to the theme default when the value is missing or has the wrong type', () => {
    expect(customThemeSetting(colors, 'showBadge', false)).toBe(true);
    expect(customThemeSetting(colors, 'label', 'x')).toBe('New');
    expect(customThemeSetting(colors, 'label', 5)).toBe(5);
    expect(customThemeSetting(undefined, 'showBadge', true)).toBe(true);
  });
});
