import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { OrderTimelineEntry } from './product';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderActionResponse {
  success: boolean;
  message: string;
}

export interface UpdateStatusPayload {
  orderId: string;
  storeId: string;
  status:  'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  tracking?: {
    carrier:        string;
    trackingNumber: string;
    trackingUrl:    string;
  };
  /** Default true. Set false to skip the buyer notification/email. */
  notifyCustomer?: boolean;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type ReturnStatus = 'none' | 'requested' | 'partial_requested' | 'approved' | 'rejected';

export interface BuyerReturnLabel {
  labelUrl:       string | null;
  trackingNumber: string | null;
  trackingUrl:    string | null;
  carrier:        string | null;
  purchasedAt:    string | null;
}

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
  /** Set when the return was resolved by an exchange: the replacement order (buyer-visible). */
  exchangeOrderId?: string | null;
  exchangeOrderNumber?: string | null;
  /** Prepaid return label issued by the seller after approving the return (buyer-safe: link + tracking only). */
  returnLabel?: BuyerReturnLabel | null;
  // Detail-view fields (present on the raw order document's sellerOrders[].items[]).
  _id?:        string;
  variantId?:  string;
  options?:    { name: string; value: string }[];
  taxUSD?:     number;
  couponDiscountUSD?:      number;
  giftCardDiscountUSD?:    number;
  storeCreditDiscountUSD?: number;
  refundedAmount?:         number;
}

export interface OrderStoreGroup {
  storeId:         string;
  fulfillmentType: string;
  status:          string;
  subtotal:        number;
  /** This store's own share of the order's tax — now real (was always 0). */
  taxAmount?:      number;
  itemCount:       number;
  items:           OrderLineItem[];
  /** `label*` fields exist only on orders whose label was bought through Shippo (merchant-only). */
  tracking?:       { carrier: string; trackingNumber: string; trackingUrl: string; labelUrl?: string | null; labelCost?: number | null; labelCurrency?: string | null } | null;
  /** Per-shipment tracking (buyer-safe). Empty/absent → fall back to `tracking`. */
  shipments?:      { _id: string; items: { itemId: string; quantity: number }[]; tracking?: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null } | null; shippedAt?: string | null; deliveredAt?: string | null }[];
  pickupReadyAt?:  string | null;
  shippedAt?:      string | null;
  deliveredAt?:    string | null;
  _id?:            string;
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
  shippingAddress:  Record<string, unknown> | null;
  fulfillmentMethod?: 'ship' | 'pickup';
  pickupLocation?:  { name: string | null; address: string | null; instructions: string | null } | null;
  /** Present when this order is the replacement order of an exchange. */
  exchangeOf?:      { orderId: string; orderNumber: string; itemIds: string[] } | null;
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
  shippingAddress: Record<string, unknown> | null;
  fulfillmentMethod?: 'ship' | 'pickup';
  pickupLocation?: { name: string | null; address: string | null; instructions: string | null } | null;
  sellerOrders:    OrderStoreGroup[];
  exchangeOf?:     { orderId: string; orderNumber: string; itemIds: string[] } | null;
  couponCode?:               string | null;
  couponDiscountTotal?:      number;
  giftCardDiscountTotal?:    number;
  storeCreditDiscountTotal?: number;
  campaignDiscountTotal?:    number;
  autoDiscountTotal?:        number;
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
  exchangeOrderId?:     string | null;
  exchangeOrderNumber?: string | null;
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

export function apiMarkOrderPaid(storeId: string, orderId: string) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.MARK_PAID(storeId, orderId));
}

export function apiUpdateOrderStatus(payload: UpdateStatusPayload) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.UPDATE_STATUS, payload);
}

export interface FulfilOrderPayload {
  items:           { itemId: string; quantity: number }[];
  carrier?:        string;
  trackingNumber?: string;
  trackingUrl?:    string;
  notifyCustomer?: boolean;
}

