import { TokenStorage } from '@/api/services/auth';
import { apiGetB2BPrices, apiGetWholesaleStanding, type B2BPriceLine, type WholesaleStanding } from '@/api/services/b2bStorefront';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useLoad } from '../pageHooks';

/** One standing request per store and sign-in at a time (a product page asks for it several times); refreshed after 30 s. */
const standingCache = new Map<string, { at: number; p: Promise<WholesaleStanding> }>();
function standingFor(storeId: string, token: string): Promise<WholesaleStanding> {
  const key = `${storeId}|${token}`;
  const hit = standingCache.get(key);
  if (hit && Date.now() - hit.at < 30_000) return hit.p;
  const p = apiGetWholesaleStanding(storeId).catch((e: unknown) => { standingCache.delete(key); throw e; });
  standingCache.set(key, { at: Date.now(), p });
  return p;
}
/** Forget the cached standing (after applying, signing out, etc.). */
export const resetWholesaleStanding = () => standingCache.clear();

export interface WholesaleGate {
  /** The visitor is signed in (guests count: they just are not wholesale buyers). */
  signedIn: boolean;
  /** Approved company buyer. */
  approved: boolean;
  /** Still asking the server (only when signed in). */
  loading: boolean;
  standing: WholesaleStanding | null;
  /** Wholesale-only store and this visitor is not an approved buyer: hide prices and buy buttons, show the apply / sign in link. */
  locked: boolean;
}

/** Headless: who is looking at this store in wholesale terms, and does a wholesale-only store lock them out? */
export function useWholesaleGate(): WholesaleGate {
  const { store } = useStorefront();
  const token = TokenStorage.getToken() ?? '';
  const q = useLoad<WholesaleStanding | null>(() => (token ? standingFor(store.storeId, token) : Promise.resolve(null)), [store.storeId, token]);
  const approved = q.data?.status === 'approved';
  const wholesaleOnly = !!(store as { wholesaleOnly?: boolean }).wholesaleOnly;
  return { signedIn: !!token, approved, loading: q.loading, standing: q.data, locked: wholesaleOnly && !approved };
}

/** Headless: the signed-in company buyer's server-computed price, rule and volume breaks for one variant at a quantity (null = retail). */
export function useWholesalePrice(variantId: string | undefined, quantity: number, approved: boolean): B2BPriceLine | null {
  const { store } = useStorefront();
  const q = useLoad<B2BPriceLine | null>(
    () => (approved && variantId
      ? apiGetB2BPrices(store.storeId, [{ variantId, quantity }]).then((r) => (r.b2b ? r.lines[0] ?? null : null))
      : Promise.resolve(null)),
    [store.storeId, variantId, quantity, approved],
  );
  return q.data;
}
