// THEME 05 - "Ledup" (Architectural & Commercial LED Lighting Theme)
// Based on https://ledup.pt - Warm metallic bronze hero banner, signature curved tab cutout,
// pill navigation bar, minimalist white product cards with technical specs (Wattage, CCT, SKU),
// single product page with interactive specifications table, datasheet downloads, and high-curvature espresso footer.

import { readProductsPerPage } from '../themeManifest';
import { applyMerchantThemeOverrides as applyBase, baseTheme, mixHex, relativeLuminance, type BaseMerchantColors } from './theme.base';

export const LEDUP_SHAPES = {
  ledup: { button: '9999px', field: '9999px', card: '16px', image: '16px', badge: '9999px' },
  pill: { button: '9999px', field: '9999px', card: '24px', image: '20px', badge: '9999px' },
  rounded: { button: '12px', field: '10px', card: '12px', image: '12px', badge: '6px' },
  square: { button: '0px', field: '0px', card: '0px', image: '0px', badge: '0px' },
} as const;

export type LedupShapeId = keyof typeof LEDUP_SHAPES;

const LEDUP_WIDTH = { narrow: '1140px', standard: '1380px', wide: '1600px' } as const;
const BUTTON_HEIGHT = { sm: '38px', md: '48px', lg: '54px' } as const;

const STATIC_DEFAULTS = {
  id: 'theme-05-ledup',
  name: 'Ledup',
  fonts: { display: `'Poppins', system-ui, sans-serif`, body: `'Poppins', system-ui, sans-serif` },
  colors: {
    bg: '#FFFFFF',
    bgAlt: '#F9F8F6',
    ink: '#1C1917',
    inkMuted: '#78716C',
    border: '#EAE8E5',
    borderStrong: '#D6D3D1',
    accent: '#8C7355',
    accentInk: '#FFFFFF',
    accentGradient: 'linear-gradient(135deg, #C29367 0%, #D4A373 50%, #B07D50 100%)',
    footerBg: 'linear-gradient(180deg, #423932 0%, #2A241F 100%)',
    footerInk: '#FFFFFF',
    cardBg: '#FFFFFF',
    tagBg: '#594C40',
    tagInk: '#FFFFFF',
    selected: '#594C40',
    selectedInk: '#FFFFFF',
    dark: '#2A241F',
    darkInk: '#FFFFFF',
    star: '#EAB308',
    starOff: '#D4D4D8',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    price: '#1C1917',
  },
  layout: {
    maxWidth: LEDUP_WIDTH.standard as string,
    containerPadX: 'clamp(16px, 4vw, 48px)',
    sectionPadY: 'clamp(40px, 6vw, 80px)',
  },
  shape: 'ledup' as LedupShapeId,
  buttonRadiusPx: '9999px',
  buttonHeightPx: BUTTON_HEIGHT.md as string,
  cardRadiusPx: '16px',
  fieldRadiusPx: '9999px',
  imageRadiusPx: '16px',
  badgeRadiusPx: '9999px',
  // Custom seller settings
  topBar: false,
  stickyHeader: true,
  curvedFooterRadiusPx: '50px',
  showDatasheetButton: true,
  showCharacteristicsTable: true,
  checkoutSummary: 'right' as 'right' | 'left',
  cartUpsell: true,
  /** Products per page on collection/category/search; seller settings `custom.productsPerPage` / `custom.productShowAll`. */
  pagination: { productsPerPage: 12 },
};

export const ledupTheme = { ...STATIC_DEFAULTS };
/** Colours before any store customisation: reset on every apply so one store's colours never leak into the next store opened in the same tab. */
const DEFAULT_COLORS = { ...STATIC_DEFAULTS.colors };

export type LedupColors = typeof ledupTheme.colors;

export function applyMerchantThemeOverrides(colors: BaseMerchantColors | null | undefined): void {
  applyBase(colors);
  Object.assign(ledupTheme.colors, DEFAULT_COLORS);
  ledupTheme.pagination.productsPerPage = readProductsPerPage((colors as { themeSettings?: Record<string, unknown> } | null | undefined)?.themeSettings).pageSize;
  ledupTheme.fonts.body = baseTheme.fonts.body;
  ledupTheme.fonts.display = baseTheme.fonts.display;

  if (colors?.primaryColor) {
    ledupTheme.colors.accent = colors.primaryColor;
    const lum = relativeLuminance(colors.primaryColor);
    ledupTheme.colors.accentInk = lum > 0.55 ? '#0A0A0A' : '#FFFFFF';
  }
  if (colors?.bgColor) {
    ledupTheme.colors.bg = colors.bgColor;
    ledupTheme.colors.bgAlt = mixHex(colors.bgColor, '#000000', 0.96);
  }
  if (colors?.textColor) {
    ledupTheme.colors.ink = colors.textColor;
    ledupTheme.colors.inkMuted = mixHex(colors.textColor, ledupTheme.colors.bg, 0.6);
  }
  if (colors?.mutedColor) ledupTheme.colors.inkMuted = colors.mutedColor;
  if (colors?.saleColor) ledupTheme.colors.danger = colors.saleColor;
  if (colors?.borderColor) {
    ledupTheme.colors.border = colors.borderColor;
    ledupTheme.colors.borderStrong = mixHex(colors.borderColor, '#000000', 0.85);
  }
}
