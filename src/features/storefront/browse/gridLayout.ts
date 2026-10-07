/** Keeps product/category grids readable on phones while respecting the
 *  merchant's selected desktop column count. Explicit class names keep these
 *  variants visible to Tailwind's production scanner. */
export function responsiveGridColumnsClass(columns?: 2 | 3 | 4): string {
  if (columns === 2) return 'grid-cols-2 md:grid-cols-2';
  if (columns === 3) return 'grid-cols-2 md:grid-cols-3';
  if (columns === 4) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
}
