import { afterEach, describe, expect, it } from 'vitest';
import { fashionThemeManifest } from './theme.manifest';
import { applyMerchantThemeOverrides, fashionTheme, fashionTypographyCss, resolveSectionColors } from './theme.config';

const fields = fashionThemeManifest.themeSettingsFields;
const byKey = new Map(fields.map(f => [f.key as string, f]));
const HEX = /^#[0-9a-fA-F]{6}$/;

/** A value the backend DTO would accept for this field. */
function validFor(key: string, value: unknown): boolean {
  const f = byKey.get(key);
  if (!f) return false;
  if (f.control.kind === 'select') return (key === 'headingFont' && value === null) || typeof value === 'string' && f.control.options.some(o => o.value === value);
  return value === null || (typeof value === 'string' && HEX.test(value));
}

describe('Maison theme styles', () => {
  it('has the five one-click looks', () => {
    expect((fashionThemeManifest.styles ?? []).map(s => s.id)).toEqual(['classic', 'noir', 'editorial', 'soft', 'bold']);
  });

  it('every style only sets real settings with values the server accepts', () => {
    for (const style of fashionThemeManifest.styles ?? []) {
      for (const [key, value] of Object.entries(style.settings)) {
        expect(validFor(key, value), `${style.id}.${key} = ${String(value)}`).toBe(true);
      }
    }
  });

  it('defaults cover every editable setting, so "Reset to default" resets everything', () => {
    const defaults = fashionThemeManifest.defaultSettings ?? {};
    for (const f of fields) expect(f.key in defaults, `default for ${f.key}`).toBe(true);
    for (const [key, value] of Object.entries(defaults)) expect(validFor(key, value), `default ${key}`).toBe(true);
  });

  it('every style completely defines the look (nothing left over from the previous style)', () => {
    for (const style of fashionThemeManifest.styles ?? []) {
      for (const f of fields) expect(f.key in style.settings, `${style.id} sets ${f.key}`).toBe(true);
    }
  });

  it('every setting has help text', () => {
    for (const f of fields) expect(f.helpText, f.key).toBeTruthy();
  });
});

describe('Maison theme settings are applied', () => {
  afterEach(() => applyMerchantThemeOverrides(null));

  it('the default style reproduces the out-of-the-box theme', () => {
    applyMerchantThemeOverrides(fashionThemeManifest.defaultSettings);
    const d = fashionTheme.colors;
    applyMerchantThemeOverrides(null);
    expect(fashionTheme.colors).toEqual(d);
    expect(fashionTheme.sectionRadiusPx).toBe('28px');
    expect(fashionTypographyCss('main')).toBe('main :is(h1,h2,h3,h4){font-weight:500}');
  });

  it('applies typography, case and shape settings', () => {
    applyMerchantThemeOverrides({ headingWeight: 'bold', headingCase: 'uppercase', headingTracking: 'wide', buttonCase: 'uppercase', sectionRadius: 'none', inputRadius: 'full', badgeStyle: 'square', cardRating: 'hide', cardTag: 'hide', cardButton: 'hide' });
    expect(fashionTheme.headingWeight).toBe(700);
    expect(fashionTheme.sectionRadiusPx).toBe('0px');
    expect(fashionTheme.inputRadiusPx).toBe('9999px');
    expect(fashionTheme.badgeStyle).toBe('square');
    expect([fashionTheme.cardRating, fashionTheme.cardTag, fashionTheme.cardButton]).toEqual([false, false, false]);
    const css = fashionTypographyCss('[data-sx]');
    expect(css).toContain('[data-sx] :is(h1,h2,h3,h4){font-weight:700}');
    expect(css).toContain('text-transform:uppercase');
    expect(css).toContain('letter-spacing:0.04em');
    expect(css).toContain('.fx-pill,.fx-cta{text-transform:uppercase');
  });

  it('optional colours override the derived ones and fall back when cleared', () => {
    const derived = { ...applyThen({}) };
    applyMerchantThemeOverrides({ mutedColor: '#111111', borderColor: '#222222', saleColor: '#333333' });
    expect([fashionTheme.colors.inkMuted, fashionTheme.colors.border, fashionTheme.colors.danger]).toEqual(['#111111', '#222222', '#333333']);
    applyMerchantThemeOverrides({ mutedColor: null, borderColor: null, saleColor: null });
    expect(fashionTheme.colors.inkMuted).toBe(derived.inkMuted);
    expect(fashionTheme.colors.border).toBe(derived.border);
    expect(fashionTheme.colors.danger).toBe(derived.danger);
  });

  it('a section colour scheme can carry the extra roles', () => {
    const scheme = { id: 's1', bgColor: '#000000', textColor: '#ffffff', primaryColor: '#ff0000', mutedColor: '#999999', borderColor: '#333333', saleColor: '#00ff00' };
    const c = resolveSectionColors('s1', [scheme]);
    expect([c.bg, c.ink, c.accent, c.inkMuted, c.border, c.danger]).toEqual(['#000000', '#ffffff', '#ff0000', '#999999', '#333333', '#00ff00']);
    const plain = resolveSectionColors('s1', [{ id: 's1', bgColor: '#000000', textColor: '#ffffff', primaryColor: '#ff0000' }]);
    expect(plain.danger).toBe(fashionTheme.colors.danger);
  });
});

