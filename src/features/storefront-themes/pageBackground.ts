import type { ThemeSettingsFieldDef } from './themeManifest';

/** Seller's page background picture (Theme Settings -> Page background), shared by themes that have no own copy.
 *  Settings are stored as `custom.pageBg*`. */
export interface PageBg {
  image: string | null;
  mode: 'cover' | 'tile' | 'fit';
  tileSize: number | null;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  fixed: boolean;
  /** 5-100: how much of the picture shows over the page colour. */
  strength: number;
  /** Colour the picture fades into when strength < 100; null = the page colour. */
  overlayColor: string | null;
  /** 0-20 px: blur of the picture (drawn on its own layer, see PageBgLayer). */
  blur: number;
}

export const DEFAULT_PAGE_BG: PageBg = { image: null, mode: 'cover', tileSize: null, position: 'center', fixed: false, strength: 100, overlayColor: null, blur: 0 };

/** Read the `pageBg*` keys of `StorefrontColors.themeSettings` (bad values fall back to the defaults). */
export function readPageBg(ts: Record<string, unknown> | undefined | null): PageBg {
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
  const img = ts?.pageBgImage;
  const tile = Math.round(Number(ts?.pageBgTileSize));
  const strength = Math.round(Number(ts?.pageBgStrength));
  const blur = Math.round(Number(ts?.pageBgBlur));
  return {
    blur: blur >= 1 && blur <= 20 ? blur : 0,
    image: typeof img === 'string' && /^https:\/\//i.test(img) ? img : null,
    mode: pick(ts?.pageBgMode, ['cover', 'tile', 'fit'] as const, 'cover'),
    tileSize: tile >= 20 && tile <= 1200 ? tile : null,
    position: pick(ts?.pageBgPosition, ['center', 'top', 'bottom', 'left', 'right'] as const, 'center'),
    fixed: ts?.pageBgScroll === 'fixed',
    strength: strength >= 5 && strength <= 100 ? strength : 100,
    overlayColor: typeof ts?.pageBgOverlay === 'string' && /^#[0-9a-fA-F]{6}$/.test(ts.pageBgOverlay) ? ts.pageBgOverlay : null,
  };
}

/** Inline style for the page's own background: the page colour plus the picture (faded into the page colour by `strength`). */
export function pageBackgroundCss(bg: string, p: PageBg): Record<string, string> {
  if (!p.image) return { background: bg };
  // A blurred picture lives on its own layer (PageBgLayer) so the page content stays sharp.
  // overflow: clip (not hidden) trims the layer's blurred edge without breaking a sticky header.
  if (p.blur > 0) return { backgroundColor: bg, position: 'relative', isolation: 'isolate', overflow: 'clip' };
  const m = /^#([0-9a-f]{6})$/i.exec(p.overlayColor ?? bg);
  let veil = '';
  if (m && p.strength < 100) {
    const rgba = `rgba(${parseInt(m[1].slice(0, 2), 16)},${parseInt(m[1].slice(2, 4), 16)},${parseInt(m[1].slice(4, 6), 16)},${(100 - p.strength) / 100})`;
    veil = `linear-gradient(${rgba},${rgba}),`;
  }
  const tileSize = p.tileSize ? `${p.tileSize}px auto` : 'auto';
  const size = p.mode === 'tile' ? tileSize : p.mode === 'fit' ? 'contain' : 'cover';
  const pre = (layer: string) => (veil ? `${veil ? (layer === 'size' ? '100% 100%,' : layer === 'pos' ? '0 0,' : layer === 'att' ? 'scroll,' : 'no-repeat,') : ''}` : '');
  return {
    backgroundColor: bg,
    backgroundImage: `${veil}url("${p.image.replace(/["\\\n\r()]/g, '')}")`,
    backgroundRepeat: `${pre('rep')}${p.mode === 'tile' ? 'repeat' : 'no-repeat'}`,
    backgroundSize: `${pre('size')}${size}`,
    backgroundPosition: `${pre('pos')}${p.position}`,
    backgroundAttachment: `${pre('att')}${p.fixed ? 'fixed' : 'scroll'}`,
  };
}

