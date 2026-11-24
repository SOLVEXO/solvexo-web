import type { HeaderIconSetDef } from '../themeManifest';
import type { IconSkin } from '../navigation/headerIcons';

/**
 * Ledup's own header icon sets. Ledup already draws every icon on its own round pill button (`.ld-iconbtn`),
 * so its sets only change the glyph inside that pill (no extra containers).
 */
export const LEDUP_ICON_SETS: HeaderIconSetDef[] = [
  { id: 'ledup-line', label: 'Light', hint: 'Fine outline inside the round button. The Ledup look.', family: 'bag', treatment: 'line' },
  { id: 'ledup-bold', label: 'Strong', hint: 'Heavier outline.', family: 'bag', treatment: 'bold' },
  { id: 'ledup-solid', label: 'Solid', hint: 'Filled icons.', family: 'bag', treatment: 'filled' },
  { id: 'ledup-soft', label: 'Soft tint', hint: 'Outline with a light fill and a handbag cart.', family: 'handbag', treatment: 'duotone' },
  { id: 'ledup-crisp', label: 'Crisp', hint: 'Square corners inside the round button.', family: 'bag', treatment: 'sharp' },
  { id: 'ledup-basket', label: 'Basket', hint: 'Light outline with a shopping basket.', family: 'basket', treatment: 'line' },
];

/** Ledup's tooltip: soft dark-brown pill, like its buttons. */
export const LEDUP_ICON_SKIN: IconSkin = {
  tipBg: '#4b423b', tipInk: '#ffffff', tipRadius: 999, tipFont: "'Poppins', system-ui, sans-serif",
  tipShadow: '0 8px 22px rgba(75,66,59,.22)', tileRadius: 16, inverse: '#ffffff',
};
