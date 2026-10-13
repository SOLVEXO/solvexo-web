import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

// ── Barcode / SKU lookup ───────────────────────────────────────────────────

export interface LookupHit {
  variantId: string;
  productId: string;
  productName: string;
  image: string | null;
  sku: string | null;
  barcode: string | null;
  options: { name: string; value: string }[];
  stock: number;
  committedStock: number;
  available: number | null;
  unlimitedStock: boolean;
  costPrice: number | null;
}

export function apiLookupByCode(storeId: string, code: string) {
  return client.get<never, ApiResponse<LookupHit[]>>(ENDPOINTS.INVENTORY.LOOKUP(storeId), { params: { code } });
}

// ── Lots / expiry / write-off ──────────────────────────────────────────────

export type LotFilter = 'all' | 'expired' | 'expiring';

export interface StockLotRow {
  _id: string;
  productName: string;
  sku: string | null;
  options: { name: string; value: string }[];
  lotNumber: string;
  expiryDate: string | null;
  quantityRemaining: number;
  quantityReceived: number;
  costPrice: number;
  isExpired: boolean;
  daysToExpiry: number | null;
  valueRemaining: number;
}

export function apiListLots(storeId: string, params: { filter?: LotFilter; days?: number; q?: string; page?: number; limit?: number } = {}) {
  return client.get<never, ApiResponse<StockLotRow[]>>(ENDPOINTS.INVENTORY.LOTS(storeId), { params });
}

export function apiWriteOffLot(storeId: string, lotId: string, body: { quantity?: number; reason: 'expired' | 'damaged'; note?: string }) {
  return client.post<never, ApiResponse<{ lotNumber: string; written: number; remaining: number; value: number }>>(
    ENDPOINTS.INVENTORY.WRITE_OFF_LOT(storeId, lotId), body,
  );
}

// ── Movement report ────────────────────────────────────────────────────────

export interface MovementReport {
  range: { from: string; to: string };
  adjustmentsByReason: { reason: string; entries: number; unitsIn: number; unitsOut: number }[];
  supplierReturns: { count: number; units: number; totalCredit: number; pendingCredit: number };
  expired: { lots: number; units: number; value: number };
  expiringIn30Days: { lots: number; units: number; value: number };
}

export function apiGetMovementReport(storeId: string, params: { from?: string; to?: string } = {}) {
  return client.get<never, ApiResponse<MovementReport>>(ENDPOINTS.INVENTORY.MOVEMENT_REPORT(storeId), { params });
}

// ── Supplier returns ───────────────────────────────────────────────────────

export type SupplierReturnReason = 'damaged' | 'defective' | 'wrong_item' | 'overstock' | 'expired' | 'other';

export interface SupplierReturn {
  _id: string;
  returnNumber: string;
  supplierName: string;
  purchaseOrderId: string | null;
  reason: SupplierReturnReason;
  note: string | null;
  items: { variantId: string; name: string; sku: string | null; quantity: number; unitCost: number; fromDamaged: boolean }[];
  totalCredit: number;
  creditStatus: 'pending' | 'received';
  createdAt: string;
}

export interface CreateSupplierReturnPayload {
  supplierId?: string;
  supplierName?: string;
  purchaseOrderId?: string;
  reason: SupplierReturnReason;
  note?: string;
  items: { variantId: string; quantity: number; unitCost?: number; fromDamaged?: boolean; purchaseOrderItemId?: string }[];
}

/** `requestId` must be generated once per form open and reused on a retry — the server then ignores a repeated submit. */
export function apiCreateSupplierReturn(storeId: string, payload: CreateSupplierReturnPayload, requestId: string) {
  return client.post<never, ApiResponse<SupplierReturn> & { duplicate: boolean; pendingApproval?: boolean }>(
    ENDPOINTS.PURCHASE_ORDERS.SUPPLIER_RETURNS(storeId), { ...payload, requestId },
  );
}

export function apiListSupplierReturns(storeId: string, params: { page?: number; limit?: number; creditStatus?: 'pending' | 'received' } = {}) {
  return client.get<never, ApiResponse<SupplierReturn[]>>(ENDPOINTS.PURCHASE_ORDERS.SUPPLIER_RETURNS(storeId), { params });
}

export function apiMarkSupplierReturnCredit(storeId: string, id: string) {
  return client.post<never, ApiResponse<SupplierReturn>>(ENDPOINTS.PURCHASE_ORDERS.SUPPLIER_RETURN_CREDIT(storeId, id), {});
}

// ── CSV exports ────────────────────────────────────────────────────────────

export function apiExportLotsCsv(storeId: string) {
  return client.get<never, Blob>(ENDPOINTS.INVENTORY.LOTS_EXPORT(storeId), { responseType: 'blob' });
}

export function apiExportSupplierReturnsCsv(storeId: string) {
  return client.get<never, Blob>(ENDPOINTS.PURCHASE_ORDERS.SUPPLIER_RETURNS_EXPORT(storeId), { responseType: 'blob' });
}