/** Style of the blurred picture layer (PageBgLayer): the picture, faded and blurred, behind the page content. */
export function pageBgLayerStyle(bg: string, p: PageBg): Record<string, string> {
  const img = pageBackgroundCss(bg, { ...p, blur: 0 });
  delete img.backgroundColor;
  const edge = `-${p.blur * 2}px`;
  return { ...img, backgroundAttachment: 'scroll', position: p.fixed ? 'fixed' : 'absolute', inset: edge, zIndex: '-1', pointerEvents: 'none', filter: `blur(${p.blur}px)` };
}

/** The "Page background" settings, for a theme manifest (). Short labels; the extra options show only when they matter. */
const has = (s: Record<string, unknown>) => typeof s.pageBgImage === 'string' && s.pageBgImage !== '';
export const PAGE_BG_FIELDS: ThemeSettingsFieldDef[] = [
  { key: 'custom.pageBgImage', label: 'Picture', group: 'Page background', control: { kind: 'image' }, helpText: 'Behind every page of your store.' },
  { key: 'custom.pageBgMode', label: 'Style', group: 'Page background', showIf: has, control: { kind: 'select', options: [{ value: 'cover', label: 'Fill' }, { value: 'tile', label: 'Pattern' }, { value: 'fit', label: 'Whole picture' }] }, helpText: 'Use Pattern for small repeating textures.' },
  { key: 'custom.pageBgTileSize', label: 'Pattern size (px)', group: 'Page background', showIf: s => has(s) && s.pageBgMode === 'tile', control: { kind: 'number', min: 20, max: 1200, placeholder: 'Original' }, helpText: 'Width of one tile in Pattern style.' },
  { key: 'custom.pageBgPosition', label: 'Position', group: 'Page background', showIf: s => has(s) && s.pageBgMode !== 'tile', control: { kind: 'select', options: [{ value: 'center', label: 'Centre' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] }, helpText: 'Which part of the picture stays visible.' },
  { key: 'custom.pageBgScroll', label: 'Scrolling', group: 'Page background', showIf: has, control: { kind: 'select', options: [{ value: 'scroll', label: 'Moves with page' }, { value: 'fixed', label: 'Stays in place' }] }, helpText: 'Phones may always move it with the page.' },
  { key: 'custom.pageBgStrength', label: 'Strength (%)', group: 'Page background', showIf: has, control: { kind: 'number', min: 5, max: 100, placeholder: '100' }, helpText: 'Lower fades the picture into the overlay colour.' },
  { key: 'custom.pageBgBlur', label: 'Blur (px)', group: 'Page background', showIf: has, control: { kind: 'number', min: 0, max: 20, placeholder: '0' }, helpText: 'Softens the picture, not the page content.' },
  { key: 'custom.pageBgOverlay', label: 'Fade colour', group: 'Page background', showIf: has, control: { kind: 'color', optional: { fallback: '#FFFFFF' } }, helpText: 'The colour the picture fades into.' },
];

/** Seller's product card border (Theme Settings -> Product cards): thickness 0-6 px and an optional colour. `width` null = the theme's own look. */
export interface CardBorder { width: number | null; color: string | null }
export const DEFAULT_CARD_BORDER: CardBorder = { width: null, color: null };

export function readCardBorder(ts: Record<string, unknown> | undefined | null): CardBorder {
  const raw = ts?.cardBorderWidth;
  const w = raw === undefined || raw === null || raw === '' ? NaN : Math.round(Number(raw));
  const c = ts?.cardBorderColor;
  return { width: w >= 0 && w <= 6 ? w : null, color: typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : null };
}

/** CSS that gives every card matching `selector` the seller's border; empty when the seller set nothing. */
export function cardBorderCss(selector: string, cb: CardBorder, fallbackColor: string): string {
  if (cb.width === null) return '';
  if (cb.width === 0) return `${selector}{border:none!important}`;
  return `${selector}{border:${cb.width}px solid ${cb.color ?? fallbackColor}!important}`;
}

export const CARD_BORDER_FIELDS: ThemeSettingsFieldDef[] = [
  { key: 'custom.cardBorderWidth', label: 'Card border thickness (px)', group: 'Product cards', control: { kind: 'number', min: 0, max: 6, placeholder: 'Theme default' }, helpText: '0 = no border.' },
  { key: 'custom.cardBorderColor', label: 'Card border colour', group: 'Product cards', control: { kind: 'color', optional: { fallback: '#E5E5E5' } }, helpText: 'Empty uses your border colour.' },
];
