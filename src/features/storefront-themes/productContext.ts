import { createContext, useContext } from 'react';

/** The product the shopper is looking at — provided by each theme's product page so sections placed on the product
 *  template (e.g. "Related products") know which product they belong to. */
export interface ProductPageValue {
  productId: string;
  categoryId: string | null;
}

export const ProductPageContext = createContext<ProductPageValue | null>(null);

export function useProductPage(): ProductPageValue | null {
  return useContext(ProductPageContext);
}
