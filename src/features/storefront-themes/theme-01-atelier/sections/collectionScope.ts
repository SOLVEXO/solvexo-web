import { createContext, useContext } from 'react';

/** Lets the contextual `collection_product_grid` section (always "whichever
 *  collection is currently being browsed") know which real collection that
 *  is — `AtelierCollectionPage` is the only real provider of this. Absent
 *  everywhere else (Home, Product, Pages), where that section type is never
 *  actually placed. */
const AtelierCollectionScope = createContext<string | null>(null);

export const AtelierCollectionScopeProvider = AtelierCollectionScope.Provider;

export function useAtelierCollectionScope(): string | null {
  return useContext(AtelierCollectionScope);
}
