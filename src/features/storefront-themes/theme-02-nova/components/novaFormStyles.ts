import type { CSSProperties } from 'react';
import { novaTheme as t } from '../theme.config';

/** Shared plain-input styling for Theme 02's auth/account forms — soft
 *  rounded corners, hairline border, matching every other Nova surface.
 *  Mirrors `atelierFormStyles.ts`'s own role exactly, with Nova's own
 *  rounded/bold visual language instead of Atelier's sharp-cornered one. */
export const novaInput: CSSProperties = {
  fontFamily: t.fonts.body,
  fontSize: '14px',
  color: t.colors.ink,
  border: `1.5px solid ${t.colors.border}`,
  padding: '12px 15px',
  width: '100%',
  outline: 'none',
  background: '#FFFFFF',
  borderRadius: t.radius.sm,
};

export const novaLabel: CSSProperties = {
  display: 'block',
  fontFamily: t.fonts.body,
  fontSize: '11.5px',
  fontWeight: 700,
  letterSpacing: '0.03em',
  color: t.colors.inkMuted,
  marginBottom: '6px',
};
