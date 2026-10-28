import { moneyText } from '../money';

/** Amount in its OWN currency (no conversion). Used where the figure was or will be charged in that exact currency
 *  (placed orders, gift card purchases), so the page never disagrees with the receipt or the card charge.
 *  Same symbol spacing, decimals and price format as every other storefront price ("AED 12.00", "$9.99", "Rs 8,900"). */
export function nativeMoney(amount: number | null | undefined, currency?: string | null): string {
  return moneyText(amount ?? 0, currency);
}

/** Whole-number variant for round denominations (gift card amounts). */
export function nativeMoneyShort(amount: number, currency?: string | null): string {
  return moneyText(amount, currency);
}
