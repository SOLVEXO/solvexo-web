// ── Currency symbol lookup ────────────────────────────────────────────────────
// Orders/Checkouts carry a real `currency` code from the backend (e.g. "USD",
// "PKR"). This maps known codes to their display symbol so pages don't need to
// hardcode a single currency across the whole app. Falls back to the code
// itself (e.g. an unrecognized ISO code) so nothing silently disappears.

// The platform's backend now supports every real ISO-4217 currency an admin
// enables (AdminConfigService.getEnabledCurrencies/enableAllCurrencies) —
// not just this original 8. A currency with no entry here still displays
// correctly (falls back to its own code, e.g. "SEK 1,234" instead of a
// symbol), it just won't have a pretty glyph — this list covers every
// currency that has a widely-recognized one, so it stays worth extending
// rather than a hard requirement for a currency to work.
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', PKR: 'Rs', EUR: '€', GBP: '£', INR: '₹', AED: 'AED',
  CAD: 'CA$', AUD: 'AU$', JPY: '¥', CNY: '¥', KRW: '₩', THB: '฿',
  VND: '₫', IDR: 'Rp', MYR: 'RM', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$',
  CHF: 'Fr', SEK: 'kr', NOK: 'kr', DKK: 'kr', ISK: 'kr', PLN: 'zł',
  TRY: '₺', ZAR: 'R', BRL: 'R$', MXN: 'Mex$', ILS: '₪', SAR: 'SR',
  QAR: 'QR', KWD: 'KD', BHD: 'BD', OMR: 'OMR', JOD: 'JD', EGP: 'E£',
  NGN: '₦', KES: 'KSh', GHS: 'GH₵', PHP: '₱', BDT: '৳', LKR: 'Rs',
  NPR: 'Rs', VES: 'Bs', ARS: '$', CLP: '$', COP: '$', PEN: 'S/',
  UAH: '₴', RUB: '₽', CZK: 'Kč', HUF: 'Ft', RON: 'lei', BGN: 'лв',
  TWD: 'NT$', MAD: 'DH', TND: 'DT', DZD: 'DA', IQD: 'ID', LBP: 'L£',
};

export function currencySymbol(code?: string | null): string {
  if (!code) return '$';
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;
}

// Mirrors the backend's authoritative ISO-4217 metadata table
// (solvexo-api/src/common/currency-metadata.const.ts) exactly — zero-decimal
// currencies (never show cents) and the small set of real three-decimal
// currencies (KWD/BHD/OMR/... price to a sub-cent minor unit). PKR is a
// deliberate Solvexo pricing-convention override (real ISO-4217 says 2
// decimals, but Pakistani retail never prices in paisas) — kept exactly as
// this app has always priced it, not a regression. Small, static reference
// data, safe to mirror on both sides without a shared package — but it must
// stay a mirror: a currency added to the backend table with a non-default
// decimals value needs the same update here, or its price will just round
// to the (wrong) 2-decimal default rather than error out.
const ZERO_DECIMAL_CURRENCIES = new Set([
  'PKR', 'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG',
  'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);
const THREE_DECIMAL_CURRENCIES = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

/** How many decimal places a given currency actually prices in on this
 *  platform — used anywhere a display conversion rounds an amount, so a
 *  real zero- or three-decimal currency (or PKR, by this platform's own
 *  convention) never shows the wrong number of digits. */
export function getCurrencyDecimals(code?: string | null): number {
  if (!code) return 2;
  const upper = code.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(upper)) return 3;
  return 2;
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
  // Below 1,000 — the only range where the real per-currency precision
  // actually matters visually (a JPY/KRW total should never show a fake
  // ".00", a KWD/BHD/OMR one needs its real 3rd decimal) — the abbreviated
  // K/M branches above stay at their existing fixed precision, matching
  // this function's original look for large figures.
  return `${sign}${symbol}${abs.toFixed(getCurrencyDecimals(code))}`;
}
