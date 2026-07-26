import { Suspense } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import { ReferenceNav } from './ReferenceNav';
import { ErrorBoundary } from '@/components/comman/ErrorBoundary';

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[55vh]">
      <div className="w-5 h-5 rounded-full border-2 border-[#D97757] border-t-transparent animate-spin" />
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
      <div className="h-full w-1/3 bg-[#D97757] animate-[top-progress_1s_ease-in-out_infinite]" />
    </div>
  );
}

export function RootLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <TopProgressBar />
      <ReferenceNav />
      {/* height is explicit (not just paddingTop) so full-viewport child pages can
          size themselves with h-full instead of an independent calc(100vh - 44px),
          which produced a 1px scrollbar mismatch at some browser zoom levels */}
      <div style={{ paddingTop: 44, height: '100vh' }}>
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
