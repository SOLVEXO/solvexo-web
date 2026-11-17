import type { CSSProperties } from 'react';

/** The small tag a menu item can carry ("New", "Sale"): the seller's colour when set, otherwise the theme's own accent. */
function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.45 ? '#ffffff' : '#111111';
}

export function NavBadge({ badge, fallbackBg, fallbackInk, style }: {
  badge: { text: string; color: string | null } | null | undefined;
  fallbackBg: string;
  fallbackInk: string;
  style?: CSSProperties;
}) {
  if (!badge?.text) return null;
  const bg = badge.color ?? fallbackBg;
  const ink = badge.color ? inkOn(badge.color) : fallbackInk;
  return (
    <span
      data-nav-badge
      style={{ marginInlineStart: 6, padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', lineHeight: '16px', verticalAlign: 'middle', whiteSpace: 'nowrap', background: bg, color: ink, ...style }}
    >
      {badge.text}
    </span>
  );
}
