import { Outlet } from 'react-router-dom';
import { PublicMegaNavbar } from '@/components/comman/ui/PublicMegaNavbar';
import { BrandSplash } from '@/components/comman/motion/BrandSplash';
import { Cursor } from '@/components/comman/motion/Cursor';

// Public marketing/product/solutions pages share one navigation system —
// PublicMegaNavbar's Products/Solutions/Resources mega-menus — instead of
// BuyerNavbar's flat centerLinks (which had no room for the expanded public
// site's information architecture). The custom cursor is scoped here too —
// desktop marketing pages only, never the buyer/seller/admin app.
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <BrandSplash />
      <Cursor />
      <PublicMegaNavbar />
      <main><Outlet /></main>
    </div>
  );
}
