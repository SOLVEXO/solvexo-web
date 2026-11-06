import { afterEach, describe, expect, it } from 'vitest';
import { findCatalogFont } from '@/utils/googleFonts';
import { NEW_THEME_REGISTRY, DEFAULT_THEME_ID, listNewThemeEntries } from '../registry';
import { baseTheme } from './theme.base';
import { THEME_MANIFESTS } from '../themeManifest';
import { applyMerchantThemeOverrides, techTheme, TECH_STATIC_DEFAULTS } from './theme.config';
import { techThemeManifest } from './theme.manifest';

const fields = techThemeManifest.themeSettingsFields;
const byKey = new Map(fields.map(f => [f.key as string, f]));
const HEX = /^#[0-9a-fA-F]{6}$/;

/** A value the backend DTO would accept for this field. */
function validFor(key: string, value: unknown): boolean {
  const f = byKey.get(key);
  if (!f) return false;
  if (f.control.kind === 'font') return (value === null && !!f.control.defaultLabel) || (typeof value === 'string' && findCatalogFont(value) !== undefined);
  if (f.control.kind === 'select') return (key === 'headingFont' && value === null) || (typeof value === 'string' && f.control.options.some(o => o.value === value));
  return value === null || (typeof value === 'string' && HEX.test(value));
}

describe('Tech Store theme styles', () => {
  it('has eight one-click looks', () => {
    expect((techThemeManifest.styles ?? []).map(s => s.id)).toEqual(['light', 'midnight', 'graphite', 'neon', 'minimal', 'bold', 'ocean', 'sunset']);
  });

  it('every style only sets real settings with values the server accepts', () => {
    for (const style of techThemeManifest.styles ?? []) {
      for (const [key, value] of Object.entries(style.settings)) {
        // settings Tech dropped from the panel may still sit in the shared defaults; they are never offered, so only check offered ones
        if (!byKey.has(key)) continue;
        expect(validFor(key, value), `${style.id}.${key} = ${String(value)}`).toBe(true);
      }
    }
  });

  it('defaults cover every editable setting, so "Reset to default" resets everything', () => {
    const defaults = techThemeManifest.defaultSettings ?? {};
    for (const f of fields.filter(x => !String(x.key).startsWith('custom.'))) expect(f.key in defaults, `default for ${f.key}`).toBe(true);
  });

  it('every style completely defines the look (nothing left over from the previous style)', () => {
    for (const style of techThemeManifest.styles ?? []) {
      for (const f of fields.filter(x => !String(x.key).startsWith('custom.'))) expect(f.key in style.settings, `${style.id} sets ${f.key}`).toBe(true);
    }
  });

  it('every setting has help text and a unique key', () => {
    for (const f of fields) expect(f.helpText, f.key).toBeTruthy();
    expect(new Set(fields.map(f => f.key)).size).toBe(fields.length);
  });

  it('custom settings the theme reads are all offered, with the names the config reads', () => {
    const custom = fields.filter(f => String(f.key).startsWith('custom.')).map(f => String(f.key));
    for (const key of ['custom.techDarkColor', 'custom.techTopBar', 'custom.techStickyHeader', 'custom.techCardStyle', 'custom.techMegaFeatured', 'custom.techShape', 'custom.techWarning', 'custom.techHeader', 'custom.techTopHours', 'custom.techTopShowroom', 'custom.techFooterTone']) expect(custom).toContain(key);
  });

  it('custom sections are namespaced and declare a label, description and a heading or block', () => {
    for (const d of techThemeManifest.customSections ?? []) {
      expect(d.key.startsWith('tech.'), d.key).toBe(true);
      expect(d.label && d.description, d.key).toBeTruthy();
      expect(d.fields.length > 0 || !!d.block, d.key).toBe(true);
    }
  });
});

