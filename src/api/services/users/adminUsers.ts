import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type AccountRole = 'buyer' | 'seller';

export interface AdminUsersStats {
  totalUsers: number;
  activeSellers: number;
  suspended: number;
}

export interface AdminUsersQuery {
  role?: AccountRole;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  plan: string;
  status: string;
  createdAt: string;
}

export interface AdminUsersListData {
  items: AccountRow[];
  total: number;
  page: number;
  limit: number;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetAdminUsersStats() {
  return client.get<never, ApiResponse<AdminUsersStats>>(ENDPOINTS.USERS.ADMIN.STATS);
}

export function apiListAdminUsers(query: AdminUsersQuery = {}) {
  return client.get<never, ApiResponse<AdminUsersListData>>(ENDPOINTS.USERS.ADMIN.LIST, { params: query });
}

export function apiGetAdminUserById(role: AccountRole, id: string) {
  return client.get<never, ApiResponse<AccountRow>>(ENDPOINTS.USERS.ADMIN.GET_BY_ID(role, id));
}

export function apiSuspendAccount(role: AccountRole, id: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.USERS.ADMIN.SUSPEND(role, id));
}

export function apiUnsuspendAccount(role: AccountRole, id: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.USERS.ADMIN.UNSUSPEND(role, id));
}
