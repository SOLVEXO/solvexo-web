import { apiGetMyStores, type MyStoreItem } from '@/api/services/store';

/** Where an authenticated seller actually belongs, based on their REAL
 *  backend store state — never a hardcoded "/onboard". Used by OTP-verify,
 *  login, and the "Sell on Solvexo" entry handler so a seller is never sent
 *  through onboarding/verification they've already completed, and never
 *  dumped on a dashboard when they haven't finished setup.
 *
 *  Rules (deliberately simple/deterministic — this only decides where the
 *  seller LANDS, it doesn't replace the route guards that protect each
 *  destination):
 *  - No stores yet                                → /onboard (create the first one)
 *  - Any store is `active`                        → /seller/dashboard (they have a live store)
 *  - Exactly one store, still `pending`/`rejected` → straight to that store's
 *    verification page (covers both "hasn't submitted yet" and "resubmit
 *    after rejection" — the verification page itself renders the right
 *    sub-state from its own data)
 *  - Anything else (e.g. `under_review`, or multiple non-active stores)     → /seller/dashboard
 */
export function resolveSellerDestination(stores: MyStoreItem[]): string {
  if (stores.length === 0) return '/onboard';

  const active = stores.find(s => s.status === 'active');
  if (active) return '/seller/dashboard';

  if (stores.length === 1) {
    const only = stores[0];
    if (only.status === 'pending' || only.status === 'rejected') {
      return `/seller/store/${only._id}/verification`;
    }
  }

  return '/seller/dashboard';
}

/** Fetches the seller's own stores and resolves the destination in one call
 *  — the network failure fallback is `/seller/dashboard` (never a hard
 *  crash, never `/onboard` by default, since blindly assuming "no store" on
 *  a failed request could re-trigger onboarding for a seller who already
 *  has one). */
export async function resolveSellerDestinationRemote(): Promise<string> {
  try {
    const res = await apiGetMyStores();
    return resolveSellerDestination(res.data ?? []);
  } catch {
    return '/seller/dashboard';
  }
}
