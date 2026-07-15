import { apiGetStoreInventory } from '@/api/services/product';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

/** Lightweight product list for AI Studio's product-picker dropdowns — reuses the existing inventory endpoint. */
export function useStoreProductPicker(storeId: string) {
  const { data, loading, error } = useAnalyticsQuery(
    (p: { storeId: string }) => apiGetStoreInventory(p.storeId, 1, 100),
    { storeId },
  );
  return { products: data?.products ?? [], loading, error };
}
