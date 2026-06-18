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
      <div style={{ paddingTop: 44 }}>
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </div>
    </>
  );
}