/** POST /api/orders/fulfil/:storeId/:orderId — Shopify "Fulfil items": one shipment for a subset/quantity of the unfulfilled lines. */
export function apiFulfilOrderItems(storeId: string, orderId: string, payload: FulfilOrderPayload) {
  return client.post<never, OrderApiResponse<{ shipmentId: string; status: string; fullyShipped: boolean }>>(
    ENDPOINTS.ORDERS.FULFIL(storeId, orderId), payload,
  );
}

/** PUT /api/orders/shipment-delivered/:storeId/:orderId/:shipmentId */
export function apiMarkShipmentDelivered(storeId: string, orderId: string, shipmentId: string) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.SHIPMENT_DELIVERED(storeId, orderId, shipmentId));
}

/** PUT /api/orders/purchase-shipping-label — real one-click "mark as
 *  shipped": buys the cheapest live carrier label for this order via the
 *  store's connected Shippo account and marks it shipped with the real
 *  tracking number, no manual entry. Throws with a clear message whenever a
 *  live label genuinely isn't available (see OrdersService.purchaseShippingLabel) —
 *  callers should fall back to the existing manual `apiUpdateOrderStatus`
 *  tracking-number form in that case, not treat it as a hard failure. */
export function apiPurchaseShippingLabel(
  orderId: string,
  storeId: string,
  opts: {
    rateId?: string;
    packageId?: string;
    /** Partial shipment: label (and fulfil) only these lines/quantities. Omit to label the whole order. */
    items?: { itemId: string; quantity: number }[];
    notifyCustomer?: boolean;
  } = {},
) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.PURCHASE_SHIPPING_LABEL, { orderId, storeId, ...opts });
}

export interface LabelRate {
  rateId: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  estimatedDays: number | null;
}

/** GET /api/orders/label-rates/:storeId/:orderId — real carrier rates for this order (cheapest first). */
export function apiGetLabelRates(storeId: string, orderId: string, packageId?: string, items?: { itemId: string; quantity: number }[]) {
  const params: Record<string, string> = {};
  if (packageId) params.packageId = packageId;
  // Partial shipment: weigh only these lines — "itemId:qty,itemId:qty".
  if (items && items.length > 0) params.items = items.map(i => `${i.itemId}:${i.quantity}`).join(',');
  return client.get<never, { success: boolean; data: { rates: LabelRate[] } }>(
    ENDPOINTS.ORDERS.LABEL_RATES(storeId, orderId),
    { params: Object.keys(params).length > 0 ? params : undefined },
  );
}

/** GET /api/orders/return-label-rates/:storeId/:orderId — carrier rates for a return label (buyer -> store). */
export function apiGetReturnLabelRates(storeId: string, orderId: string, itemIds: string[], packageId?: string) {
  return client.get<never, { success: boolean; data: { rates: LabelRate[] } }>(
    ENDPOINTS.ORDERS.RETURN_LABEL_RATES(storeId, orderId),
    { params: { itemIds: itemIds.join(','), ...(packageId ? { packageId } : {}) } },
  );
}

/** PUT /api/orders/purchase-return-label — buys the return label for approved returned lines and emails the buyer. */
export function apiPurchaseReturnLabel(
  storeId: string,
  orderId: string,
  payload: { itemIds: string[]; rateId?: string; packageId?: string; notifyCustomer?: boolean },
) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.PURCHASE_RETURN_LABEL, { storeId, orderId, ...payload });
}

/** PUT /api/orders/tracking/:storeId/:orderId — edit the single tracking of an old shipped order (no per-shipment tracking). */
export function apiUpdateOrderTracking(storeId: string, orderId: string, payload: { carrier?: string; trackingNumber?: string; trackingUrl?: string }) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.TRACKING(storeId, orderId), payload);
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

/** GET /api/orders/status/:token — public "Order status page" (no login).
 *  The token is the unguessable one from the order confirmation email; the
 *  response is a buyer-safe order document (same shape as `OrderDetail`). */
