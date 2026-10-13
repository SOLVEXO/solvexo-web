import { createContext, useContext } from 'react';
import type { BrowseSort } from '@/features/storefront/browse/browseState';

const GRID_SORTS: readonly string[] = ['newest', 'oldest', 'title_asc', 'title_desc', 'price_asc', 'price_desc', 'best_rated', 'best_selling', 'trending'];

/** The collection currently being browsed can set how its own products are ordered until the shopper picks a sort.
 *  Provided by each theme's Collection page; read by the product grid section on it. */
export const CollectionDefaultSortContext = createContext<string | undefined>(undefined);

export function useCollectionDefaultSort(): string | undefined {
  return useContext(CollectionDefaultSortContext);
}

/** The collection's own sort wins unless it is 'manual' (= "no preference"), in which case the section's setting stays in charge. */
export function gridSortFor(collectionSort: string | undefined, sectionSort?: string): BrowseSort | undefined {
  const pick = collectionSort && collectionSort !== 'manual' ? collectionSort : sectionSort;
  return pick && GRID_SORTS.includes(pick) ? (pick as BrowseSort) : undefined;
}
