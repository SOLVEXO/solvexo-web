import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PosPaymentMethod = 'cash' | 'card' | 'other';
export type SaleStatus = 'completed' | 'held' | 'refunded' | 'voided' | 'partially_refunded';

export interface SaleItem {
  _id:          string;
  productId:    string;
  variantId:    string;
  name:         string;
  sku:          string;
  image:        string | null;
  price:        number;
  qty:          number;
  lineTotal:    number;
  refundedQty:  number;
}

export interface Sale {
  _id:             string;
  saleNumber:      string;
  storeId:         string;
  sessionId:       string;
  registerId:      string;
  employeeId:      string;
  items:           SaleItem[];
  subtotal:        number;
  discount:        number;
  tax:             number;
  total:           number;
  paymentMethod:   PosPaymentMethod;
  customerId:      string | null;
  customerName:    string;
  notes:           string | null;
  heldAt:          string | null;
  status:          SaleStatus;
  idempotencyKey:  string | null;
  voidedAt:        string | null;
  voidedBy:        string | null;
  refundedAmount:  number;
  createdAt:       string;
  updatedAt:       string;
}

export interface SaleItemInput {
  productId: string;
  variantId: string;
  qty:       number;
}

export interface CreateSalePayload {
  storeId:         string;
  sessionId:       string;
  registerId:      string;
  employeeId:      string;
  items:           SaleItemInput[];
  discount?:       number;
  tax?:            number;
  paymentMethod:   PosPaymentMethod;
  customerId?:     string;
  customerName?:   string;
  notes?:          string;
  status?:         'completed' | 'held';
  idempotencyKey?: string;
}

export interface CompleteSalePayload {
  paymentMethod: PosPaymentMethod;
  discount?:     number;
  tax?:          number;
  notes?:        string;
}

export interface RefundItemInput {
  saleItemId: string;
  qty:        number;
}

export interface RefundSalePayload {
  items?:            RefundItemInput[];
  actingEmployeeId?: string;
}

export interface EditSaleItemInput {
  variantId: string;
  productId: string;
  qty:       number;
}

export interface UpdateSaleItemsPayload {
  items:     EditSaleItemInput[];
  discount?: number;
  tax?:      number;
}

export interface VoidSalePayload {
  reason?:           string;
  actingEmployeeId?: string;
}

export interface SalesQuery {
  storeId:        string;
  page?:          number;
  sessionId?:     string;
  employeeId?:    string;
  paymentMethod?: PosPaymentMethod;
  status?:        SaleStatus;
  from?:          string;
  to?:            string;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface ListResponse<T> { success: boolean; count: number; data: T[] }
interface PaginatedSalesResponse {
  success: boolean;
  data: {
    pagination: { page: number; limit: number; total: number; totalPages: number };
    sales:      Sale[];
  };
}
interface MessageResponse { success: boolean; message: string }
interface RefundResponse {
  success: boolean;
  message: string;
  data?: { refundedAmount: number; newStatus: SaleStatus };
}

// ── API ───────────────────────────────────────────────────────────────────────

/** POST /api/pos/sales */
export function apiCreateSale(payload: CreateSalePayload) {
  return client.post<never, ApiResponse<Sale>>(ENDPOINTS.POS.SALES.CREATE, payload);
}

/** GET /api/pos/sales/held?storeId=&sessionId= */
export function apiGetHeldSales(storeId: string, sessionId?: string) {
  const qs = sessionId ? `?storeId=${storeId}&sessionId=${sessionId}` : `?storeId=${storeId}`;
  return client.get<never, ListResponse<Sale>>(`${ENDPOINTS.POS.SALES.HELD}${qs}`);
}

/** GET /api/pos/sales?storeId=&... */
export function apiGetSales(query: SalesQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return client.get<never, PaginatedSalesResponse>(`${ENDPOINTS.POS.SALES.LIST}?${params}`);
}

/** GET /api/pos/sales/:saleId */
export function apiGetSaleById(saleId: string) {
  return client.get<never, ApiResponse<Sale>>(ENDPOINTS.POS.SALES.GET_BY_ID(saleId));
}

/** POST /api/pos/sales/:saleId/complete */
export function apiCompleteSale(saleId: string, payload: CompleteSalePayload) {
  return client.post<never, ApiResponse<Sale>>(ENDPOINTS.POS.SALES.COMPLETE(saleId), payload);
}

/** POST /api/pos/sales/:saleId/refund */
export function apiRefundSale(saleId: string, payload?: RefundSalePayload) {
  return client.post<never, RefundResponse>(ENDPOINTS.POS.SALES.REFUND(saleId), payload ?? {});
}

/** DELETE /api/pos/sales/:saleId/discard */
export function apiDiscardHeldSale(saleId: string) {
  return client.delete<never, MessageResponse>(ENDPOINTS.POS.SALES.DISCARD(saleId));
}

/** POST /api/pos/sales/:saleId/void */
export function apiVoidSale(saleId: string, payload: VoidSalePayload = {}) {
  return client.post<never, MessageResponse>(ENDPOINTS.POS.SALES.VOID(saleId), payload);
}

/** PATCH /api/pos/sales/:saleId/items */
export function apiEditHeldSaleItems(saleId: string, payload: UpdateSaleItemsPayload) {
  return client.patch<never, ApiResponse<Sale>>(ENDPOINTS.POS.SALES.UPDATE_ITEMS(saleId), payload);
}
