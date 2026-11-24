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
    title: 'Solvexo: Online Store Builder & POS in One Platform',
    description: 'Build your online store and sell in person with POS, from one shared stock list. Orders, customers and analytics in one place. 7 days free, no card.' },
  { path: '/pricing', index: true, priority: 0.9, changefreq: 'weekly',
    title: 'Solvexo Pricing: Online Store & POS Plans, 7 Days Free',
    description: 'Compare Basic, Grow, Advanced and Enterprise plans. Try any plan free for 7 days, no card needed. 0% commission on cash on delivery and in-store sales.' },
  { path: '/sellers', index: true, priority: 0.9, changefreq: 'monthly',
    title: 'Sell Online & In Person with Solvexo | Start Free',
    description: 'Your own branded store, POS, inventory, orders and marketing tools in one place, for shops, creators and educators. Go live straight away. 7 days free.' },
  { path: '/products', index: true, priority: 0.8, changefreq: 'monthly',
    title: t('All Products: Store Builder, POS, Inventory & More'),
    description: 'Explore every Solvexo product: store builder, point of sale, inventory, orders, payments, checkout, discounts, shipping and analytics.' },
  { path: '/solutions', index: true, priority: 0.8, changefreq: 'monthly',
    title: t('Solutions by Industry'),
    description: 'See how Solvexo fits retail, fashion, restaurants and food, beauty and cosmetics, creators and digital sellers, and small businesses.' },
  { path: '/online-store-pakistan', index: true, priority: 0.8, changefreq: 'monthly',
    title: 'Online Store Builder & POS System in Pakistan | Solvexo',
    description: 'Make your online store in Pakistan with cash on delivery, delivery charges by city and a POS for your shop. 0% commission on COD. 7 days free, no card.' },
  { path: '/partners', index: true, priority: 0.6, changefreq: 'monthly',
    title: 'Become a Solvexo Partner: Resellers & Referral Agents',
    description: 'Help shops in your city sell online and in person with Solvexo, and earn on every month they stay subscribed. Apply as a reseller or referral agent.' },
  { path: '/about', index: true, priority: 0.6, changefreq: 'monthly',
    title: 'About Solvexo: One Connected Commerce Platform',
    description: 'Why we built Solvexo: one platform where your store, POS, inventory and analytics share the same real data, instead of five tools that don\'t talk.' },
  { path: '/faq', index: true, priority: 0.6, changefreq: 'monthly',
    title: 'Solvexo FAQ: Store Setup, Plans, POS & Payments',
    description: 'Answers to common questions about setting up your Solvexo store, plans and billing, POS, payments, shipping and getting help.' },
  { path: '/manuals', index: true, priority: 0.6, changefreq: 'monthly',
    title: 'Solvexo User Manuals (PDF) in English & Urdu',
    description: 'Download step-by-step Solvexo manuals as PDF: create your online store and run your shop with Solvexo POS. Real screenshots, English and Urdu.' },
  { path: '/contact-us', index: true, priority: 0.5, changefreq: 'yearly',
    title: 'Contact Solvexo: Sales & Support',
    description: 'Questions about plans, setup or selling on Solvexo? Email sales@solvexo.store or send a message. We usually reply within 24 hours.' },
  { path: '/book-demo', index: true, priority: 0.7, changefreq: 'yearly',
    title: 'Book a Free Solvexo Demo: See Store & POS Live',
    description: 'Book a free 30-minute walkthrough. See your online store, POS, stock and payments working together, and get your questions answered.' },
  { path: '/security', index: true, priority: 0.4, changefreq: 'yearly',
    title: 'Security at Solvexo: How We Protect Your Store',
    description: 'Card details are handled by Stripe and never stored by Solvexo. Encrypted connections, verified sign-ups, and store data private to each seller.' },
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
  '/start': 'Start your online store',
  '/email-preferences/confirmed': 'Email preferences',
};

/** Hand-written search titles and descriptions (titles ≤ 60 characters, descriptions ≤ 158) for the main product and
 *  solution pages. Pages not listed here fall back to their page copy. */
