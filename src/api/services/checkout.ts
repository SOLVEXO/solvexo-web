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
  originalPrice?:          number | null;
  subscriberDiscountUSD?:  number;
  couponDiscountUSD?:      number;
  campaignId?:             string | null;
  campaignDiscountUSD?:    number;
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
  subscriberSavingsUSD?: number;
  couponCode?:       string | null;
  couponDiscountUSD?: number;
  campaignDiscountTotalUSD?: number;
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
  subscriberSavingsUSD?: number;
  campaignDiscountUSD?: number;
  /** Only meaningful for a mixed physical+digital cart — see `allowedPaymentMethods`'s 'split' option. */
  digitalSubtotal?:  number;
  physicalSubtotal?: number;
}

export interface AppliedCampaign {
  campaignId: string;
  name:       string;
  storeId:    string;
  discountUSD: number;
}

export interface ApplyCouponPayload { checkoutId: string; code: string }

export interface ApplyCouponData {
  checkoutId: string;
  couponCode: string;
  couponDiscountUSD: number;
  totalAmount: number;
  digitalSubtotal?:  number;
  physicalSubtotal?: number;
}

interface ApplyCouponResponse { success: boolean; message: string; data: ApplyCouponData }

export interface RemoveCouponData {
  checkoutId: string;
  totalAmount: number;
  digitalSubtotal?:  number;
  physicalSubtotal?: number;
}
interface RemoveCouponResponse { success: boolean; message: string; data: RemoveCouponData }

export interface SubscriptionSavingsHint {
  storeId: string; storeName: string; storeSlug: string; planId: string; planName: string; potentialSavingsUSD: number;
}

export interface CreateCheckoutPayload {
  addressId?:      string;
  shippingZoneId?: string;
}

interface CreateCheckoutResponse {
  success: boolean;
  message: string;
  data: {
    checkout:               Checkout;
    allowedPaymentMethods:  string[];
    summary:                CheckoutSummary;
    subscriptionSavingsHints: SubscriptionSavingsHint[];
    appliedCampaigns:       AppliedCampaign[];
  };
}

export interface AddShippingPayload {
  checkoutId:    string;
  shippingZoneId: string;
}

export interface AddShippingData {
  checkoutId:    string;
  shippingZoneId: string;
  shippingFee:   number;
  subtotal:      number;
  totalAmount:   number;
  digitalSubtotal?:  number;
  physicalSubtotal?: number;
}

interface AddShippingResponse {
  success: boolean;
  message: string;
  data:    AddShippingData;
}

interface DeleteCheckoutResponse {
  success: boolean;
  message: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export function apiCreateCheckout(payload: CreateCheckoutPayload) {
  return client.post<never, CreateCheckoutResponse>(ENDPOINTS.CHECKOUT.CREATE, payload);
}

export function apiAddShippingToCheckout(payload: AddShippingPayload) {
  return client.post<never, AddShippingResponse>(
    ENDPOINTS.CHECKOUT.ADD_SHIPPING_ZONE_IN_CHECKOUT,
    payload,
  );
}

export function apiDeleteCheckout(checkoutId: string) {
  return client.delete<never, DeleteCheckoutResponse>(
    `${ENDPOINTS.CHECKOUT.DELETE_CHECKOUT}/${checkoutId}`,
  );
}

export function apiApplyCoupon(payload: ApplyCouponPayload) {
  return client.post<never, ApplyCouponResponse>(ENDPOINTS.CHECKOUT.APPLY_COUPON, payload);
}

export function apiRemoveCoupon(checkoutId: string) {
  return client.delete<never, RemoveCouponResponse>(ENDPOINTS.CHECKOUT.REMOVE_COUPON(checkoutId));
}
