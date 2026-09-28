/** Affiliate referral attribution — the storefront half of the affiliate
 *  program. A referral link lands the shopper on the store with `?ref=CODE`
 *  (see AffiliateService.trackClick); we remember the code for 30 days
 *  (last click wins, like a typical affiliate cookie) and apiCreateCheckout
 *  sends it as `attributedAffiliateCode` so the order earns the commission.
 *  Storefronts are per-origin (subdomain / custom domain), so localStorage is
 *  already scoped to the one store. */

const KEY = 'solvexo_affiliate_ref';
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function captureAffiliateRef(search: string = typeof window !== 'undefined' ? window.location.search : '') {
  try {
    const code = new URLSearchParams(search).get('ref')?.trim();
    if (!code || !/^[A-Za-z0-9_-]{3,64}$/.test(code)) return;
    localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
  } catch { /* storage blocked — attribution just won't apply */ }
}

export function getAffiliateRef(): string | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const { code, at } = JSON.parse(raw) as { code?: string; at?: number };
    if (!code || !at || Date.now() - at > WINDOW_MS) {
      localStorage.removeItem(KEY);
      return undefined;
    }
    return code;
  } catch {
    return undefined;
  }
}
