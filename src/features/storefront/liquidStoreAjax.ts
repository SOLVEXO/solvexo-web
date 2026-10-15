import type { PublicStoreProduct } from '@/api/services/store';

/**
 * Shapes a Solvexo product like one entry of Shopify's predictive-search JSON (`/search/suggest.json`), so a
 * theme's own search-as-you-type dropdown (written against that API) renders without modification. Only the
 * fields real theme JS commonly reads are filled in; anything Shopify-specific with no Solvexo equivalent
 * (article/page/query suggestions) is left out rather than faked.
 */
export function toShopifySearchSuggestion(product: PublicStoreProduct, currency: string) {
  const price = product.defaultVariantPrice ?? 0;
  const image = product.images?.[0] ?? null;
  return {
    title: product.name,
    url: `/products/${product.slug}`,
    image,
    featured_image: image ? { url: image } : null,
    price: Math.round(price * 100),
    price_min: Math.round(price * 100),
    compare_at_price: product.compareAtPrice != null ? Math.round(product.compareAtPrice * 100) : null,
    available: product.inStock ?? true,
    currency,
  };
}

export function toShopifySearchJson(products: PublicStoreProduct[], currency: string) {
  return { resources: { results: { products: products.map((product) => toShopifySearchSuggestion(product, currency)) } } };
}
