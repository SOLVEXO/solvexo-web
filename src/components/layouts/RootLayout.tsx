import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import { ReferenceNav } from './ReferenceNav';
import { ErrorBoundary } from '@/components/comman/ErrorBoundary';
import { scrollRootRef } from '@/utils/scrollRoot';
import { AuthGateModal } from '@/components/comman/ui/AuthGateModal';
import { ToastContainer } from '@/components/comman/ui/ToastContainer';

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
    scrollRootRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <TopProgressBar />
      <AuthGateModal />
      <ToastContainer />
      <ReferenceNav />
      {/* `fixed ... top-[44px] bottom-0` (not paddingTop + height:100vh) so this
          wrapper IS the scroll container, confined to the area below the fixed
          44px ReferenceNav — the previous approach had no overflow container of
          its own, so tall pages fell back to scrolling the whole document, and
          the native scrollbar then spanned the full viewport behind the fixed
          top bar instead of starting under it. Anything that used to read
          window.scrollY / call window.scrollTo now goes through scrollRootRef
          (see utils/scrollRoot.ts) instead, since window itself no longer scrolls. */}
      <div
        ref={el => { scrollRootRef.current = el; }}
        className={`fixed inset-x-0 bottom-0 overflow-y-auto ${import.meta.env.DEV ? 'top-[44px]' : 'top-0'}`}
      >
        {/* keyed by pathname so navigating to a new route always remounts past a caught error */}
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}
