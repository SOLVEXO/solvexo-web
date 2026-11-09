/** Most columns a seller can ask for in a grid (the Columns setting is a number box from 1 to this). */
export const MAX_COLUMNS = 8;

/** The seller's "Columns" value as a whole number from `min` to `MAX_COLUMNS`; anything else (empty, text, out of range) falls back. */
export function columnCount(value: unknown, fallback: number, min = 1): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= MAX_COLUMNS ? n : fallback;
}

/** Keeps product/category grids readable on phones while respecting the
 *  merchant's selected desktop column count. Explicit class names keep these
 *  variants visible to Tailwind's production scanner. */
export function responsiveGridColumnsClass(columns?: number): string {
  switch (columns) {
    case 1: return 'grid-cols-1';
    case 2: return 'grid-cols-2 md:grid-cols-2';
    case 3: return 'grid-cols-2 md:grid-cols-3';
    case 4: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    case 5: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
    case 6: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    case 7: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7';
    case 8: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8';
    default: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  }
}

/** Grid classes for the home-page product sections (Featured products and similar): the same idea with their own phone/tablet steps. */
export function sectionGridColumnsClass(columns?: number): string {
  switch (columns) {
    case 1: return 'grid-cols-1';
    case 2: return 'grid-cols-2';
    case 3: return 'grid-cols-2 lg:grid-cols-3';
    case 5: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
    case 6: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    case 7: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7';
    case 8: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8';
    default: return 'grid-cols-2 lg:grid-cols-4';
  }
}
