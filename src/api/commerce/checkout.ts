import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CheckoutItem {
  productId:    string;
  variantId:    string;
  sellerId:     string;
  storeId:      string;
  type:         string;
  name:         string;
  image:        string | null;
  sku:          string;
  size:         string | null;
  color:        string | null;
  licenseType:  string | null;
  quantity:     number;
  price:        number;
  totalPrice:   number;
}

export interface Checkout {
  _id:               string;
  userId:            string;
  addressId:         string;
  currency:          string;
  items:             CheckoutItem[];
  shippingZoneId:    string | null;
  paymentType:       string | null;
  paymentMethodId:   string | null;
  subtotal:          number;
  shippingFee:       number;
  taxAmount:         number;
  totalAmount:       number;
  status:            string;
  expiredAt:         string;
  isDelete:          boolean;
  createdAt:         string;
  updatedAt:         string;
}

export interface CheckoutSummary {
  subtotal:    number;
  shippingFee: number;
  taxAmount:   number;
  totalAmount: number;
}

export interface CreateCheckoutPayload {
  addressId:      string;
  shippingZoneId?: string;
}

interface CreateCheckoutResponse {
  success: boolean;
  message: string;
  data: {
    checkout:               Checkout;
    allowedPaymentMethods:  string[];
    summary:                CheckoutSummary;
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

export function apiCreateCheckout(payload: CreateCheckoutPayload) {
  return client.post<never, CreateCheckoutResponse>(ENDPOINTS.CHECKOUT.CREATE, payload);
}
