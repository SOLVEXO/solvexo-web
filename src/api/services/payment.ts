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
 *  for a checkout. Returns a clientSecret for Stripe Elements/PaymentElement. */
export function apiInitiatePayment(payload: { checkoutId: string }) {
  return client.post<never, InitiatePaymentResponse>(ENDPOINTS.PAYMENT.INITIATE_PAYMENT, payload);
}

/** GET /api/payment/status — poll after stripe.confirmPayment() resolves client-side.
 *  Actively re-checks Stripe and finalizes the order if the webhook hasn't landed yet. */
export function apiGetPaymentStatus(checkoutId: string) {
  return client.get<never, PaymentStatusResponse>(`${ENDPOINTS.PAYMENT.STATUS}?checkoutId=${checkoutId}`);
}
