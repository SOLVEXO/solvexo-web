import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ReferenceNav } from './ReferenceNav';

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[55vh]">
      <div className="w-5 h-5 rounded-full border-2 border-[#D97757] border-t-transparent animate-spin" />
    </div>
  );
}

export function RootLayout() {
  return (
    <>
      <ReferenceNav />
      {/* height is explicit (not just paddingTop) so full-viewport child pages can
          size themselves with h-full instead of an independent calc(100vh - 44px),
          which produced a 1px scrollbar mismatch at some browser zoom levels */}
      <div style={{ paddingTop: 44, height: '100vh' }}>
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </div>
    </>
  );
}
