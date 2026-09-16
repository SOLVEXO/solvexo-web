import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Real, store-wide taxonomy benchmarked against Shopify's actual live
// "Store permissions" list (110 permissions across 19 categories, verified
// this session) — see the staff-permissions project plan for the full
// matrix and every disclosed merge/gap. Must stay in sync with the
// backend's `STAFF_PERMISSIONS` (`solvexo-api/src/staff/schemas/staff-member.schema.ts`).
export const STAFF_PERMISSIONS = [
  'home.view',
  'orders.view', 'orders.export', 'orders.fulfill', 'orders.capture_payment',
  'orders.buy_shipping_label', 'orders.return', 'orders.abandoned_checkouts', 'orders.cancel',
  'orders.refund', 'orders.record_payment', 'orders.disputes_manage',
  'draft_orders.view', 'draft_orders.mark_paid',
  'products.view', 'products.view_cost', 'products.export', 'products.delete', 'products.edit', 'products.edit_price', 'products.edit_cost',
  'inventory.view', 'inventory.adjust', 'inventory.receive', 'inventory.transfer',
  'inventory.count', 'inventory.approve', 'purchase_orders.manage',
  'giftcards.view', 'giftcards.deactivate', 'giftcards.manage',
  'customers.view', 'customers.export', 'customers.edit',
  'analytics.view',
  'marketing.manage', 'discounts.manage',
  'content.menus.manage', 'content.metaobjects.manage', 'files.manage',
  'onlinestore.themes.manage', 'onlinestore.content.manage',
  'settings.billing.view', 'settings.billing.manage', 'settings.general.manage', 'settings.taxes.manage',
  'settings.shipping.manage', 'settings.locations.manage',
  'settings.domains.manage', 'settings.pixels.manage', 'settings.payments.manage',
  'finance.payouts.view', 'finance.payments.manage', 'finance.tax_documents.manage',
  'messaging.view', 'messaging.manage',
  'loyalty.view', 'loyalty.manage', 'loyalty.points.award',
  'subscriptions.view', 'subscriptions.manage', 'subscriptions.subscribers.manage',
  'seo.view', 'seo.manage',
  'aistudio.view', 'aistudio.use',
  'staff.manage',
] as const;
export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<StaffPermission, string> = {
  'home.view': 'View dashboard',
  'orders.view': 'View orders',
  'orders.export': 'Export orders',
  'orders.fulfill': 'Fulfill & ship orders',
  'orders.capture_payment': 'Capture payments',
  'orders.buy_shipping_label': 'Buy shipping labels',
  'orders.return': 'View & process returns',
  'orders.abandoned_checkouts': 'Manage abandoned checkouts',
  'orders.cancel': 'Cancel orders',
  'orders.refund': 'Issue refunds to the original payment method',
  'orders.record_payment': 'Record manual payments on orders',
  'orders.disputes_manage': 'View & respond to payment disputes',
  'draft_orders.view': 'View draft orders',
  'draft_orders.mark_paid': 'Mark draft orders as paid',
  'products.view': 'View products',
  'products.view_cost': 'View product cost prices',
  'products.export': 'Export products',
  'products.delete': 'Delete products',
  'products.edit': 'Edit products (name, description, images, etc.)',
  'products.edit_price': 'Edit product prices',
  'products.edit_cost': 'Edit product cost prices',
  'inventory.view': 'View inventory',
  'inventory.adjust': 'Adjust stock',
  'inventory.receive': 'Receive purchase orders',
  'inventory.transfer': 'Ship / receive transfers',
  'inventory.count': 'Run stock counts',
  'inventory.approve': 'Approve staff stock adjustments',
  'purchase_orders.manage': 'Manage purchase orders & suppliers',
  'giftcards.view': 'View & send gift cards',
  'giftcards.deactivate': 'Deactivate gift cards',
  'giftcards.manage': 'Issue gift cards & adjust balances',
  'customers.view': 'View customers',
  'customers.export': 'Export customers',
  'customers.edit': 'Create & edit customers',
  'analytics.view': 'View analytics & reports',
  'marketing.manage': 'Manage marketing campaigns',
  'discounts.manage': 'Manage coupons & discounts',
  'content.menus.manage': 'Manage menus, metafields & metaobjects',
  'content.metaobjects.manage': 'Manage metafields & metaobjects',
  'files.manage': 'Manage files',
  'onlinestore.themes.manage': 'Manage themes',
  'onlinestore.content.manage': 'Manage pages, blog & policies',
  'settings.billing.view': 'View plan & billing',
  'settings.billing.manage': 'Manage plan & billing',
  'settings.general.manage': 'Manage general store settings',
  'settings.taxes.manage': 'Manage tax settings',
  'settings.shipping.manage': 'Manage shipping',
  'settings.locations.manage': 'Manage locations',
  'settings.domains.manage': 'Manage domains',
  'settings.pixels.manage': 'Manage tracking pixels',
  'settings.payments.manage': 'Manage checkout payment providers',
  'finance.payouts.view': 'View payouts & transactions',
  'finance.payments.manage': 'Manage Stripe payout account',
  'finance.tax_documents.manage': 'Generate tax reports',
  'messaging.view': 'View customer messages',
  'messaging.manage': 'Reply to & manage customer messages',
  'loyalty.view': 'View loyalty program & members',
  'loyalty.manage': 'Manage loyalty program & rewards',
  'loyalty.points.award': 'Manually award loyalty points',
  'subscriptions.view': 'View subscription plans & subscribers',
  'subscriptions.manage': 'Manage subscription plans',
  'subscriptions.subscribers.manage': 'Manage subscribers (pause/cancel/refund)',
  'seo.view': 'View SEO data & audits',
  'seo.manage': 'Manage SEO settings',
  'aistudio.view': 'View AI Studio credit usage & history',
  'aistudio.use': 'Use AI Studio generation tools',
  'staff.manage': 'Manage staff & roles',
};

// ── Roles (Shopify-parity: a named, reusable permission bundle) ──────────

export interface Role {
  _id: string;
  storeId: string;
  name: string;
  description: string | null;
  permissions: StaffPermission[];
  isPreset: boolean;
}

export function apiListRoles(storeId: string) {
  return client.get<never, ApiResponse<Role[]>>(ENDPOINTS.STAFF.LIST_ROLES(storeId));
}

export function apiCreateRole(storeId: string, payload: { name: string; description?: string; permissions: StaffPermission[] }) {
  return client.post<never, ApiResponse<Role>>(ENDPOINTS.STAFF.CREATE_ROLE(storeId), payload);
}

export function apiUpdateRole(storeId: string, roleId: string, payload: { name?: string; description?: string; permissions?: StaffPermission[] }) {
  return client.patch<never, ApiResponse<Role>>(ENDPOINTS.STAFF.UPDATE_ROLE(storeId, roleId), payload);
}

export function apiDeleteRole(storeId: string, roleId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STAFF.DELETE_ROLE(storeId, roleId));
}

// ── Staff ──────────────────────────────────────────────────────────────

export interface StaffMember {
  _id: string;
  storeId: string;
  sellerId: string;
  name: string;
  email: string;
  role: 'manager' | 'staff';
  roleId: string | null;
  locationId: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role?: 'manager' | 'staff';
  roleId?: string;
  locationId?: string;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: 'manager' | 'staff';
  roleId?: string;
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
