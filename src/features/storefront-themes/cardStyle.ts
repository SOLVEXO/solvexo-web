import type { CSSProperties } from 'react';

/** Theme setting "Card style" for product cards. 'theme' keeps each theme's own look. */
export function productCardFrame(style: 'theme' | 'flat' | 'outlined' | 'elevated', colors: { border: string; bg: string }, radius: string): CSSProperties | undefined {
  if (style === 'outlined') return { border: `1px solid ${colors.border}`, borderRadius: radius, padding: '10px', background: colors.bg };
  if (style === 'elevated') return { boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderRadius: radius, padding: '10px', background: colors.bg };
  return undefined;
}
