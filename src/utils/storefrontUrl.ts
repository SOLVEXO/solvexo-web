/**
 * Builds an absolute URL to a store's subdomain-based storefront —
 * `hello.localhost:3000/about-us` in dev, `hello.solvexo.store/about-us` in
 * production. A subdomain is a different origin from wherever the link
 * lives (Marketplace, ProductDetail, checkout, etc.), so this always returns
 * a full URL for a hard navigation (`window.location.href` or a plain
 * `<a href>`) — React Router's client-side `navigate()`/`<Link>` cannot
 * cross an origin boundary, only works for links *within* an already-loaded
 * storefront (see `StorefrontContext.resolveLink`, which stays relative).
 */
// Infra subdomains that are never a store slug — kept separate from the
// backend's `RESERVED_STORE_SLUGS` (which reserves top-level *path* segments
// on the apex domain, a different namespace entirely).
const RESERVED_HOST_PREFIXES = ['www', 'staging', 'api'];

// The platform's own apex domain(s). Configurable via `VITE_PLATFORM_APEX_DOMAINS`
// (comma-separated, e.g. `solvexo.store,staging.solvexo.store`); default
// `solvexo.store`. `<slug>.<apex>` is a storefront; the apex itself and
// reserved prefixes (www/api/staging) are the platform app.
const PLATFORM_APEX_DOMAINS: string[] = (
  (import.meta.env.VITE_PLATFORM_APEX_DOMAINS as string | undefined) || 'solvexo.store'
)
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean);

function isIpHost(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith('[');
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost') || isIpHost(hostname);
}

// Deploy-preview / hosting-provider hosts (`*.vercel.app`) behave as the
// platform app — never a storefront and never a custom domain.
function isPlatformPreviewHost(hostname: string): boolean {
  return hostname.endsWith('.vercel.app');
}

function matchingApex(hostname: string): string | null {
  return PLATFORM_APEX_DOMAINS.find(apex => hostname === apex || hostname.endsWith(`.${apex}`)) ?? null;
}

/**
 * Reads the current store slug from the browser's hostname, or `null` when
 * on the main app (apex domain) or on a custom domain. Only
 * `<slug>.<platform apex>` (and `<slug>.localhost` in dev) yields a slug —
 * `shop.example.com` / `x.com.pk` never do (they are custom-domain candidates,
 * see `isCustomDomainCandidate`). Called once at router-selection time
 * (`router/index.tsx` picks the storefront-only route tree vs. the full app
 * tree based on this) and again inside `StorefrontLayout` to know which
 * store to load — the hostname is stable for the lifetime of a page load,
 * so this is safe to call repeatedly without memoizing.
 */
export function getStoreSlugFromHost(): string | null {
  const hostname = window.location.hostname.toLowerCase();
  if (isIpHost(hostname) || hostname === 'localhost') return null;

  let prefix: string | null = null;
  if (hostname.endsWith('.localhost')) {
    prefix = hostname.slice(0, -'.localhost'.length);
  } else {
    const apex = matchingApex(hostname);
    if (apex && hostname !== apex) prefix = hostname.slice(0, -(apex.length + 1));
  }
  if (!prefix || prefix.includes('.') || RESERVED_HOST_PREFIXES.includes(prefix)) return null;
  return prefix;
}

/**
 * True for any hostname that isn't the platform's own apex/subdomain, a
 * preview host or localhost — i.e. a domain a seller may have connected via
 * Custom Domain (`DomainWhiteLabelCard`). Deliberately synchronous (no network
 * call) so `router/index.tsx` can decide the route tree at module-load time,
 * same as `getStoreSlugFromHost()` — the actual "which store, if any, is
 * this domain verified for" lookup happens later, inside `StorefrontLayout`,
 * via `apiResolveStoreByDomain`.
 */
export function isCustomDomainCandidate(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  if (isLocalHost(hostname) || isPlatformPreviewHost(hostname)) return false;
  return !matchingApex(hostname);
}

function baseDomain(): string {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return 'localhost';
  return matchingApex(hostname) ?? PLATFORM_APEX_DOMAINS[0];
}

export function getStorefrontUrl(slug: string, path = ''): string {
  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : '';
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${protocol}//${slug}.${baseDomain()}${portSuffix}${cleanPath}`;
}

