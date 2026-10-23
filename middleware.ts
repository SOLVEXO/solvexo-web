import { next, rewrite } from '@vercel/functions';

// Platform pages that live under a country prefix (`/pk/pricing`). Dashboards (/store, /admin, ...) never get one.
const COUNTRY_PAGES = new Set(['/', '/login', '/register', '/signup', '/forgot-password', '/new-password', '/verify-otp', '/onboard', '/pricing', '/about', '/contact', '/contact-us', '/faq', '/help', '/terms-of-service', '/privacy-policy', '/cookie-policy', '/mobile-app']);
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse|pingdom|headless|monitor/i;

const PLATFORM_HOSTS = new Set(['solvexo.store', 'www.solvexo.store', 'solvexo.com', 'www.solvexo.com']);
const RESERVED_SUBDOMAINS = new Set(['www', 'staging', 'api', 'admin', 'app', 'seller', 'dashboard', 'cdn', 'assets', 'mail']);
const SEO_API_ORIGIN = 'https://api.solvexo.store';

export default function middleware(request: Request) {
  const hostname = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  const pathname = new URL(request.url).pathname;
  const crawlerFile = pathname === '/robots.txt' || pathname === '/products.json' || pathname === '/sitemap.xml' || /^\/sitemap-\d+\.xml$/.test(pathname);
  if (crawlerFile && hostname && isStorefrontHost(hostname)) {
    const target = new URL(`${SEO_API_ORIGIN}/api/storefront-seo${pathname}`);
    new URL(request.url).searchParams.forEach((value, key) => { if (key !== 'host') target.searchParams.set(key, value); });
    target.searchParams.set('host', hostname);
    return rewrite(target);
  }
  const toCountry = countryRedirect(request, hostname, pathname);
  if (toCountry) return toCountry;
  if (pathname.startsWith('/_solvexo/')) return next(); // platform marker script — must never be rewritten to the HTML shell
  if (!hostname || isPlatformHost(hostname) || hostname.endsWith('.vercel.app') || hostname === 'localhost' || pathname.startsWith('/api/') || pathname.startsWith('/assets/') || pathname === '/favicon.ico' || pathname === '/favicon.png') {
    return next();
  }
  if (pathname === '/manifest.webmanifest' || pathname === '/site.webmanifest') return next();

  const target = new URL('/api/storefront-document', request.url);
  target.searchParams.set('host', hostname);
  target.searchParams.set('path', pathname);
  return rewrite(target);
}

/** First visit to a platform page without a country: send the visitor to `/<cc>/...` (cookie they chose, else the
 *  IP country Vercel detected). Never for crawlers, non-page requests or paths that already carry a country. */
function countryRedirect(request: Request, hostname: string | undefined, pathname: string) {
  if (!hostname || !PLATFORM_HOSTS.has(hostname) || request.method !== 'GET') return null;
  if (!request.headers.get('accept')?.includes('text/html')) return null;
  if (BOT_UA.test(request.headers.get('user-agent') ?? '')) return null;
  const base = pathname.length > 1 ? pathname.replace(//+$/, '') : pathname;
  if (!(COUNTRY_PAGES.has(base) || base.startsWith('/solutions') || base.startsWith('/onboard/'))) return null;
  const cookie = /(?:^|;s*)sx_country=([a-z]{2})(?:;|$)/.exec(request.headers.get('cookie') ?? '')?.[1];
  const ip = request.headers.get('x-vercel-ip-country')?.toLowerCase();
  const code = cookie ?? (ip && /^[a-z]{2}$/.test(ip) ? ip : null);
  if (!code) return null;
  const url = new URL(request.url);
  url.pathname = `/${code}${base === '/' ? '/' : base}`;
  return new Response(null, { status: 307, headers: { Location: url.toString(), 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}

function isPlatformHost(host: string) {
  if (PLATFORM_HOSTS.has(host)) return true;
  if (host.endsWith('.solvexo.store')) {
    const subdomain = host.slice(0, -'.solvexo.store'.length);
    return !subdomain || subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain);
  }
  return false;
}

function isStorefrontHost(host: string) {
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.vercel.app')) return false;
  if (host === 'solvexo.store' || host === 'www.solvexo.store') return false;
  if (host.endsWith('.solvexo.store')) {
    const subdomain = host.slice(0, -'.solvexo.store'.length);
    return !subdomain.includes('.') && !RESERVED_SUBDOMAINS.has(subdomain);
  }
  return true;
}

export const config = { matcher: '/:path*' };
