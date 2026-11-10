import { apiGetMyStores, type MyStoreItem } from '@/api/services/store';
import { isPlanUsable, readRecentStoreIds } from '@/utils/storePlanState';

/** Where an authenticated seller actually belongs, based on their REAL
 *  backend store state — never a hardcoded "/onboard". Used by OTP-verify,
 *  login, and the "Sell on Solvexo" entry handler so a seller is never sent
 *  through onboarding they've already completed, and never dumped on a
 *  dashboard when they haven't finished setup.
 *
 *  There is no separate cross-store "seller dashboard" any more — onboarding
 *  now activates the store immediately once the Payment step is done (see
 *  StoreService.createStore's `selfServeActivation`), so a seller lands
 *  directly on THAT store's own dashboard, never an intermediate page.
 *
 *  Every store has its OWN plan, so a store whose trial ended (or that is
 *  locked) is skipped as a landing page while another store can be worked in.
 *
 *  Rules (deliberately simple/deterministic — this only decides where the
 *  seller LANDS, it doesn't replace the route guards that protect each
 *  destination):
 *  - No stores yet                          → /onboard (create the first one)
 *  - The store used last (this browser) that is active and has a usable plan
 *                                           → that store's dashboard
 *  - Else the first active store with a usable plan
 *                                           → that store's dashboard
 *  - Exactly one store, still
 *    `pending`/`rejected` (legacy —         → straight to that store's verification
 *    pre-dates self-serve activation)        page (resubmit / awaiting review)
 *  - Else the first store with a usable plan → its dashboard
 *  - Else (every store needs a plan)        → the last-used (or first) store: its
 *                                             plan gate opens, with a store switcher
 */
export function resolveSellerDestination(stores: MyStoreItem[], recentIds: string[] = readRecentStoreIds()): string {
  if (stores.length === 0) return '/onboard';
  const dash = (s: MyStoreItem) => `/store/${s._id}/dashboard`;

  const workable = stores.filter(s => s.status === 'active' && isPlanUsable(s.planStatus));
  const lastUsed = recentIds.map(id => workable.find(s => s._id === id)).find(Boolean);
  if (lastUsed) return dash(lastUsed);
  if (workable[0]) return dash(workable[0]);

  if (stores.length === 1) {
    const only = stores[0];
    if (only.status === 'pending' || only.status === 'rejected') {
      return `/store/${only._id}/verification`;
    }
  }

  const usableAny = stores.find(s => isPlanUsable(s.planStatus));
  if (usableAny) return dash(usableAny);

  const lastUsedAny = recentIds.map(id => stores.find(s => s._id === id)).find(Boolean);
  return dash(lastUsedAny ?? stores[0]);
}

/** Fetches the seller's own stores and resolves the destination in one call
 *  — the network failure fallback is `/onboard`, since a seller with no
 *  reachable store list has nowhere else safe to land. */
export async function resolveSellerDestinationRemote(): Promise<string> {
  try {
    const res = await apiGetMyStores();
    return resolveSellerDestination(res.data ?? []);
  } catch {
    return '/onboard';
  }
}
