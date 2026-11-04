import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getPlatformHostPrefix, isPlatformApexHost, platformOrigin } from '@/utils/storefrontUrl';

/**
 * Which part of the platform this host serves:
 *  - `seller`      seller.solvexo.store      seller + staff panel, login, onboarding
 *  - `superadmin`  superadmin.solvexo.store  Solvexo owner + admin team (paths have NO `/admin` prefix)
 *  - `apex`        solvexo.store / www       marketing site
 *  - `any`         localhost, preview hosts  everything works at its old path (no redirects)
 */
export type HostMode = 'seller' | 'superadmin' | 'apex' | 'any';

export function hostMode(): HostMode {
  const prefix = getPlatformHostPrefix();
  if (prefix === 'seller') return 'seller';
  if (prefix === 'superadmin') return 'superadmin';
  return isPlatformApexHost() ? 'apex' : 'any';
}

const SELLER_PATHS = /^\/(login|register|signup|onboard|forgot-password|verify-otp|new-password|staff-login|staff-invite|staff-forgot-password|staff-reset-password|seller|store)(\/|$)/;
const ADMIN_PATHS = /^\/(admin|admin-invite|admin-reset-password)(\/|$)/;
const SHARED_PATHS = /^\/(maintenance|pay-invoice|theme-preview|access-denied)(\/|$)/;
// Seller-only paths that must not be served on the superadmin host (`/login` and `/forgot-password` are the admin's own there).
const SELLER_ONLY_ON_SUPERADMIN = /^\/(register|signup|onboard|verify-otp|new-password|staff-login|staff-invite|staff-forgot-password|staff-reset-password|seller|store)(\/|$)/;

/** `/admin/clients` -> `/clients`, `/admin` -> `/` (superadmin host paths carry no `/admin` prefix). */
export function stripAdminPrefix(path: string): string {
  const rest = path.replace(/^\/admin(?=\/|$)/, '');
  return rest || '/';
}

/** The path as the admin screens know it (`/admin/...`), whatever host they run on. */
export function useAdminPathname(): string {
  const { pathname } = useLocation();
  if (hostMode() !== 'superadmin') return pathname;
  return pathname === '/' ? '/admin' : `/admin${pathname}`;
}

function ExternalRedirect({ url }: { url: string }) {
  useEffect(() => { window.location.replace(url); }, [url]);
  return null;
}

/** On the superadmin host an old `/admin/...` link lands on the same screen without the prefix. */
export function StripAdminPrefix() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`${stripAdminPrefix(pathname)}${search}${hash}`} replace />;
}

/**
 * Sends a visitor to the host that owns the page they opened (old `www.solvexo.store/store/...` bookmarks,
 * marketing links to /login, ...). Wraps the router outlet; renders nothing while the browser leaves.
 */
export function PlatformHostGuard({ children }: { children: ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const mode = hostMode();
  if (mode === 'any') return <>{children}</>;
  const tail = `${search}${hash}`;
  const toSeller = () => `${platformOrigin('seller')}${pathname}${tail}`;
  const toAdmin = () => `${platformOrigin('superadmin')}${stripAdminPrefix(pathname)}${tail}`;

  if (mode === 'apex') {
    if (ADMIN_PATHS.test(pathname)) return <ExternalRedirect url={toAdmin()} />;
    if (SELLER_PATHS.test(pathname)) return <ExternalRedirect url={toSeller()} />;
  } else if (mode === 'seller') {
    if (ADMIN_PATHS.test(pathname)) return <ExternalRedirect url={toAdmin()} />;
    if (pathname === '/') return <Navigate to="/login" replace />;
    if (!SELLER_PATHS.test(pathname) && !SHARED_PATHS.test(pathname)) {
      return <ExternalRedirect url={`${platformOrigin('www')}${pathname}${tail}`} />;
    }
  } else if (SELLER_ONLY_ON_SUPERADMIN.test(pathname)) {
    return <ExternalRedirect url={toSeller()} />;
  }
  return <>{children}</>;
}
