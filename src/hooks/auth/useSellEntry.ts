import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TokenStorage, type AppRole } from '@/api/services/auth';

/** The one handler every "Sell on Solvexo" / "Start Selling" CTA in the app
 *  should call — never a raw `navigate('/onboard')`. Deliberately instant —
 *  no network call, no loading state — every public-page marketing button
 *  must respond the moment it's clicked:
 *  - Not logged in           → straight to seller registration, role
 *    pre-selected (the CTA itself IS the role choice — never ask again).
 *  - Logged in as buyer      → same seller-registration destination. This
 *    creates/logs into a separate seller account (Solvexo's seller/buyer
 *    accounts are already independent per-email documents) without ever
 *    touching the buyer session/account that's currently active.
 *  - Logged in as seller     → `/seller/stores` (their real store list) —
 *    NOT `resolveSellerDestinationRemote()`, which needs an API round-trip
 *    and used to show a spinner right on this button while it resolved.
 *    Login/OTP-verify still use that smarter resolver directly (see
 *    `sellerRouting.ts`) since those flows already show their own loading
 *    state for the real auth call — this is only the marketing-CTA entry
 *    point, where speed matters more than landing one click closer.
 *  - Logged in as admin (edge case) → same as buyer, falls through to
 *    seller registration; there's no legitimate "admin becomes seller"
 *    product flow to special-case here. */
export function useSellEntry() {
  const navigate = useNavigate();

  const go = useCallback(() => {
    const user = TokenStorage.getUser<{ role?: AppRole }>();
    const role = user?.role;

    if (!TokenStorage.isLoggedIn() || role !== 'seller') {
      navigate('/register?role=seller');
      return;
    }

    navigate('/seller/stores');
  }, [navigate]);

  return { go, loading: false };
}
