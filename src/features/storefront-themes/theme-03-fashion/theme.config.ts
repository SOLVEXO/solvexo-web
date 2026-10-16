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
  productImageRatio: 'square' as 'square' | 'portrait' | 'landscape' | 'adapt',
  productImageHover: 'zoom' as 'none' | 'zoom' | 'second-image',
  saleBadge: true,
  quickView: true,
  colorSwatches: true,
  soldOutBadge: true,
  cardStyle: 'theme' as 'theme' | 'flat' | 'outlined' | 'elevated',
  colors: {
    bg: '#FFFFFF',
    bgAlt: '#F4F4F5',
    ink: '#09090B',
    inkMuted: '#71717A',
    border: '#E4E4E7',
    accent: '#09090B',
    accentInk: '#FFFFFF',
    danger: '#DC2626',
    success: '#16A34A',
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

function derive(bg: string, ink: string, accent: string): Pick<FashionColors, 'bg' | 'ink' | 'accent' | 'bgAlt' | 'inkMuted' | 'border' | 'accentInk'> {
  const dark = relativeLuminance(bg) < 0.5;
  return {
    bg, ink, accent,
    bgAlt: mixHex(bg, dark ? 'white' : 'black', 0.05),
    inkMuted: mixHex(ink, dark ? 'black' : 'white', 0.42),
    border: mixHex(bg, dark ? 'white' : 'black', 0.12),
    accentInk: relativeLuminance(accent) < 0.5 ? '#FFFFFF' : '#09090B',
  };
}

export interface FashionMerchantColors {
  bgColor?: string; textColor?: string; primaryColor?: string; font?: string; headingFont?: string | null;
  imageRadius?: Radius; productCardRadius?: Radius; productImageRatio?: 'square' | 'portrait' | 'landscape' | 'adapt';
  productImageHover?: 'none' | 'zoom' | 'second-image';
  saleBadge?: 'show' | 'hide'; quickView?: 'show' | 'hide'; colorSwatches?: 'show' | 'hide'; soldOutBadge?: 'show' | 'hide'; cardStyle?: 'theme' | 'flat' | 'outlined' | 'elevated';
  buttonStyle?: 'solid' | 'outline' | 'soft'; buttonRadius?: Radius; buttonWidth?: 'auto' | 'full';
  sectionSpacing?: 'compact' | 'comfortable' | 'spacious'; containerWidth?: 'narrow' | 'standard' | 'wide';
}

/** The one place the singleton is written. `null` resets to the theme's own defaults. */
export function applyMerchantThemeOverrides(c: FashionMerchantColors | null | undefined): void {
  const d = STATIC_DEFAULTS;
  Object.assign(fashionTheme.colors, derive(c?.bgColor || d.colors.bg, c?.textColor || d.colors.ink, c?.primaryColor || d.colors.accent));
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
}

/** A section can point at one of the store's saved color schemes; this resolves its palette. */
export function resolveSectionColors(
  colorSchemeId: string | null | undefined,
  schemes: { id: string; bgColor: string; textColor: string; primaryColor: string }[] | undefined,
): FashionColors {
  const s = colorSchemeId ? schemes?.find(x => x.id === colorSchemeId) : undefined;
  if (!s) return fashionTheme.colors;
  return { ...derive(s.bgColor, s.textColor, s.primaryColor), danger: fashionTheme.colors.danger, success: fashionTheme.colors.success };
}
