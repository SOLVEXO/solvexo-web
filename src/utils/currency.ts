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

// Zero-decimal currencies — mirrors the backend's ISO-4217 metadata table
// (solvexo-api/src/common/currency-metadata.const.ts). PKR is a deliberate
// Solvexo pricing-convention override (real ISO-4217 says 2 decimals, but
// Pakistani retail never prices in paisas) — kept exactly as this app has
// always priced it, not a regression. Small, static reference data, safe to
// mirror on both sides without a shared package.
const ZERO_DECIMAL_CURRENCIES = new Set([
  'PKR', 'JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF', 'BIF', 'DJF', 'GNF',
  'KMF', 'PYG', 'RWF', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF',
]);

/** How many decimal places a given currency actually prices in on this
 *  platform — used anywhere a display conversion rounds an amount, so a
 *  real zero-decimal currency (or PKR, by this platform's own convention)
 *  never shows a fake ".00". */
export function getCurrencyDecimals(code?: string | null): number {
  if (!code) return 2;
  return ZERO_DECIMAL_CURRENCIES.has(code.toUpperCase()) ? 0 : 2;
}

/** Formats a plain number to always show exactly 2 decimals with thousands
 *  separators (e.g. `2999.9` → `2,999.90`, `134.1` → `134.10`) — pairs with
 *  `currencySymbol()` at call sites that build their own `{symbol}{amount}`
 *  string rather than using `formatMoney`. Fixes the inconsistency where a
 *  bare `.toLocaleString()` silently drops a trailing zero. */
export function fmt2(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
