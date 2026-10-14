import { TokenStorage } from '@/api/services/auth';

type Permission = string | string[];

const session = () => TokenStorage.getUser<{ role?: string; permissions?: string[]; teamAdmin?: boolean; readOnly?: boolean; isSuperAdmin?: boolean }>();

/** True for a staff login (a store team member), false for the owner/admin/buyer. */
export const isStaffSession = () => session()?.role === 'staff';

/** True for a restricted platform-team admin (not the owner / a Super Admin). */
export const isTeamAdminSession = () => { const u = session(); return u?.role === 'admin' && u.teamAdmin === true; };

/** A team admin whose role is read-only (can look, cannot change). */
export const isReadOnlyAdmin = () => isTeamAdminSession() && session()?.readOnly === true;

/** Does the current session hold ANY of these permissions? The store owner (and anyone who is not
 *  staff) always can. A staff session's permissions come from its token, the same list the server
 *  enforces. A platform-team admin is checked against its admin permissions; the owner / Super Admin
 *  always can. Use it to HIDE what a session cannot use, instead of showing a 403 error. */
export function can(permission: Permission): boolean {
  const user = session();
  if (!user) return true;
  if (user.role !== 'staff' && !(user.role === 'admin' && user.teamAdmin === true)) return true;
  const granted = new Set(user.permissions ?? []);
  return (Array.isArray(permission) ? permission : [permission]).some(p => granted.has(p));
}
