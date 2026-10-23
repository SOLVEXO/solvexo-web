import { currencySymbol, getCurrencyDecimals } from '@/utils/currency';
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
  const gap = /^[A-Za-z]/.test(symbol) ? ' ' : '';
  if (display === 'symbol_code' && code) return `${sign}${symbol}${gap}${body} ${code}`;
  return `${sign}${symbol}${gap}${body}`;
}

/** The slice of the currency context the display helpers need. */
export interface MoneyConverter {
  currency: string;
  convert: (amount: number, from?: string | null) => number;
  canConvert: (from?: string | null, to?: string) => boolean;
}

/** Converts into the shopper's currency when a rate exists; otherwise keeps the amount in its OWN currency, so the number is always truthful. */
export function displayMoney(c: MoneyConverter, amount: number | null | undefined, from: string): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  return c.canConvert(from, c.currency) ? moneyText(c.convert(amount, from), c.currency) : moneyText(amount, from);
}

/** Total of several lines: converted when every line can be, else summed in the first line's own currency (a cart is one store = one currency). */
export function displayMoneySum(c: MoneyConverter, lines: { amount: number; from: string }[]): string {
  if (lines.length === 0) return moneyText(0, c.currency);
  if (lines.every(l => c.canConvert(l.from, c.currency))) return moneyText(lines.reduce((s, l) => s + c.convert(l.amount, l.from), 0), c.currency);
  const own = lines[0].from;
  return moneyText(lines.reduce((s, l) => s + l.amount, 0), own);
}
