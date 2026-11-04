// THEME 04 - "Tech Store" (electronics / computers)
// Colours and sizes below were read from the exported design frames (see docs/tech-theme-tokens.md for the method and margin of
// error). Merchant overrides go through `applyMerchantThemeOverrides`, the only writer of the singleton. Until every route is
// native it also feeds the base settings engine (`baseTheme`, theme.base.ts), which the shared section renderers read.
import { applyMerchantThemeOverrides as applyBase, baseTheme, mixHex, relativeLuminance, type BaseMerchantColors } from './theme.base';

/** Shape system: one choice sets the corners of buttons, form fields, cards, images and badges together. */
export const TECH_SHAPES = {
  /** The design: pill buttons, square-ish fields and cards. */
  tech: { button: '9999px', field: '4px', card: '4px', image: '4px', badge: '4px', maison: { button: 'full', input: 'small', card: 'none', image: 'none', section: 'none' } },
  pill: { button: '9999px', field: '22px', card: '14px', image: '14px', badge: '9999px', maison: { button: 'full', input: 'large', card: 'medium', image: 'medium', section: 'large' } },
  rounded: { button: '12px', field: '12px', card: '16px', image: '16px', badge: '8px', maison: { button: 'medium', input: 'medium', card: 'large', image: 'large', section: 'medium' } },
  square: { button: '0px', field: '0px', card: '0px', image: '0px', badge: '0px', maison: { button: 'none', input: 'none', card: 'none', image: 'none', section: 'none' } },
} as const;
export type TechShapeId = keyof typeof TECH_SHAPES;

/** Container widths (the design's content column is about 1400px wide on a 1920px frame). */
const TECH_WIDTH = { narrow: '1120px', standard: '1400px', wide: '1680px' } as const;
/** Button heights: the design's primary button is about 50px tall. */
const BUTTON_HEIGHT = { sm: '42px', md: '50px', lg: '56px' } as const;

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
    /** Form field outline (a step darker than the layout rules, as in the design). */
    borderStrong: '#A2A6B0',
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
    /** Low-stock, pre-order and other "heads up" text. */
    warning: '#B45309',
    price: '#020203',
  },
  layout: { maxWidth: TECH_WIDTH.standard as string, containerPadX: 'clamp(16px, 4vw, 40px)', sectionPadY: 'clamp(32px, 5vw, 64px)' },
  shape: 'tech' as TechShapeId,
  buttonRadiusPx: '9999px',
  buttonHeightPx: BUTTON_HEIGHT.md as string,
  cardRadiusPx: '4px',
  fieldRadiusPx: '4px',
  imageRadiusPx: '4px',
  badgeRadiusPx: '4px',
  /** `custom.tech*` seller settings. */
  topBar: true,
  stickyHeader: true,
  productCardStyle: 'flat' as 'flat' | 'outlined' | 'shadow',
  showCardRating: true,
  megaFeatured: true,
  /** Mega menu: first-level links on the left (sub-links appear on hover), or every group as its own column. */
  megaStyle: 'sidebar' as 'sidebar' | 'columns',
  /** Header layout: standard (logo + menu + icons), compact, centered (logo in the middle, menu below), search-first (wide search bar). */
  header: 'standard' as 'standard' | 'compact' | 'centered' | 'search-first',
  /** Seller-typed top bar texts (opening hours, showroom line). Empty = not shown. */
  topBarHours: '',
  topBarShowroom: '',
  footerTone: 'dark' as 'dark' | 'light',
  /** Footer columns on large screens: 0 = as many as fit, or a fixed 2 to 4. */
  footerColumns: 0 as 0 | 2 | 3 | 4,
  /** Product description sections: a tab bar, or stacked open/close sections. */
  productTabs: 'tabs' as 'tabs' | 'accordion',
  /** "You may also like" in the mini cart (the store's best sellers that are not in the cart yet). */
  cartUpsell: true,
  /** Listing filters: a sidebar on large screens, or only the slide-in panel. */
  filterLayout: 'sidebar' as 'sidebar' | 'drawer',
  /** Product page thumbnails: below the photo or in a column beside it. */
  gallery: 'bottom' as 'bottom' | 'left',
  /** Checkout order summary: right of the steps (default) or left. */
  checkoutSummary: 'right' as 'right' | 'left',
  /** Client-side compare (up to 4 products, stored in the browser). */
  compare: true,
  /** Listing sizes and the way shoppers move on (seller settings under Pagination). */
  pagination: { productsPerPage: 12, mode: 'pages' as 'pages' | 'more' | 'infinite', postsPerPage: 9, reviewsPerPage: 5 },
  /** Quick view pop-up on product cards (seller setting). */
  quickView: true,
  quickViewSize: 'standard' as 'compact' | 'standard' | 'large',
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

export type TechMerchantColors = BaseMerchantColors;

