/**
 * Free content layer — the shape of `section.settings.contentItems`.
 *
 * Mirrors `solvexo-api/src/common/store-content/content-items.util.ts` (the two
 * repos have no shared package, so they are kept in step by hand). The backend
 * is the enforcement point; this file only types what the editor writes and
 * what the storefront draws.
 */

export const CONTENT_ITEM_KINDS = ['heading', 'subheading', 'text', 'button', 'image'] as const;
export type ContentItemKind = (typeof CONTENT_ITEM_KINDS)[number];

export const CONTENT_ITEM_ANCHORS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
] as const;
export type ContentItemAnchor = (typeof CONTENT_ITEM_ANCHORS)[number];

export const CONTENT_ITEM_WIDTHS = ['narrow', 'normal', 'wide', 'full'] as const;
export type ContentItemWidth = (typeof CONTENT_ITEM_WIDTHS)[number];

export const CONTENT_ITEM_ALIGNS = ['left', 'center', 'right'] as const;
export type ContentItemAlign = (typeof CONTENT_ITEM_ALIGNS)[number];

export const CONTENT_ITEM_SIZES = ['sm', 'md', 'lg', 'xl'] as const;
export type ContentItemSize = (typeof CONTENT_ITEM_SIZES)[number];

export const MAX_CONTENT_ITEMS = 30;

export interface ContentItem {
  id?: string;
  kind: ContentItemKind;
  text?: string;
  imageUrl?: string;
  link?: unknown;
  anchor?: ContentItemAnchor;
  width?: ContentItemWidth;
  align?: ContentItemAlign;
  color?: string;
  size?: ContentItemSize;
  /** Free desktop-only nudge (px) on top of `anchor`; the storefront drops
   *  it below 1024px so a phone column can never be pushed off screen. */
  offsetX?: number;
  offsetY?: number;
}

/** Largest nudge (px) the editor offers and the backend accepts. */
export const CONTENT_MAX_OFFSET = 2000;

/** Max characters per kind — must match the backend's `TEXT_LIMIT`. */
export const CONTENT_TEXT_LIMIT: Record<ContentItemKind, number> = {
  heading: 150,
  subheading: 200,
  text: 2000,
  button: 40,
  image: 0,
};

/** The 3×3 grid area each anchor maps to (row / column, 1-based). */
export const CONTENT_ANCHOR_AREA: Record<ContentItemAnchor, { row: number; column: number }> = {
  'top-left': { row: 1, column: 1 },
  'top-center': { row: 1, column: 2 },
  'top-right': { row: 1, column: 3 },
  'middle-left': { row: 2, column: 1 },
  'middle-center': { row: 2, column: 2 },
  'middle-right': { row: 2, column: 3 },
  'bottom-left': { row: 3, column: 1 },
  'bottom-center': { row: 3, column: 2 },
  'bottom-right': { row: 3, column: 3 },
};

/** Width of one item inside its grid cell. */
export const CONTENT_WIDTH_CLASS: Record<ContentItemWidth, string> = {
  narrow: 'max-w-[420px]',
  normal: 'max-w-[640px]',
  wide: 'max-w-[900px]',
  full: 'max-w-none',
};

/** Type scale. `clamp()` keeps it readable on a phone and on a 4K screen. */
export const CONTENT_SIZE_CLASS: Record<ContentItemSize, string> = {
  sm: 'text-[15px] leading-[1.5]',
  md: 'text-[17px] leading-[1.55] md:text-[19px]',
  lg: 'text-[clamp(24px,3.4vw,40px)] leading-[1.15]',
  xl: 'text-[clamp(32px,5vw,64px)] leading-[1.05]',
};

export const contentItemKey = (item: ContentItem, index: number): string =>
  item.id && /^[A-Za-z0-9_-]{1,40}$/.test(item.id) ? item.id : `${item.kind}-${index}`;