import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { PaymentSession } from '@/api/services/integrations';
import type { PlacedOrder } from '@/api/services/payment';

/** What the confirmation screens need from an order; manual-method placement returns only the first four. */
export interface PlacedLike {
  orderId: string;
  orderNumber: string;
  currency: string;
  summary: { total: number };
  items?: PlacedOrder['items'];
  paymentMethod?: string;
  isPaid?: boolean;
  deliveryAddress?: PlacedOrder['deliveryAddress'];
}

const withKey = (key: string) => ({ headers: { 'Idempotency-Key': key } });

/** Same endpoints and payloads as the shared services, plus an `Idempotency-Key` so a double tap / retry cannot place twice. */
export function placeCodOrderOnce(checkoutId: string, key: string) {
  return client.post<never, { success?: boolean; data: { orders: PlacedOrder[] } }>(ENDPOINTS.PAYMENT.COD, { checkoutId }, withKey(key));
}

export function placeManualOrderOnce(checkoutId: string, methodId: string, key: string) {
  return client.post<never, { success?: boolean; data: { orders: PlacedLike[] } }>(ENDPOINTS.CHECKOUT.PLACE_MANUAL_METHOD(checkoutId, methodId), undefined, withKey(key));
}

export function initiateGatewayOnce(checkoutId: string, provider: string, returnUrl: string, cancelUrl: string, walletAccount: string | undefined, key: string) {
  return client.post<never, { success?: boolean; data: PaymentSession }>(
    ENDPOINTS.CHECKOUT.INITIATE_PAYMENT_METHOD(checkoutId, provider),
    { returnUrl, cancelUrl, ...(walletAccount ? { walletAccount } : {}) },
    withKey(key),
  );
}