const PRODUCT_SEO: Record<string, [title: string, description: string]> = {
  'store-builder': ['Drag-and-Drop Online Store Builder | Solvexo', 'Build a store that looks like your brand. Edit pages, sections, header and footer with a live desktop and mobile preview. Your own store link. 7 days free.'],
  pos: ['POS System Synced With Your Online Store | Solvexo', 'Sell at the counter with staff PIN login, live cart and receipts. Every sale updates the same stock as your online store. Works without a store too.'],
  inventory: ['Inventory Management for Store & POS | Solvexo', "Track stock per product and variant, synced across your online store and POS in real time, so you never sell what you don't have. Multiple locations."],
  'orders-customers': ['Order & Customer Management in One Place | Solvexo', 'Track every order, return and customer from your online store and in-person POS sales in one workspace. No more orders scattered across chats.'],
  analytics: ['Sales Analytics & Reports for Your Store | Solvexo', 'See revenue, orders and customer trends from your real store data, per store or across all your stores. Export reports as PDF or CSV.'],
  loyalty: ['Customer Loyalty & Rewards Program | Solvexo', 'Reward repeat buyers with points they redeem as voucher codes at your checkout. Turn one-time buyers into regular customers. Included on Grow and up.'],
  payments: ['Online Payments Paid Straight to Your Account | Solvexo', 'Connect your own Stripe account so eligible online card sales are paid straight to you, with automatic payouts and a finance dashboard to track them.'],
  checkout: ['Checkout With Card & Cash on Delivery | Solvexo', 'A complete checkout for every store: card or cash on delivery, coupon and gift-card codes, and shipping worked out from your own delivery zones.'],
  discounts: ['Automatic Discounts & Coupon Codes | Solvexo', 'Run automatic discounts, coupon codes and sale campaigns side by side. Solvexo applies the single best discount to each order, so buyers never miss out.'],
  shipping: ['Shipping Zones & Delivery Rates for Your Store | Solvexo', 'Set the zones you deliver to and the carriers you use. Checkout picks the right shipping cost and method for every order, separately for each store.'],
  domains: ['Connect Your Own Domain to Your Store | Solvexo', 'Connect a domain you already own, verify it with a DNS check, and your storefront opens on it instead of a .solvexo.store address.'],
  'customer-accounts': ['Customer Accounts for Your Online Store | Solvexo', 'Every Solvexo store comes with buyer accounts: order history, wishlist, saved addresses and account security, so customers can come back and reorder.'],
  markets: ['Sell in PKR & USD With Live Exchange Rates | Solvexo', "Let buyers check out in PKR or USD alongside your store's own currency. Live exchange rates convert prices for you, so you set them once."],
};
const SOLUTION_SEO: Record<string, [title: string, description: string]> = {
  retail: ['Retail POS & Online Store on One System | Solvexo', 'Run your shop counter and online store from one product list and one stock count. No separate spreadsheet to keep in sync. Try it 7 days free.'],
  fashion: ['Online Store & POS for Fashion and Clothing | Solvexo', 'Sell clothes with size and colour variants, a storefront that fits your brand, and stock tracking that never mixes up a small and a large.'],
  restaurants: ['Restaurant & Food POS for Busy Counters | Solvexo', 'Fast staff PIN login and a simple till workflow, built for a food counter at rush hour. Sales and stock in one place. Try Solvexo free for 7 days.'],
  beauty: ['Online Store for Beauty & Cosmetics Brands | Solvexo', 'Photo-first storefront themes for beauty and skincare, plus loyalty rewards that bring buyers back. Sell online and in your shop from one stock list.'],
  creators: ['Sell Digital Products & Downloads Online | Solvexo', 'Sell digital downloads, courses and memberships from your own branded store, with instant delivery and no stock to manage. 7 days free, no card.'],
  'small-business': ['All-in-One Store & POS for Small Business | Solvexo', 'Online store, POS, orders, customers and analytics under one login, instead of five separate tools. Built for small teams. Try it 7 days free.'],
};

const PRODUCT_PAGES: PublicPageSeo[] = ALL_PLATFORM_PRODUCTS.map(p => ({
  path: `/products/${p.slug}`,
  index: true,
  priority: 0.7,
  changefreq: 'monthly' as const,
  title: PRODUCT_SEO[p.slug]?.[0] ?? t(`${p.name}: ${p.tagline}`),
  description: PRODUCT_SEO[p.slug]?.[1] ?? clip(p.heroSubtext),
}));

const SOLUTION_PAGES: PublicPageSeo[] = SOLUTIONS.map(s => ({
  path: `/solutions/${s.slug}`,
  index: true,
  priority: 0.7,
  changefreq: 'monthly' as const,
  title: SOLUTION_SEO[s.slug]?.[0] ?? t(`${s.name}: ${s.headline.replace(/\.$/, '')}`),
  description: SOLUTION_SEO[s.slug]?.[1] ?? clip(s.subtext),
}));

/** Every indexable page, in sitemap order. */
const BLOG_PAGES: PublicPageSeo[] = [
  { path: '/blog', index: true, priority: 0.7, changefreq: 'weekly', lastmod: SORTED_BLOG_POSTS[0]?.published,
    title: 'Selling Online in Pakistan: Guides & Tips | Solvexo Blog',
    description: 'Practical guides for Pakistani sellers: starting an online store, cash on delivery, delivery, POS for shops and growing your sales.' },
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
