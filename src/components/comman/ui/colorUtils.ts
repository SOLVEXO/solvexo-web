/* Pure colour helpers for ColorField. Colours travel as "#rrggbb" (lower case) or "" for "not set". */

export interface Hsv { h: number; s: number; v: number }   // h 0-360, s/v 0-1
export interface Rgb { r: number; g: number; b: number }   // 0-255

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** "#abc", "abc", "#AABBCC", " aabbcc " -> "#aabbcc". Returns null when it is not a valid colour. */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
  return /^[0-9a-f]{6}$/.test(s) ? `#${s}` : null;
}

export function hexToRgb(hex: string): Rgb {
  const h = normalizeHex(hex) ?? '#000000';
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const p = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${p(r)}${p(g)}${p(b)}`;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export const hexToHsv = (hex: string): Hsv => rgbToHsv(hexToRgb(hex));
export const hsvToHex = (hsv: Hsv): string => rgbToHex(hsvToRgb(hsv));

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Black or white, whichever reads better on this background. */
export function readableOn(hex: string): '#ffffff' | '#141413' {
  return luminance(hex) > 0.4 ? '#141413' : '#ffffff';
}

/** A gentle starting palette: neutrals plus the main hues, in Solvexo's warm tone. */
export const DEFAULT_SWATCHES = [
  '#141413', '#4b423b', '#8c8a82', '#e8e6dc', '#ffffff', '#d97757', '#b91c1c', '#ea580c',
  '#ca8a04', '#16a34a', '#0d9488', '#0284c7', '#2563eb', '#7c3aed', '#c026d3', '#e11d48',
];

const RECENT_KEY = 'solvexo:recent-colors';
const RECENT_MAX = 8;

export function readRecentColors(key: string = RECENT_KEY): string[] {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(x => normalizeHex(String(x))).filter((x): x is string => !!x).slice(0, RECENT_MAX) : [];
  } catch { return []; }
}

export function rememberColor(hex: string, key: string = RECENT_KEY): string[] {
  const n = normalizeHex(hex);
  if (!n) return readRecentColors(key);
  const next = [n, ...readRecentColors(key).filter(c => c !== n)].slice(0, RECENT_MAX);
  try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* private mode: recents just do not persist */ }
  return next;
}
