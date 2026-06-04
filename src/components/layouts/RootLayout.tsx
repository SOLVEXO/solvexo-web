import { Outlet } from 'react-router-dom';
import { ReferenceNav } from './ReferenceNav';

export function RootLayout() {
  return (
    <>
      <ReferenceNav />
      <div style={{ paddingTop: 44 }}>
        <Outlet />
      </div>
    </>
  );
}