function applyThen(c: Parameters<typeof applyMerchantThemeOverrides>[0]) {
  applyMerchantThemeOverrides(c);
  return { ...fashionTheme.colors };
}

describe('Maison extended settings', () => {
  afterEach(() => applyMerchantThemeOverrides(null));

  it('has at least 60 settings, each with help text', () => {
    expect(fields.length).toBeGreaterThanOrEqual(60);
  });

  it('emits no extra rules at the defaults', () => {
    applyMerchantThemeOverrides(fashionThemeManifest.defaultSettings);
    expect(fashionTypographyCss('main')).toBe('main :is(h1,h2,h3,h4){font-weight:500}');
  });

  it('turns typography, link, button, grid and motion settings into rules', () => {
    applyMerchantThemeOverrides({ headingScale: 'xlarge', headingLineHeight: 'tight', headingColor: '#112233', bodyScale: 'large', bodyWeight: 'medium', linkUnderline: 'always', linkColor: '#445566', buttonSize: 'lg', buttonHover: 'lift', buttonShadow: 'soft', gridGap: 'airy', animations: 'off', focusRing: 'accent', sectionDividers: 'line', selection: 'accent' });
    const css = fashionTypographyCss('main');
    for (const expected of [
      'main :is(h1,h2){zoom:1.25}', 'line-height:1.05', 'main :is(h1,h2,h3,h4){color:#112233}', 'main .fx-on-image :is(h1,h2,h3,h4){color:inherit}',
      'main p{zoom:1.08}', 'main :is(p,li,dd){font-weight:500}', 'text-decoration:underline', 'main :is(p,li,dd) a{color:#445566}',
      'height:56px', 'translateY(-2px)', 'box-shadow:0 8px 20px -10px', '--fx-gap-x:32px;--fx-gap-y:56px', '.fx-up{animation:none', ':focus-visible{outline:2px solid', '[data-sx]+[data-sx]{border-top', '::selection',
    ]) expect(css, expected).toContain(expected);
  });

  it('colour roles and toggles reach the theme', () => {
    applyMerchantThemeOverrides({ priceColor: '#010101', starColor: '#020202', successColor: '#030303', cardBgColor: '#040404', buttonTextColor: '#050505', pagePadding: 'wide', showBreadcrumbs: 'hide', showReviews: 'hide', stickyBuyBar: 'hide', cardWishlist: 'hide', saleBadgeText: 'label' });
    expect([fashionTheme.colors.price, fashionTheme.colors.star, fashionTheme.colors.success, fashionTheme.colors.cardBg, fashionTheme.colors.accentInk]).toEqual(['#010101', '#020202', '#030303', '#040404', '#050505']);
    expect(fashionTheme.layout.containerPadX).toBe('clamp(24px, 6vw, 96px)');
    expect([fashionTheme.showBreadcrumbs, fashionTheme.showReviews, fashionTheme.stickyBuyBar, fashionTheme.cardWishlist]).toEqual([false, false, false, false]);
    expect(fashionTheme.saleBadgeText).toBe('label');
  });
});
