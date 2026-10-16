import { getCurrencyDecimals } from '@/utils/currency';
import type { AddressPayload } from '@/api/services/address';

import { moneyText } from '../money';
export { moneyText };

/** Rounds to the currency's minor unit. */
export function roundMoney(amount: number, currency?: string | null): number {
  const f = 10 ** getCurrencyDecimals(currency);
  return Math.round((amount + Number.EPSILON) * f) / f;
}

export interface SummaryInput {
  currency: string;
  subtotal: number;
  shipping: number;
  tax: number;
  coupon: number;
  giftCard: number;
  storeCredit: number;
  /** The backend-authoritative total (kept in sync by every apply / remove / shipping response). */
  total: number;
}

export interface SummaryRows {
  /** Tax to show: the last known tax, corrected when a coupon re-quoted it on the server. */
  tax: number;
  /** Left-over difference between the rows and the authoritative total (shown only when it is real). */
  adjustment: number;
}

/**
 * The server is the only source of truth for the total. The rows we show must add up to it, so any leftover
 * difference is attributed honestly: to tax when the store charges tax (a coupon makes the server re-quote it
 * and the apply response does not carry the new figure), otherwise to a visible "Adjustments" row.
 */
export function reconcileSummary(s: SummaryInput): SummaryRows {
  const unit = 1 / 10 ** getCurrencyDecimals(s.currency);
  const expected = s.subtotal + s.shipping + s.tax - s.coupon - s.giftCard - s.storeCredit;
  const residual = roundMoney(s.total - expected, s.currency);
  if (Math.abs(residual) < unit - 1e-9) return { tax: s.tax, adjustment: 0 };
  if (s.tax > 0 && s.tax + residual >= 0) return { tax: roundMoney(s.tax + residual, s.currency), adjustment: 0 };
  return { tax: s.tax, adjustment: residual };
}

/** `?buyNow=productId:variantId` -> the single line to check out, or null. */
export function parseBuyNow(raw: string | null | undefined): { productId: string; variantId: string } | null {
  if (!raw) return null;
  const [productId, variantId] = raw.split(':');
  return productId && variantId ? { productId, variantId } : null;
}

/** Stable text for "what is in the cart" so a changed cart re-creates the checkout. */
export function cartSignature(items: { productVariantId: string; quantity: number }[]): string {
  return items.map(i => `${i.productVariantId}x${i.quantity}`).sort().join(',');
}

/** The checkout expired / was completed / was cancelled while the buyer was on the page. */
export function isStaleCheckoutError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /expired|no longer (valid|available|active)|already (been )?(completed|paid|placed|processed)|cancell?ed|checkout not found|not found or/i.test(message);
}

/** One key per place-order attempt (kept while in flight / after success, dropped on failure so a retry is a new attempt). */
export function newAttemptKey(prefix: string, checkoutId: string): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${checkoutId}-${rand}`;
}

export type AddressErrors = Partial<Record<'recipientName' | 'phoneNumber' | 'addressLine1' | 'city' | 'state' | 'zipCode' | 'country', string>>;

export function validateAddress(a: AddressPayload): AddressErrors {
  const e: AddressErrors = {};
  if (!a.recipientName.trim()) e.recipientName = 'Enter the recipient name.';
  const digits = a.phoneNumber.replace(/\D/g, '');
  if (!a.phoneNumber.trim()) e.phoneNumber = 'Enter a phone number.';
  else if (digits.length < 5) e.phoneNumber = 'Enter a valid phone number.';
  if (!a.addressLine1.trim()) e.addressLine1 = 'Enter the street address.';
  if (!a.city.trim()) e.city = 'Enter the city.';
  if (!a.state.trim()) e.state = 'Enter the state or province.';
  if (!a.zipCode.trim()) e.zipCode = 'Enter the postal code.';
  if (!(a.country ?? '').trim()) e.country = 'Select a country.';
  return e;
}

/** Sum of the placed orders' totals (each order is in its own permanent currency; the first one labels the sum). */
export function placedTotal(orders: { currency: string; summary: { total: number } }[]): { amount: number; currency: string } {
  return { amount: orders.reduce((s, o) => s + (o.summary?.total ?? 0), 0), currency: orders[0]?.currency ?? 'USD' };
}
