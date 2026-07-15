import { apiGetMyStores, type MyStoreItem, type MyStoresSummary } from '@/api/services/store';
import { createSharedResource } from '@/hooks/createSharedResource';

interface MyStoresData {
  stores:  MyStoreItem[];
  summary: MyStoresSummary;
}

const EMPTY_SUMMARY: MyStoresSummary = { storeCount: 0, totalProducts: 0, totalRevenueUSD: 0 };

// Shared across every component that calls useMyStores() — SellerDashboard,
// SellerStoreList, and ActiveStoreContext all need "my stores" and previously
// each fired an independent request for the same data on every mount.
const myStoresResource = createSharedResource<MyStoresData>(() =>
  apiGetMyStores().then(res => ({ stores: res.data ?? [], summary: res.summary ?? EMPTY_SUMMARY })),
);

export const invalidateMyStoresCache = myStoresResource.invalidate;

export function useMyStores() {
  const { data, loading, error, refetch } = myStoresResource.useSharedResource();
  return { stores: data?.stores ?? [], summary: data?.summary ?? EMPTY_SUMMARY, loading, error, refetch };
}
