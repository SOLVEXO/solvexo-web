// A shareable discount link (https://store/discount/CODE) remembers the code in the visitor's browser; checkout then applies it
// by itself — the buyer never has to type anything (Shopify: "the discount applies at the customer's next checkout").
// One key per browser is enough: every store has its own host (subdomain or custom domain), so storage is already per store.

const KEY = 'solvexo:discount-code';
const CODE_RE = /^[A-Za-z0-9_-]{1,40}$/;

export function isValidDiscountCode(code: string | null | undefined): code is string {
  return !!code && CODE_RE.test(code);
}

export function saveDiscountCode(code: string): void {
  if (!isValidDiscountCode(code)) return;
  try { localStorage.setItem(KEY, code.toUpperCase()); } catch { /* storage blocked: the link just redirects */ }
}

export function readSavedDiscountCode(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return isValidDiscountCode(v) ? v : null;
  } catch { return null; }
}

export function clearSavedDiscountCode(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Only same-site paths are followed after the link, never an outside address. */
export function safeRedirectPath(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\') ? raw : '/';
}
