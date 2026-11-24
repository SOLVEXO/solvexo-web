import type { HeaderIconSetDef } from '../themeManifest';
import type { IconSkin } from '../navigation/headerIcons';

/** Tech Store's own header icon sets: straighter, more technical. The first one is the default (what every store had before). */
export const TECH_ICON_SETS: HeaderIconSetDef[] = [
  { id: 'tech-line', label: 'Standard', hint: 'Clean outline icons with a shopping cart.', family: 'cart', treatment: 'line' },
  { id: 'tech-sharp', label: 'Sharp', hint: 'Square corners and joints, a technical look.', family: 'cart', treatment: 'sharp' },
  { id: 'tech-bold', label: 'Bold', hint: 'Heavier outline.', family: 'cart', treatment: 'bold' },
  { id: 'tech-solid', label: 'Solid', hint: 'Filled icons.', family: 'cart', treatment: 'filled' },
  { id: 'tech-duo', label: 'Tinted', hint: 'Outline with a light fill and a basket cart.', family: 'basket', treatment: 'duotone' },
  { id: 'tech-box', label: 'Boxed', hint: 'Each icon inside a thin square.', family: 'cart', treatment: 'box' },
  { id: 'tech-tile', label: 'Tile', hint: 'Each icon on a tinted square tile.', family: 'bag', treatment: 'tile' },
];

export function techIconSkin(t: { colors: { ink: string; bg: string; accent?: string; accentInk?: string }; fonts: { body: string } }, radius: string | number): IconSkin {
  const r = Number.parseFloat(String(radius)) || 0;
  return {
    tipBg: t.colors.ink, tipInk: t.colors.bg, tipRadius: Math.min(r, 6), tipFont: t.fonts.body,
    tipShadow: '0 4px 14px rgba(0,0,0,.2)', tileRadius: Math.min(r, 6), inverse: t.colors.bg,
    brandBg: t.colors.accent, brandInk: t.colors.accentInk,
  };
}
