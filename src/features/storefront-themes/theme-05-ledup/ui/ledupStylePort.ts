import type { CSSProperties } from 'react';
import { ledupTheme as t } from '../theme.config';

export type LedupButtonVariant = 'primary' | 'outline' | 'dark';

/** Inline style of a Tech button; primary = filled accent, outline = accent border, dark = black pill. */
export function ledupButtonStyle(variant: LedupButtonVariant): CSSProperties {
  if (variant === 'outline') return { background: 'transparent', color: t.colors.accent, borderColor: t.colors.accent };
  if (variant === 'dark') return { background: t.colors.dark, color: t.colors.darkInk, borderColor: t.colors.dark };
  return { background: t.colors.accent, color: t.colors.accentInk, borderColor: t.colors.accent };
}

/** CSS variables the lb- classes read; set on the root wrapper so merchant colours flow into the stylesheet. */
export function ledupCssVars(): CSSProperties {
  return { '--lb-bg': t.colors.bg, '--lb-border': t.colors.border, '--lb-muted': t.colors.inkMuted, '--lb-accent': t.colors.accent, '--lb-btn-h': t.buttonHeightPx, '--lb-field-r': t.fieldRadiusPx, '--lb-card-r': t.cardRadiusPx } as CSSProperties;
}

/** Shared look of text inputs, selects and textareas (also used by the phone field). */
export function ledupControlStyle(invalid?: boolean): CSSProperties {
  // ledup.pt forms: soft grey field, hairline border, 12 px corners (never a pill).
  return { width: '100%', minHeight: 44, padding: '10px 14px', borderRadius: 12, background: '#f7f6f5', color: '#4b423b', fontFamily: t.fonts.body, fontSize: 14, outline: 'none', border: `1px solid ${invalid ? t.colors.danger : '#ebe8e5'}` };
}
