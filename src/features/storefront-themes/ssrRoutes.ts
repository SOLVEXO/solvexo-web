import { matchPath } from 'react-router-dom';
import type { StorefrontRouteKey } from './registry';

/**
 * The storefront pages that are rendered on the server, and how to tell which one an address is. Shared by the server entry
 * (what to render) and the browser (which chunks the first page needs). Pure: it imports no theme and no registry code.
 * Add a route here only after its data has an `ssrKey` (see `useLoad`).
 */
export interface SsrRoute { path: string; key: StorefrontRouteKey }

export const SSR_ROUTES: SsrRoute[] = [
  { path: '/', key: 'home' },
  { path: '/product/:slug', key: 'product' },
  { path: '/collections', key: 'collections' },
  { path: '/collections/:slugOrId', key: 'collection' },
  { path: '/category/:slugOrId', key: 'category' },
  { path: '/blog', key: 'blogIndex' },
  { path: '/blogs/:blogSlug', key: 'blogIndex' },
  { path: '/blog/:postSlug', key: 'blogPost' },
  { path: '/blogs/:blogSlug/:postSlug', key: 'blogPost' },
  { path: '/faqs', key: 'faqs' },
  // Last: any other single segment is a seller-made page - unless it is one of the app's own routes (see RESERVED_FIRST_SEGMENTS).
  { path: '/:pageSlug', key: 'customPage' },
];

/** First path segments the storefront router gives to the app itself (cart, account, ...): never a seller page, never server-rendered. */
const RESERVED_FIRST_SEGMENTS = new Set([
  'blog', 'blogs', 'cart', 'discount', 'checkout', 'login', 'register', 'verify-otp', 'forgot-password', 'new-password', 'account',
  'wishlist', 'loyalty', 'messages', 'notifications', 'returns', 'gift-cards', 'store-credit', 'orders', 'library', 'memberships',
  'licenses', 'learn', 'wholesale', 'subscriptions', 'cod-confirm', 'messaging-preferences', 'order-status', 'addresses', 'reviews',
  'category', 'collections', 'faqs', 'product', 'search', 'collection',
]);

/** The server-rendered route an address belongs to, or null (the normal app serves it). */
export function ssrRouteFor(path: string): SsrRoute | null {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  for (const route of SSR_ROUTES) {
    const match = matchPath({ path: route.path, end: true }, clean);
    if (!match) continue;
    if (route.key === 'customPage' && RESERVED_FIRST_SEGMENTS.has(String(match.params.pageSlug ?? '').toLowerCase())) return null;
    return route;
  }
  return null;
}
