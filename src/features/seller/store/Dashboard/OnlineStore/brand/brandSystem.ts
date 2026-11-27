import type { BrandKit } from '@/api/services/storeTheme';

/** Pure helpers for the Brand Kit page: colour maths, the one-colour palette, style presets and the readability checks. */

const HEX6 = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX6.test(v);

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const ch = toRgb(hex).map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG contrast ratio, 1 (same colour) to 21 (black on white). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

export interface DerivedPalette { primaryColor: string; accentColor: string; bgColor: string; textColor: string; saleColor: string }

/** One brand colour in, a readable set of roles out: a faint tint of the brand for the page, a deep tone for text, a red that does not clash for sales. */
export function derivePalette(primary: string): DerivedPalette {
  if (!isHex(primary)) throw new Error('A 6-digit colour like #D97757 is needed.');
  const [h, s] = hexToHsl(primary);
  const bgColor = hslToHex(h, Math.min(0.2, Math.max(0.05, s * 0.3)), 0.97);
  const textColor = hslToHex(h, Math.min(0.22, s * 0.4), 0.11);
  const redish = h < 20 || h > 340;
  const saleColor = redish ? '#b42318' : '#d92d20';
  return { primaryColor: primary.toLowerCase(), accentColor: primary.toLowerCase(), bgColor, textColor, saleColor };
}

/** The look settings a style preset sets (never colours). Every value is one the theme settings already accept. */
export type BrandStyle = Pick<BrandKit,
  'font' | 'headingFont' | 'headingWeight' | 'headingCase' | 'headingTracking' | 'buttonCase' | 'buttonStyle' | 'buttonRadius'
  | 'imageRadius' | 'sectionRadius' | 'inputRadius' | 'productCardRadius' | 'buttonHover' | 'buttonShadow' | 'cardHover'>;

export interface BrandPreset { id: string; name: string; blurb: string; style: BrandStyle }

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: 'minimal', name: 'Minimal', blurb: 'Clean sans type, small corners, quiet buttons.',
    style: { font: 'Inter', headingFont: null, headingWeight: 'medium', headingCase: 'none', headingTracking: 'tight', buttonCase: 'normal', buttonStyle: 'solid', buttonRadius: 'small', imageRadius: 'small', sectionRadius: 'small', inputRadius: 'small', productCardRadius: 'small', buttonHover: 'fade', buttonShadow: 'none', cardHover: 'none' },
  },
  {
    id: 'bold', name: 'Bold', blurb: 'Heavy capitals, square edges, buttons that lift.',
    style: { font: 'Space Grotesk', headingFont: 'Space Grotesk', headingWeight: 'bold', headingCase: 'uppercase', headingTracking: 'tight', buttonCase: 'uppercase', buttonStyle: 'solid', buttonRadius: 'none', imageRadius: 'none', sectionRadius: 'none', inputRadius: 'none', productCardRadius: 'none', buttonHover: 'lift', buttonShadow: 'none', cardHover: 'lift' },
  },
  {
    id: 'soft', name: 'Soft', blurb: 'Rounded everything, friendly type, gentle shadows.',
    style: { font: 'Nunito', headingFont: 'Nunito', headingWeight: 'semibold', headingCase: 'none', headingTracking: 'normal', buttonCase: 'normal', buttonStyle: 'soft', buttonRadius: 'full', imageRadius: 'large', sectionRadius: 'large', inputRadius: 'full', productCardRadius: 'large', buttonHover: 'grow', buttonShadow: 'soft', cardHover: 'shadow' },
  },
  {
    id: 'editorial', name: 'Editorial', blurb: 'A serif headline over a calm body face, outlined buttons.',
    style: { font: 'DM Sans', headingFont: 'Fraunces', headingWeight: 'regular', headingCase: 'none', headingTracking: 'tight', buttonCase: 'normal', buttonStyle: 'outline', buttonRadius: 'none', imageRadius: 'none', sectionRadius: 'none', inputRadius: 'none', productCardRadius: 'none', buttonHover: 'fade', buttonShadow: 'none', cardHover: 'none' },
  },
  {
    id: 'modern', name: 'Modern', blurb: 'Confident semibold type, medium corners, soft card shadow.',
    style: { font: 'Inter', headingFont: 'Inter', headingWeight: 'semibold', headingCase: 'none', headingTracking: 'tight', buttonCase: 'normal', buttonStyle: 'solid', buttonRadius: 'medium', imageRadius: 'medium', sectionRadius: 'medium', inputRadius: 'medium', productCardRadius: 'medium', buttonHover: 'lift', buttonShadow: 'none', cardHover: 'shadow' },
  },
];

export const STYLE_KEYS = Object.keys(BRAND_PRESETS[0].style) as (keyof BrandStyle)[];

/** The preset whose every value the kit currently holds, or null once the seller has changed any of them. */
export function matchingPreset(kit: Partial<BrandKit>): BrandPreset | null {
  return BRAND_PRESETS.find(p => STYLE_KEYS.every(k => (kit[k] ?? null) === (p.style[k] ?? null))) ?? null;
}

export interface BrandCheck { id: string; level: 'error' | 'warn' | 'ok'; text: string }

/** Plain-language readability checks on the colours the store will really use (a role left on Auto falls back to the theme's own). */
export function checkBrand(kit: Partial<BrandKit> & { primaryColor: string }, theme: { bgColor: string; textColor: string }): BrandCheck[] {
  const out: BrandCheck[] = [];
  const bg = isHex(kit.bgColor) ? kit.bgColor : theme.bgColor;
  const text = isHex(kit.textColor) ? kit.textColor : theme.textColor;
  if (!isHex(bg) || !isHex(text)) return out;
  const ratio = contrast(text, bg);
  if (ratio < 4.5) out.push({ id: 'text', level: 'error', text: `Text is hard to read on the page background (contrast ${ratio.toFixed(1)}:1, aim for 4.5 or more).` });
  if (isHex(kit.primaryColor)) {
    const onPage = contrast(kit.primaryColor, bg);
    if (onPage < 3) out.push({ id: 'primary', level: 'warn', text: 'Your main colour is too close to the page background; buttons and highlights may disappear.' });
    const whiteOn = contrast('#ffffff', kit.primaryColor);
    const darkOn = contrast('#111111', kit.primaryColor);
    if (!isHex(kit.buttonTextColor) && Math.max(whiteOn, darkOn) < 3.5) out.push({ id: 'button', level: 'warn', text: 'Neither white nor dark text is easy to read on your main colour. Pick a button text colour.' });
    if (isHex(kit.buttonTextColor) && contrast(kit.buttonTextColor, kit.primaryColor) < 3.5) out.push({ id: 'button', level: 'warn', text: 'Button text is hard to read on the main colour.' });
  }
  if (isHex(kit.linkColor) && contrast(kit.linkColor, bg) < 3) out.push({ id: 'link', level: 'warn', text: 'Link colour is faint on the page background.' });
  if (isHex(kit.priceColor) && contrast(kit.priceColor, bg) < 3) out.push({ id: 'price', level: 'warn', text: 'Price colour is faint on the page background.' });
  if (isHex(kit.saleColor) && contrast(kit.saleColor, bg) < 3) out.push({ id: 'sale', level: 'warn', text: 'Sale colour is faint on the page background.' });
  if (isHex(kit.headingColor) && contrast(kit.headingColor, bg) < 4.5) out.push({ id: 'heading', level: 'warn', text: 'Heading colour is faint on the page background.' });
  if (out.length === 0) out.push({ id: 'ok', level: 'ok', text: 'Text, buttons and links all read well on your page background.' });
  return out;
}
