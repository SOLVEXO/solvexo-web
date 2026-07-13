import { apiGetMyStores, type MyStoreItem } from '@/api/services/store';
import { createSharedResource } from '@/hooks/createSharedResource';

// Shared across every component that calls useMyStores() — SellerDashboard,
// SellerStoreList, and ActiveStoreContext all need "my stores" and previously
// each fired an independent request for the same data on every mount.
const myStoresResource = createSharedResource<MyStoreItem[]>(() =>
  apiGetMyStores().then(res => {
    // Handle both { success, data } wrapper and direct array
    return (res as { data?: MyStoreItem[] }).data ?? (res as unknown as MyStoreItem[]);
  }),
);

export const invalidateMyStoresCache = myStoresResource.invalidate;

export function useMyStores() {
  const { data, loading, error, refetch } = myStoresResource.useSharedResource();
  return { stores: data ?? [], loading, error, refetch };
}
