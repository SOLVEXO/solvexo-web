// THEME 05 - "Ledup" (Architectural & Commercial LED Lighting Theme)
// Based on https://ledup.pt - Warm metallic bronze hero banner, signature curved tab cutout,
// pill navigation bar, minimalist white product cards with technical specs (Wattage, CCT, SKU),
// single product page with interactive specifications table, datasheet downloads, and high-curvature espresso footer.

import { readProductsPerPage } from '../themeManifest';
import { setVendorPrefix } from '../core/VendorLink';
import { applyMerchantThemeOverrides as applyBase, baseTheme,  relativeLuminance, type BaseMerchantColors } from './theme.base';

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
    bg: '#FAFAFA',
    bgAlt: '#F9F8F6',
    ink: '#1C1917',
    inkMuted: '#78716C',
    border: '#EAE8E5',
    borderStrong: '#D6D3D1',
    accent: '#4b423b',
    banner: '#c49466',
    footer: '#54453a',
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
  preloader: { mode: 'once' as 'once' | 'always' | 'hide', bg: '#0a0a0b', logo: '', tone: 'light' as 'light' | 'original', style: 'fade' as 'fade' | 'bar' | 'pulse', seconds: 1.5 },
  checkoutSummary: 'right' as 'right' | 'left',
  cartUpsell: true,
  /** Products per page on collection/category/search; seller settings `custom.productsPerPage` / `custom.productShowAll`. */
  pagination: { productsPerPage: 12 },
};

/** Blend two #rrggbb colours: weight = share of the first. */
function mixHex(a: string, b: string, weight: number): string {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const m = (x: number, y: number) => Math.round(x * weight + y * (1 - weight)).toString(16).padStart(2, '0');
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
}

export const ledupTheme = { ...STATIC_DEFAULTS };
/** Colours before any store customisation: reset on every apply so one store's colours never leak into the next store opened in the same tab. */
const DEFAULT_COLORS = { ...STATIC_DEFAULTS.colors };

export type LedupColors = typeof ledupTheme.colors;

export function applyMerchantThemeOverrides(colors: BaseMerchantColors | null | undefined): void {
  applyBase(colors);
  Object.assign(ledupTheme.colors, DEFAULT_COLORS);
  const ts = (colors as { themeSettings?: Record<string, unknown> } | null | undefined)?.themeSettings;
  const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
  ledupTheme.colors.banner = hex(ts?.bannerColor) ?? DEFAULT_COLORS.banner;
  ledupTheme.colors.footer = hex(ts?.footerColor) ?? DEFAULT_COLORS.footer;
  const pick = <T extends string>(v: unknown, all: readonly T[], d: T): T => (typeof v === 'string' && (all as readonly string[]).includes(v) ? (v as T) : d);
  const secs = Number(ts?.preloaderSeconds);
  ledupTheme.preloader = {
    mode: pick(ts?.preloader, ['once', 'always', 'hide'] as const, 'once'),
    bg: hex(ts?.preloaderBg) ?? '#0a0a0b',
    logo: typeof ts?.preloaderLogo === 'string' && /^https:\/\//.test(ts.preloaderLogo.trim()) ? ts.preloaderLogo.trim() : '',
    tone: pick(ts?.preloaderTone, ['light', 'original'] as const, 'light'),
    style: pick(ts?.preloaderStyle, ['fade', 'bar', 'pulse'] as const, 'fade'),
    seconds: Number.isFinite(secs) && secs >= 0.5 && secs <= 6 ? secs : 1.5,
  };
  const themeSettings = (colors as { themeSettings?: Record<string, unknown> } | null | undefined)?.themeSettings;
  ledupTheme.pagination.productsPerPage = readProductsPerPage(themeSettings).pageSize;
  setVendorPrefix(themeSettings?.vendorPrefix);
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
