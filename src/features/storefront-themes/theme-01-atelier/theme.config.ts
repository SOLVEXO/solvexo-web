// ─────────────────────────────────────────────────────────────────────────────
// THEME 01 — "Atelier"
// A premium editorial fashion/lifestyle storefront. Genuinely independent
// design system — NOT fed through the legacy 12-theme `StorefrontCfg` /
// `resolveStorefrontCfg()` token system (see `src/features/storefront/`).
// Every value here is this theme's own, owned, hardcoded design decision.
// ─────────────────────────────────────────────────────────────────────────────

export const atelierTheme = {
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
} as const;

export type AtelierTheme = typeof atelierTheme;
