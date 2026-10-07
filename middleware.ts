import { next, rewrite } from '@vercel/functions';

const PLATFORM_HOSTS = new Set(['solvexo.store', 'www.solvexo.store', 'solvexo.com', 'www.solvexo.com']);
const RESERVED_SUBDOMAINS = new Set(['www', 'staging', 'api', 'admin', 'app', 'seller', 'dashboard', 'cdn', 'assets', 'mail']);
const SEO_API_ORIGIN = 'https://api.solvexo.store';

export default function middleware(request: Request) {
  const hostname = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  const pathname = new URL(request.url).pathname;
  const crawlerFile = pathname === '/robots.txt' || pathname === '/sitemap.xml' || /^\/sitemap-\d+\.xml$/.test(pathname);
  if (crawlerFile && hostname && isStorefrontHost(hostname)) {
    const target = new URL(`${SEO_API_ORIGIN}/api/storefront-seo${pathname}`);
    target.searchParams.set('host', hostname);
    return rewrite(target);
  }
  if (!hostname || isPlatformHost(hostname) || hostname.endsWith('.vercel.app') || hostname === 'localhost' || pathname.startsWith('/api/') || pathname.startsWith('/assets/') || pathname === '/favicon.ico') {
    return next();
  }
  if (pathname === '/manifest.webmanifest' || pathname === '/site.webmanifest') return next();

  const target = new URL('/api/storefront-document', request.url);
  target.searchParams.set('host', hostname);
  target.searchParams.set('path', pathname);
  return rewrite(target);
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
