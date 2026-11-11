import { apiGetStoreInventory } from '@/api/services/product';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

/** Lightweight product list for product-picker dropdowns (for example the AI SEO tab) — reuses the existing inventory endpoint. */
export function useStoreProductPicker(storeId: string) {
  const { data, loading, error } = useAnalyticsQuery(
    (p: { storeId: string }) => apiGetStoreInventory(p.storeId, 1, 100),
    { storeId },
  );
  return { products: data?.products ?? [], loading, error };
}
