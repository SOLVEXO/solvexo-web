// ─────────────────────────────────────────────────────────────────────────────
// THEME 01 — "Atelier"
// A premium editorial fashion/lifestyle storefront. Genuinely independent
// design system — NOT fed through the legacy 12-theme `StorefrontCfg` /
// `resolveStorefrontCfg()` token system (see `src/features/storefront/`).
// Every value here is this theme's own, owned, hardcoded design decision —
// these are the STATIC DEFAULTS a store renders with until a merchant
// customizes their theme (see `applyMerchantThemeOverrides` below).
// ─────────────────────────────────────────────────────────────────────────────

const STATIC_DEFAULTS = {
  id: 'theme-01-atelier',
  name: 'Atelier',
  description: 'Premium editorial fashion & lifestyle — asymmetric layouts, large photography, and a quiet, confident typographic voice.',
  category: 'fashion' as const,

  // Typography — a serif display paired with a clean, letter-spaced sans.
  // Both are already loaded platform-wide via index.css's Google Fonts
  // @import (Fraunces + Inter are both already in the loaded set — see
  // `src/index.css`), so this theme needs no additional font loading.
  fonts: {
    display: `'Fraunces', serif`,
    body: `'Inter', sans-serif`,
  },

  // Color system — warm ivory ground, near-black ink, one restrained brass
  // accent used sparingly (never as a background fill, only for small
  // details: underlines, active states, price emphasis).
  colors: {
    bg: '#FAF8F4',
    bgAlt: '#F1EDE5',
    ink: '#161412',
    inkMuted: '#6B6459',
    border: '#E4DFD3',
    accent: '#9C7A3C',
    accentInk: '#FFFFFF',
    danger: '#B3413A',
    success: '#3D6B4F',
  },

  // Spacing / layout scale — generous, editorial whitespace.
  layout: {
    maxWidth: '1400px',
    sectionPadY: 'clamp(64px, 8vw, 128px)',
    containerPadX: 'clamp(20px, 5vw, 64px)',
  },

  // Radii — sharp corners throughout (editorial, not soft-commerce).
  radius: {
    none: '0px',
    sm: '2px',
    md: '4px',
  },

  // Buttons — the one place Atelier's own `AtelierButton` reads a merchant's
  // saved `StorefrontColors.buttonStyle/buttonRadius/buttonWidth` (see
  // `applyMerchantThemeOverrides`). Sharp/outline-first by default, matching
  // the rest of the theme's editorial identity.
  buttonStyle: 'outline' as 'solid' | 'outline' | 'soft',
  buttonRadiusPx: '0px',
  buttonWidth: 'auto' as 'auto' | 'full',
};

/** `atelierTheme` is a real, mutable singleton (not `as const`/frozen) —
 *  every one of the ~38 files across this theme that does
 *  `import { atelierTheme as t } from '../theme.config'` reads `t.colors.x`
 *  / `t.fonts.x` fresh at render time, so mutating these nested fields in
 *  place (rather than replacing the object reference) makes a merchant's
 *  saved customization show up everywhere the static default used to,
 *  with zero changes to any of those 38 files. See
 *  `applyMerchantThemeOverrides` for the one place this is ever mutated.
 *
 *  A deep clone of `STATIC_DEFAULTS`, NOT the same object reference — the
 *  fallback below (`d = STATIC_DEFAULTS`) must stay the untouched literal
 *  defaults forever, otherwise clearing a customized field just re-applies
 *  whatever was last mutated in here instead of actually resetting. */
export const atelierTheme: typeof STATIC_DEFAULTS = JSON.parse(JSON.stringify(STATIC_DEFAULTS));

export type AtelierTheme = typeof atelierTheme;

/** The literal default values, kept separate so a store that never
 *  customizes (or a merchant who wants to reset a single field) always has
 *  a real fallback to mutate back to — never re-derived/guessed. */
export const ATELIER_STATIC_DEFAULTS = STATIC_DEFAULTS;

const SECTION_PAD_Y_PRESET: Record<'compact' | 'comfortable' | 'spacious', string> = {
  compact:     'clamp(40px, 5vw, 80px)',
  comfortable: STATIC_DEFAULTS.layout.sectionPadY,
  spacious:    'clamp(88px, 11vw, 176px)',
};
const MAX_WIDTH_PRESET: Record<'narrow' | 'standard' | 'wide', string> = {
  narrow:   '1180px',
  standard: STATIC_DEFAULTS.layout.maxWidth,
  wide:     '1600px',
};
const BUTTON_RADIUS_PRESET: Record<'none' | 'small' | 'medium' | 'large' | 'full', string> = {
  none: '0px', small: '4px', medium: '8px', large: '16px', full: '9999px',
};

/** Real color-relationship math, not literal merchant fields for every
 *  token — Atelier has 9 color roles but a merchant only ever picks 3
 *  (background / text / accent, matching every other e-commerce theme
 *  editor's mental model). `bgAlt`/`inkMuted`/`border`/`accentInk` are
 *  derived from those 3 so the whole palette stays visually coherent
 *  instead of asking a merchant to individually tune 9 swatches. */
