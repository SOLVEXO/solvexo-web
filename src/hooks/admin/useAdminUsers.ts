import { useCallback, useState } from 'react';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import {
  apiGetAdminUsersStats,
  apiListAdminUsers,
  apiGetAdminSeller,
  apiSuspendAccount,
  apiUnsuspendAccount,
  apiSuspendStore,
  apiUnsuspendStore,
  apiGetStoreCustomers,
  apiBlockStoreCustomer,
  apiUnblockStoreCustomer,
  type AccountRole,
  type AdminUsersQuery,
  type StoreCustomersQuery,
} from '@/api/services/users/adminUsers';

export function useAdminUsersStats() {
  return useAnalyticsQuery(() => apiGetAdminUsersStats(), {});
}

export function useAdminUsersList(query: AdminUsersQuery) {
  return useAnalyticsQuery(apiListAdminUsers, query);
}

/** A seller's own account + their stores — only ever mounted while a seller
 *  is actually being viewed (see AdminUsers.tsx), so there's no "skip"
 *  concept to build here. */
export function useAdminSellerDetail(sellerId: string) {
  return useAnalyticsQuery((p: { sellerId: string }) => apiGetAdminSeller(p.sellerId), { sellerId });
}

/** One store's customers (buyers) — the per-store list a real per-store
 *  admin (Shopify) shows, since a buyer has no platform-wide profile of its
 *  own. Only ever mounted while a specific store's customer list is open. */
export function useStoreCustomers(storeId: string, query: StoreCustomersQuery) {
  return useAnalyticsQuery(
    (p: { storeId: string } & StoreCustomersQuery) => apiGetStoreCustomers(p.storeId, p),
    { storeId, ...query },
  );
}

/** Whole-account suspend/unsuspend — role:'seller' cascades to every store
 *  they own; role:'buyer' is the platform-wide ban. */
export function useAdminUserActions() {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const suspend = useCallback(async (role: AccountRole, id: string) => {
    setProcessingId(id);
    setError('');
    try {
      await apiSuspendAccount(role, id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend account.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const unsuspend = useCallback(async (role: AccountRole, id: string) => {
    setProcessingId(id);
    setError('');
    try {
      await apiUnsuspendAccount(role, id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsuspend account.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  return { suspend, unsuspend, processingId, error };
}

/** Single-store suspend/unsuspend — independent of the seller account and
 *  their other stores (see AdminUsersService.suspendStore's doc comment). */
export function useAdminStoreActions() {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const suspendStore = useCallback(async (storeId: string) => {
    setProcessingId(storeId);
    setError('');
    try {
      await apiSuspendStore(storeId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend store.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const unsuspendStore = useCallback(async (storeId: string) => {
    setProcessingId(storeId);
    setError('');
    try {
      await apiUnsuspendStore(storeId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsuspend store.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  return { suspendStore, unsuspendStore, processingId, error };
}

/** Block/unblock one buyer from checking out at ONE store only — lighter
 *  than the platform-wide ban (useAdminUserActions.suspend('buyer', id)). */
export function useStoreCustomerActions() {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const block = useCallback(async (storeId: string, buyerId: string) => {
    setProcessingId(buyerId);
    setError('');
    try {
      await apiBlockStoreCustomer(storeId, buyerId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block customer.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const unblock = useCallback(async (storeId: string, buyerId: string) => {
    setProcessingId(buyerId);
    setError('');
    try {
      await apiUnblockStoreCustomer(storeId, buyerId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock customer.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  return { block, unblock, processingId, error };
}
