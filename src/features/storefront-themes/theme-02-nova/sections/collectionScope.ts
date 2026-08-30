import { createContext, useContext } from 'react';

/** Lets the contextual `collection_product_grid` section (always "whichever
 *  collection is currently being browsed") know which real collection that
 *  is — `NovaCollectionPage` is the only real provider of this. Byte-for-byte
 *  the same contract as `theme-01-atelier/sections/collectionScope.ts`, kept
 *  as its own file per this theme system's "no theme reaches into another
 *  theme's folder" convention. Absent everywhere else (Home, Product), where
 *  that section type is never actually placed. */
const NovaCollectionScope = createContext<string | null>(null);

export const NovaCollectionScopeProvider = NovaCollectionScope.Provider;

export function useNovaCollectionScope(): string | null {
  return useContext(NovaCollectionScope);
}
