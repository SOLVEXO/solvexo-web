/**
 * Cookie-backed storage for the auth session — replaces `localStorage` as
 * `TokenStorage`'s backend so a login on `solvexo.store` is visible on every
 * seller storefront subdomain (`hello.solvexo.store`, ...). `localStorage`
 * is locked to one exact origin (scheme+host+port) — a token saved there on
 * the main domain is invisible on a subdomain, which would otherwise log
 * every buyer out the moment they land on a store. A cookie scoped to
 * `domain=.solvexo.store` (or `localhost` in dev) is visible from any
 * subdomain, so this is a same-security-level swap (both are JS-readable,
 * equally exposed to XSS) purely to fix the storage *scope*, not a security
 * downgrade.
 *
 * IP-address hosts (e.g. testing via `127.0.0.1`) can't take a `domain`
 * attribute at all (browsers reject it for IPs) — those fall back to a
 * plain host-only cookie, which is fine since an IP has no subdomains to
 * share with anyway.
 *
 * A per-store buyer account (see `User.storeId`) is the one deliberate
 * exception to "shared across every subdomain" — see the `scope` param
 * below.
 */

import { getStoreSlugFromHost, isCustomDomainCandidate } from '@/utils/storefrontUrl';

const MAX_AGE_SECONDS = 400 * 24 * 60 * 60; // ~400 days — the browser-enforced cap, matches "persists until logout" like localStorage did

function isIpAddress(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host === '[::1]';
}

function cookieDomain(): string | null {
  const { hostname } = window.location;
  if (isIpAddress(hostname)) return null;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return 'localhost';
  const parts = hostname.split('.');
  if (parts.length < 2) return null;
  return `.${parts.slice(-2).join('.')}`;
}

// `scope: 'shared'` (default) — the behavior above, visible from every
// subdomain. `scope: 'host'` — omits `domain=` entirely, so the cookie is
// visible ONLY on the exact origin that set it (the browser default). Used
// by a per-store buyer session (see `TokenStorage`), which must NOT leak
// into another store's subdomain or the apex the way a seller/admin/legacy
// buyer session deliberately still does.
export type AuthCookieScope = 'shared' | 'host';

// A domain-wide ('shared') cookie is no longer ever WRITTEN: an apex
// seller/admin session on `.solvexo.store` would be readable on every store
// subdomain (a seller looked logged in as a buyer on their own storefront).
// Every session cookie is now host-only. `scope: 'shared'` survives only as a
// DELETE target, to clean up legacy domain-wide cookies set by older builds.
export function setAuthCookie(name: string, value: string): void {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `path=/`,
    `max-age=${MAX_AGE_SECONDS}`,
    `SameSite=Lax`,
  ];
  if (window.location.protocol === 'https:') parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function getAuthCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Deletes the cookie on this host AND (apex only) any legacy domain-wide copy. */
export function clearAuthCookie(name: string): void {
  deleteAuthCookie(name, 'host');
  deleteAuthCookie(name, 'shared');
}

export function deleteAuthCookie(name: string, scope: AuthCookieScope = 'host'): void {
  // A storefront (subdomain/custom domain) must never delete the domain-wide
  // cookie: that would log the seller out of the apex app.
  if (scope === 'shared' && (getStoreSlugFromHost() || isCustomDomainCandidate())) return;
  const domain = scope === 'host' ? null : cookieDomain();
  const parts = [`${name}=`, `path=/`, `max-age=0`];
  if (domain) parts.push(`domain=${domain}`);
  document.cookie = parts.join('; ');
}
