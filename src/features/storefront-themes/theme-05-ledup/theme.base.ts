// Settings engine of the Ledup theme: every shared setting (typography, buttons, cards, grid...) is applied into `baseTheme`.
// Copy of the shared engine with Ledup's own defaults (Poppins, tight headings, pill inputs).
import { ensureGoogleFont, fontFallback } from '@/utils/googleFonts';
import { readProductsPerPage } from '../themeManifest';

const STATIC_DEFAULTS = {
  id: 'theme-05-ledup',
  name: 'Ledup',
  fonts: {
    display: `'Poppins', system-ui, sans-serif`,
    body: `'Poppins', system-ui, sans-serif`,
  },
  imageRadiusPx: '16px',
  productCardRadiusPx: '16px',
  radius: { sm: '8px' },
  headingWeight: 600,
  headingCase: 'none' as 'none' | 'uppercase',
  headingTracking: 'tight' as 'auto' | 'tight' | 'normal' | 'wide',
  headingScale: 'medium' as 'small' | 'medium' | 'large' | 'xlarge',
  headingLineHeight: 'tight' as 'auto' | 'tight' | 'normal' | 'loose',
  headingColor: null as string | null,
  bodyScale: 'medium' as 'small' | 'medium' | 'large',
  linkUnderline: 'never' as 'auto' | 'always' | 'never',
  linkColor: null as string | null,
  buttonCase: 'normal' as 'normal' | 'uppercase',
  buttonSize: 'md' as 'sm' | 'md' | 'lg',
  buttonHover: 'fade' as 'fade' | 'lift' | 'grow',
  buttonShadow: 'none' as 'none' | 'soft',
  sectionRadiusPx: '24px',
  inputRadiusPx: '9999px',
  badgeStyle: 'pill' as 'pill' | 'square',
  cardRating: false,
  cardTag: true,
  cardButton: true,
  cardHover: 'shadow' as 'shadow' | 'lift' | 'none',
  cardTextAlign: 'left' as 'left' | 'center',
  gridGap: 'standard' as 'tight' | 'standard' | 'airy',
  showBreadcrumbs: true,
  showStockStatus: true,
  showVendor: false,
  showReviews: false,
  stickyBuyBar: true,
  animations: true,
  focusRing: 'auto' as 'auto' | 'accent' | 'ink',
  bodyWeight: 'regular' as 'regular' | 'medium',
  sectionDividers: 'none' as 'none' | 'line',
  selection: 'auto' as 'auto' | 'accent',
  cardWishlist: true,
  cardViewLink: true,
  saleBadgeText: 'percent' as 'percent' | 'label',
  showDelivery: true,
  productImageRatio: 'square' as 'square' | 'portrait' | 'landscape' | 'adapt',
  productImageHover: 'zoom' as 'none' | 'zoom' | 'second-image',
  /** 'whole' = the whole photo is shown (bars around it if the shape differs); 'fill' = the photo fills its box and the edges are cropped. Seller setting `custom.productImageFit`. */
  productImageFit: 'whole' as 'fill' | 'whole',
  saleBadge: true,
  quickView: false,
  colorSwatches: true,
  soldOutBadge: true,
  cardStyle: 'theme' as 'theme' | 'flat' | 'outlined' | 'elevated',
  /** Pop-up messages ("Added to bag"); seller settings `custom.toast*`. `color` null = the accent. */
  toast: {
    style: 'dark' as 'dark' | 'light',
    color: null as string | null,
    position: 'bottom-right' as 'bottom-right' | 'bottom-center' | 'top-right' | 'top-center',
    progress: true,
  },
  /** Sign-in pop-up; seller settings `custom.auth*`. Empty text = the default wording. */
  authGate: { title: '', button: '', size: 'standard' as 'compact' | 'standard' | 'large', social: true },
  /** Quick view pop-up width; seller setting `custom.quickViewSize`. */
  quickViewSize: 'standard' as 'compact' | 'standard' | 'large',
  /** Mega menu look; seller settings `custom.mega*`. */
  mega: { featured: true, columns: 4, heading: 'upper' as 'upper' | 'normal', photo: 'square' as 'square' | 'landscape' | 'portrait' },
  /** Listing sizes and the way shoppers move on; seller settings `custom.productsPerPage` etc. */
  pagination: { productsPerPage: 12, mode: 'pages' as 'pages' | 'more' | 'infinite', postsPerPage: 12, reviewsPerPage: 5 },
  /** Share popup networks; seller settings `custom.share*` (hide = off). */
  share: { facebook: true, x: true, pinterest: true, whatsapp: true, email: true, linkedin: false, telegram: false },
  colors: {
    bg: '#FFFFFF',
    bgAlt: '#F4F4F5',
    ink: '#09090B',
    inkMuted: '#71717A',
    border: '#E4E4E7',
    accent: '#09090B',
    accentInk: '#FFFFFF',
    /** Selected / active states (chosen variant, active tab, filled chips, badges). Follows the accent unless the seller sets one. */
    selected: '#09090B',
    selectedInk: '#FFFFFF',
    danger: '#DC2626',
    success: '#16A34A',
    /** Rating stars. */
    star: '#FB923C',
    /** Product prices (defaults to the text colour). */
    price: '#09090B',
    /** Product card background (defaults to the page background). */
    cardBg: '#FFFFFF',
  },
  layout: {
    maxWidth: '1280px',
    sectionPadY: 'clamp(48px, 6vw, 96px)',
    containerPadX: 'clamp(16px, 4vw, 56px)',
  },
  buttonStyle: 'solid' as 'solid' | 'outline' | 'soft',
  buttonRadiusPx: '9999px',
  buttonWidth: 'auto' as 'auto' | 'full',
};

