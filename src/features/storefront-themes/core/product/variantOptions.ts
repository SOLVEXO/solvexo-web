import type { ProductVariant } from '@/api/services/marketplace';
import { optionValueAvailable } from '../../variantAvailability';

/** Headless logic of the product page's option pickers (Size, Colour ...): which values an option has, which are buyable now,
 *  what colour / picture a value stands for, and which look (buttons, dropdown, swatches, picture tiles) fits an option. */

export type OptionPickerStyle = 'pills' | 'dropdown' | 'swatches' | 'images';
export const OPTION_PICKER_STYLES: readonly OptionPickerStyle[] = ['pills', 'dropdown', 'swatches', 'images'];

export interface OptionValueInfo {
  value: string;
  /** Can be bought together with the other options currently chosen (a sold-out value stays selectable, struck through). */
  available: boolean;
  /** A colour for the value ("Navy Blue" -> #000080), or null when we do not know it. */
  color: string | null;
  /** The picture that stands for this value: only when EVERY variant with the value shows the same first photo (so a "Size" never borrows the picture of one colour), else null. */
  image: string | null;
  /** True when the colour is the one the SELLER chose for this value (Shopify's colour entry), not a guess from the name. */
  custom?: boolean;
}

/** A colour the seller chose for one option value. */
export interface SellerSwatch { option: string; value: string; color: string }

/** The colour of an option value: the seller's own choice first, else a guess from the name (Royal Green -> green), else null. */
export function swatchColor(swatches: SellerSwatch[] | undefined, option: string, value: string): { color: string | null; custom: boolean } {
  const own = swatches?.find(s => s.option === option && s.value === value)?.color;
  return own ? { color: own, custom: true } : { color: colorForValue(value), custom: false };
}

// Common colour names (the CSS colours people actually use in a shop) plus a few frequent extras. Unknown names fall back to text.
const COLORS: Record<string, string> = {
  black: '#000000', white: '#ffffff', red: '#e53935', blue: '#1e88e5', green: '#43a047', yellow: '#fdd835', orange: '#fb8c00', purple: '#8e24aa', pink: '#ec407a',
  brown: '#6d4c41', grey: '#9e9e9e', gray: '#9e9e9e', silver: '#c0c0c0', gold: '#d4af37', beige: '#d9c8a9', cream: '#fffdd0', ivory: '#fffff0', navy: '#001f5b',
  maroon: '#800000', burgundy: '#800020', teal: '#008080', turquoise: '#40e0d0', aqua: '#00ffff', cyan: '#00bcd4', magenta: '#ff00ff', violet: '#7f00ff', lavender: '#b497d6',
  lilac: '#c8a2c8', indigo: '#3f51b5', olive: '#808000', lime: '#cddc39', mint: '#98ff98', khaki: '#c3b091', tan: '#d2b48c', coral: '#ff7f50', salmon: '#fa8072',
  peach: '#ffcba4', rose: '#ff007f', fuchsia: '#ff00ff', crimson: '#dc143c', scarlet: '#ff2400', charcoal: '#36454f', slate: '#708090', copper: '#b87333', bronze: '#cd7f32',
  camel: '#c19a6b', mustard: '#e1ad01', rust: '#b7410e', wine: '#722f37', plum: '#8e4585', sand: '#c2b280', stone: '#a8a29e', denim: '#1560bd', sky: '#87ceeb',
  emerald: '#50c878', forest: '#228b22', sage: '#9caf88', lemon: '#fff44f', nude: '#e3bc9a', mauve: '#e0b0ff', cherry: '#de3163', chocolate: '#7b3f00', coffee: '#6f4e37',
  transparent: '#f4f4f4', clear: '#f4f4f4',
};
const MODIFIERS = new Set(['light', 'dark', 'deep', 'pale', 'bright', 'soft', 'dusty', 'baby', 'royal', 'matte', 'glossy', 'metallic', 'hot', 'neon', 'off']);
// a hex code needs its '#': plain words such as "facade" or "bad" are made of hex digits too
const HEX = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;

/** A colour for an option value, or null. Accepts a hex code, a colour name, and names like "Navy Blue" or "Light Grey". */
export function colorForValue(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  const hex = HEX.exec(v);
  if (hex) return `#${hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1]}`;
  if (COLORS[v]) return COLORS[v];
  const words = v.replace(/[^a-z\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);
  // "Navy Blue" -> navy, "Light Grey" -> grey: the first colour word that is not just a modifier (light, dark ...) decides
  const named = words.find(w => !MODIFIERS.has(w) && COLORS[w]);
  return named ? COLORS[named] : null;
}

/** Does the option NAME say it is a colour? (English plus the common Urdu / Hindi word.) */
export const isColorOptionName = (name: string): boolean => /colou?r|shade|rang|رنگ/i.test(name);

/** Every value of one option, in first-seen order, with availability, colour and picture. */
export function buildOptionValues(variants: ProductVariant[], selected: ProductVariant | null, name: string, isDigital: boolean, swatches?: SellerSwatch[]): OptionValueInfo[] {
  const seen = new Set<string>();
  const out: OptionValueInfo[] = [];
  for (const v of variants) {
    const value = v.options?.find(o => o.name === name)?.value;
    if (!value || seen.has(value)) continue;
    seen.add(value);
    const withValue = variants.filter(x => x.options?.find(o => o.name === name)?.value === value);
    const pictures = new Set(withValue.map(x => x.images?.[0] ?? ''));
    const image = pictures.size === 1 && !pictures.has('') ? [...pictures][0] : null;
    const { color, custom } = swatchColor(swatches, name, value);
    out.push({ value, available: optionValueAvailable(variants, selected, name, value, isDigital), color, image, custom });
  }
  return out;
}

/** The look an option really gets: swatches only for colour-like options, picture tiles only when every value has a picture;
 *  otherwise the buttons, so a "Size" option never turns into empty circles. */
export function resolveOptionStyle(requested: unknown, name: string, values: OptionValueInfo[]): OptionPickerStyle {
  const chosen = (OPTION_PICKER_STYLES as readonly unknown[]).includes(requested);
  // Shopify: swatches show by default once the seller has given a value its colour. An explicit choice of the seller always wins.
  const style = chosen ? (requested as OptionPickerStyle) : values.some(v => v.custom) ? 'swatches' : 'pills';
  if (style === 'swatches') {
    const known = values.filter(v => v.color).length;
    const colourLike = isColorOptionName(name) ? known > 0 : values.length > 0 && known / values.length >= 0.6;
    return colourLike ? 'swatches' : 'pills';
  }
  if (style === 'images') return values.length > 0 && values.every(v => v.image) ? 'images' : 'pills';
  return style;
}
