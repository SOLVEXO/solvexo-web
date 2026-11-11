// Search-engine details for Solvexo's own public site (not merchant storefronts, which manage their own SEO).
// One list feeds three things: the <head> tags set while browsing (SeoHead), the page titles, and the
// sitemap.xml / robots.txt written at build time (vite.config.ts). Keep it free of React imports: the build
// config imports it directly.
import { ALL_PLATFORM_PRODUCTS } from '../features/buyer/data/platformProducts';
import { SOLUTIONS } from '../features/buyer/data/solutions';
import { SORTED_BLOG_POSTS } from '../features/buyer/data/blogPosts';

/** The one address search engines should index (solvexo.store redirects here; country paths canonicalise to it). */
export const SITE_ORIGIN = 'https://www.solvexo.store';

export interface PublicPageSeo {
  path: string;
  title: string;
  description: string;
  /** false: kept out of search results (sign-in, sign-up steps). */
  index: boolean;
  /** sitemap hints */
  priority?: number;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Sitemap lastmod (YYYY-MM-DD) when the page has its own date; otherwise the build date. */
  lastmod?: string;
}

const BRAND = 'Solvexo';
const t = (name: string) => `${name} | ${BRAND}`;

const STATIC_PAGES: PublicPageSeo[] = [
  { path: '/', index: true, priority: 1.0, changefreq: 'weekly',
    title: 'Solvexo | Online Store Builder, POS & Commerce Platform',
    description: 'Build your online store, sell in person with Solvexo POS, and manage inventory, orders, customers, payments and analytics in one connected commerce platform.' },
  { path: '/pricing', index: true, priority: 0.9, changefreq: 'weekly',
    title: t('Pricing: Online Store & POS Plans'),
    description: 'Compare Solvexo plans for your online store and point of sale. Start with a free trial, no card required, and upgrade as your business grows.' },
  { path: '/sellers', index: true, priority: 0.9, changefreq: 'monthly',
    title: t('Sell Online and In Person'),
    description: 'Everything sellers, creators and educators need to sell online and in person: your own branded store, POS, inventory, orders, payments and marketing tools.' },
  { path: '/products', index: true, priority: 0.8, changefreq: 'monthly',
    title: t('All Products: Store Builder, POS, Inventory & More'),
    description: 'Explore every Solvexo product: store builder, point of sale, inventory, orders, payments, checkout, discounts, shipping, analytics and AI commerce.' },
  { path: '/solutions', index: true, priority: 0.8, changefreq: 'monthly',
    title: t('Solutions by Industry'),
    description: 'See how Solvexo fits retail, fashion, restaurants and food, beauty and cosmetics, creators and digital sellers, and small businesses.' },
  { path: '/about', index: true, priority: 0.6, changefreq: 'monthly',
    title: t('About Us'),
    description: 'Solvexo is one connected commerce system for independent sellers, creators and educators: storefront, POS, inventory and analytics sharing the same real data.' },
  { path: '/faq', index: true, priority: 0.6, changefreq: 'monthly',
    title: t('Frequently Asked Questions'),
    description: 'Answers to common questions about Solvexo: setting up your store, plans and billing, POS, payments, domains, shipping and getting support.' },
  { path: '/manuals', index: true, priority: 0.6, changefreq: 'monthly',
    title: t('User Manuals: Step-by-Step Guides'),
    description: 'Download the Solvexo user manuals as PDF: create your online store and run your shop with Solvexo POS. Real screenshots, English and Urdu.' },
  { path: '/contact-us', index: true, priority: 0.5, changefreq: 'yearly',
    title: t('Contact Us'),
    description: 'Get in touch with the Solvexo team for sales questions, plan enquiries or support. Email sales@solvexo.store or send us a message.' },
  { path: '/book-demo', index: true, priority: 0.7, changefreq: 'yearly',
    title: t('Book a Free Demo'),
    description: 'Book a free walkthrough of Solvexo and see how the store builder, POS, inventory and analytics work together for your business.' },
  { path: '/security', index: true, priority: 0.4, changefreq: 'yearly',
    title: t('Security'),
    description: 'How Solvexo protects your account, your store and your customers’ data: encryption, access controls, payments security and responsible data handling.' },
  { path: '/privacy-policy', index: true, priority: 0.3, changefreq: 'yearly',
    title: t('Privacy Policy'),
    description: 'How Solvexo collects, uses and protects your information, including how we use Google sign-in data, cookies and third-party services.' },
  { path: '/terms-of-service', index: true, priority: 0.3, changefreq: 'yearly',
    title: t('Terms of Service'),
    description: 'The terms that apply when you use Solvexo as a seller or buyer, including accounts, plans, payments and acceptable use.' },
  { path: '/cookie-policy', index: true, priority: 0.3, changefreq: 'yearly',
    title: t('Cookie Policy'),
    description: 'Which cookies Solvexo uses, what they are for, and how you can manage your cookie choices.' },
];