export function mixHex(hex: string, target: 'black' | 'white', amount: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16), g = parseInt(full.substring(2, 4), 16), b = parseInt(full.substring(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  const t = target === 'white' ? 255 : 0;
  const mix = (c: number) => Math.round(c + (t - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}
export function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16), g = parseInt(full.substring(2, 4), 16), b = parseInt(full.substring(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return 1;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** The one place `atelierTheme`'s mutable fields are ever written.
 *  `colors` is the real merchant-saved `StorefrontColors` subset Atelier
 *  can meaningfully render with — see `AtelierThemeSettingsPanel`'s doc
 *  comment for why only this subset (of the full ~25-field legacy schema)
 *  is exposed. Passing `null` resets every field back to the theme's own
 *  static defaults (a store that never customizes, or Explicitly Reset). */
export function applyMerchantThemeOverrides(colors: {
  bgColor?: string; textColor?: string; primaryColor?: string; font?: string;
  buttonStyle?: 'solid' | 'outline' | 'soft';
  buttonRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  buttonWidth?: 'auto' | 'full';
  sectionSpacing?: 'compact' | 'comfortable' | 'spacious';
  containerWidth?: 'narrow' | 'standard' | 'wide';
} | null | undefined): void {
  const d = STATIC_DEFAULTS;
  const bg = colors?.bgColor || d.colors.bg;
  const ink = colors?.textColor || d.colors.ink;
  const accent = colors?.primaryColor || d.colors.accent;
  const isDarkBg = relativeLuminance(bg) < 0.5;

  atelierTheme.colors.bg = bg;
  atelierTheme.colors.ink = ink;
  atelierTheme.colors.accent = accent;
  // Derived, not merchant-set — see doc comment above.
  atelierTheme.colors.bgAlt = mixHex(bg, isDarkBg ? 'white' : 'black', 0.05);
  atelierTheme.colors.inkMuted = mixHex(ink, isDarkBg ? 'black' : 'white', 0.42);
  atelierTheme.colors.border = mixHex(bg, isDarkBg ? 'white' : 'black', 0.12);
  atelierTheme.colors.accentInk = relativeLuminance(accent) < 0.5 ? '#FFFFFF' : d.colors.ink;

  atelierTheme.fonts.body = colors?.font ? `'${colors.font}', sans-serif` : d.fonts.body;

  atelierTheme.buttonStyle = colors?.buttonStyle ?? d.buttonStyle;
  atelierTheme.buttonRadiusPx = BUTTON_RADIUS_PRESET[colors?.buttonRadius ?? 'none'];
  atelierTheme.buttonWidth = colors?.buttonWidth ?? d.buttonWidth;

  atelierTheme.layout.sectionPadY = SECTION_PAD_Y_PRESET[colors?.sectionSpacing ?? 'comfortable'];
  atelierTheme.layout.maxWidth = MAX_WIDTH_PRESET[colors?.containerWidth ?? 'standard'];
}

export type AtelierSectionColors = typeof ATELIER_STATIC_DEFAULTS.colors;

/** Real per-section color override — a section referencing one of the
 *  store's own saved `ColorScheme`s (see `Section.colorSchemeId`'s schema
 *  doc comment) renders with THIS resolved palette instead of
 *  `atelierTheme.colors`, so e.g. one Hero section can be dark while the
 *  rest of the page stays light. Uses the exact same 3-color-in,
 *  full-palette-out derivation `applyMerchantThemeOverrides` uses for the
 *  theme-wide colors, so a section's scheme looks like a first-class part
 *  of the theme, not a bolted-on flat-color patch. Falls back to the
 *  theme's own current colors (unchanged rendering) when `colorSchemeId` is
 *  null/undefined, or references a scheme that's been renamed/deleted since
 *  the section was saved — never throws, never a blank/broken section. */
export function resolveSectionColors(
  colorSchemeId: string | null | undefined,
  colorSchemes: { id: string; bgColor: string; textColor: string; primaryColor: string }[] | undefined,
): AtelierSectionColors {
  const scheme = colorSchemeId ? colorSchemes?.find(s => s.id === colorSchemeId) : undefined;
  if (!scheme) return atelierTheme.colors;

  const bg = scheme.bgColor;
  const ink = scheme.textColor;
  const accent = scheme.primaryColor;
  const isDarkBg = relativeLuminance(bg) < 0.5;

  return {
    bg,
    ink,
    accent,
    bgAlt: mixHex(bg, isDarkBg ? 'white' : 'black', 0.05),
    inkMuted: mixHex(ink, isDarkBg ? 'black' : 'white', 0.42),
    border: mixHex(bg, isDarkBg ? 'white' : 'black', 0.12),
    accentInk: relativeLuminance(accent) < 0.5 ? '#FFFFFF' : ATELIER_STATIC_DEFAULTS.colors.ink,
    danger: atelierTheme.colors.danger,
    success: atelierTheme.colors.success,
  };
}
