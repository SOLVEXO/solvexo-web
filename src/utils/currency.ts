// ── Currency symbol lookup ────────────────────────────────────────────────────
// Orders/Checkouts carry a real `currency` code from the backend (e.g. "USD",
// "PKR"). This maps known codes to their display symbol so pages don't need to
// hardcode a single currency across the whole app. Falls back to the code
// itself (e.g. an unrecognized ISO code) so nothing silently disappears.

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: 'Rs',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'AED',
  CAD: 'CA$',
  AUD: 'AU$',
};

export function currencySymbol(code?: string | null): string {
  if (!code) return '$';
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;
}

/** Formats an amount with the correct symbol for a given currency code. */
export function formatMoney(amount: number, code?: string | null): string {
  return `${currencySymbol(code)} ${amount.toLocaleString()}`;
}

/** Same abbreviation style as the admin analytics `formatCurrency` helper
 *  (K/M suffixes) but with the correct symbol for [code] instead of always
 *  hardcoding "$" — for admin finance figures that must stay currency-aware
 *  (a PKR total should never render with a $ prefix). */
export function formatMoneyCompact(amount: number | null | undefined, code?: string | null): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  const symbol = currencySymbol(code);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(1)}k`;
  return `${sign}${symbol}${abs.toFixed(2)}`;
}
