import { createContext } from 'react';

/** Which collection the page is showing, handed to the `collection_product_grid` section. */
export const CollectionScopeContext = createContext<{ collectionId?: string; onProducts?: (products: { slug: string; name: string; images?: string[] }[]) => void } | null>(null);
