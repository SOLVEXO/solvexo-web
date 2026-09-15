import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type AccountRole = 'buyer' | 'seller';

export interface AdminUsersStats {
  totalBuyers: number;
  activeSellerAccounts: number;
  suspended: number;
}

export interface AdminUsersQuery {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// This page lists SELLER accounts only — a buyer has no store of their own
// (see StoreCustomer below for how buyers are actually managed, per-store).
export interface SellerRow {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  /** A seller can own more than one store (same as a real Shopify account
   *  can run several stores) — this is always computed fresh from the Store
   *  collection, never a single "Plan" that would be misleading once a
   *  seller has more than one. */
  storeCount: number;
}

export interface SellerStore {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
}

/** Seller `getById` response — the account fields plus its stores. */
export interface SellerDetail extends SellerRow {
  stores: SellerStore[];
}

export interface AdminUsersListData {
  items: SellerRow[];
  total: number;
  page: number;
  limit: number;
}

export interface StoreCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  segment: 'new' | 'returning' | 'vip' | 'at_risk';
  /** Blocked from checking out at THIS store only — independent of the
   *  buyer's platform-wide account status (see apiSuspendAccount/'buyer'). */
  isBlocked: boolean;
}

export interface StoreCustomersQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface StoreCustomersData {
  storeName: string;
  pagination: { page: number; limit: number; total: number };
  customers: StoreCustomer[];
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ─────────────────────────────────────────────────────────────────────────────
// API — sellers
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetAdminUsersStats() {
  return client.get<never, ApiResponse<AdminUsersStats>>(ENDPOINTS.USERS.ADMIN.STATS);
}

export function apiListAdminUsers(query: AdminUsersQuery = {}) {
  return client.get<never, ApiResponse<AdminUsersListData>>(ENDPOINTS.USERS.ADMIN.LIST, { params: query });
}

export function apiGetAdminSeller(id: string) {
  return client.get<never, ApiResponse<SellerDetail>>(ENDPOINTS.USERS.ADMIN.GET_BY_ID('seller', id));
}

/** Whole-account action — role:'seller' cascades to every store they own;
 *  role:'buyer' is the platform-wide ban (from a store's customer list, once
 *  a buyer id is known — see apiBlockStoreCustomer for the lighter, per-store
 *  version). */
export function apiSuspendAccount(role: AccountRole, id: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.USERS.ADMIN.SUSPEND(role, id));
}

export function apiUnsuspendAccount(role: AccountRole, id: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.USERS.ADMIN.UNSUSPEND(role, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// API — single store (independent of the seller account)
// ─────────────────────────────────────────────────────────────────────────────
export function apiSuspendStore(storeId: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.USERS.ADMIN.SUSPEND_STORE(storeId));
}

export function apiUnsuspendStore(storeId: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.USERS.ADMIN.UNSUSPEND_STORE(storeId));
}

// ─────────────────────────────────────────────────────────────────────────────
// API — a store's customers (buyers)
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetStoreCustomers(storeId: string, query: StoreCustomersQuery = {}) {
  return client.get<never, ApiResponse<StoreCustomersData>>(ENDPOINTS.USERS.ADMIN.STORE_CUSTOMERS(storeId), { params: query });
}

export function apiBlockStoreCustomer(storeId: string, buyerId: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.USERS.ADMIN.BLOCK_CUSTOMER(storeId, buyerId));
}

export function apiUnblockStoreCustomer(storeId: string, buyerId: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.USERS.ADMIN.UNBLOCK_CUSTOMER(storeId, buyerId));
}
