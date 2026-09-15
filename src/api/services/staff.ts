import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const STAFF_PERMISSIONS = [
  'inventory.view',
  'inventory.adjust',
  'inventory.receive',
  'inventory.transfer',
  'inventory.count',
  'inventory.approve',
  'purchase_orders.manage',
  'staff.manage',
] as const;
export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<StaffPermission, string> = {
  'inventory.view': 'View inventory',
  'inventory.adjust': 'Adjust stock',
  'inventory.receive': 'Receive purchase orders',
  'inventory.transfer': 'Ship / receive transfers',
  'inventory.count': 'Run stock counts',
  'inventory.approve': 'Approve staff adjustments',
  'purchase_orders.manage': 'Manage purchase orders & suppliers',
  'staff.manage': 'Manage staff accounts',
};

export interface StaffMember {
  _id: string;
  storeId: string;
  sellerId: string;
  name: string;
  email: string;
  role: 'manager' | 'staff';
  permissions: StaffPermission[];
  locationId: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role?: 'manager' | 'staff';
  permissions?: StaffPermission[];
  locationId?: string;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: 'manager' | 'staff';
  permissions?: StaffPermission[];
  locationId?: string | null;
  status?: 'active' | 'inactive';
}

export function apiStaffLogin(storeId: string, email: string, password: string) {
  return client.post<never, ApiResponse<{ accessToken: string; staff: { id: string; name: string; email: string; role: string; permissions: string[]; storeId: string } }>>(
    ENDPOINTS.STAFF.LOGIN(storeId),
    { email, password },
  );
}

export function apiListStaff(storeId: string) {
  return client.get<never, ApiResponse<StaffMember[]>>(ENDPOINTS.STAFF.LIST(storeId));
}

export function apiCreateStaff(storeId: string, payload: CreateStaffPayload) {
  return client.post<never, ApiResponse<StaffMember>>(ENDPOINTS.STAFF.CREATE(storeId), payload);
}

export function apiUpdateStaff(storeId: string, staffId: string, payload: UpdateStaffPayload) {
  return client.patch<never, ApiResponse<StaffMember>>(ENDPOINTS.STAFF.UPDATE(storeId, staffId), payload);
}

export function apiDeactivateStaff(storeId: string, staffId: string) {
  return client.patch<never, ApiResponse<StaffMember>>(ENDPOINTS.STAFF.DEACTIVATE(storeId, staffId), {});
}

// ── Approvals queue ─────────────────────────────────────────────────────

export interface ApprovalRequestItem {
  _id: string;
  storeId: string;
  type: 'stock_adjustment';
  payload: Record<string, unknown>;
  summary: string;
  requestedBy: string;
  requestedByName: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export function apiListApprovals(storeId: string, status?: string) {
  return client.get<never, ApiResponse<ApprovalRequestItem[]>>(ENDPOINTS.INVENTORY.LIST_APPROVALS(storeId), { params: status ? { status } : undefined });
}

export function apiApproveRequest(storeId: string, approvalId: string) {
  return client.post<never, ApiResponse<{ approval: ApprovalRequestItem; result: unknown }>>(ENDPOINTS.INVENTORY.APPROVE_REQUEST(storeId, approvalId), {});
}

export function apiRejectRequest(storeId: string, approvalId: string, reason?: string) {
  return client.post<never, ApiResponse<ApprovalRequestItem>>(ENDPOINTS.INVENTORY.REJECT_REQUEST(storeId, approvalId), { reason });
}

// ── Bins ─────────────────────────────────────────────────────────────────

export interface Bin {
  _id: string;
  storeId: string;
  locationId: string;
  code: string;
  zone: string | null;
  aisle: string | null;
  shelf: string | null;
}

export function apiListBins(storeId: string, locationId: string) {
  return client.get<never, ApiResponse<Bin[]>>(ENDPOINTS.INVENTORY.LIST_BINS(storeId, locationId));
}

export function apiCreateBin(storeId: string, locationId: string, body: { code: string; zone?: string; aisle?: string; shelf?: string }) {
  return client.post<never, ApiResponse<Bin>>(ENDPOINTS.INVENTORY.CREATE_BIN(storeId, locationId), body);
}

export function apiDeleteBin(storeId: string, binId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.INVENTORY.DELETE_BIN(storeId, binId));
}
