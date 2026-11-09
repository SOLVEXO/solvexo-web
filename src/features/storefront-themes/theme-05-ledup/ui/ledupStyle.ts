import type { CSSProperties } from 'react';
import { ledupTheme as t } from '../theme.config';

export type LedupButtonVariant = 'primary' | 'outline' | 'dark';

export function ledupButtonStyle(variant: LedupButtonVariant = 'primary'): CSSProperties {
  if (variant === 'outline') {
    return {
      background: 'transparent',
      color: t.colors.ink,
      borderColor: t.colors.borderStrong,
    };
  }
  if (variant === 'dark') {
    return {
      background: t.colors.dark,
      color: t.colors.darkInk,
      borderColor: t.colors.dark,
    };
  }
  return {
    background: t.colors.accent,
    color: t.colors.accentInk,
    borderColor: t.colors.accent,
  };
}

export function ledupCssVars(): CSSProperties {
  return {
    '--ld-bg': t.colors.bg,
    '--ld-border': t.colors.border,
    '--ld-muted': t.colors.inkMuted,
    '--ld-accent': t.colors.accent,
    '--ld-accent-hover': `color-mix(in srgb, ${t.colors.accent} 82%, #000)`,
    '--ld-banner': t.colors.banner,
    '--ld-footer': t.colors.footer,
    '--ld-ink': t.colors.ink,
    '--ld-btn-h': t.buttonHeightPx,
    '--ld-field-r': t.fieldRadiusPx,
    '--ld-card-r': t.cardRadiusPx,
  } as CSSProperties;
}

export function ledupControlStyle(invalid?: boolean): CSSProperties {
  return {
    width: '100%',
    minHeight: 46,
    padding: '10px 18px',
    borderRadius: t.fieldRadiusPx,
    background: t.colors.bg,
    color: t.colors.ink,
    fontFamily: t.fonts.body,
    fontSize: 14,
    outline: 'none',
    border: `1px solid ${invalid ? t.colors.danger : t.colors.borderStrong}`,
  };
}
