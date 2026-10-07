// The store the visitor is currently browsing. StorefrontLayout publishes it; code that lives OUTSIDE the
// storefront React context (e.g. the global AuthGateModal / social-login hook mounted in RootLayout) reads it so
// a buyer signs in to THIS store's account (buyer accounts are per store) instead of the legacy global one.
let currentStoreId: string | null = null;

export function setCurrentStorefrontStoreId(storeId: string | null) { currentStoreId = storeId; }
export function getCurrentStorefrontStoreId(): string | undefined { return currentStoreId ?? undefined; }

// Whether the current store lets visitors check out without an account (Shopify "Customer accounts" setting).
// Published by StorefrontLayout next to the store id, for code outside the storefront context (AuthGateContext).
let currentGuestCheckout = false;

export function setStorefrontGuestCheckout(enabled: boolean) { currentGuestCheckout = enabled; }
export function getStorefrontGuestCheckout(): boolean { return currentGuestCheckout; }

// Password-page access token (Shopify storefront password). Minted by POST api/store/:storeId/storefront-password/verify,
// kept per tab (sessionStorage; every access wrapped — it can throw in private mode) and sent by the axios client as
// `x-storefront-token` for the store currently being browsed. The server enforces it; this is only transport.
const tokenKey = (storeId: string) => `storefront_token_${storeId}`;
export function getStorefrontToken(storeId: string | null | undefined): string | null {
  if (!storeId) return null;
  try { return sessionStorage.getItem(tokenKey(storeId)); } catch { return null; }
}
export function setStorefrontToken(storeId: string, token: string | null) {
  try {
    if (token) sessionStorage.setItem(tokenKey(storeId), token); else sessionStorage.removeItem(tokenKey(storeId));
  } catch { /* storage unavailable */ }
}
