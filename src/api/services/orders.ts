import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderActionResponse {
  success: boolean;
  message: string;
}

export interface UpdateStatusPayload {
  orderId: string;
  storeId: string;
  status:  'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  tracking?: {
    carrier:        string;
    trackingNumber: string;
    trackingUrl:    string;
  };
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type ReturnStatus = 'none' | 'requested' | 'partial_requested' | 'approved' | 'rejected';

export interface OrderLineItem {
  itemId:     string;
  productId:  string;
  name:       string;
  image:      string | null;
  sku:        string;
  type:       'physical' | 'digital';
  productType?: 'physical' | 'digital' | 'educational';
  quantity:   number;
  price:      number;
  totalPrice: number;
  status:     string;
  returnStatus?: ReturnStatus;
}

export interface OrderStoreGroup {
  storeId:         string;
  fulfillmentType: string;
  status:          string;
  subtotal:        number;
  itemCount:       number;
  items:           OrderLineItem[];
  tracking?:       { carrier: string; trackingNumber: string; trackingUrl: string } | null;
  shippedAt?:      string | null;
  deliveredAt?:    string | null;
}

export interface OrderSummary {
  orderId:          string;
  orderNumber:      string;
  orderStatus:      OrderStatus;
  paymentType:      string;
  paymentStatus:    string;
  isPaid:           boolean;
  subtotal:         number;
  shippingFee:      number;
  taxAmount:        number;
  totalAmount:      number;
  currency:         string;
  shippingAddress:  Record<string, unknown>;
  stores:           OrderStoreGroup[];
  createdAt:        string;
  paidAt?:          string | null;
}

export interface MyOrdersParams { page?: number; limit?: number; status?: string }
interface MyOrdersResponse {
  success: boolean;
  data: {
    pagination: { page: number; limit: number; totalPages: number; total: number };
    orders: OrderSummary[];
  };
}

// Raw order document (used for the single order-detail view)
export interface OrderDetail {
  _id:             string;
  userId:          string;
  orderNumber:     string;
  orderStatus:     OrderStatus;
  paymentType:     string;
  paymentStatus:   string;
  isPaid:          boolean;
  subtotal:        number;
  shippingFee:     number;
  taxAmount:       number;
  totalAmount:     number;
  currency:        string;
  shippingAddress: Record<string, unknown>;
  sellerOrders:    OrderStoreGroup[];
  createdAt:       string;
  paidAt?:         string | null;
}
interface OrderDetailResponse { success: boolean; data: OrderDetail }

export interface CancelOrderPayload { reason: string; itemIds?: string[] }
interface CancelOrderResponse {
  success: boolean;
  message: string;
  data: { orderId: string; cancelledItems: number; refundProcessed: boolean };
}

export interface ReturnRequestPayload { reason: string; itemIds?: string[] }
interface ReturnRequestResponse {
  success: boolean;
  message: string;
  data: { orderId: string; requestedItems: number };
}

export interface SellerReturnItem {
  orderId:            string;
  orderNumber:        string;
  itemId:             string;
  customer:           { name: string; email: string | null };
  storeId:            string;
  productName:        string;
  productImage:       string | null;
  returnReason:       string;
  amount:             number;
  refundedAmount:     number;
  returnStatus:       ReturnStatus;
  returnRejectReason: string | null;
  returnRequestedAt:  string;
}

export interface SellerReturnsParams { storeId?: string; status?: string; page?: number }
interface SellerReturnsResponse {
  success: boolean;
  data: {
    stats: { openRequests: number; returnRate: string; totalRefunded: number };
    pagination: { page: number; limit: number; totalPages: number; total: number };
    returns: SellerReturnItem[];
  };
}

export interface ReturnActionPayload {
  storeId:      string;
  itemIds:      string[];
  action:       'approve' | 'reject';
  rejectReason?: string;
  // Keyed by the same OrderItem ids as `itemIds` — omit entirely (or a
  // given item's key) to leave stock untouched, exactly like before this
  // existed. 'restock' credits real sellable stock back; 'damaged' credits
  // the separate unsellable damagedStock pool instead (still genuinely
  // on-hand — see ProductVariant.damagedStock).
  restockDecisions?: Record<string, 'restock' | 'damaged'>;
}
interface ReturnActionResponse {
  success: boolean;
  message: string;
  data: { orderId: string; action: string; processedItems: number; refundProcessed: boolean };
}

interface DownloadLinkResponse {
  success: boolean;
  data: { token: string; endpoint: string; fileName: string; expiresIn: string };
}

// ── API ───────────────────────────────────────────────────────────────────────

export function apiMarkOrderPaid(orderId: string) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.MARK_PAID(orderId));
}

export function apiUpdateOrderStatus(payload: UpdateStatusPayload) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.UPDATE_STATUS, payload);
}

/** PUT /api/orders/purchase-shipping-label — real one-click "mark as
 *  shipped": buys the cheapest live carrier label for this order via the
 *  store's connected Shippo account and marks it shipped with the real
 *  tracking number, no manual entry. Throws with a clear message whenever a
 *  live label genuinely isn't available (see OrdersService.purchaseShippingLabel) —
 *  callers should fall back to the existing manual `apiUpdateOrderStatus`
 *  tracking-number form in that case, not treat it as a hard failure. */
export function apiPurchaseShippingLabel(orderId: string, storeId: string) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.PURCHASE_SHIPPING_LABEL, { orderId, storeId });
}

