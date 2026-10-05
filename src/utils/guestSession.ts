import { isGuestUser, startAndSaveGuestSession, TokenStorage } from '@/api/services/auth';
import { getCurrentStorefrontStoreId, getStorefrontGuestCheckout } from '@/utils/currentStorefront';

let inFlight: Promise<boolean> | null = null;

/** True when the visitor has no session and the current store allows guest checkout. */
export function canStartGuestSession(): boolean {
  return !TokenStorage.isLoggedIn() && getStorefrontGuestCheckout() && !!getCurrentStorefrontStoreId();
}

/** A REAL account session (not a guest-checkout one). */
export function hasRealAccount(): boolean {
  return TokenStorage.isLoggedIn() && !isGuestUser();
}

/**
 * Makes sure there is some session for cart/checkout actions: resolves true when one exists (or was just started
 * as a guest session), false when the store requires accounts / the call failed (caller falls back to login).
 */
export function ensureGuestSession(): Promise<boolean> {
  if (TokenStorage.isLoggedIn()) return Promise.resolve(true);
  if (!canStartGuestSession()) return Promise.resolve(false);
  if (!inFlight) {
    inFlight = startAndSaveGuestSession(getCurrentStorefrontStoreId()!)
      .then(() => true)
      .catch(() => false)
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}
