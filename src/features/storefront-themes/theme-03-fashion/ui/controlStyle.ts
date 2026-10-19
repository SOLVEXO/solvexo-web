import type { CSSProperties } from 'react';
import { fashionTheme as t } from '../theme.config';

/** Shared control look (inputs, selects, textareas). */
export function controlStyle(invalid?: boolean): CSSProperties {
  return { width: '100%', minHeight: 48, padding: '12px 18px', borderRadius: t.inputRadiusPx, background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, fontSize: 15, outline: 'none', border: `1px solid ${invalid ? t.colors.danger : t.colors.border}` };
}
