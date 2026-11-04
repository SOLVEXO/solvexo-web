// THEME 04 - "Tech Store" (electronics / computers)
// Colours below were read from the pixels of the exported design frames (primary blue, soft blue panel, near-black blocks,
// border grey, star orange, in-stock green). Merchant overrides go through `applyMerchantThemeOverrides`, the only writer
// of the singleton. It also feeds Maison's singleton (`fashionTheme`) with the same values: routes Tech does not design
// natively reuse Maison pages, which read that singleton, so they follow the Tech palette and fonts.
import { applyMerchantThemeOverrides as applyBase, fashionTheme, type FashionMerchantColors } from '../theme-03-fashion/theme.config';

const STATIC_DEFAULTS = {
  id: 'theme-04-tech',
  name: 'Tech Store',
  fonts: { display: `'Poppins', system-ui, sans-serif`, body: `'Poppins', system-ui, sans-serif` },
  colors: {
    bg: '#FFFFFF',
    bgAlt: '#F5F7FF',
    ink: '#020203',
    inkMuted: '#666666',
    border: '#CACDD8',
    accent: '#0156FF',
    accentInk: '#FFFFFF',
    /** Selected / active states (chosen option, step badge, count badge). Follows the accent unless the seller sets one. */
    selected: '#0156FF',
    selectedInk: '#FFFFFF',
    /** Near-black blocks (top bar, footer, dark feature bands). */
    dark: '#020203',
    darkInk: '#FFFFFF',
    star: '#E9A426',
    starOff: '#C4C4C4',
    success: '#78A962',
    danger: '#DC2626',
    price: '#020203',
  },
  layout: { maxWidth: '1280px', containerPadX: 'clamp(16px, 4vw, 40px)', sectionPadY: 'clamp(32px, 5vw, 64px)' },
  buttonRadiusPx: '9999px',
  cardRadiusPx: '4px',
  /** `custom.tech*` seller settings. */
  topBar: true,
  stickyHeader: true,
  productCardStyle: 'flat' as 'flat' | 'outlined' | 'shadow',
  showCardRating: true,
  megaFeatured: true,
};

export const techTheme: typeof STATIC_DEFAULTS = structuredClone(STATIC_DEFAULTS);
export type TechTheme = typeof techTheme;
export type TechColors = typeof STATIC_DEFAULTS.colors;
export const TECH_STATIC_DEFAULTS = STATIC_DEFAULTS;

/** What a freshly installed Tech store starts with (also the values a seller sees as "default" in Theme Settings). */
export const TECH_INSTALL_DEFAULTS = {
  primaryColor: STATIC_DEFAULTS.colors.accent,
  bgColor: STATIC_DEFAULTS.colors.bg,
  textColor: STATIC_DEFAULTS.colors.ink,
  font: 'Poppins',
  buttonStyle: 'solid' as const,
  buttonRadius: 'full' as const,
};

export type TechMerchantColors = FashionMerchantColors;

const HEX6 = /^#[0-9a-f]{6}$/i;
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);

/** Unset merchant values fall back to the Tech look (not Maison's), so the bridged Maison pages match. */
function withTechDefaults(c: TechMerchantColors | null | undefined): TechMerchantColors {
  const d = STATIC_DEFAULTS;
  return {
    ...c,
    bgColor: c?.bgColor || d.colors.bg,
    textColor: c?.textColor || d.colors.ink,
    primaryColor: c?.primaryColor || d.colors.accent,
    font: c?.font || 'Poppins',
    mutedColor: c?.mutedColor || d.colors.inkMuted,
    borderColor: c?.borderColor || d.colors.border,
    starColor: c?.starColor || d.colors.star,
    successColor: c?.successColor || d.colors.success,
    buttonRadius: c?.buttonRadius || 'full',
    productCardRadius: c?.productCardRadius || 'none',
    imageRadius: c?.imageRadius || 'none',
    sectionRadius: c?.sectionRadius || 'none',
    inputRadius: c?.inputRadius || 'small',
    cardRating: c?.cardRating || 'show',
    cardTag: c?.cardTag || 'hide',
    headingWeight: c?.headingWeight || 'semibold',
    cardStyle: c?.cardStyle || 'flat',
  };
}

/** The one place the Tech singleton (and, for reused routes, Maison's) is written. `null` resets to the Tech defaults. */
export function applyMerchantThemeOverrides(c: TechMerchantColors | null | undefined): void {
  const merged = withTechDefaults(c);
  applyBase(merged);
  const d = STATIC_DEFAULTS;
  const m = fashionTheme.colors;
  // Panels and rules follow the Tech palette unless the seller changed the base colours; derived values stay otherwise.
  const customBg = !!c?.bgColor && c.bgColor.toLowerCase() !== d.colors.bg.toLowerCase();
  if (!customBg) m.bgAlt = d.colors.bgAlt;
  const colors = techTheme.colors;
  colors.bg = m.bg;
  colors.ink = m.ink;
  colors.accent = m.accent;
  colors.accentInk = m.accentInk;
  colors.selected = m.selected;
  colors.selectedInk = m.selectedInk;
  colors.bgAlt = m.bgAlt;
  colors.inkMuted = m.inkMuted;
  colors.border = m.border;
  colors.danger = m.danger;
  colors.success = m.success;
  colors.star = m.star;
  colors.price = m.price;
  colors.starOff = d.colors.starOff;
  const ts = c?.themeSettings;
  const dark = ts?.techDarkColor;
  colors.dark = typeof dark === 'string' && HEX6.test(dark) ? dark : d.colors.dark;
  colors.darkInk = '#FFFFFF';
  techTheme.fonts.body = fashionTheme.fonts.body;
  techTheme.fonts.display = c?.headingFont ? fashionTheme.fonts.display : fashionTheme.fonts.body;
  techTheme.buttonRadiusPx = fashionTheme.buttonRadiusPx;
  techTheme.cardRadiusPx = fashionTheme.productCardRadiusPx;
  techTheme.layout.maxWidth = fashionTheme.layout.maxWidth;
  techTheme.layout.containerPadX = fashionTheme.layout.containerPadX;
  techTheme.layout.sectionPadY = fashionTheme.layout.sectionPadY;
  techTheme.topBar = ts?.techTopBar !== 'hide';
  techTheme.stickyHeader = ts?.techStickyHeader !== 'off';
  techTheme.productCardStyle = oneOf(ts?.techCardStyle, ['flat', 'outlined', 'shadow'] as const, 'flat');
  techTheme.showCardRating = fashionTheme.cardRating;
  techTheme.megaFeatured = ts?.techMegaFeatured !== 'hide';
}

/** Same readable-label rule as Maison, for fills the seller can recolour. */
export { mixHex, relativeLuminance } from '../theme-03-fashion/theme.config';
