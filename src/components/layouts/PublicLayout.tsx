import { Outlet } from 'react-router-dom';
import { BuyerNavbar } from '@/components/comman/ui/BuyerNavbar';
import { useSellEntry } from '@/hooks/auth/useSellEntry';

// ─────────────────────────────────────────────────────────────────────────────
// Marketing/discovery links — centered in the real BuyerNavbar itself (see
// `centerLinks` prop) instead of a separate strip underneath it, so this page
// reads as one continuous marketplace product with one navigation bar.
// ─────────────────────────────────────────────────────────────────────────────
export function PublicLayout() {
  const sellEntry = useSellEntry();

  // "Become a Seller" routes through the same entry handler as every other
  // "Start Selling" button on this page (login/register → onboarding/store
  // dashboard, whichever applies) — never a plain link to the static
  // /sellers info page, same as the navbar's own "Start Selling" button.
  const centerLinks = [
    { label: 'Marketplace',     path: '/marketplace' },
    { label: 'Education',       path: '/education' },
    { label: 'Pricing',         path: '/pricing' },
    { label: 'Become a Seller', path: '/sellers', onClick: sellEntry.go },
  ];

  return (
    <div className="min-h-screen bg-white">
      <BuyerNavbar centerLinks={centerLinks} hideSearch hideCommerce />
      <main><Outlet /></main>
    </div>
  );
}
