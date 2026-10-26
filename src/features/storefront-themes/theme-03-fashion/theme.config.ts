// THEME 03 - "Maison" (Fashion / Apparel)
// Modern retail: white ground, zinc neutrals, rounded 2xl cards, pill buttons, big sans headlines with a serif-italic
// accent word, soft gradients and gentle motion. Merchant overrides (colors, fonts, buttons, spacing) are applied
// into the singleton below before any child renders, same contract every registered theme follows.

const STATIC_DEFAULTS = {
  id: 'theme-03-fashion',
  name: 'Maison',
  fonts: {
    display: `'Inter', system-ui, sans-serif`,
    body: `'Inter', system-ui, sans-serif`,
  },
  imageRadiusPx: '16px',
  productCardRadiusPx: '16px',
  radius: { sm: '10px' },
  headingWeight: 500,
  headingCase: 'none' as 'none' | 'uppercase',
  headingTracking: 'auto' as 'auto' | 'tight' | 'normal' | 'wide',
  headingScale: 'medium' as 'small' | 'medium' | 'large' | 'xlarge',
  headingLineHeight: 'auto' as 'auto' | 'tight' | 'normal' | 'loose',
  headingColor: null as string | null,
  bodyScale: 'medium' as 'small' | 'medium' | 'large',
  linkUnderline: 'auto' as 'auto' | 'always' | 'never',
  linkColor: null as string | null,
  buttonCase: 'normal' as 'normal' | 'uppercase',
  buttonSize: 'md' as 'sm' | 'md' | 'lg',
  buttonHover: 'fade' as 'fade' | 'lift' | 'grow',
  buttonShadow: 'none' as 'none' | 'soft',
  sectionRadiusPx: '28px',
  inputRadiusPx: '14px',
  badgeStyle: 'pill' as 'pill' | 'square',
  cardRating: true,
  cardTag: true,
  cardButton: true,
  cardHover: 'shadow' as 'shadow' | 'lift' | 'none',
  cardTextAlign: 'left' as 'left' | 'center',
  gridGap: 'standard' as 'tight' | 'standard' | 'airy',
  showBreadcrumbs: true,
  showStockStatus: true,
  showVendor: true,
  showReviews: true,
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
  saleBadge: true,
  quickView: true,
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

export const fashionTheme: typeof STATIC_DEFAULTS = structuredClone(STATIC_DEFAULTS);
export type FashionTheme = typeof fashionTheme;
export const FASHION_STATIC_DEFAULTS = STATIC_DEFAULTS;

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

export type FashionColors = typeof STATIC_DEFAULTS.colors;

const HEX6 = /^#[0-9a-f]{6}$/i;
/** Readable label colour on a solid fill. */
function inkOn(fill: string): string {
  return relativeLuminance(fill) < 0.5 ? '#FFFFFF' : '#09090B';
}

function derive(bg: string, ink: string, accent: string): Pick<FashionColors, 'bg' | 'ink' | 'accent' | 'bgAlt' | 'inkMuted' | 'border' | 'accentInk' | 'selected' | 'selectedInk' | 'price' | 'cardBg'> {
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

export interface FashionMerchantColors {
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
export function applyMerchantThemeOverrides(c: FashionMerchantColors | null | undefined): void {
  const d = STATIC_DEFAULTS;
  Object.assign(fashionTheme.colors, derive(c?.bgColor || d.colors.bg, c?.textColor || d.colors.ink, c?.primaryColor || d.colors.accent));
  if (c?.mutedColor) fashionTheme.colors.inkMuted = c.mutedColor;
  if (c?.borderColor) fashionTheme.colors.border = c.borderColor;
  if (c?.buttonTextColor) fashionTheme.colors.accentInk = c.buttonTextColor;
  const picked = c?.themeSettings?.selectedColor;
  if (typeof picked === 'string' && HEX6.test(picked)) {
    fashionTheme.colors.selected = picked;
    fashionTheme.colors.selectedInk = inkOn(picked);
  } else {
    fashionTheme.colors.selected = fashionTheme.colors.accent;
    fashionTheme.colors.selectedInk = fashionTheme.colors.accentInk;
  }
  const ts = c?.themeSettings;
  const toastColor = ts?.toastColor;
  fashionTheme.toast.style = ts?.toastStyle === 'light' ? 'light' : 'dark';
  fashionTheme.toast.color = typeof toastColor === 'string' && HEX6.test(toastColor) ? toastColor : null;
  fashionTheme.toast.position = ts?.toastPosition === 'bottom-center' || ts?.toastPosition === 'top-right' || ts?.toastPosition === 'top-center' ? ts.toastPosition : 'bottom-right';
  fashionTheme.toast.progress = ts?.toastProgress !== 'hide';
  if (c?.priceColor) fashionTheme.colors.price = c.priceColor;
  if (c?.cardBgColor) fashionTheme.colors.cardBg = c.cardBgColor;
  fashionTheme.colors.danger = c?.saleColor || d.colors.danger;
  fashionTheme.colors.success = c?.successColor || d.colors.success;
  fashionTheme.colors.star = c?.starColor || d.colors.star;
  fashionTheme.headingColor = c?.headingColor || null;
  fashionTheme.linkColor = c?.linkColor || null;
  fashionTheme.headingWeight = HEADING_WEIGHT[c?.headingWeight ?? 'medium'] ?? 500;
  fashionTheme.headingCase = c?.headingCase === 'uppercase' ? 'uppercase' : 'none';
  fashionTheme.headingTracking = c?.headingTracking ?? 'auto';
  fashionTheme.headingScale = c?.headingScale ?? 'medium';
  fashionTheme.headingLineHeight = c?.headingLineHeight ?? 'auto';
  fashionTheme.bodyScale = c?.bodyScale ?? 'medium';
  fashionTheme.linkUnderline = c?.linkUnderline ?? 'auto';
  fashionTheme.buttonCase = c?.buttonCase === 'uppercase' ? 'uppercase' : 'normal';
  fashionTheme.buttonSize = c?.buttonSize ?? 'md';
  fashionTheme.buttonHover = c?.buttonHover ?? 'fade';
  fashionTheme.buttonShadow = c?.buttonShadow ?? 'none';
  fashionTheme.inputRadiusPx = INPUT_RADIUS_PX[c?.inputRadius ?? 'medium'] ?? '14px';
  fashionTheme.badgeStyle = c?.badgeStyle === 'square' ? 'square' : 'pill';
  fashionTheme.cardRating = c?.cardRating !== 'hide';
  fashionTheme.cardTag = c?.cardTag !== 'hide';
  fashionTheme.cardButton = c?.cardButton !== 'hide';
  fashionTheme.cardHover = c?.cardHover ?? 'shadow';
  fashionTheme.cardTextAlign = c?.cardTextAlign ?? 'left';
  fashionTheme.gridGap = c?.gridGap ?? 'standard';
  fashionTheme.showBreadcrumbs = c?.showBreadcrumbs !== 'hide';
  fashionTheme.showStockStatus = c?.showStockStatus !== 'hide';
  fashionTheme.showVendor = c?.showVendor !== 'hide';
  fashionTheme.showReviews = c?.showReviews !== 'hide';
  fashionTheme.stickyBuyBar = c?.stickyBuyBar !== 'hide';
  fashionTheme.animations = c?.animations !== 'off';
  fashionTheme.focusRing = c?.focusRing ?? 'auto';
  fashionTheme.bodyWeight = c?.bodyWeight === 'medium' ? 'medium' : 'regular';
  fashionTheme.sectionDividers = c?.sectionDividers === 'line' ? 'line' : 'none';
  fashionTheme.selection = c?.selection === 'accent' ? 'accent' : 'auto';
  fashionTheme.cardWishlist = c?.cardWishlist !== 'hide';
  fashionTheme.cardViewLink = c?.cardViewLink !== 'hide';
  fashionTheme.saleBadgeText = c?.saleBadgeText === 'label' ? 'label' : 'percent';
  fashionTheme.showDelivery = c?.showDelivery !== 'hide';
  fashionTheme.sectionRadiusPx = SECTION_RADIUS_PX[c?.sectionRadius ?? 'large'] ?? '28px';
  fashionTheme.fonts.body = c?.font ? `'${c.font}', sans-serif` : d.fonts.body;
  fashionTheme.fonts.display = c?.headingFont ? `'${c.headingFont}', serif` : d.fonts.display;
  fashionTheme.imageRadiusPx = RADIUS_PX[c?.imageRadius ?? 'large'];
  fashionTheme.productCardRadiusPx = RADIUS_PX[c?.productCardRadius ?? 'large'];
  fashionTheme.productImageRatio = c?.productImageRatio ?? d.productImageRatio;
  fashionTheme.productImageHover = c?.productImageHover ?? d.productImageHover;
  fashionTheme.saleBadge = c?.saleBadge !== 'hide';
  fashionTheme.quickView = c?.quickView !== 'hide';
  fashionTheme.colorSwatches = c?.colorSwatches !== 'hide';
  fashionTheme.soldOutBadge = c?.soldOutBadge !== 'hide';
  fashionTheme.cardStyle = c?.cardStyle ?? d.cardStyle;
  fashionTheme.buttonStyle = c?.buttonStyle ?? d.buttonStyle;
  fashionTheme.buttonRadiusPx = RADIUS_PX[c?.buttonRadius ?? 'full'];
  fashionTheme.buttonWidth = c?.buttonWidth ?? d.buttonWidth;
  fashionTheme.layout.sectionPadY = SPACING[c?.sectionSpacing ?? 'comfortable'];
  fashionTheme.layout.maxWidth = WIDTH[c?.containerWidth ?? 'standard'];
  fashionTheme.layout.containerPadX = PAGE_PADDING[c?.pagePadding ?? 'standard'] ?? PAGE_PADDING.standard;
}

/** A section can point at one of the store's saved color schemes; this resolves its palette. */
export function resolveSectionColors(
  colorSchemeId: string | null | undefined,
  schemes: { id: string; bgColor: string; textColor: string; primaryColor: string; mutedColor?: string | null; borderColor?: string | null; saleColor?: string | null }[] | undefined,
): FashionColors {
  const s = colorSchemeId ? schemes?.find(x => x.id === colorSchemeId) : undefined;
  if (!s) return fashionTheme.colors;
  const base = derive(s.bgColor, s.textColor, s.primaryColor);
  return {
    ...base,
    ...(s.mutedColor ? { inkMuted: s.mutedColor } : {}),
    ...(s.borderColor ? { border: s.borderColor } : {}),
    danger: s.saleColor || fashionTheme.colors.danger,
    success: fashionTheme.colors.success,
    star: fashionTheme.colors.star,
  };
}

/** Typography, button, card, link, grid and motion rules driven by the merchant's theme settings. `scope` is the selector
 *  the rules apply under (the live page uses 'main', the section renderer uses '[data-sx]', so the editor preview matches
 *  the live store). Every rule is only emitted when a setting differs from the theme default. */
export function fashionTypographyCss(scope: string): string {
  const t = fashionTheme;
  const h = `${scope} :is(h1,h2,h3,h4)`;
  const btn = `${scope} :is(.fx-pill,.fx-cta)`;
  const rules = [
    `${h}{font-weight:${t.headingWeight}}`,
    t.headingCase === 'uppercase' ? `${h}{text-transform:uppercase}` : '',
    t.headingTracking !== 'auto' ? `${h}{letter-spacing:${TRACKING_EM[t.headingTracking]}}` : '',
    t.headingScale !== 'medium' ? `${scope} :is(h1,h2){zoom:${HEADING_ZOOM[t.headingScale]}}` : '',
    t.headingLineHeight !== 'auto' ? `${h}{line-height:${LINE_HEIGHT[t.headingLineHeight]}}` : '',
    // headings drawn over a photo keep their own colour
    t.headingColor ? `${h}{color:${t.headingColor}}${scope} .fx-on-image :is(h1,h2,h3,h4){color:inherit}` : '',
    t.bodyScale !== 'medium' ? `${scope} p{zoom:${BODY_ZOOM[t.bodyScale]}}` : '',
    t.linkUnderline !== 'auto' ? `${scope} :is(p,li,dd) a{text-decoration:${t.linkUnderline === 'always' ? 'underline' : 'none'}}` : '',
    t.linkColor ? `${scope} :is(p,li,dd) a{color:${t.linkColor}}` : '',
    t.buttonCase === 'uppercase' ? '.fx-pill,.fx-cta{text-transform:uppercase;letter-spacing:.06em;font-size:13px}' : '',
    t.buttonSize !== 'md' ? `${btn}{height:${BUTTON_HEIGHT[t.buttonSize]}}` : '',
    t.buttonHover === 'lift' ? `${btn}:hover:not([disabled]){transform:translateY(-2px)}` : '',
    t.buttonHover === 'grow' ? `${btn}:hover:not([disabled]){transform:scale(1.03)}` : '',
    t.buttonShadow === 'soft' ? `${btn}{box-shadow:0 8px 20px -10px rgba(0,0,0,.4)}` : '',
    t.gridGap !== 'standard' ? `${scope}{--fx-gap-x:${GRID_GAP[t.gridGap][0]};--fx-gap-y:${GRID_GAP[t.gridGap][1]}}` : '',
    !t.animations ? `${scope} .fx-up{animation:none!important;opacity:1!important;transform:none!important}${btn}{transition:none}` : '',
    t.bodyWeight === 'medium' ? `${scope} :is(p,li,dd){font-weight:500}` : '',
    t.sectionDividers === 'line' ? `[data-sx]+[data-sx]{border-top:1px solid ${t.colors.border}}` : '',
    t.selection === 'accent' ? `${scope} ::selection{background:${t.colors.accent};color:${t.colors.accentInk}}` : '',
    t.focusRing !== 'auto' ? `${scope} :focus-visible{outline:2px solid ${t.focusRing === 'accent' ? t.colors.accent : t.colors.ink};outline-offset:2px}` : '',
  ];
  return rules.filter(Boolean).join('');
}
