import { currencySymbol, fmt2 } from '@/utils/currency';

/** Amount in its OWN currency (no conversion). Used where the figure was or will be charged in that exact currency
 *  (placed orders, gift card purchases), so the page never disagrees with the receipt or the card charge. */
export function nativeMoney(amount: number | null | undefined, currency?: string | null): string {
  return `${currencySymbol(currency)}${fmt2(amount ?? 0)}`;
}

/** Whole-number variant for round denominations (gift card amounts). */
export function nativeMoneyShort(amount: number, currency?: string | null): string {
  return `${currencySymbol(currency)}${amount.toLocaleString()}`;
}