/** Sign-in and sign-up steps: useful pages, but never a search result. */
const NOINDEX_PAGES: Record<string, string> = {
  '/login': 'Sign in',
  '/register': 'Create your seller account',
  '/signup': 'Create your seller account',
  '/verify-otp': 'Verify your email',
  '/forgot-password': 'Reset your password',
  '/new-password': 'Choose a new password',
  '/onboard': 'Set up your store',
};

const PRODUCT_PAGES: PublicPageSeo[] = ALL_PLATFORM_PRODUCTS.map(p => ({
  path: `/products/${p.slug}`,
  index: true,
  priority: 0.7,
  changefreq: 'monthly' as const,
  title: t(`${p.name}: ${p.tagline}`),
  description: clip(p.heroSubtext),
}));

const SOLUTION_PAGES: PublicPageSeo[] = SOLUTIONS.map(s => ({
  path: `/solutions/${s.slug}`,
  index: true,
  priority: 0.7,
  changefreq: 'monthly' as const,
  title: t(`${s.name}: ${s.headline.replace(/\.$/, '')}`),
  description: clip(s.subtext),
}));

/** Every indexable page, in sitemap order. */
const BLOG_PAGES: PublicPageSeo[] = [
  { path: '/blog', index: true, priority: 0.7, changefreq: 'weekly', lastmod: SORTED_BLOG_POSTS[0]?.published,
    title: t('Blog: Guides for Selling Online in Pakistan'),
    description: 'Practical guides for Pakistani sellers: starting an online store, cash on delivery, delivery, POS for shops and growing your sales with Solvexo.' },
  ...SORTED_BLOG_POSTS.map(p => ({
    path: `/blog/${p.slug}`,
    index: true,
    priority: 0.6,
    changefreq: 'monthly' as const,
    lastmod: p.updated ?? p.published,
    title: t(p.title),
    description: p.description,
  })),
];

export const SITEMAP_PAGES: PublicPageSeo[] = [...STATIC_PAGES, ...PRODUCT_PAGES, ...SOLUTION_PAGES, ...BLOG_PAGES];

const BY_PATH = new Map(SITEMAP_PAGES.map(p => [p.path, p]));

/** `/pricing/` → `/pricing`; `/` stays `/`. */
export function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/{2,}/g, '/');
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

/** SEO details for a path of the public site (country prefix already removed); null for any other page. */
export function seoForPath(pathname: string): PublicPageSeo | null {
  const path = normalizePath(pathname);
  const page = BY_PATH.get(path);
  if (page) return page;
  const noindex = NOINDEX_PAGES[path] ?? (path.startsWith('/onboard/') ? NOINDEX_PAGES['/onboard'] : undefined);
  return noindex ? { path, index: false, title: t(noindex), description: STATIC_PAGES[0].description } : null;
}

export function canonicalUrl(path: string): string {
  const p = normalizePath(path);
  return p === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${p}`;
}

function clip(text: string, max = 158): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

// ── Build-time files ─────────────────────────────────────────────────────────

export function buildSitemapXml(lastmod: string): string {
  const urls = SITEMAP_PAGES.filter(p => p.index).map(p => [
    '  <url>',
    `    <loc>${canonicalUrl(p.path)}</loc>`,
    `    <lastmod>${p.lastmod ?? lastmod}</lastmod>`,
    p.changefreq ? `    <changefreq>${p.changefreq}</changefreq>` : '',
    p.priority != null ? `    <priority>${p.priority.toFixed(1)}</priority>` : '',
    '  </url>',
  ].filter(Boolean).join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/** robots.txt for the public site. Dashboards and sign-in steps are private; the sitemap lists everything else. */
export function buildRobotsTxt(): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /store/',
    'Disallow: /seller',
    'Disallow: /admin',
    'Disallow: /account',
    'Disallow: /theme-preview',
    'Disallow: /pay-invoice',
    'Disallow: /_pages/',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');
}
