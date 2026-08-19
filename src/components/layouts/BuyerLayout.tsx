import { Outlet } from 'react-router-dom';
import { AnnouncementBanner, AppOpenPrompt, AppOpenFab } from '@/components/comman/ui';

// ── BuyerLayout ───────────────────────────────────────────────────────────────
// Thin shell for buyer-facing pages. Used to also render a fixed mobile
// bottom-nav (Shop/Cart/Orders/Account tabs) + a guest sign-in bar above it —
// both were built for marketplace browsing, which no longer has a
// buyer-facing entry point on the apex domain (a buyer only ever shops a
// seller's own storefront subdomain now), so both were removed outright
// rather than left dead in the tree (TypeScript's `noUnusedLocals` doesn't
// allow an unused top-level component to just sit there unlinked, unlike a
// route/page which stays reachable by direct URL).
export function BuyerLayout() {
  return (
    <>
      <AnnouncementBanner audience="buyers" />
      <Outlet />
      <AppOpenPrompt />
      <AppOpenFab />
    </>
  );
}
