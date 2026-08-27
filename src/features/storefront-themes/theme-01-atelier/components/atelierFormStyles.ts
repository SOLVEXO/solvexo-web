import type { CSSProperties } from 'react';
import { atelierTheme as t } from '../theme.config';

/** Shared plain-input styling for Theme 01's auth/account forms — sharp
 *  corners, hairline border, no drop shadow, matching every other Atelier
 *  surface (Cart/Checkout inputs use the same visual language inline). */
export const atelierInput: CSSProperties = {
  fontFamily: t.fonts.body,
  fontSize: '13.5px',
  color: t.colors.ink,
  border: `1px solid ${t.colors.border}`,
  padding: '11px 13px',
  width: '100%',
  outline: 'none',
  background: '#FFFFFF',
  borderRadius: t.radius.none,
};

export const atelierLabel: CSSProperties = {
  display: 'block',
  fontFamily: t.fonts.body,
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: t.colors.inkMuted,
  marginBottom: '6px',
};
