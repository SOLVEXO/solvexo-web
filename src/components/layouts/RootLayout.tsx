import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import { ReferenceNav } from './ReferenceNav';
import { ErrorBoundary } from '@/components/comman/ErrorBoundary';
import { scrollRootRef, scrollRootToTop, lenisRef } from '@/utils/scrollRoot';
import { SmoothScroll } from '@/components/comman/motion/SmoothScroll';
import { AuthGateModal } from '@/components/comman/ui/AuthGateModal';
import { ToastContainer } from '@/components/comman/ui/ToastContainer';
import { GoogleOneTapPrompt } from '@/components/comman/ui/GoogleOneTapPrompt';

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[55vh]">
      <div className="w-5 h-5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
    </div>
  );
}

// Thin top bar shown while React Router is loading a route (e.g. fetching a
// lazy page's chunk) — keeps the previous page on screen instead of swapping
// it for a centered spinner, so navigation feels continuous rather than blocked.
function TopProgressBar() {
  const navigation = useNavigation();
  if (navigation.state === 'idle') return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent overflow-hidden">
      <div className="h-full w-1/3 bg-brand-orange animate-[top-progress_1s_ease-in-out_infinite]" />
    </div>
  );
}

export function RootLayout() {
  const { pathname } = useLocation();

  // `window` never scrolls in this app (see the div below) and nothing
  // resets *its* scroll position on navigation either — so the scroll
  // container kept whatever offset the previous page was left at, and the
  // next page rendered already scrolled down by that same amount. From a
  // product-search result that could genuinely land you on the new page's
  // footer instead of its top, looking like navigation went to the wrong
  // place entirely.
  useEffect(() => {
    scrollRootToTop();
    // The outgoing page's DOM is swapped for the new one on every
    // navigation (ErrorBoundary above the scroll container is keyed by
    // pathname), which can change the container's scrollHeight without
    // Lenis's own resize-observer necessarily catching it (that observer
    // watches the container's own box, which has a fixed height and never
    // fires from a child's height changing) — force a remeasure so its
    // scroll bounds match the page that just mounted. A second pass one
    // frame later covers the common case where the new page's layout
    // settles slightly after paint (async images, lazy chunks still
    // resolving behind Suspense).
    lenisRef.current?.resize();
    const raf = requestAnimationFrame(() => lenisRef.current?.resize());
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return (
    <>
      <TopProgressBar />
      <AuthGateModal />
      <ToastContainer />
      <GoogleOneTapPrompt />
      <ReferenceNav />
      {/* Eases wheel/touch input on the scroll container below instead of
         jumping the raw delta — the same Lenis smooth-scroll layer the
         reference design runs site-wide. Mounted once here so it wraps
         every route, same as the container itself. */}
      <SmoothScroll />
      {/* `fixed ... top-0 bottom-0` (not paddingTop + height:100vh) so this
          wrapper IS the scroll container — the previous approach had no
          overflow container of its own, so tall pages fell back to
          scrolling the whole document, and the native scrollbar then
          spanned the full viewport behind the fixed top bar instead of
          starting under it. Anything that used to read window.scrollY /
          call window.scrollTo now goes through scrollRootRef (see
          utils/scrollRoot.ts) instead, since window itself no longer
          scrolls. ReferenceNav is disabled (see ReferenceNav.tsx), so this
          no longer reserves a dev-only 44px strip for it either — that
          empty space at the top was a leftover once the bar was turned off. */}
      <div
        ref={el => { scrollRootRef.current = el; }}
        className="fixed inset-x-0 top-0 bottom-0 overflow-y-auto"
      >
        {/* `resetKey` (not `key`) — clears a caught error on navigation without
            force-remounting this boundary's whole subtree (and every
            persistent nested layout inside it, e.g. StoreLayout/SellerLayout/
            AdminLayout's own sidebar) on every single navigation. A `key`
            here was a real, previously-unnoticed bug: it tore down and
            rebuilt the sidebar chrome of every dashboard on EVERY page
            change, not just after an actual error. */}
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}