export const baseTheme: typeof STATIC_DEFAULTS = structuredClone(STATIC_DEFAULTS);
export type BaseTheme = typeof baseTheme;
export const BASE_STATIC_DEFAULTS = STATIC_DEFAULTS;

type Radius = 'none' | 'small' | 'medium' | 'large' | 'full';
const RADIUS_PX: Record<Radius, string> = { none: '0px', small: '6px', medium: '12px', large: '16px', full: '9999px' };
const HEADING_WEIGHT: Record<string, number> = { regular: 400, medium: 500, semibold: 600, bold: 700 };
const SECTION_RADIUS_PX: Record<string, string> = { none: '0px', small: '10px', medium: '18px', large: '28px' };
const INPUT_RADIUS_PX: Record<string, string> = { none: '0px', small: '8px', medium: '14px', large: '20px', full: '9999px' };
const TRACKING_EM = { tight: '-0.025em', normal: '0', wide: '0.04em' } as const;
const HEADING_ZOOM = { small: 0.9, medium: 1, large: 1.12, xlarge: 1.25 } as const;
const BODY_ZOOM = { small: 0.94, medium: 1, large: 1.08 } as const;
const LINE_HEIGHT = { tight: '1.05', normal: '1.25', loose: '1.45' } as const;
const BUTTON_HEIGHT = { sm: '40px', md: '48px', lg: '56px' } as const;
const GRID_GAP = { tight: ['12px', '24px'], standard: ['20px', '40px'], airy: ['32px', '56px'] } as const;
const PAGE_PADDING: Record<string, string> = {
  narrow: 'clamp(12px, 3vw, 32px)',
  standard: STATIC_DEFAULTS.layout.containerPadX,
  wide: 'clamp(24px, 6vw, 96px)',
};
const SPACING: Record<'compact' | 'comfortable' | 'spacious', string> = {
  compact: 'clamp(28px, 3.5vw, 56px)',
  comfortable: STATIC_DEFAULTS.layout.sectionPadY,
  spacious: 'clamp(72px, 9vw, 140px)',
};
const WIDTH: Record<'narrow' | 'standard' | 'wide', string> = { narrow: '1080px', standard: STATIC_DEFAULTS.layout.maxWidth, wide: '1560px' };

