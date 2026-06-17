import type { StoreProduct, ProductVariant } from '@/api/commerce/product';

export interface ProductEntry {
  product: StoreProduct;
  variant:  ProductVariant;
}

// Module-level in-memory cache keyed by storeId
const cache = new Map<string, ProductEntry[]>();

export function getCachedProducts(storeId: string): ProductEntry[] {
  return cache.get(storeId) ?? [];
}

export function addCachedProduct(storeId: string, entry: ProductEntry): void {
  cache.set(storeId, [...(cache.get(storeId) ?? []), entry]);
}

export function updateCachedProduct(storeId: string, productId: string, entry: ProductEntry): void {
  const list = cache.get(storeId) ?? [];
  cache.set(storeId, list.map(e => e.product._id === productId ? entry : e));
}
