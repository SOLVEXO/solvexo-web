const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;

type Rgb = [number, number, number];

/** [hue in degrees, lightness 0..1] */
function hsl([r, g, b]: Rgb): [number, number] {
  const max = Math.max(r, g, b) / 255; const min = Math.min(r, g, b) / 255; const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, (max + min) / 2];
}
const hueDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

/** Picks up to 5 distinct brand-looking colours from RGBA pixel data (e.g. a downscaled logo). Pure, so it is unit-testable without a canvas.
 *  Ignores the background (near white), near black, greys and the pale half-blended pixels along a shape's edge (anti-aliasing between a
 *  colour and its background is not a brand colour), then ranks what is left by how much of the image it covers. */
export function paletteFromPixels(data: ArrayLike<number>): string[] {
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue;
    const max = Math.max(r, g, b); const min = Math.min(r, g, b);
    const light = (max + min) / 510;
    const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    if (light > 0.82 || light < 0.08 || sat < 0.3) continue;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    cur.r += r; cur.g += g; cur.b += b; cur.n += 1;
    buckets.set(key, cur);
  }
  const ranked = [...buckets.values()].sort((x, y) => y.n - x.n);
  const total = ranked.reduce((sum, v) => sum + v.n, 0);
  // "Different enough" is judged by RGB distance, NOT luminance: red and blue can be equally bright yet are clearly different brand colours.
  const far = (p: Rgb, q: Rgb) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 90;
  // A paler version of a colour we already picked (same hue, noticeably lighter) is that colour blended with the background, not a new brand colour.
  const isTintOf = (c: Rgb, p: Rgb) => hueDistance(hsl(c)[0], hsl(p)[0]) < 25 && hsl(c)[1] > hsl(p)[1] + 0.1;
  const picked: Rgb[] = [];
  for (const v of ranked) {
    if (v.n < total * 0.02) break; // ignore specks
    const rgb: Rgb = [Math.round(v.r / v.n), Math.round(v.g / v.n), Math.round(v.b / v.n)];
    if (picked.every(p => far(p, rgb) && !isTintOf(rgb, p))) picked.push(rgb);
    if (picked.length === 5) break;
  }
  return picked.map(([r, g, b]) => toHex(r, g, b));
}
