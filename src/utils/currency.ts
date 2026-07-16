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
