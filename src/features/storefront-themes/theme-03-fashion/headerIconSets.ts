import type { HeaderIconSetDef } from '../themeManifest';
import type { IconSkin } from '../navigation/headerIcons';

/** Maison's own header icon sets. The first one is the default and is exactly the look every store had before. */
export const MAISON_ICON_SETS: HeaderIconSetDef[] = [
  { id: 'maison-line', label: 'Fine line', hint: 'Light outline icons. The classic Maison look.', family: 'bag', treatment: 'line' },
  { id: 'maison-bold', label: 'Bold line', hint: 'Heavier outline, easier to see on small screens.', family: 'bag', treatment: 'bold' },
  { id: 'maison-solid', label: 'Solid', hint: 'Filled icons.', family: 'bag', treatment: 'filled' },
  { id: 'maison-soft', label: 'Soft tint', hint: 'Outline with a light fill and a handbag cart.', family: 'handbag', treatment: 'duotone' },
  { id: 'maison-ring', label: 'Ring', hint: 'Each icon inside a thin circle.', family: 'bag', treatment: 'circle' },
  { id: 'maison-dot', label: 'Dark circle', hint: 'Each icon on a solid round button.', family: 'bag', treatment: 'solid' },
  { id: 'maison-tile', label: 'Soft tile', hint: 'Each icon on a softly tinted rounded tile.', family: 'handbag', treatment: 'tile' },
];

export function maisonIconSkin(t: { colors: { ink: string; bg: string }; fonts: { body: string }; buttonRadiusPx: string | number }): IconSkin {
  const r = Number.parseFloat(String(t.buttonRadiusPx)) || 0;
  return {
    tipBg: t.colors.ink, tipInk: t.colors.bg, tipRadius: Math.min(r, 12), tipFont: t.fonts.body,
    tipShadow: '0 6px 18px rgba(0,0,0,.18)', tileRadius: Math.min(r, 14), inverse: t.colors.bg,
  };
}
