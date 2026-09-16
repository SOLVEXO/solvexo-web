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

export interface DraftOrderShippingAddress {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  zipCode?: string;
  phoneNumber: string;
}

export type DraftOrderPaymentTerms = 'due_on_receipt' | 'net_15' | 'net_30' | 'net_60';

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
  isPaid: boolean;
  paidAt: string | null;
  orderId: string | null;
  orderNumber: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  shippingAddress: DraftOrderShippingAddress | null;
  paymentTerms: DraftOrderPaymentTerms | null;
  dueDate: string | null;
  invoiceToken: string | null;
  invoiceSentAt: string | null;
  invoicePaidAt: string | null;
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
  shippingAddress?: DraftOrderShippingAddress;
  paymentTerms?: DraftOrderPaymentTerms;
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

/** Records that payment was actually collected for this open draft —
 *  independent of `apiCompleteDraftOrder`, which still converts the draft
 *  even when unpaid (see DraftOrdersService.complete's doc comment). */
export function apiMarkDraftOrderPaid(storeId: string, id: string) {
  return client.post<never, { success: boolean; data: DraftOrder }>(ENDPOINTS.DRAFT_ORDERS.MARK_PAID(storeId, id), {});
}

export function apiCompleteDraftOrder(storeId: string, id: string) {
  return client.post<never, { success: boolean; data: { draftOrderId: string; orderId: string; orderNumber: string } }>(
    ENDPOINTS.DRAFT_ORDERS.COMPLETE(storeId, id), {},
  );
}

/** Real "Duplicate" — clones an existing draft into a brand new open one. */
export function apiDuplicateDraftOrder(storeId: string, id: string) {
  return client.post<never, { success: boolean; data: DraftOrder }>(ENDPOINTS.DRAFT_ORDERS.DUPLICATE(storeId, id), {});
}

/** Real hard-delete — only valid for a never-completed draft. */
export function apiDeleteDraftOrderPermanently(storeId: string, id: string) {
  return client.delete<never, { success: boolean; message: string }>(ENDPOINTS.DRAFT_ORDERS.DELETE_PERMANENT(storeId, id));
}

/** Real "Send invoice" — emails the customer a secure link to pay online. */
export function apiSendDraftOrderInvoice(storeId: string, id: string) {
  return client.post<never, { success: boolean; message: string; data: { invoiceUrl: string } }>(ENDPOINTS.DRAFT_ORDERS.SEND_INVOICE(storeId, id), {});
}

// ── Public invoice payment page ──────────────────────────────────────────

export interface PublicInvoiceData {
  customerName: string;
  storeName: string;
  storeLogo: string | null;
  items: { name: string; image: string | null; quantity: number; unitPrice: number }[];
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  isPaid: boolean;
  dueDate: string | null;
}

export function apiGetPublicInvoice(token: string) {
  return client.get<never, { success: boolean; data: PublicInvoiceData }>(ENDPOINTS.DRAFT_ORDERS.PUBLIC_INVOICE(token));
}

export function apiCreateInvoicePaymentIntent(token: string) {
  return client.post<never, { success: boolean; data: { clientSecret: string; amount: number; currency: string } }>(
    ENDPOINTS.DRAFT_ORDERS.PUBLIC_INVOICE_PAYMENT_INTENT(token), {},
  );
}
