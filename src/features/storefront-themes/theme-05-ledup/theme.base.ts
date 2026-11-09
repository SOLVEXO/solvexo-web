// Settings engine of the Ledup theme (theme-05-ledup)
// Architectural & Commercial LED Lighting Theme: Poppins typography, metallic bronze header, curved tab cutout, 
// technical spec badges, and curved espresso footer.
import { ensureGoogleFont, fontFallback } from '@/utils/googleFonts';

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
  saleBadge: true,
  quickView: false,
  colorSwatches: true,
};

export const baseTheme = { ...STATIC_DEFAULTS };

export type BaseColors = {
  bg: string;
  bgAlt: string;
  ink: string;
  inkMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentInk: string;
  accentGradient: string;
  footerBg: string;
  footerInk: string;
  cardBg: string;
  tagBg: string;
  tagInk: string;
  success: string;
  warning: string;
  danger: string;
};

export const baseColors: BaseColors = {
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
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
};

export type BaseMerchantColors = Partial<{
  font: string | null;
  headingFont: string | null;
  headingWeight: string | null;
  buttonRadius: string | null;
  inputRadius: string | null;
  productCardRadius: string | null;
  primaryColor: string | null;
  bgColor: string | null;
  textColor: string | null;
  mutedColor: string | null;
  borderColor: string | null;
}>;

export function applyMerchantThemeOverrides(colors: BaseMerchantColors | null | undefined): void {
  const font = colors?.font || 'Poppins';
  ensureGoogleFont(font);
  baseTheme.fonts.body = `'${font}', ${fontFallback(font)}`;
  const headFont = colors?.headingFont || font;
  if (headFont !== font) ensureGoogleFont(headFont);
  baseTheme.fonts.display = `'${headFont}', ${fontFallback(headFont)}`;

  if (colors?.primaryColor) {
    baseColors.accent = colors.primaryColor;
  }
  if (colors?.bgColor) {
    baseColors.bg = colors.bgColor;
  }
  if (colors?.textColor) {
    baseColors.ink = colors.textColor;
  }
  if (colors?.mutedColor) {
    baseColors.inkMuted = colors.mutedColor;
  }
  if (colors?.borderColor) {
    baseColors.border = colors.borderColor;
  }
}

export function resolveSectionColors(
  colorSchemeId: string | null | undefined,
  schemes: { id: string; bgColor: string; textColor: string; primaryColor: string; mutedColor?: string | null; borderColor?: string | null; saleColor?: string | null }[] | undefined,
): BaseColors {
  const s = colorSchemeId ? schemes?.find(x => x.id === colorSchemeId) : undefined;
  if (!s) return baseColors;
  return {
    ...baseColors,
    bg: s.bgColor || baseColors.bg,
    ink: s.textColor || baseColors.ink,
    accent: s.primaryColor || baseColors.accent,
    ...(s.mutedColor ? { inkMuted: s.mutedColor } : {}),
    ...(s.borderColor ? { border: s.borderColor } : {}),
    danger: s.saleColor || baseColors.danger,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for call-site parity with the other themes
export function baseTypographyCss(_scope = 'main'): string {
  return `
    .ld-root {
      font-family: ${baseTheme.fonts.body};
      color: ${baseColors.ink};
      background: ${baseColors.bg};
    }
  `;
}

export function mixHex(color1: string, color2: string, weight = 0.5): string {
  const d2h = (d: number) => d.toString(16).padStart(2, '0');
  const h2d = (h: string) => parseInt(h, 16);
  let c1 = color1.replace('#', '');
  let c2 = color2.replace('#', '');
  if (c1.length === 3) c1 = c1.split('').map(x => x + x).join('');
  if (c2.length === 3) c2 = c2.split('').map(x => x + x).join('');
  const r = Math.round(h2d(c1.substring(0, 2)) * weight + h2d(c2.substring(0, 2)) * (1 - weight));
  const g = Math.round(h2d(c1.substring(2, 4)) * weight + h2d(c2.substring(2, 4)) * (1 - weight));
  const b = Math.round(h2d(c1.substring(4, 6)) * weight + h2d(c2.substring(4, 6)) * (1 - weight));
  return `#${d2h(r)}${d2h(g)}${d2h(b)}`;
}

export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
