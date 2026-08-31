// ─────────────────────────────────────────────────────────────────────────────
// THEME 02 — "Nova"
// A bold, energetic modern lifestyle storefront — the deliberate visual
// opposite of Atelier's quiet editorial identity: pill-shaped buttons, a
// geometric display face, a vivid indigo accent used generously rather than
// sparingly. This is the reusability-proof second theme (see
// `theme-02-nova/README` note at the bottom of this file) — genuinely
// independent from Theme 01, not a re-skin: its own components, its own
// section renderers, its own manifest. Same pattern as `theme.config.ts` in
// `theme-01-atelier` — read that file's own doc comment first if this one
// is unclear on the "why" of any given piece; this file intentionally
// mirrors its shape so the two are easy to compare.
// ─────────────────────────────────────────────────────────────────────────────

const STATIC_DEFAULTS = {
  id: 'theme-02-nova',
  name: 'Nova',
  description: 'Bold, energetic, commerce-first — vivid color, confident geometric type, and punchy pill buttons.',
  category: 'lifestyle' as const,

  // 'Space Grotesk' (display) and 'DM Sans' (body) are both already loaded
  // platform-wide via index.css's Google Fonts @import — same set Atelier's
  // 'Fraunces'/'Inter' come from (see the Theme Settings font dropdown,
  // which offers both) — so, like Atelier, this theme needs no additional
  // font loading of its own.
  fonts: {
    display: `'Space Grotesk', sans-serif`,
    body: `'DM Sans', sans-serif`,
  },

  // Color system — white ground, near-black ink with a cool undertone, one
  // vivid indigo used generously (fills, primary buttons, active states) —
  // the deliberate opposite of Atelier's "accent only as a small detail"
  // restraint.
  colors: {
    bg: '#FFFFFF',
    bgAlt: '#F2F0FF',
    ink: '#14121F',
    inkMuted: '#6E6B85',
    border: '#E3E1F2',
    accent: '#4B3BFF',
    accentInk: '#FFFFFF',
    danger: '#E4483A',
    success: '#1E9E6D',
  },

  // Spacing / layout scale — tighter, punchier than Atelier's generous
  // editorial whitespace.
  layout: {
    maxWidth: '1360px',
    sectionPadY: 'clamp(48px, 6vw, 96px)',
    containerPadX: 'clamp(16px, 4vw, 56px)',
  },

  // Radii — soft/rounded throughout (commerce-friendly, not editorial).
  radius: {
    none: '0px',
    sm: '8px',
    md: '14px',
  },

  // Buttons — solid-fill pill by default (contrast to Atelier's
  // sharp/outline-first identity). Same merchant-override mechanism as
  // Atelier: `NovaButton` reads a saved `StorefrontColors.buttonStyle/
  // buttonRadius/buttonWidth` via `applyMerchantThemeOverrides`.
  buttonStyle: 'solid' as 'solid' | 'outline' | 'soft',
  buttonRadiusPx: '9999px',
  buttonWidth: 'auto' as 'auto' | 'full',
};

/** `novaTheme` is a real, mutable singleton — every file across this theme
 *  that does `import { novaTheme as t } from '../theme.config'` reads
 *  `t.colors.x`/`t.fonts.x` fresh at render time, so mutating these nested
 *  fields in place (rather than replacing the object reference) makes a
 *  merchant's saved customization show up everywhere, with zero changes to
 *  any of those files. Exact same pattern as `atelierTheme` — see that
 *  file's own doc comment. */
export const novaTheme: typeof STATIC_DEFAULTS = STATIC_DEFAULTS;

export type NovaTheme = typeof novaTheme;

export const NOVA_STATIC_DEFAULTS = STATIC_DEFAULTS;

const SECTION_PAD_Y_PRESET: Record<'compact' | 'comfortable' | 'spacious', string> = {
  compact:     'clamp(28px, 4vw, 56px)',
  comfortable: STATIC_DEFAULTS.layout.sectionPadY,
  spacious:    'clamp(72px, 9vw, 144px)',
};
const MAX_WIDTH_PRESET: Record<'narrow' | 'standard' | 'wide', string> = {
  narrow:   '1140px',
  standard: STATIC_DEFAULTS.layout.maxWidth,
  wide:     '1560px',
};
const BUTTON_RADIUS_PRESET: Record<'none' | 'small' | 'medium' | 'large' | 'full', string> = {
  none: '0px', small: '4px', medium: '8px', large: '16px', full: '9999px',
};

