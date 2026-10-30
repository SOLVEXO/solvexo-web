import { currencySymbol, getCurrencyDecimals } from '@/utils/currency';
import type { PriceRef } from '@/contexts/CurrencyPreferenceContext';
import { activeLocale } from './locale';

export type CurrencyDisplay = 'symbol' | 'code' | 'symbol_code';

// The storefront shows one store, so its seller's price format is kept here (set by StorefrontLayout) and every moneyText call follows it.
let display: CurrencyDisplay = 'symbol';
export function setCurrencyDisplay(next: CurrencyDisplay | null | undefined) { display = next === 'code' || next === 'symbol_code' ? next : 'symbol'; }

/** Formats an amount that is ALREADY in `currency` (never converts), with that currency's own decimals: "$89.00", "Rs 8,900", "KD 12.500". */
export function moneyText(amount: number | null | undefined, currency?: string | null): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  const d = getCurrencyDecimals(currency);
  const symbol = currencySymbol(currency);
  const body = Math.abs(amount).toLocaleString(activeLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });
  const code = String(currency ?? '').toUpperCase();
  const sign = amount < 0 ? '-' : '';
  if (display === 'code' && code) return `${sign}${code} ${body}`;
  if (display === 'symbol_code' && code) return `${sign}${symbol} ${body} ${code}`;
  return `${sign}${symbol} ${body}`;
}

/** The slice of the currency context the display helpers need. */
export interface MoneyConverter {
  currency: string;
  convert: (amount: number, from?: string | null, ref?: PriceRef | null) => number;
  canConvert: (from?: string | null, to?: string) => boolean;
}

/** Converts into the shopper's currency when a rate exists; otherwise keeps the amount in its OWN currency, so the number is always truthful.
 *  `ref` names the catalog item so the market's fixed price (when the seller set one) is shown, exactly what checkout charges. */
export function displayMoney(c: MoneyConverter, amount: number | null | undefined, from: string, ref?: PriceRef | null): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  return c.canConvert(from, c.currency) ? moneyText(c.convert(amount, from, ref), c.currency) : moneyText(amount, from);
}

/** Compare-at ("was") price + "Save N%" for one item. A market's FIXED prices are judged on what the buyer sees
 *  (a fixed compare-at shows even when the store price has none); otherwise the store's own price/compare-at decide. */
export interface SaleInfo { onSale: boolean; percentOff: number; /** Pass to `convert(.., { compare: true })` / `displayMoney` to print the compare-at price. */ compareAmount: number }
export function saleInfo(
  c: MoneyConverter & { fixedPriceFor?: (productId?: string | null, variantId?: string | null) => { price: number; compareAt: number | null } | null },
  price: number | null | undefined,
  compare: number | null | undefined,
  from: string,
  ref?: PriceRef | null,
): SaleInfo {
  const native = price != null && compare != null && compare > price;
  const nativeInfo = { onSale: native, percentOff: native ? Math.round((1 - (price as number) / (compare as number)) * 100) : 0, compareAmount: compare ?? price ?? 0 };
  const fixed = price != null ? c.fixedPriceFor?.(ref?.productId, ref?.variantId) : null;
  if (!fixed || !c.canConvert(from, c.currency)) return nativeInfo;
  const shown = fixed.price;
  const was = fixed.compareAt != null ? fixed.compareAt : compare != null ? c.convert(compare, from, { ...ref, compare: true }) : null;
  if (was == null || !(was > shown)) return { ...nativeInfo, onSale: false, percentOff: 0 };
  return { onSale: true, percentOff: Math.round((1 - shown / was) * 100), compareAmount: compare ?? price ?? 0 };
}

/** A cart line: the UNIT price is converted (fixed market prices are per unit), then multiplied by the quantity, like checkout. */
export interface MoneyLine { amount: number; from: string; unit?: number; qty?: number; ref?: PriceRef | null }
function lineValue(c: MoneyConverter, l: MoneyLine): number {
  return l.unit != null && l.qty != null ? c.convert(l.unit, l.from, l.ref) * l.qty : c.convert(l.amount, l.from);
}

/** Text of one cart line (see `MoneyLine`). */
export function displayMoneyLine(c: MoneyConverter, l: MoneyLine): string {
  return c.canConvert(l.from, c.currency) ? moneyText(lineValue(c, l), c.currency) : moneyText(l.amount, l.from);
}

/** Total of several lines: converted when every line can be, else summed in the first line's own currency (a cart is one store = one currency). */
export function displayMoneySum(c: MoneyConverter, lines: MoneyLine[]): string {
  if (lines.length === 0) return moneyText(0, c.currency);
  if (lines.every(l => c.canConvert(l.from, c.currency))) return moneyText(lines.reduce((s, l) => s + lineValue(c, l), 0), c.currency);
  const own = lines[0].from;
  return moneyText(lines.reduce((s, l) => s + l.amount, 0), own);
}
