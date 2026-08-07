import { Outlet } from 'react-router-dom';
import { BuyerNavbar } from '@/components/comman/ui/BuyerNavbar';

// ─────────────────────────────────────────────────────────────────────────────
// Marketing/discovery links — centered in the real BuyerNavbar itself (see
// `centerLinks` prop) instead of a separate strip underneath it, so this page
// reads as one continuous marketplace product with one navigation bar.
// ─────────────────────────────────────────────────────────────────────────────
const CENTER_LINKS = [
  { label: 'Marketplace',    path: '/marketplace' },
  { label: 'Education',      path: '/EducationMarketplace' },
  { label: 'Pricing',        path: '/pricing' },
  { label: 'Become a Seller', path: '/sellers' },
  {
    label: 'Resources', path: '/faq',
    children: [
      { label: 'FAQ',              path: '/faq' },
      { label: 'Contact Us',       path: '/contact-us' },
      { label: 'Privacy Policy',   path: '/privacy-policy' },
      { label: 'Terms of Service', path: '/terms-of-service' },
      { label: 'Cookie Policy',    path: '/cookie-policy' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PublicLayout — the real marketplace header (search, wishlist, cart, account)
// with marketing/discovery links centered in it. BottomNav is provided by
// BuyerLayout.
// ─────────────────────────────────────────────────────────────────────────────
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <BuyerNavbar centerLinks={CENTER_LINKS} hideSearch />
      <main><Outlet /></main>
    </div>
  );
}
