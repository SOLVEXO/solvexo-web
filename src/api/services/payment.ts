import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CodPaymentPayload {
  checkoutId: string;
}

export interface OrderDeliveryAddress {
  recipientName: string;
  phoneNumber:   string;
  addressLine1:  string;
  addressLine2:  string | null;
  city:          string;
  state:         string;
  zipCode:       string;
}

export interface OrderItem {
  name:         string;
  image:        string | null;
  sku:          string;
  productId?:   string;
  quantity:     number;
  price:        number;
  totalPrice:   number;
  type:         string;
  downloadUrl?: string;
}

export interface OrderSummary {
  subtotal: number;
  shipping: number;
  total:    number;
}

export interface PlacedOrder {
  orderId:         string;
  orderNumber:     string;
  orderDate:       string;
  paymentDate:     string | null;
  paymentMethod:   string;
  isPaid:          boolean;
  orderStatus:     string;
  /** The currency this order was actually placed/charged in — permanent,
   *  never re-derived from the buyer's current display preference. */
  currency:        string;
  deliveryAddress: OrderDeliveryAddress;
  items:           OrderItem[];
  summary:         OrderSummary;
}

interface CodPaymentResponse {
  success: boolean;
  message: string;
  data: {
    orders: PlacedOrder[];
  };
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    clientSecret:    string;
    paymentIntentId: string;
    amount:          number;
    currency:        string;
  };
}

export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    status: PaymentStatus;
    orders: PlacedOrder[];
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

export function apiPlaceCodOrder(payload: CodPaymentPayload) {
  return client.post<never, CodPaymentResponse>(ENDPOINTS.PAYMENT.COD, payload);
}

/** POST /api/payment/initiate-payment — creates (or reuses) a Stripe PaymentIntent
 *  for a checkout. Returns a clientSecret for Stripe Elements/PaymentElement.
 *  `paymentMode: 'split'` (mixed carts only) charges just the digital-items
 *  subtotal now, leaving the physical items to be settled via COD. Omit or
 *  pass 'full' to charge the whole checkout, same as before this existed. */
export function apiInitiatePayment(payload: { checkoutId: string; paymentMode?: 'full' | 'split' }) {
  return client.post<never, InitiatePaymentResponse>(ENDPOINTS.PAYMENT.INITIATE_PAYMENT, payload);
}

/** GET /api/payment/status — poll after stripe.confirmPayment() resolves client-side.
 *  Actively re-checks Stripe and finalizes the order if the webhook hasn't landed yet. */
export function apiGetPaymentStatus(checkoutId: string) {
  return client.get<never, PaymentStatusResponse>(`${ENDPOINTS.PAYMENT.STATUS}?checkoutId=${checkoutId}`);
}

/** GET /api/payment/disputes/:storeId/open-count — seller-facing "Needs Attention"
 *  signal: how many orders currently have an open Stripe dispute genuinely awaiting
 *  the seller's evidence response (mirrors Shopify Home's "Submit evidence for
 *  chargebacks" order task) — real Stripe dispute-status tracking, not a cosmetic count. */
export function apiGetOpenDisputeCount(storeId: string) {
  return client.get<never, { success: boolean; data: { count: number } }>(ENDPOINTS.PAYMENT.OPEN_DISPUTE_COUNT(storeId));
}

export interface DisputeRow {
  disputeId: string;
  status: string;
  reason: string | null;
  amount: number;
  currency: string;
  storeIds: string[];
  evidenceDueBy: string | null;
  createdAt: string;
  updatedAt: string;
  orderIds: string[];
  stripePaymentIntentId: string | null;
}

/** GET /api/payment/disputes/:storeId — the full disputes list/detail view
 *  (real Stripe data, not just the count) — see PaymentService.listDisputes. */
export function apiListDisputes(storeId: string, status?: string) {
  return client.get<never, { success: boolean; data: DisputeRow[] }>(ENDPOINTS.PAYMENT.DISPUTES_LIST(storeId, status));
}

export interface SubmitDisputeEvidencePayload {
  productDescription?: string;
  customerCommunication?: string;
  shippingDocumentation?: string;
  uncategorizedText?: string;
}

/** POST /api/payment/disputes/:storeId/:disputeId/evidence — files real
 *  evidence with Stripe (`submit:true`), not a local-only acknowledgement. */
export function apiSubmitDisputeEvidence(storeId: string, disputeId: string, payload: SubmitDisputeEvidencePayload) {
  return client.post<never, { success: boolean; message: string }>(ENDPOINTS.PAYMENT.DISPUTE_SUBMIT_EVIDENCE(storeId, disputeId), payload);
}

/** GET /api/payment/risk-orders/:storeId/open-count — mirrors Shopify Home's
 *  "Review high-risk orders" order task, backed by Stripe Radar's own real
 *  fraud-risk assessment (PaymentTransaction.riskLevel), not an invented score. */
export function apiGetHighRiskOrderCount(storeId: string) {
  return client.get<never, { success: boolean; data: { count: number } }>(ENDPOINTS.PAYMENT.HIGH_RISK_ORDER_COUNT(storeId));
}

/** POST /api/payment/orders/:orderId/capture — real "Capture Payment" action for a manual-capture store's authorized order. `amountToCapture` omitted = full authorized amount; passed = a real Stripe partial capture (the remainder is released back to the buyer). */
export function apiCaptureOrderPayment(orderId: string, amountToCapture?: number) {
  return client.post<never, { success: boolean; data: { captured: boolean; orderIds: string[]; capturedAmount: number } }>(
    ENDPOINTS.PAYMENT.CAPTURE_ORDER(orderId),
    amountToCapture != null ? { amountToCapture } : {},
  );
}

/** GET /api/payment/orders/:storeId/awaiting-capture-count — real count for the store dashboard's "Needs Attention" card (Store.paymentCaptureMethod === 'manual' orders still authorized, not yet captured). */
export function apiGetAwaitingCaptureCount(storeId: string) {
  return client.get<never, { success: boolean; data: { count: number } }>(ENDPOINTS.PAYMENT.AWAITING_CAPTURE_COUNT(storeId));
}
