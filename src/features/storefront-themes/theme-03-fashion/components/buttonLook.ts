import type { CSSProperties } from 'react';
import { fashionTheme as t, relativeLuminance, type FashionColors } from '../theme.config';

/** Colors for a button on the page background. The merchant's button style + radius apply here. */
export function buttonLook(variant: 'primary' | 'outline'): CSSProperties {
  const filled = variant === 'primary' && t.buttonStyle !== 'outline';
  const soft = variant === 'primary' && t.buttonStyle === 'soft';
  return {
    borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body,
    border: `1px solid ${variant === 'outline' ? t.colors.border : t.colors.accent}`,
    background: soft ? `color-mix(in srgb, ${t.colors.accent} 12%, transparent)` : filled ? t.colors.accent : 'transparent',
    color: soft ? t.colors.accent : filled ? t.colors.accentInk : t.colors.ink,
  };
}

export type CtaVariant = 'primary' | 'outline' | 'light';

/** The pill with a sliding arrow chip (View all, hero / banner calls to action, Add to cart, Checkout). One place decides
 *  both colours from the merchant's palette, so a brand colour set in Theme settings reaches every one of them.
 *  `palette` is the section's own colour scheme when there is one, else the store theme. */
export function ctaLook(variant: CtaVariant, palette: FashionColors = t.colors): { button: CSSProperties; chip: CSSProperties } {
  const base: CSSProperties = { borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body };
  // A near-white accent would vanish against a white button, so the chip falls back to black there.
  const chipOnWhite = relativeLuminance(palette.accent) > 0.85 ? '#09090B' : palette.accent;
  const chipOnWhiteInk = relativeLuminance(palette.accent) > 0.85 ? '#FFFFFF' : palette.accentInk;
  if (variant === 'light') {
    return { button: { ...base, background: '#fff', color: '#09090B', border: '1px solid #fff' }, chip: { background: chipOnWhite, color: chipOnWhiteInk } };
  }
  if (variant === 'outline' || t.buttonStyle === 'outline') {
    return { button: { ...base, background: 'transparent', color: variant === 'outline' ? palette.accent : palette.ink, border: `1px solid ${palette.accent}` }, chip: { background: palette.accent, color: palette.accentInk } };
  }
  if (t.buttonStyle === 'soft') {
    return { button: { ...base, background: `color-mix(in srgb, ${palette.accent} 12%, transparent)`, color: palette.accent, border: `1px solid ${palette.accent}` }, chip: { background: palette.accent, color: palette.accentInk } };
  }
  return { button: { ...base, background: palette.accent, color: palette.accentInk, border: `1px solid ${palette.accent}` }, chip: { background: palette.accentInk, color: palette.accent } };
}
