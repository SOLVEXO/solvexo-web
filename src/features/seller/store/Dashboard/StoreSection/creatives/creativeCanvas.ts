export type CreativeFormat = 'square' | 'story' | 'banner' | 'whatsapp';

export const FORMATS: Record<CreativeFormat, { label: string; w: number; h: number }> = {
  square: { label: 'Square post (1080×1080)', w: 1080, h: 1080 },
  story: { label: 'Story / Reel (1080×1920)', w: 1080, h: 1920 },
  banner: { label: 'Banner (1200×628)', w: 1200, h: 628 },
  whatsapp: { label: 'WhatsApp status (1080×1920)', w: 1080, h: 1920 },
};

export interface CreativeInput {
  format: CreativeFormat;
  name: string;
  price: string;
  storeName: string;
  accent: string;
  logo: HTMLImageElement | null;
  image: HTMLImageElement | null;
  badge?: string;
}

export function safeColor(c: string | null | undefined, fallback = '#C2410C'): string {
  return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback;
}

/** White or near-black text, whichever reads better on `hex`. */
export function readableOn(hex: string): string {
  const n = parseInt(safeColor(hex).slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#111111' : '#FFFFFF';
}

/** Splits text into at most `maxLines` lines of the given pixel width; the last line gets "…" when cut. */
export function wrapLines(measure: (s: string) => number, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (let i = 0; i < words.length; i++) {
    const next = cur ? `${cur} ${words[i]}` : words[i];
    if (measure(next) <= maxWidth || !cur) { cur = next; continue; }
    lines.push(cur);
    cur = words[i];
    if (lines.length === maxLines) { cur = ''; break; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  const used = lines.join(' ').split(/\s+/).length;
  if (used < words.length && lines.length) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / r;
  const sh = h / r;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, x: number, y: number, maxW: number, maxH: number) {
  const r = Math.min(maxW / logo.naturalWidth, maxH / logo.naturalHeight);
  ctx.drawImage(logo, x, y, logo.naturalWidth * r, logo.naturalHeight * r);
}

/** Draws the creative. Pure canvas, no network: images must already be loaded. */
export function drawCreative(canvas: HTMLCanvasElement, c: CreativeInput): void {
  const { w, h } = FORMATS[c.format];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const accent = safeColor(c.accent);
  const onAccent = readableOn(accent);
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  const tall = h > w;
  const wide = w > h;
  // Photo area
  const pad = Math.round(Math.min(w, h) * 0.05);
  const photo = wide
    ? { x: 0, y: 0, w: Math.round(w * 0.5), h }
    : { x: 0, y: 0, w, h: Math.round(h * (tall ? 0.62 : 0.68)) };
  if (c.image) drawCover(ctx, c.image, photo.x, photo.y, photo.w, photo.h);
  else { ctx.fillStyle = '#E5E7EB'; ctx.fillRect(photo.x, photo.y, photo.w, photo.h); }
  // Text panel
  const panel = wide ? { x: photo.w, y: 0, w: w - photo.w, h } : { x: 0, y: photo.h, w, h: h - photo.h };
  ctx.fillStyle = accent;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  const tx = panel.x + pad;
  const tw = panel.w - pad * 2;
  const titleSize = Math.round(Math.min(w, h) * (wide ? 0.075 : 0.06));
  ctx.fillStyle = onAccent;
  ctx.textBaseline = 'top';
  ctx.font = `700 ${titleSize}px ${font}`;
  const lines = wrapLines((s) => ctx.measureText(s).width, c.name || 'Product', tw, wide ? 4 : 3);
  let y = panel.y + pad;
  for (const l of lines) { ctx.fillText(l, tx, y); y += Math.round(titleSize * 1.15); }
  const priceSize = Math.round(titleSize * 1.25);
  ctx.font = `800 ${priceSize}px ${font}`;
  ctx.fillText(c.price, tx, y + Math.round(titleSize * 0.25));
  // Footer: logo or store name
  const fh = Math.round(Math.min(w, h) * 0.07);
  const fy = panel.y + panel.h - pad - fh;
  if (c.logo) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(tx - 8, fy - 8, Math.min(tw, fh * 4) + 16, fh + 16);
    drawLogo(ctx, c.logo, tx, fy, Math.min(tw, fh * 4), fh);
  } else {
    ctx.fillStyle = onAccent;
    ctx.font = `600 ${Math.round(fh * 0.6)}px ${font}`;
    ctx.fillText(c.storeName, tx, fy + Math.round(fh * 0.2), tw);
  }
  // Badge
  if (c.badge?.trim()) {
    const bs = Math.round(titleSize * 0.7);
    ctx.font = `700 ${bs}px ${font}`;
    const text = c.badge.trim().slice(0, 24);
    const bw = ctx.measureText(text).width + bs;
    const bx = photo.x + pad;
    const by = photo.y + pad;
    ctx.fillStyle = '#111111';
    ctx.fillRect(bx, by, bw, bs * 1.6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, bx + bs / 2, by + bs * 0.3);
  }
}

export function buildCaption(name: string, price: string, url: string, storeName: string): string {
  return `${name} — ${price}\nAvailable now at ${storeName}\n${url}`;
}
