import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ── Suppliers ────────────────────────────────────────────────────────────

export interface Supplier {
  _id: string;
  storeId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: 'active' | 'archived';
}

export function apiCreateSupplier(storeId: string, payload: { name: string; email?: string; phone?: string; address?: string; notes?: string }) {
  return client.post<never, ApiResponse<Supplier>>(ENDPOINTS.PURCHASE_ORDERS.CREATE_SUPPLIER(storeId), payload);
}

export function apiListSuppliers(storeId: string) {
  return client.get<never, ApiResponse<Supplier[]>>(ENDPOINTS.PURCHASE_ORDERS.LIST_SUPPLIERS(storeId));
}

export function apiUpdateSupplier(storeId: string, supplierId: string, payload: Partial<{ name: string; email: string; phone: string; address: string; notes: string; status: 'active' | 'archived' }>) {
  return client.patch<never, ApiResponse<Supplier>>(ENDPOINTS.PURCHASE_ORDERS.UPDATE_SUPPLIER(storeId, supplierId), payload);
}

export function apiArchiveSupplier(storeId: string, supplierId: string) {
  return client.delete<never, ApiResponse<Supplier>>(ENDPOINTS.PURCHASE_ORDERS.ARCHIVE_SUPPLIER(storeId, supplierId));
}

// ── Purchase Orders ──────────────────────────────────────────────────────

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'closed_short' | 'cancelled';

export interface PurchaseOrderItem {
  _id: string;
  productId: string;
  variantId: string;
  name: string;
  image: string | null;
  sku: string | null;
  options: { name: string; value: string }[];
  quantityOrdered: number;
  quantityReceived: number;
  quantityDamaged: number;
  unitCost: number;
}

export interface PurchaseOrder {
  _id: string;
  storeId: string;
  supplierId: string | null;
  supplierName: string;
  locationId: string | null;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  notes: string;
  currency: string;
  subtotal: number;
  shippingCost: number;
  taxCost: number;
  total: number;
  poNumber: string;
  expectedAt: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface PurchaseOrderListResult {
  items: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  counts: Record<string, number>;
}

export interface CreatePurchaseOrderItemPayload {
  productId: string;
  variantId: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface CreatePurchaseOrderPayload {
  supplierId?: string;
  supplierName: string;
  locationId?: string;
  items: CreatePurchaseOrderItemPayload[];
  shippingCost?: number;
  taxCost?: number;
  notes?: string;
  expectedAt?: string;
}

export function apiCreatePurchaseOrder(storeId: string, payload: CreatePurchaseOrderPayload) {
  return client.post<never, ApiResponse<PurchaseOrder>>(ENDPOINTS.PURCHASE_ORDERS.CREATE(storeId), payload);
}

export function apiListPurchaseOrders(storeId: string, params: { status?: string; search?: string; page?: number; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return client.get<never, ApiResponse<PurchaseOrderListResult>>(`${ENDPOINTS.PURCHASE_ORDERS.LIST(storeId)}${qs ? `?${qs}` : ''}`);
}

export function apiGetPurchaseOrder(storeId: string, id: string) {
  return client.get<never, ApiResponse<PurchaseOrder>>(ENDPOINTS.PURCHASE_ORDERS.GET(storeId, id));
}

export function apiUpdatePurchaseOrder(storeId: string, id: string, payload: Partial<CreatePurchaseOrderPayload>) {
  return client.patch<never, ApiResponse<PurchaseOrder>>(ENDPOINTS.PURCHASE_ORDERS.UPDATE(storeId, id), payload);
}

export function apiMarkPurchaseOrderOrdered(storeId: string, id: string) {
  return client.post<never, ApiResponse<PurchaseOrder>>(ENDPOINTS.PURCHASE_ORDERS.MARK_ORDERED(storeId, id), {});
}

export function apiCancelPurchaseOrder(storeId: string, id: string) {
  return client.post<never, ApiResponse<PurchaseOrder>>(ENDPOINTS.PURCHASE_ORDERS.CANCEL(storeId, id), {});
}

export function apiCloseShortPurchaseOrder(storeId: string, id: string) {
  return client.post<never, ApiResponse<PurchaseOrder>>(ENDPOINTS.PURCHASE_ORDERS.CLOSE_SHORT(storeId, id), {});
}

export interface ReceivePurchaseOrderLine {
  itemId: string;
  quantityReceived: number;
  quantityDamaged?: number;
  /** Only meaningful when the line's variant has `trackLots: true` — see
   *  StockLot schema. Harmless to send for a non-lot-tracked variant, the
   *  backend simply ignores it there. */
  lotNumber?: string;
  expiryDate?: string;
  /** Only meaningful when the line's variant has `trackSerials: true` —
   *  must have exactly `quantityReceived + quantityDamaged` entries or the
   *  backend rejects that one line (reported back as a discrepancy, not a
   *  hard error — every other line in the same receipt still applies). */
  serialNumbers?: string[];
}

export interface ReceivePurchaseOrderResult {
  po: PurchaseOrder;
  discrepancies: string[];
}

/** `idempotencyKey` should be generated once per receive ATTEMPT (e.g. once
 *  per modal open, reused across a retry of that same submission) and sent
 *  to the backend's `IdempotencyInterceptor` — without it, a slow request
 *  the seller retries (or a network-level auto-retry) could credit the
 *  same shipment's stock twice. */
export function apiReceivePurchaseOrder(storeId: string, id: string, items: ReceivePurchaseOrderLine[], idempotencyKey: string) {
  return client.post<never, ApiResponse<ReceivePurchaseOrderResult>>(
    ENDPOINTS.PURCHASE_ORDERS.RECEIVE(storeId, id), { items }, { headers: { 'Idempotency-Key': idempotencyKey } },
  );
}