const HEX6 = /^#[0-9a-f]{6}$/i;
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
const shapeOf = (c: TechMerchantColors | null | undefined): TechShapeId => oneOf(c?.themeSettings?.techShape, Object.keys(TECH_SHAPES) as TechShapeId[], 'tech');

/** Unset merchant values fall back to the Tech look (not Maison's), so the Maison pages Tech still reuses match. */
function withTechDefaults(c: TechMerchantColors | null | undefined): TechMerchantColors {
  const d = STATIC_DEFAULTS;
  const shape = TECH_SHAPES[shapeOf(c)].maison;
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
    buttonRadius: shape.button,
    productCardRadius: shape.card,
    imageRadius: shape.image,
    sectionRadius: shape.section,
    inputRadius: shape.input,
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
  const m = baseTheme.colors;
  // Panels and rules follow the Tech palette unless the seller changed the base colours; derived values stay otherwise.
  const customBg = !!c?.bgColor && c.bgColor.toLowerCase() !== d.colors.bg.toLowerCase();
  if (!customBg) m.bgAlt = d.colors.bgAlt;
  const widthKey = oneOf(c?.containerWidth, ['narrow', 'standard', 'wide'] as const, 'standard');
  baseTheme.layout.maxWidth = TECH_WIDTH[widthKey];
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
  colors.borderStrong = relativeLuminance(m.bg) < 0.5 ? mixHex(m.bg, 'white', 0.3) : customBg ? mixHex(m.bg, 'black', 0.35) : d.colors.borderStrong;
  const ts = c?.themeSettings;
  const pick = (v: unknown, fallback: string) => (typeof v === 'string' && HEX6.test(v) ? v : fallback);
  colors.dark = pick(ts?.techDarkColor, d.colors.dark);
  colors.darkInk = '#FFFFFF';
  colors.warning = pick(ts?.techWarning, d.colors.warning);
  techTheme.fonts.body = baseTheme.fonts.body;
  techTheme.fonts.display = c?.headingFont ? baseTheme.fonts.display : baseTheme.fonts.body;
  techTheme.shape = shapeOf(c);
  const shape = TECH_SHAPES[techTheme.shape];
  techTheme.buttonRadiusPx = shape.button;
  techTheme.cardRadiusPx = shape.card;
  techTheme.fieldRadiusPx = shape.field;
  techTheme.imageRadiusPx = shape.image;
  techTheme.badgeRadiusPx = shape.badge;
  techTheme.buttonHeightPx = BUTTON_HEIGHT[c?.buttonSize ?? 'md'] ?? BUTTON_HEIGHT.md;
  techTheme.layout.maxWidth = TECH_WIDTH[widthKey];
  techTheme.layout.containerPadX = baseTheme.layout.containerPadX;
  techTheme.layout.sectionPadY = baseTheme.layout.sectionPadY;
  techTheme.topBar = ts?.techTopBar !== 'hide';
  techTheme.stickyHeader = ts?.techStickyHeader !== 'off';
  techTheme.productCardStyle = oneOf(ts?.techCardStyle, ['flat', 'outlined', 'shadow'] as const, 'flat');
  techTheme.showCardRating = baseTheme.cardRating;
  techTheme.megaStyle = oneOf(ts?.techMegaStyle, ['sidebar', 'columns'] as const, 'sidebar');
  techTheme.megaFeatured = ts?.techMegaFeatured !== 'hide';
  techTheme.header = oneOf(ts?.techHeader, ['standard', 'compact', 'centered', 'search-first'] as const, 'standard');
  const text = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 80) : '');
  techTheme.topBarHours = text(ts?.techTopHours);
  techTheme.topBarShowroom = text(ts?.techTopShowroom);
  techTheme.footerTone = oneOf(ts?.techFooterTone, ['dark', 'light'] as const, 'dark');
  techTheme.cartUpsell = ts?.techCartUpsell !== 'hide';
  techTheme.productTabs = oneOf(ts?.techProductTabs, ['tabs', 'accordion'] as const, 'tabs');
  techTheme.footerColumns = ({ '2': 2, '3': 3, '4': 4 } as Record<string, 2 | 3 | 4>)[String(ts?.techFooterColumns)] ?? 0;
  techTheme.filterLayout = oneOf(ts?.techFilterLayout, ['sidebar', 'drawer'] as const, 'sidebar');
  techTheme.gallery = oneOf(ts?.techGallery, ['bottom', 'left'] as const, 'bottom');
  techTheme.checkoutSummary = oneOf(ts?.techCheckoutSummary, ['right', 'left'] as const, 'right');
  techTheme.compare = ts?.techCompare !== 'hide';
  techTheme.pagination = { ...baseTheme.pagination };
  techTheme.quickView = baseTheme.quickView;
  techTheme.quickViewSize = baseTheme.quickViewSize;
}

/** Same readable-label rule as Maison, for fills the seller can recolour. */
export { mixHex, relativeLuminance } from './theme.base';
