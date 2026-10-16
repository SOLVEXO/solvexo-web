import type { CSSProperties } from 'react';
import { fashionTheme as t } from '../theme.config';

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