// Identical color-relationship math to `theme.config.ts` in `theme-01-atelier`
// — see that file's doc comment for why derived roles (bgAlt/inkMuted/
// border/accentInk) aren't separately merchant-editable fields.
function mixHex(hex: string, target: 'black' | 'white', amount: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16), g = parseInt(full.substring(2, 4), 16), b = parseInt(full.substring(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  const t = target === 'white' ? 255 : 0;
  const mix = (c: number) => Math.round(c + (t - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}
function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16), g = parseInt(full.substring(2, 4), 16), b = parseInt(full.substring(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return 1;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** The one place `novaTheme`'s mutable fields are ever written — same real
 *  merchant-saved `StorefrontColors` subset Atelier's own
 *  `applyMerchantThemeOverrides` reads (see `AtelierThemeSettingsPanel`'s
 *  doc comment on why only this subset of the full schema is exposed; this
 *  theme's manifest — `theme.manifest.ts` — declares the exact same field
 *  set). Passing `null` resets every field back to this theme's own static
 *  defaults. */
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

  novaTheme.colors.bg = bg;
  novaTheme.colors.ink = ink;
  novaTheme.colors.accent = accent;
  novaTheme.colors.bgAlt = mixHex(bg, isDarkBg ? 'white' : 'black', 0.05);
  novaTheme.colors.inkMuted = mixHex(ink, isDarkBg ? 'black' : 'white', 0.42);
  novaTheme.colors.border = mixHex(bg, isDarkBg ? 'white' : 'black', 0.12);
  novaTheme.colors.accentInk = relativeLuminance(accent) < 0.5 ? '#FFFFFF' : d.colors.ink;

  novaTheme.fonts.body = colors?.font ? `'${colors.font}', sans-serif` : d.fonts.body;

  novaTheme.buttonStyle = colors?.buttonStyle ?? d.buttonStyle;
  novaTheme.buttonRadiusPx = BUTTON_RADIUS_PRESET[colors?.buttonRadius ?? 'full'];
  novaTheme.buttonWidth = colors?.buttonWidth ?? d.buttonWidth;

  novaTheme.layout.sectionPadY = SECTION_PAD_Y_PRESET[colors?.sectionSpacing ?? 'comfortable'];
  novaTheme.layout.maxWidth = MAX_WIDTH_PRESET[colors?.containerWidth ?? 'standard'];
}

/**
 * README — what Theme B (Nova) proves, and its disclosed scope.
 *
 * This is the reusability-proof second theme required by the platform's
 * theme-agnostic architecture requirement: it registers itself in
 * `NEW_THEME_REGISTRY` (rendering), `THEME_MANIFESTS` (Customize/Theme
 * Settings), and `THEME_DEV_FILES` (Edit Code) exactly like Atelier does,
 * through the exact same generic contracts — zero new editor-page code was
 * written to support it.
 *
 * DISCLOSED SCOPE: Nova implements Home, Product, Collection, Category,
 * Search, Blog Index, and Blog Article (7 of 16 `StorefrontRouteKey`s) —
 * the routes that are actually exercised by the Customize page's scope
 * switcher and the section-editor/manifest system, which is what this proof
 * is about. Cart/Checkout/Login/Register/VerifyOtp/ForgotPassword/
 * NewPassword/Account/CustomPage are NOT implemented for Nova; `ThemedRoute`
 * already has a real, intentional fallback for exactly this ("a future
 * theme that's mid-build and hasn't reached this route yet" — see that
 * file's own comment) that renders Atelier's real, fully-functional page
 * for those routes instead of a blank screen or a crash. A Nova store is
 * therefore fully usable end-to-end today; its own visual identity simply
 * doesn't yet extend to checkout/auth/account. `display.builtRouteCount`/
 * `totalRouteCount` on this theme's `NEW_THEME_REGISTRY` entry states this
 * honestly on its Theme Library card, matching the exact mechanism that
 * field exists for.
 */