export function apiGetOrderByStatusToken(token: string) {
  return client.get<never, OrderDetailResponse>(`/api/orders/status/${encodeURIComponent(token)}`);
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

/** `refundTo` defaults to the original payment method when omitted. */
export interface RefundOrderPayload { amount: number; reason?: string; refundTo?: 'original' | 'store_credit' }
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

/** GET /api/orders/status-link/:orderId — signed token for the public order-status page (`/order-status/:token`). */
export function apiGetOrderStatusLink(orderId: string) {
  return client.get<never, { success: boolean; data: { token: string } }>(ENDPOINTS.ORDERS.STATUS_LINK(orderId));
}

// ── Order editing / timeline / notes / shipping address (seller) ─────────────

interface OrderApiResponse<T> { success: boolean; message: string; data: T }

export interface EditOrderPayload {
  changes?:   { itemId: string; quantity: number }[];
  additions?: { variantId: string; quantity: number }[];
  dryRun?:    boolean;
  refundTo?:  'original' | 'store_credit';
  reason?:    string;
}
export interface EditOrderResult {
  oldTotal:     number;
  newTotal:     number;
  delta:        number;
  currency:     string;
  refundAmount: number;
  amountDue:    number;
  lines:        string[];
  refundNote?:  string;
}

/** POST /api/orders/edit/:storeId/:orderId — `dryRun: true` only previews. */
export function apiEditOrder(storeId: string, orderId: string, payload: EditOrderPayload) {
  return client.post<never, OrderApiResponse<EditOrderResult>>(ENDPOINTS.ORDERS.EDIT(storeId, orderId), payload);
}

// ── Exchanges (seller) ───────────────────────────────────────────────────────

export interface CreateExchangePayload {
  returnItemIds: string[];
  replacements:  { variantId: string; quantity: number }[];
  refundTo?:     'original' | 'store_credit';
  restock?:      'restock' | 'damaged' | 'none';
  dryRun?:       boolean;
  note?:         string;
}
export interface ExchangeResult {
  currency:            string;
  returnedValue:       number;
  credit:              number;
  creditShortfall:     number;
  replacementSubtotal: number;
  replacementTax:      number;
  replacementValue:    number;
  /** > 0 the customer owes it, < 0 the store refunds it. */
  difference:          number;
  amountDue:           number;
  refundDue:           number;
  outcome:             'charge' | 'refund' | 'even';
  lines:               { variantId: string; name: string; quantity: number; unitPrice: number; total: number }[];
  exchangeOrderId?:     string;
  exchangeOrderNumber?: string;
  refundNote?:          string;
}

/** POST /api/orders/exchange/:storeId/:orderId — `dryRun: true` only previews the money. */
export function apiCreateExchange(storeId: string, orderId: string, payload: CreateExchangePayload) {
  return client.post<never, OrderApiResponse<ExchangeResult>>(ENDPOINTS.ORDERS.EXCHANGE(storeId, orderId), payload);
}

/** POST /api/orders/timeline/:storeId/:orderId */
export function apiAddOrderComment(storeId: string, orderId: string, message: string) {
  return client.post<never, OrderApiResponse<OrderTimelineEntry>>(ENDPOINTS.ORDERS.TIMELINE(storeId, orderId), { message });
}

/** PATCH /api/orders/note/:storeId/:orderId */
export function apiUpdateOrderNote(storeId: string, orderId: string, note: string) {
  return client.patch<never, OrderApiResponse<{ note: string }>>(ENDPOINTS.ORDERS.NOTE(storeId, orderId), { note });
}

export interface OrderShippingAddressPayload {
  recipientName: string;
  phoneNumber:   string;
  addressLine1:  string;
  addressLine2?: string;
  city:          string;
  state:         string;
  zipCode:       string;
  country?:      string;
}

/** PATCH /api/orders/shipping-address/:storeId/:orderId */
export function apiUpdateOrderShippingAddress(storeId: string, orderId: string, payload: OrderShippingAddressPayload) {
  return client.patch<never, OrderApiResponse<OrderShippingAddressPayload>>(ENDPOINTS.ORDERS.SHIPPING_ADDRESS(storeId, orderId), payload);
}
