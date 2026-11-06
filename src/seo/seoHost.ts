import { seoForPath } from './publicPages';
import { hostMode } from '@/utils/platformHost';
import { getStoreSlugFromHost, isCustomDomainCandidate } from '@/utils/storefrontUrl';

/** Merchant storefronts set their own SEO tags (per store, per product); Solvexo's site tags never apply there. */
export const ON_STORE_HOST = !!(getStoreSlugFromHost() || isCustomDomainCandidate());
/** The seller panel and super admin hosts: private apps, never indexed. */
export const PRIVATE_HOST = hostMode() === 'seller' || hostMode() === 'superadmin';

/** True when this page's title comes from the SEO list (pages then leave `document.title` alone). */
export function seoOwnsTitle(pathname: string): boolean {
  return !ON_STORE_HOST && !PRIVATE_HOST && !!seoForPath(pathname);
}
