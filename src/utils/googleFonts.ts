/**
 * Google Fonts the seller can pick for a storefront (Shopify-style font picker).
 * Only names from this catalog are ever turned into a stylesheet URL, so a saved
 * value can never inject anything else. A font loads only when something asks for it.
 */
export type FontGroup = 'Sans' | 'Serif' | 'Display' | 'Handwriting' | 'Mono' | 'Urdu & Arabic';

export interface CatalogFont { name: string; group: FontGroup }

const list = (group: FontGroup, names: string[]): CatalogFont[] => names.map(name => ({ name, group }));

export const FONT_CATALOG: CatalogFont[] = [
  ...list('Sans', ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'DM Sans', 'Nunito', 'Space Grotesk', 'Open Sans', 'Lato', 'Work Sans', 'Manrope', 'Outfit', 'Plus Jakarta Sans', 'Raleway', 'Source Sans 3', 'Rubik', 'Karla', 'Mulish', 'Figtree', 'Sora', 'Lexend', 'Barlow', 'Cabin', 'Urbanist', 'Jost', 'Quicksand', 'Public Sans', 'IBM Plex Sans', 'Josefin Sans', 'Albert Sans', 'Red Hat Display', 'Be Vietnam Pro']),
  ...list('Serif', ['Playfair Display', 'Fraunces', 'Lora', 'Merriweather', 'Cormorant Garamond', 'EB Garamond', 'Libre Baskerville', 'Crimson Pro', 'DM Serif Display', 'Bitter', 'Source Serif 4', 'Spectral', 'Noto Serif', 'PT Serif', 'Instrument Serif', 'Cinzel', 'Bodoni Moda', 'Newsreader']),
  ...list('Display', ['Bebas Neue', 'Oswald', 'Anton', 'Archivo Black', 'Abril Fatface', 'Syne', 'Unbounded', 'Righteous', 'Alfa Slab One', 'League Spartan', 'Big Shoulders Display']),
  ...list('Handwriting', ['Pacifico', 'Dancing Script', 'Caveat', 'Satisfy', 'Great Vibes', 'Sacramento', 'Shadows Into Light']),
  ...list('Mono', ['JetBrains Mono', 'IBM Plex Mono', 'Space Mono', 'Fira Code', 'DM Mono']),
  ...list('Urdu & Arabic', ['Noto Nastaliq Urdu', 'Noto Naskh Arabic', 'Lateef', 'Scheherazade New', 'Amiri', 'Cairo', 'Tajawal', 'Almarai', 'Harmattan', 'Reem Kufi', 'Noto Sans Arabic', 'IBM Plex Sans Arabic', 'Markazi Text', 'El Messiri']),
];

const BY_NAME = new Map(FONT_CATALOG.map(f => [f.name.toLowerCase(), f]));

/** Catalog entry for a stored value, or undefined when it is not (or no longer) offered. */
export function findCatalogFont(name: string | null | undefined): CatalogFont | undefined {
  return name ? BY_NAME.get(name.trim().toLowerCase()) : undefined;
}

/** Serif fallback for serif/display/handwriting-looking fonts, sans otherwise. */
export function fontFallback(name: string | null | undefined, preferSerif = false): string {
  const f = findCatalogFont(name);
  if (f?.group === 'Serif' || f?.group === 'Urdu & Arabic') return 'serif';
  if (f?.group === 'Mono') return 'monospace';
  if (f?.group === 'Handwriting') return 'cursive';
  return f ? 'sans-serif' : preferSerif ? 'serif' : 'sans-serif';
}

/** Fonts index.html already loads, so we never download them twice. */
const PRELOADED = new Set(['inter', 'poppins', 'roboto', 'montserrat', 'dm sans', 'nunito', 'space grotesk', 'playfair display', 'fraunces', 'lora']);

const WEIGHTS = '400;500;600;700';
const loaded = new Set<string>();

function familyParam(name: string): string {
  return `family=${encodeURIComponent(name).replace(/%20/g, '+')}`;
}

function addLink(id: string, href: string): void {
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/** Loads one catalog font for real use (all weights headings/body need). No-op for unknown names and for fonts already on the page. */
export function ensureGoogleFont(name: string | null | undefined): void {
  const font = findCatalogFont(name);
  if (!font) return;
  const key = font.name.toLowerCase();
  if (loaded.has(key) || PRELOADED.has(key)) return;
  loaded.add(key);
  addLink(`gf-${key.replace(/\s+/g, '-')}`, `https://fonts.googleapis.com/css2?${familyParam(font.name)}:wght@${WEIGHTS}&display=swap`);
}

/** Loads only the letters of the font's own name, so a long picker list stays light. */
export function ensureFontPreview(name: string): void {
  const font = findCatalogFont(name);
  if (!font) return;
  const key = `preview-${font.name.toLowerCase()}`;
  if (loaded.has(key)) return;
  loaded.add(key);
  addLink(`gfp-${font.name.toLowerCase().replace(/\s+/g, '-')}`, `https://fonts.googleapis.com/css2?${familyParam(font.name)}&text=${encodeURIComponent(font.name)}&display=swap`);
}
