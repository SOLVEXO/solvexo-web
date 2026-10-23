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
