const key = (checkoutId: string) => `maison:buy-now:${checkoutId}`;

/** Remembers that a checkout was a one-line "buy it now", so the gateway return page does not empty the whole cart. */
export function markBuyNowCheckout(checkoutId: string): void {
  try { sessionStorage.setItem(key(checkoutId), '1'); } catch { /* private mode: falls back to clearing the cart */ }
}

export function isBuyNowCheckout(checkoutId: string): boolean {
  try { return sessionStorage.getItem(key(checkoutId)) === '1'; } catch { return false; }
}
