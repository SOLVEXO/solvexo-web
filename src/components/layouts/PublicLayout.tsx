import { Outlet } from 'react-router-dom';
import { PublicMegaNavbar } from '@/components/comman/ui/PublicMegaNavbar';
import { BrandSplash } from '@/components/comman/motion/BrandSplash';

// Public marketing/product/solutions pages share one navigation system —
// PublicMegaNavbar's Products/Solutions/Resources mega-menus — instead of
// BuyerNavbar's flat centerLinks (which had no room for the expanded public
// site's information architecture).
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <BrandSplash />
      <PublicMegaNavbar />
      <main><Outlet /></main>
    </div>
  );
}
