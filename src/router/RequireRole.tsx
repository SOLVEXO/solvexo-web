import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { TokenStorage, type AppRole } from '@/api/services/auth';

interface RequireRoleProps {
  role: AppRole;
  children: ReactNode;
}

/**
 * Client-side role gate. No route in this app is currently guarded on the frontend —
 * enforcement today is backend-only (401/403 from the API) plus a login-time role
 * redirect (see `getRoleRedirect`). This component adds a real client-side check for
 * the Admin Analytics route specifically; broadening it to every `/admin/*` and
 * `/seller/*` route is a good follow-up but out of scope for this change.
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  if (!TokenStorage.isLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }

  const user = TokenStorage.getUser<{ role?: AppRole }>();
  if (user?.role !== role) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
