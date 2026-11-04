import type { CSSProperties } from 'react';
import { techTheme as t } from '../theme.config';

export type TechButtonVariant = 'primary' | 'outline' | 'dark';

/** Inline style of a Tech button; primary = filled accent, outline = accent border, dark = black pill. */
export function techButtonStyle(variant: TechButtonVariant): CSSProperties {
  if (variant === 'outline') return { background: 'transparent', color: t.colors.accent, borderColor: t.colors.accent };
  if (variant === 'dark') return { background: t.colors.dark, color: t.colors.darkInk, borderColor: t.colors.dark };
  return { background: t.colors.accent, color: t.colors.accentInk, borderColor: t.colors.accent };
}

/** CSS variables the tx- classes read; set on the root wrapper so merchant colours flow into the stylesheet. */
export function techCssVars(): CSSProperties {
  return { '--tx-bg': t.colors.bg, '--tx-border': t.colors.border, '--tx-muted': t.colors.inkMuted, '--tx-accent': t.colors.accent } as CSSProperties;
}
