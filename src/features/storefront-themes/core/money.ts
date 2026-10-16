import { currencySymbol, getCurrencyDecimals } from '@/utils/currency';

/** Formats an amount that is ALREADY in `currency` (never converts), with that currency's own decimals: "$89.00", "Rs 8,900", "KD 12.500". */
export function moneyText(amount: number | null | undefined, currency?: string | null): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  const d = getCurrencyDecimals(currency);
  const symbol = currencySymbol(currency);
  const body = Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const gap = /^[A-Za-z]/.test(symbol) ? ' ' : '';
  return `${amount < 0 ? '-' : ''}${symbol}${gap}${body}`;
}
