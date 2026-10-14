import { TokenStorage } from '@/api/services/auth';

type Permission = string | string[];

const session = () => TokenStorage.getUser<{ role?: string; permissions?: string[] }>();

/** True for a staff login (a store team member), false for the owner/admin/buyer. */
export const isStaffSession = () => session()?.role === 'staff';

/** Does the current session hold ANY of these permissions? The store owner (and anyone who is not
 *  staff) always can. A staff session's permissions come from its token, the same list the server
 *  enforces. Use it to HIDE what a staff member cannot use, instead of showing a 403 error. */
export function can(permission: Permission): boolean {
  const user = session();
  if (!user || user.role !== 'staff') return true;
  const granted = new Set(user.permissions ?? []);
  return (Array.isArray(permission) ? permission : [permission]).some(p => granted.has(p));
}