export function apiGetDownloadUrl(orderId: string, productId: string) {
  return client.get<never, { success: boolean; message: string; data: { downloadUrl: string } }>(
    `${ENDPOINTS.ORDERS.DOWNLOAD_URL}?orderId=${orderId}&productId=${productId}`,
  );
}

/** GET /api/orders/my-orders — buyer's paginated order list */
export function apiGetMyOrders(params?: MyOrdersParams) {
  return client.get<never, MyOrdersResponse>(ENDPOINTS.ORDERS.MY_ORDERS, { params });
}

/** GET /api/orders/:orderId — single order detail (buyer, must own the order) */
export function apiGetOrderById(orderId: string) {
  return client.get<never, OrderDetailResponse>(ENDPOINTS.ORDERS.GET_BY_ID(orderId));
}

/** POST /api/orders/cancel/:orderId — buyer cancels a whole order or specific items */
export function apiCancelOrder(orderId: string, payload: CancelOrderPayload) {
  return client.post<never, CancelOrderResponse>(ENDPOINTS.ORDERS.CANCEL(orderId), payload);
}

/** POST /api/orders/seller-cancel/:storeId/:orderId — seller cancels their own
 *  sellerOrder's items (or all of them if `itemIds` omitted). Real Stripe
 *  refund + finance ledger debit + stock restore, same as the buyer path
 *  (see OrdersService.executeCancellation). Requires the `orders.cancel`
 *  staff permission. */
export function apiCancelOrderAsSeller(storeId: string, orderId: string, payload: CancelOrderPayload) {
  return client.post<never, CancelOrderResponse>(ENDPOINTS.ORDERS.SELLER_CANCEL(storeId, orderId), payload);
}

export interface RefundOrderPayload { amount: number; reason?: string }
interface RefundOrderResponse {
  success: boolean;
  message: string;
  data: { orderId: string; amount: number; stripeRefundId: string | null };
}

/** POST /api/orders/seller-refund/:storeId/:orderId — standalone "Refund $X",
 *  independent of Cancel/Return — no item/fulfillment status changes. */
export function apiRefundOrderAsSeller(storeId: string, orderId: string, payload: RefundOrderPayload) {
  return client.post<never, RefundOrderResponse>(ENDPOINTS.ORDERS.SELLER_REFUND(storeId, orderId), payload);
}

export interface RecordOrderPaymentPayload {
  amount: number;
  method: 'cash' | 'bank_transfer' | 'other';
  reference?: string;
  note?: string;
}
interface RecordOrderPaymentResponse {
  success: boolean;
  message: string;
  data: { orderId: string; amount: number; totalRecorded: number; remaining: number; fullyPaid: boolean };
}

/** POST /api/orders/record-payment/:storeId/:orderId — real "Record
 *  payments": amount/method/reference/note, supports partial/installment
 *  entries, auto-completes the order once fully covered. */
export function apiRecordOrderPayment(storeId: string, orderId: string, payload: RecordOrderPaymentPayload) {
  return client.post<never, RecordOrderPaymentResponse>(ENDPOINTS.ORDERS.RECORD_PAYMENT(storeId, orderId), payload);
}

export interface OrderPaymentRecordRow {
  _id: string;
  orderId: string;
  storeId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'bank_transfer' | 'other';
  reference: string | null;
  note: string;
  recordedBy: string;
  recordedByRole: 'seller' | 'staff' | 'admin';
  createdAt: string;
}

/** GET /api/orders/payment-records/:storeId/:orderId — the real payment ledger. */
export function apiListOrderPayments(storeId: string, orderId: string) {
  return client.get<never, { success: boolean; data: OrderPaymentRecordRow[] }>(ENDPOINTS.ORDERS.PAYMENT_RECORDS(storeId, orderId));
}

/** POST /api/orders/return-request/:orderId — buyer requests a return on delivered items */
export function apiRequestReturn(orderId: string, payload: ReturnRequestPayload) {
  return client.post<never, ReturnRequestResponse>(ENDPOINTS.ORDERS.RETURN_REQUEST(orderId), payload);
}

/** GET /api/orders/returns — seller's paginated return requests across their store(s) */
export function apiGetSellerReturns(params?: SellerReturnsParams) {
  return client.get<never, SellerReturnsResponse>(ENDPOINTS.ORDERS.SELLER_RETURNS, { params });
}

/** PUT /api/orders/return-action/:orderId — seller approves/rejects a return request */
export function apiReturnAction(orderId: string, payload: ReturnActionPayload) {
  return client.put<never, ReturnActionResponse>(ENDPOINTS.ORDERS.RETURN_ACTION(orderId), payload);
}

/** GET /api/orders/get-download-link — issues a short-lived (10 min) download token for a digital file */
export function apiGetDownloadLink(orderId: string, productId: string, fileIndex = 0) {
  return client.get<never, DownloadLinkResponse>(ENDPOINTS.ORDERS.GET_DOWNLOAD_LINK, {
    params: { orderId, productId, fileIndex },
  });
}

/** GET /api/orders/stream-pdf — downloads the (optionally watermark-stamped) PDF as a blob */
export function apiStreamPdf(orderId: string, productId: string, fileIndex = 0) {
  return client.get<never, Blob>(ENDPOINTS.ORDERS.STREAM_PDF, {
    params: { orderId, productId, fileIndex },
    responseType: 'blob',
  });
}
