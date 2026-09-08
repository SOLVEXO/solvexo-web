import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import { SkeletonBox } from '@/components/comman/ui';

// Replaces the old cross-store "seller dashboard" (`/seller/stores` — a grid
// of every store — plus cross-store `/seller/analytics` and
// `/seller/settings`) — explicitly not wanted any more: a seller logging in
// already lands directly on their own active store's dashboard (see
// sellerRouting.ts's resolveSellerDestination, used by login/OTP-verify/
// social-login), and switches between stores from right there via the
// StoreSwitcher dropdown (already wired into both SellerLayout and
// StoreLayout) — there's no reason a separate landing page needs to exist
// too. This is what every one of those old URLs now resolves through
// instead, using the exact same resolver login already trusts, so a
// bookmarked/shared old link still lands somewhere real instead of 404ing.
export function SellerAreaRedirect() {
  const [dest, setDest] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveSellerDestinationRemote().then(d => { if (!cancelled) setDest(d); });
    return () => { cancelled = true; };
  }, []);

  if (!dest) return <div className="p-7"><SkeletonBox height={200} rounded="12px" /></div>;
  return <Navigate to={dest} replace />;
}