describe('Tech Store theme settings are applied', () => {
  afterEach(() => applyMerchantThemeOverrides(null));

  it('starts from the colours read off the design frames', () => {
    applyMerchantThemeOverrides(null);
    expect(techTheme.colors.accent).toBe('#0156FF');
    expect(techTheme.colors.bgAlt).toBe('#F5F7FF');
    expect(techTheme.colors.dark).toBe('#020203');
    expect(techTheme.fonts.body).toContain('Poppins');
  });

  it('the default style reproduces the out-of-the-box theme', () => {
    applyMerchantThemeOverrides(techThemeManifest.defaultSettings);
    const d = structuredClone(techTheme.colors);
    applyMerchantThemeOverrides(null);
    expect(techTheme.colors).toEqual(d);
  });

  it('a seller colour reaches Tech and its shared settings engine', () => {
    applyMerchantThemeOverrides({ primaryColor: '#E11D48', bgColor: '#FFFFFF', textColor: '#111111' });
    expect(techTheme.colors.accent).toBe('#E11D48');
    expect(baseTheme.colors.accent).toBe('#E11D48');
    expect(techTheme.colors.selected).toBe('#E11D48');
    expect(baseTheme.fonts.body).toContain('Poppins');
  });

  it('theme-declared settings are read and invalid ones are ignored', () => {
    applyMerchantThemeOverrides({ themeSettings: { techTopBar: 'hide', techStickyHeader: 'off', techCardStyle: 'shadow', techDarkColor: '#101828' } });
    expect(techTheme.topBar).toBe(false);
    expect(techTheme.stickyHeader).toBe(false);
    expect(techTheme.productCardStyle).toBe('shadow');
    expect(techTheme.colors.dark).toBe('#101828');
    applyMerchantThemeOverrides({ themeSettings: { techCardStyle: 'bogus', techDarkColor: 'red' } });
    expect(techTheme.productCardStyle).toBe('flat');
    expect(techTheme.colors.dark).toBe(TECH_STATIC_DEFAULTS.colors.dark);
  });

  it('the shape setting moves every corner together', () => {
    applyMerchantThemeOverrides({ themeSettings: { techShape: 'square' } });
    expect([techTheme.buttonRadiusPx, techTheme.fieldRadiusPx, techTheme.cardRadiusPx, techTheme.imageRadiusPx, techTheme.badgeRadiusPx]).toEqual(['0px', '0px', '0px', '0px', '0px']);
    applyMerchantThemeOverrides({ themeSettings: { techShape: 'rounded' } });
    expect(techTheme.buttonRadiusPx).toBe('12px');
    expect(techTheme.cardRadiusPx).toBe('16px');
    applyMerchantThemeOverrides({ themeSettings: { techShape: 'nonsense' } });
    expect(techTheme.shape).toBe('tech');
    expect(techTheme.buttonRadiusPx).toBe('9999px');
    expect(techTheme.fieldRadiusPx).toBe('4px');
  });

  it('container width, button size and the warning colour are read', () => {
    applyMerchantThemeOverrides({ containerWidth: 'wide', buttonSize: 'lg', themeSettings: { techWarning: '#CA8A04' } });
    expect(techTheme.layout.maxWidth).toBe('1680px');
    expect(techTheme.buttonHeightPx).toBe('56px');
    expect(techTheme.colors.warning).toBe('#CA8A04');
    applyMerchantThemeOverrides(null);
    expect(techTheme.layout.maxWidth).toBe('1400px');
    expect(techTheme.buttonHeightPx).toBe('50px');
  });

  it('dark presets get a lighter field outline and keep a dark base', () => {
    const midnight = techThemeManifest.styles!.find(s => s.id === 'midnight')!;
    applyMerchantThemeOverrides(midnight.settings);
    expect(techTheme.colors.bg).toBe('#0B1020');
    expect(techTheme.colors.borderStrong).not.toBe(TECH_STATIC_DEFAULTS.colors.borderStrong);
  });

  it('header layout, top bar texts and footer tone are read and bad values fall back', () => {
    applyMerchantThemeOverrides({ themeSettings: { techHeader: 'search-first', techTopHours: '  Mon-Fri 9-5  ', techTopShowroom: 'Visit our showroom', techFooterTone: 'light' } });
    expect(techTheme.header).toBe('search-first');
    expect(techTheme.topBarHours).toBe('Mon-Fri 9-5');
    expect(techTheme.topBarShowroom).toBe('Visit our showroom');
    expect(techTheme.footerTone).toBe('light');
    applyMerchantThemeOverrides({ themeSettings: { techHeader: 'huge', techTopHours: 42, techFooterTone: 'blue' } });
    expect(techTheme.header).toBe('standard');
    expect(techTheme.topBarHours).toBe('');
    expect(techTheme.footerTone).toBe('dark');
    applyMerchantThemeOverrides({ themeSettings: { techTopHours: 'x'.repeat(200) } });
    expect(techTheme.topBarHours.length).toBe(80);
  });

  it('every preset applies cleanly and picks a known shape', () => {
    for (const s of techThemeManifest.styles ?? []) {
      applyMerchantThemeOverrides(s.settings);
      expect(['tech', 'pill', 'rounded', 'square'], s.id).toContain(techTheme.shape);
      expect(techTheme.colors.accent, s.id).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('a dark base colour keeps derived panel colours instead of the light blue panel', () => {
    applyMerchantThemeOverrides({ bgColor: '#0B1020', textColor: '#F5F7FF' });
    expect(techTheme.colors.bgAlt).not.toBe('#F5F7FF');
  });
});

describe('Tech Store registration', () => {
  it('is registered next to Maison, which stays the default', () => {
    expect(DEFAULT_THEME_ID).toBe('theme-03-fashion');
    expect(Object.keys(NEW_THEME_REGISTRY)).toEqual(expect.arrayContaining(['theme-03-fashion', 'theme-04-tech']));
    expect(THEME_MANIFESTS['theme-04-tech']).toBe(techThemeManifest);
  });

  it('every storefront route key has a native Tech page', () => {
    const KEYS = ['home', 'product', 'category', 'collection', 'collections', 'faqs', 'search', 'cart', 'checkout', 'checkoutReturn', 'login', 'register', 'verifyOtp', 'account', 'wishlist', 'loyalty', 'messages', 'notifications', 'returns', 'giftCards', 'giftCardView', 'storeCredit', 'orders', 'orderDetail', 'library', 'memberships', 'licenses', 'learn', 'orderStatus', 'addresses', 'myReviews', 'blogIndex', 'blogPost', 'customPage', 'forgotPassword', 'newPassword', 'notFound'];
    const pages = NEW_THEME_REGISTRY['theme-04-tech'].pages as Record<string, unknown>;
    for (const k of KEYS) expect(pages[k], k).toBeTruthy();
    expect(Object.keys(pages).sort()).toEqual([...KEYS].sort());
  });

  it('shows honest build progress: only the pages it really draws count as built', () => {
    const entry = listNewThemeEntries().find(e => e.id === 'theme-04-tech');
    const impl = NEW_THEME_REGISTRY['theme-04-tech'];
    expect(entry?.builtRouteCount).toBe(Object.keys(impl.pages).length);
    expect(entry!.builtRouteCount).toBeLessThanOrEqual(entry!.totalRouteCount);
    expect(entry!.builtRouteCount).toBe(37);
  });

  it('installs with the Tech look, not the backend defaults', () => {
    const d = NEW_THEME_REGISTRY['theme-04-tech'].installDefaults;
    expect(d.primaryColor).toBe('#0156FF');
    expect(d.font).toBe('Poppins');
  });
});