export function mixHex(hex: string, target: 'black' | 'white', amount: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16), g = parseInt(full.slice(2, 4), 16), b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  const to = target === 'white' ? 255 : 0;
  const mix = (c: number) => Math.round(c + (to - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

export function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16), g = parseInt(full.slice(2, 4), 16), b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return 1;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export type BaseColors = typeof STATIC_DEFAULTS.colors;

const HEX6 = /^#[0-9a-f]{6}$/i;
/** Readable label colour on a solid fill. */
function inkOn(fill: string): string {
  return relativeLuminance(fill) < 0.5 ? '#FFFFFF' : '#09090B';
}

function derive(bg: string, ink: string, accent: string): Pick<BaseColors, 'bg' | 'ink' | 'accent' | 'bgAlt' | 'inkMuted' | 'border' | 'accentInk' | 'selected' | 'selectedInk' | 'price' | 'cardBg'> {
  const dark = relativeLuminance(bg) < 0.5;
  return {
    bg, ink, accent,
    selected: accent,
    selectedInk: inkOn(accent),
    bgAlt: mixHex(bg, dark ? 'white' : 'black', 0.05),
    inkMuted: mixHex(ink, dark ? 'black' : 'white', 0.42),
    border: mixHex(bg, dark ? 'white' : 'black', 0.12),
    accentInk: relativeLuminance(accent) < 0.5 ? '#FFFFFF' : '#09090B',
    price: ink,
    cardBg: bg,
  };
}

type Show = 'show' | 'hide';

export interface BaseMerchantColors {
  bgColor?: string; textColor?: string; primaryColor?: string; font?: string; headingFont?: string | null; mutedColor?: string | null; borderColor?: string | null; saleColor?: string | null;
  headingWeight?: 'regular' | 'medium' | 'semibold' | 'bold'; headingCase?: 'none' | 'uppercase'; headingTracking?: 'auto' | 'tight' | 'normal' | 'wide';
  headingScale?: 'small' | 'medium' | 'large' | 'xlarge'; headingLineHeight?: 'auto' | 'tight' | 'normal' | 'loose'; headingColor?: string | null;
  bodyScale?: 'small' | 'medium' | 'large'; linkUnderline?: 'auto' | 'always' | 'never'; linkColor?: string | null;
  buttonCase?: 'normal' | 'uppercase'; buttonSize?: 'sm' | 'md' | 'lg'; buttonHover?: 'fade' | 'lift' | 'grow'; buttonShadow?: 'none' | 'soft'; buttonTextColor?: string | null;
  sectionRadius?: Radius; inputRadius?: Radius; badgeStyle?: 'pill' | 'square';
  cardRating?: Show; cardTag?: Show; cardButton?: Show; cardHover?: 'shadow' | 'lift' | 'none'; cardTextAlign?: 'left' | 'center'; cardBgColor?: string | null;
  priceColor?: string | null; starColor?: string | null; successColor?: string | null;
  gridGap?: 'tight' | 'standard' | 'airy'; pagePadding?: 'narrow' | 'standard' | 'wide';
  showBreadcrumbs?: Show; showStockStatus?: Show; showVendor?: Show; showReviews?: Show; stickyBuyBar?: Show;
  animations?: 'on' | 'off'; focusRing?: 'auto' | 'accent' | 'ink';
  bodyWeight?: 'regular' | 'medium'; sectionDividers?: 'none' | 'line'; selection?: 'auto' | 'accent'; cardWishlist?: Show; cardViewLink?: Show; saleBadgeText?: 'percent' | 'label'; showDelivery?: Show;
  imageRadius?: Radius; productCardRadius?: Radius; productImageRatio?: 'square' | 'portrait' | 'landscape' | 'adapt';
  productImageHover?: 'none' | 'zoom' | 'second-image';
  saleBadge?: Show; quickView?: Show; colorSwatches?: Show; soldOutBadge?: Show; cardStyle?: 'theme' | 'flat' | 'outlined' | 'elevated';
  buttonStyle?: 'solid' | 'outline' | 'soft'; buttonRadius?: Radius; buttonWidth?: 'auto' | 'full';
  sectionSpacing?: 'compact' | 'comfortable' | 'spacious'; containerWidth?: 'narrow' | 'standard' | 'wide';
  /** Theme-declared `custom.<name>` settings (here: `selectedColor`). */
  themeSettings?: Record<string, string | number | boolean>;
}

/** The one place the singleton is written. `null` resets to the theme's own defaults. */
export function applyMerchantThemeOverrides(c: BaseMerchantColors | null | undefined): void {
  const d = STATIC_DEFAULTS;
  Object.assign(baseTheme.colors, derive(c?.bgColor || d.colors.bg, c?.textColor || d.colors.ink, c?.primaryColor || d.colors.accent));
  if (c?.mutedColor) baseTheme.colors.inkMuted = c.mutedColor;
  if (c?.borderColor) baseTheme.colors.border = c.borderColor;
  if (c?.buttonTextColor) baseTheme.colors.accentInk = c.buttonTextColor;
  const picked = c?.themeSettings?.selectedColor;
  if (typeof picked === 'string' && HEX6.test(picked)) {
    baseTheme.colors.selected = picked;
    baseTheme.colors.selectedInk = inkOn(picked);
  } else {
    baseTheme.colors.selected = baseTheme.colors.accent;
    baseTheme.colors.selectedInk = baseTheme.colors.accentInk;
  }
  const ts = c?.themeSettings;
  const toastColor = ts?.toastColor;
  baseTheme.toast.style = ts?.toastStyle === 'light' ? 'light' : 'dark';
  baseTheme.toast.color = typeof toastColor === 'string' && HEX6.test(toastColor) ? toastColor : null;
  baseTheme.toast.position = ts?.toastPosition === 'bottom-center' || ts?.toastPosition === 'top-right' || ts?.toastPosition === 'top-center' ? ts.toastPosition : 'bottom-right';
  baseTheme.toast.progress = ts?.toastProgress !== 'hide';
  const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
  baseTheme.authGate.title = typeof ts?.authTitle === 'string' ? ts.authTitle.trim().slice(0, 60) : '';
  baseTheme.authGate.button = typeof ts?.authButton === 'string' ? ts.authButton.trim().slice(0, 30) : '';
  baseTheme.authGate.size = oneOf(ts?.authSize, ['compact', 'standard', 'large'] as const, 'standard');
  baseTheme.authGate.social = ts?.authSocial !== 'hide';
  baseTheme.quickViewSize = oneOf(ts?.quickViewSize, ['compact', 'standard', 'large'] as const, 'standard');
  baseTheme.productImageFit = oneOf(ts?.productImageFit, ['fill', 'whole'] as const, 'whole');
  baseTheme.mega.featured = ts?.megaFeatured !== 'hide';
  baseTheme.mega.columns = Number(oneOf(ts?.megaColumns, ['3', '4', '5'] as const, '4'));
  baseTheme.mega.heading = oneOf(ts?.megaHeading, ['upper', 'normal'] as const, 'upper');
  baseTheme.mega.photo = oneOf(ts?.megaPhoto, ['square', 'landscape', 'portrait'] as const, 'square');
  { const pp = readProductsPerPage(ts); baseTheme.pagination.productsPerPage = pp.pageSize; baseTheme.pagination.mode = pp.showAll ? 'infinite' : oneOf(ts?.productPagination, ['pages', 'more', 'infinite'] as const, 'pages'); }
  baseTheme.pagination.postsPerPage = Number(oneOf(ts?.postsPerPage == null ? undefined : String(ts.postsPerPage), ['6', '9', '12', '18', '24'] as const, '12'));
  baseTheme.pagination.reviewsPerPage = Number(oneOf(ts?.reviewsPerPage == null ? undefined : String(ts.reviewsPerPage), ['5', '10', '20'] as const, '5'));
  baseTheme.share.facebook = ts?.shareFacebook !== 'hide';
  baseTheme.share.x = ts?.shareX !== 'hide';
  baseTheme.share.pinterest = ts?.sharePinterest !== 'hide';
  baseTheme.share.whatsapp = ts?.shareWhatsapp !== 'hide';
  baseTheme.share.email = ts?.shareEmail !== 'hide';
  if (c?.priceColor) baseTheme.colors.price = c.priceColor;
  if (c?.cardBgColor) baseTheme.colors.cardBg = c.cardBgColor;
  baseTheme.colors.danger = c?.saleColor || d.colors.danger;
  baseTheme.colors.success = c?.successColor || d.colors.success;
  baseTheme.colors.star = c?.starColor || d.colors.star;
  baseTheme.headingColor = c?.headingColor || null;
  baseTheme.linkColor = c?.linkColor || null;
  baseTheme.headingWeight = HEADING_WEIGHT[c?.headingWeight ?? 'medium'] ?? 500;
  baseTheme.headingCase = c?.headingCase === 'uppercase' ? 'uppercase' : 'none';
  baseTheme.headingTracking = c?.headingTracking ?? 'auto';
  baseTheme.headingScale = c?.headingScale ?? 'medium';
  baseTheme.headingLineHeight = c?.headingLineHeight ?? 'auto';
  baseTheme.bodyScale = c?.bodyScale ?? 'medium';
  baseTheme.linkUnderline = c?.linkUnderline ?? 'auto';
  baseTheme.buttonCase = c?.buttonCase === 'uppercase' ? 'uppercase' : 'normal';
  baseTheme.buttonSize = c?.buttonSize ?? 'md';
  baseTheme.buttonHover = c?.buttonHover ?? 'fade';
  baseTheme.buttonShadow = c?.buttonShadow ?? 'none';
  baseTheme.inputRadiusPx = INPUT_RADIUS_PX[c?.inputRadius ?? 'medium'] ?? '14px';
  baseTheme.badgeStyle = c?.badgeStyle === 'square' ? 'square' : 'pill';
  baseTheme.cardRating = c?.cardRating !== 'hide';
  baseTheme.cardTag = c?.cardTag !== 'hide';
  baseTheme.cardButton = c?.cardButton !== 'hide';
  baseTheme.cardHover = c?.cardHover ?? 'shadow';
  baseTheme.cardTextAlign = c?.cardTextAlign ?? 'left';
  baseTheme.gridGap = c?.gridGap ?? 'standard';
  baseTheme.showBreadcrumbs = c?.showBreadcrumbs !== 'hide';
  baseTheme.showStockStatus = c?.showStockStatus !== 'hide';
  baseTheme.showVendor = c?.showVendor !== 'hide';
  baseTheme.showReviews = c?.showReviews !== 'hide';
  baseTheme.stickyBuyBar = c?.stickyBuyBar !== 'hide';
  baseTheme.animations = c?.animations !== 'off';
  baseTheme.focusRing = c?.focusRing ?? 'auto';
  baseTheme.bodyWeight = c?.bodyWeight === 'medium' ? 'medium' : 'regular';
  baseTheme.sectionDividers = c?.sectionDividers === 'line' ? 'line' : 'none';
  baseTheme.selection = c?.selection === 'accent' ? 'accent' : 'auto';
  baseTheme.cardWishlist = c?.cardWishlist !== 'hide';
  baseTheme.cardViewLink = c?.cardViewLink !== 'hide';
  baseTheme.saleBadgeText = c?.saleBadgeText === 'label' ? 'label' : 'percent';
  baseTheme.showDelivery = c?.showDelivery !== 'hide';
  baseTheme.sectionRadiusPx = SECTION_RADIUS_PX[c?.sectionRadius ?? 'large'] ?? '28px';
  ensureGoogleFont(c?.font);
  ensureGoogleFont(c?.headingFont);
  baseTheme.fonts.body = c?.font ? `'${c.font}', ${fontFallback(c.font)}` : d.fonts.body;
  baseTheme.fonts.display = c?.headingFont ? `'${c.headingFont}', ${fontFallback(c.headingFont, true)}` : d.fonts.display;
  baseTheme.imageRadiusPx = RADIUS_PX[c?.imageRadius ?? 'large'];
  baseTheme.productCardRadiusPx = RADIUS_PX[c?.productCardRadius ?? 'large'];
  baseTheme.productImageRatio = c?.productImageRatio ?? d.productImageRatio;
  baseTheme.productImageHover = c?.productImageHover ?? d.productImageHover;
  baseTheme.saleBadge = c?.saleBadge !== 'hide';
  baseTheme.quickView = c?.quickView !== 'hide';
  baseTheme.colorSwatches = c?.colorSwatches !== 'hide';
  baseTheme.soldOutBadge = c?.soldOutBadge !== 'hide';
  baseTheme.cardStyle = c?.cardStyle ?? d.cardStyle;
  baseTheme.buttonStyle = c?.buttonStyle ?? d.buttonStyle;
  baseTheme.buttonRadiusPx = RADIUS_PX[c?.buttonRadius ?? 'full'];
  baseTheme.buttonWidth = c?.buttonWidth ?? d.buttonWidth;
  baseTheme.layout.sectionPadY = SPACING[c?.sectionSpacing ?? 'comfortable'];
  baseTheme.layout.maxWidth = WIDTH[c?.containerWidth ?? 'standard'];
  baseTheme.layout.containerPadX = PAGE_PADDING[c?.pagePadding ?? 'standard'] ?? PAGE_PADDING.standard;
}

/** A section can point at one of the store's saved color schemes; this resolves its palette. */
export function resolveSectionColors(
  colorSchemeId: string | null | undefined,
  schemes: { id: string; bgColor: string; textColor: string; primaryColor: string; mutedColor?: string | null; borderColor?: string | null; saleColor?: string | null }[] | undefined,
): BaseColors {
  const s = colorSchemeId ? schemes?.find(x => x.id === colorSchemeId) : undefined;
  if (!s) return baseTheme.colors;
  const base = derive(s.bgColor, s.textColor, s.primaryColor);
  return {
    ...base,
    ...(s.mutedColor ? { inkMuted: s.mutedColor } : {}),
    ...(s.borderColor ? { border: s.borderColor } : {}),
    danger: s.saleColor || baseTheme.colors.danger,
    success: baseTheme.colors.success,
    star: baseTheme.colors.star,
  };
}

/** Typography, button, card, link, grid and motion rules driven by the merchant's theme settings. `scope` is the selector
 *  the rules apply under (the live page uses 'main', the section renderer uses '[data-sx]', so the editor preview matches
 *  the live store). Every rule is only emitted when a setting differs from the theme default. */
export function baseTypographyCss(scope: string): string {
  const t = baseTheme;
  const h = `${scope} :is(h1,h2,h3,h4)`;
  const btn = `${scope} :is(.tx-pill,.tx-cta)`;
  const rules = [
    `${h}{font-weight:${t.headingWeight}}`,
    t.headingCase === 'uppercase' ? `${h}{text-transform:uppercase}` : '',
    t.headingTracking !== 'auto' ? `${h}{letter-spacing:${TRACKING_EM[t.headingTracking]}}` : '',
    t.headingScale !== 'medium' ? `${scope} :is(h1,h2){zoom:${HEADING_ZOOM[t.headingScale]}}` : '',
    t.headingLineHeight !== 'auto' ? `${h}{line-height:${LINE_HEIGHT[t.headingLineHeight]}}` : '',
    // headings drawn over a photo keep their own colour
    t.headingColor ? `${h}{color:${t.headingColor}}${scope} .tx-on-image :is(h1,h2,h3,h4){color:inherit}` : '',
    t.bodyScale !== 'medium' ? `${scope} p{zoom:${BODY_ZOOM[t.bodyScale]}}` : '',
    t.linkUnderline !== 'auto' ? `${scope} :is(p,li,dd) a{text-decoration:${t.linkUnderline === 'always' ? 'underline' : 'none'}}` : '',
    t.linkColor ? `${scope} :is(p,li,dd) a{color:${t.linkColor}}` : '',
    t.buttonCase === 'uppercase' ? '.tx-pill,.tx-cta{text-transform:uppercase;letter-spacing:.06em;font-size:13px}' : '',
    t.buttonSize !== 'md' ? `${btn}{height:${BUTTON_HEIGHT[t.buttonSize]}}` : '',
    t.buttonHover === 'lift' ? `${btn}:hover:not([disabled]){transform:translateY(-2px)}` : '',
    t.buttonHover === 'grow' ? `${btn}:hover:not([disabled]){transform:scale(1.03)}` : '',
    t.buttonShadow === 'soft' ? `${btn}{box-shadow:0 8px 20px -10px rgba(0,0,0,.4)}` : '',
    t.gridGap !== 'standard' ? `${scope}{--fx-gap-x:${GRID_GAP[t.gridGap][0]};--fx-gap-y:${GRID_GAP[t.gridGap][1]}}` : '',
    !t.animations ? `${scope} .tx-up{animation:none!important;opacity:1!important;transform:none!important}${btn}{transition:none}` : '',
    t.bodyWeight === 'medium' ? `${scope} :is(p,li,dd){font-weight:500}` : '',
    t.sectionDividers === 'line' ? `[data-sx]+[data-sx]{border-top:1px solid ${t.colors.border}}` : '',
    t.selection === 'accent' ? `${scope} ::selection{background:${t.colors.accent};color:${t.colors.accentInk}}` : '',
    t.focusRing !== 'auto' ? `${scope} :focus-visible{outline:2px solid ${t.focusRing === 'accent' ? t.colors.accent : t.colors.ink};outline-offset:2px}` : '',
  ];
  return rules.filter(Boolean).join('');
}
