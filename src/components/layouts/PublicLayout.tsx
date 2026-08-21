import { Suspense } from 'react';
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
      {/* A local Suspense boundary around just the page content (same
         reasoning as AccountLayout/StoreLayout/etc.'s own content
         boundaries): without this, the first-visit-this-session load of any
         one of these lazy-loaded pages bubbles up to RootLayout's outer
         Suspense and blanks out the ENTIRE screen — navbar included — behind
         its big spinner. Keeping the navbar outside this boundary means
         navigating Home → Pricing → FAQ etc. never loses it, and no
         fallback markup is rendered (TopProgressBar already signals
         "loading" via its thin bar) instead of flashing a second, heavier
         loading treatment on top of that. */}
      <main><Suspense fallback={null}><Outlet /></Suspense></main>
    </div>
  );
}
