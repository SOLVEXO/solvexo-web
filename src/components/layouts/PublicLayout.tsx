import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicMegaNavbar, isDarkHeroRoute } from '@/components/comman/ui/PublicMegaNavbar';
import { BrandSplash, willShowBrandSplash } from '@/components/comman/motion/BrandSplash';
import { BrandSplashReadyProvider } from '@/components/comman/motion/BrandSplashContext';
import { Cursor } from '@/components/comman/motion/Cursor';
import { clsx } from 'clsx';

// Public marketing/product/solutions pages share one navigation system —
// PublicMegaNavbar's Products/Solutions/Resources mega-menus — instead of
// BuyerNavbar's flat centerLinks (which had no room for the expanded public
// site's information architecture). The custom cursor is scoped here too —
// desktop marketing pages only, never the buyer/seller/admin app.
export function PublicLayout() {
  // Real bug this fixes: BrandSplash and the page underneath it (e.g.
  // Homepage's hero) used to mount at the same time, so a mount-triggered
  // entrance animation finished invisibly behind the splash overlay — the
  // splash lifted onto an already-settled, static hero. `splashReady`
  // starts correctly `true`/`false` from the very first render (same
  // synchronous check BrandSplash itself uses) and only flips true once the
  // splash has actually finished, via `onDone` below.
  const [splashReady, setSplashReady] = useState(() => !willShowBrandSplash());
  const { pathname } = useLocation();
  // PublicMegaNavbar is `fixed`, not `sticky`, so it no longer reserves its
  // own space in flow — every route needs that space compensated with real
  // padding, except the dark-hero routes (see DARK_HERO_ROUTES), whose hero
  // is deliberately full-bleed to y:0 so the transparent-over-hero header
  // has something to float over.
  const overDarkHero = isDarkHeroRoute(pathname);

  return (
    <div className="min-h-screen bg-white">
      <BrandSplash onDone={() => setSplashReady(true)} />
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
      <main className={clsx(!overDarkHero && 'pt-[76px]')}>
        <Suspense fallback={null}>
          <BrandSplashReadyProvider value={splashReady}>
            <Outlet />
          </BrandSplashReadyProvider>
        </Suspense>
      </main>
    </div>
  );
}
