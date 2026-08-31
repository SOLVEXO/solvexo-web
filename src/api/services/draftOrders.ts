import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface DraftOrderItem {
  _id?: string;
  productId: string;
  variantId: string;
  type: string;
  name: string;
  image: string | null;
  sku: string | null;
  options: { name: string; value: string }[];
  quantity: number;
  unitPrice: number;
}

export interface DraftOrder {
  _id: string;
  storeId: string;
  sellerId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  items: DraftOrderItem[];
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  shippingAmount: number;
  taxAmount: number;
  notes: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  status: 'open' | 'completed' | 'cancelled';
  orderId: string | null;
  orderNumber: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DraftOrderCustomer { id: string; name: string; email: string; phone: string }

export interface CreateDraftOrderPayload {
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: { productId: string; variantId: string; quantity: number; unitPrice?: number }[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  shippingAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export type UpdateDraftOrderPayload = Partial<CreateDraftOrderPayload>;

export function apiSearchDraftOrderCustomers(storeId: string, q: string) {
  return client.get<never, { success: boolean; data: DraftOrderCustomer[] }>(ENDPOINTS.DRAFT_ORDERS.SEARCH_CUSTOMERS(storeId, q));
}

export function apiCreateDraftOrder(storeId: string, payload: CreateDraftOrderPayload) {
  return client.post<never, { success: boolean; data: DraftOrder }>(ENDPOINTS.DRAFT_ORDERS.LIST_CREATE(storeId), payload);
}

export function apiListDraftOrders(storeId: string, query: { status?: string; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return client.get<never, { success: boolean; data: { items: DraftOrder[]; total: number; page: number; limit: number } }>(
    `${ENDPOINTS.DRAFT_ORDERS.LIST_CREATE(storeId)}${qs ? `?${qs}` : ''}`,
  );
}

export function apiGetDraftOrder(storeId: string, id: string) {
  return client.get<never, { success: boolean; data: DraftOrder }>(ENDPOINTS.DRAFT_ORDERS.DETAIL(storeId, id));
}

export function apiUpdateDraftOrder(storeId: string, id: string, payload: UpdateDraftOrderPayload) {
  return client.patch<never, { success: boolean; data: DraftOrder }>(ENDPOINTS.DRAFT_ORDERS.DETAIL(storeId, id), payload);
}

export function apiCancelDraftOrder(storeId: string, id: string) {
  return client.delete<never, { success: boolean; data: DraftOrder }>(ENDPOINTS.DRAFT_ORDERS.DETAIL(storeId, id));
}

export function apiCompleteDraftOrder(storeId: string, id: string) {
  return client.post<never, { success: boolean; data: { draftOrderId: string; orderId: string; orderNumber: string } }>(
    ENDPOINTS.DRAFT_ORDERS.COMPLETE(storeId, id), {},
  );
}
