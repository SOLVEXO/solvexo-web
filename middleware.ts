import { rewrite } from '@vercel/functions';

const PLATFORM_APEX = 'solvexo.store';
const RESERVED_PREFIXES = new Set(['www', 'staging', 'api']);
const SEO_API_ORIGIN = 'https://api.solvexo.store';

/** Serve crawler files from the store's own origin while resolving them from
 * the backend with the incoming host preserved. All other storefront routes
 * continue through the existing SPA route. */
export default function storefrontCrawlerFiles(request: Request) {
  const incoming = new URL(request.url);
  const host = (request.headers.get('host') || incoming.host).split(':')[0].toLowerCase();
  const path = incoming.pathname;
  const isCrawlerFile = path === '/robots.txt' || path === '/sitemap.xml' || /^\/sitemap-\d+\.xml$/.test(path);
  if (!isCrawlerFile || !isStorefrontHost(host)) return;

  const destination = new URL(`${SEO_API_ORIGIN}/api/storefront-seo${path}`);
  destination.searchParams.set('host', host);
  return rewrite(destination);
}

export const config = { matcher: ['/robots.txt', '/sitemap.xml', '/sitemap-:page(\\d+).xml'] };

function isStorefrontHost(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.vercel.app')) return false;
  if (host === PLATFORM_APEX || host === `www.${PLATFORM_APEX}`) return false;
  if (host.endsWith(`.${PLATFORM_APEX}`)) {
    const prefix = host.slice(0, -(`.${PLATFORM_APEX}`).length);
    return !prefix.includes('.') && !RESERVED_PREFIXES.has(prefix);
  }
  return true;
}
