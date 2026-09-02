import { useNavigate } from 'react-router-dom';
import { TokenStorage, apiLogout } from '@/api/services/auth';
import { useToast } from '@/contexts/ToastContext';
import { invalidateProfileCache } from '@/hooks/auth/useGetProfile';
import { invalidateMyStoresCache } from '@/hooks/store/useMyStores';

/** Shared by ProfileAvatar and the Seller/Store/Admin dashboard sidebars. */
export function useLogout() {
  const navigate = useNavigate();
  const toast = useToast();

  // Admin has its own login route, so its sidebar passes '/admin/login'
  // instead of the default '/' (public homepage) that buyer/seller land on.
  return async (redirectTo: string = '/') => {
    try { await apiLogout(); } catch { /* best-effort — clear local session regardless */ }
    TokenStorage.clear();
    // Wipes both the in-memory AND localStorage-persisted "my profile"/"my
    // stores" caches (see createSharedResource's storageKey) — without
    // this, a different account signing in on the same browser would
    // briefly flash the PREVIOUS user's name/avatar/stores on next load,
    // right up until the real fetch for the new session resolves.
    invalidateProfileCache();
    invalidateMyStoresCache();
    // Per-store cache (StoreLayout.tsx's readCachedStore) is keyed by
    // storeId, not one fixed key — clear every one of them the same way,
    // so a different account never briefly sees a store that isn't theirs.
    try {
      Object.keys(window.localStorage)
        .filter(k => k.startsWith('solvexo:store:'))
        .forEach(k => window.localStorage.removeItem(k));
    } catch { /* non-critical */ }
    toast.success('Logged out');
    navigate(redirectTo);
    // Give the toast a beat to actually paint before the reload wipes it.
    setTimeout(() => window.location.reload(), 400);
  };
}
