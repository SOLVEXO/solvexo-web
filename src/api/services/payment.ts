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

// ── API ───────────────────────────────────────────────────────────────────────

export function apiPlaceCodOrder(payload: CodPaymentPayload) {
  return client.post<never, CodPaymentResponse>(ENDPOINTS.PAYMENT.COD, payload);
}

export function apiPlaceOrder(payload: CodPaymentPayload) {
  return client.post<never, CodPaymentResponse>(ENDPOINTS.PAYMENT.PLACE_ORDER, payload);
}
