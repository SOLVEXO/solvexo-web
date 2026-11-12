// Pre-built HTML for Solvexo's public pages. At build time (vite.config.ts) each indexable page gets its own copy of
// index.html with that page's title, description, canonical and Open Graph tags, plus a short plain-HTML version of
// its content and links to the rest of the site. middleware.ts serves that copy for the page's address, so search
// engines and link previews see real, page-specific HTML without running JavaScript. The React app still boots from
// the same file and replaces the plain block on mount (it is hidden at once for visitors with JavaScript).
import { MANUALS } from '../features/buyer/data/manuals';
import { ALL_PLATFORM_PRODUCTS } from '../features/buyer/data/platformProducts';
import { SOLUTIONS } from '../features/buyer/data/solutions';
import { BLOG_AUTHOR, SORTED_BLOG_POSTS, getBlogPost, type BlogBlock } from '../features/buyer/data/blogPosts';
import { SITEMAP_PAGES, SITE_ORIGIN, canonicalUrl, normalizePath, type PublicPageSeo } from './publicPages';
import { unsplashUrl } from '../assets/stockPhotos';

export const PRERENDER_DIR = '_pages';

/** Built file for a public path (country prefix removed), or null when the page has no pre-built copy. */
export function prerenderedFile(pathname: string): string | null {
  const path = normalizePath(pathname);
  if (!SITEMAP_PAGES.some(p => p.path === path)) return null;
  return `/${PRERENDER_DIR}/${path === '/' ? 'index' : path.slice(1).replace(/\//g, '__')}.html`;
}

/** `/pk/pricing` → `/pricing` (two-letter country prefixes only, as the router's basename does). */
export function stripCountryPrefix(pathname: string): string {
  const m = /^\/[a-z]{2}(\/.*|$)/.exec(pathname);
  return m ? (m[1] || '/') : pathname;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NAV: { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'For Sellers', path: '/sellers' },
  { label: 'Products', path: '/products' },
  { label: 'Solutions', path: '/solutions' },
  { label: 'About', path: '/about' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Book a demo', path: '/book-demo' },
  { label: 'Contact', path: '/contact-us' },
];

/** The visible heading: the title without the brand suffix ("Pricing: Online Store & POS Plans"). */
function headingFor(page: PublicPageSeo): string {
  return page.path === '/' ? 'Solvexo' : page.title.replace(/\s*\|\s*Solvexo$/, '');
}

function list(items: string[]): string {
  return `<ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function links(items: { label: string; path: string }[]): string {
  return `<ul>${items.map(i => `<li><a href="${esc(i.path)}">${esc(i.label)}</a></li>`).join('')}</ul>`;
}

/** Page-specific body copy from the same data the React pages render. */
function blockHtml(b: BlogBlock): string {
  switch (b.type) {
    case 'h2': return `<h2>${esc(b.text)}</h2>`;
    case 'h3': return `<h3>${esc(b.text)}</h3>`;
    case 'ul': return list(b.items);
    case 'ol': return `<ol>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ol>`;
    case 'tip': return `<p><strong>Tip:</strong> ${esc(b.text)}</p>`;
    default: return `<p>${esc(b.text)}</p>`;
  }
}

const blogSlug = (path: string) => /^\/blog\/([^/]+)$/.exec(path)?.[1] ?? null;

function contentFor(page: PublicPageSeo): string {
  const post = blogSlug(page.path) ? getBlogPost(blogSlug(page.path)!) : undefined;
  if (post) {
    return [
      `<p>${esc(BLOG_AUTHOR)} · <time datetime="${post.published}">${post.published}</time> · ${post.readMinutes} min read</p>`,
      ...post.body.map(blockHtml),
      `<p><a href="/blog">More guides on the Solvexo blog</a></p>`,
    ].join('');
  }
  if (page.path === '/manuals') {
    return MANUALS.map(m => `<h2>${esc(m.title)}</h2><p>${esc(m.summary)}</p>${links([m.complete, ...m.chapters].map(c => ({ label: `${c.label} (PDF)`, path: c.file })))}`).join('');
  }
  if (page.path === '/blog') {
    return `<h2>Latest guides</h2>${links(SORTED_BLOG_POSTS.map(p => ({ label: p.title, path: `/blog/${p.slug}` })))}`;
  }
  const product = ALL_PLATFORM_PRODUCTS.find(p => `/products/${p.slug}` === page.path);
  if (product) {
    return [
      `<p><strong>${esc(product.heroHeadline)}</strong> ${esc(product.heroSubtext)}</p>`,
      ...product.benefits.map(b => `<h2>${esc(b.title)}</h2><p>${esc(b.desc)}</p>`),
      product.features.length ? `<h2>Features</h2>${list(product.features)}` : '',
      product.faq.length ? `<h2>Questions</h2>${product.faq.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}` : '',
    ].join('');
  }
  const solution = SOLUTIONS.find(s => `/solutions/${s.slug}` === page.path);
  if (solution) {
    return `<p><strong>${esc(solution.headline)}</strong> ${esc(solution.subtext)}</p><h2>Highlights</h2>${list(solution.highlights)}`;
  }
  if (page.path === '/products') {
    return `<h2>Products</h2>${links(ALL_PLATFORM_PRODUCTS.map(p => ({ label: `${p.name}: ${p.tagline}`, path: `/products/${p.slug}` })))}`;
  }
  if (page.path === '/solutions') {
    return `<h2>Solutions</h2>${links(SOLUTIONS.map(s => ({ label: `${s.name}: ${s.headline}`, path: `/solutions/${s.slug}` })))}`;
  }
  if (page.path === '/') {
    return [
      '<p><strong>Solvexo</strong> is an all-in-one commerce platform for sellers, creators and educators. With Solvexo you can build your own online store, sell in person with Solvexo POS, and manage products, inventory, orders, customers, payments, marketing and analytics in one place.</p>',
      `<h2>Products</h2>${links(ALL_PLATFORM_PRODUCTS.map(p => ({ label: p.name, path: `/products/${p.slug}` })))}`,
      `<h2>Solutions</h2>${links(SOLUTIONS.map(s => ({ label: s.name, path: `/solutions/${s.slug}` })))}`,
      // Google's OAuth review reads this from the home page.
      '<h2>How Solvexo uses Google sign-in</h2><p>Sellers can create and sign in to their Solvexo account with Google. Solvexo only receives your name, email address and profile picture, and uses them solely to create your account and sign you in. Store owners can also connect Google Search Console and Google Analytics with read-only access to see their own search and visitor reports inside Solvexo. Google user data is never sold or used for advertising.</p>',
    ].join('');
  }
  return '';
}

/**
 * Structured data Google reads for the result itself: WebSite on the home page (the site name shown in results) and a
 * breadcrumb trail on product and solution pages ("Solvexo › Products › Point of Sale").
 */
export function structuredDataFor(page: PublicPageSeo): Record<string, unknown>[] {
  if (page.path === '/') {
    return [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Solvexo', alternateName: ['Solvexo Store', 'solvexo.store'], url: canonicalUrl('/') }];
  }
  const post = blogSlug(page.path) ? getBlogPost(blogSlug(page.path)!) : undefined;
  if (post) {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.published,
        dateModified: post.updated ?? post.published,
        author: { '@type': 'Organization', name: 'Solvexo', url: canonicalUrl('/') },
        publisher: { '@type': 'Organization', name: 'Solvexo', logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/brand/solvexo-logo-120.png` } },
        mainEntityOfPage: canonicalUrl(page.path),
        image: unsplashUrl(post.image, 1200),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Solvexo', item: canonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: canonicalUrl('/blog') },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl(page.path) },
        ],
      },
    ];
  }
  const m = /^\/(products|solutions)\/[^/]+$/.exec(page.path);
  if (!m) return [];
  const section = m[1] === 'products' ? 'Products' : 'Solutions';
  return [{
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Solvexo', item: canonicalUrl('/') },
      { '@type': 'ListItem', position: 2, name: section, item: canonicalUrl(`/${m[1]}`) },
      { '@type': 'ListItem', position: 3, name: headingFor(page).split(':')[0], item: canonicalUrl(page.path) },
    ],
  }];
}

/** One public page's HTML, from the built index.html (`template`). Unchanged parts (scripts, styles) are kept as-is. */
export function buildPrerenderedHtml(template: string, page: PublicPageSeo): string {
  const url = canonicalUrl(page.path);
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(page.description)}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(page.title)}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(page.description)}" />`);
  html = html.replace('<!--/solvexo-platform-head-->', [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="robots" content="${page.index ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />`,
    ...structuredDataFor(page).map(d => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`),
    '<!--/solvexo-platform-head-->',
  ].join('\n    '));
  html = deferThemeFonts(html);

  const body = [
    '<main id="solvexo-static" style="max-width:720px;margin:0 auto;padding:48px 24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d1d1b;line-height:1.6">',
    '<header style="display:flex;align-items:center;gap:14px"><a href="/"><img src="/brand/solvexo-logo-120.png" alt="Solvexo logo" width="56" height="56" style="border-radius:12px" /></a>',
    `<h1 style="font-size:30px;margin:0">${esc(headingFor(page))}</h1></header>`,
    `<p>${esc(page.description)}</p>`,
    contentFor(page),
    `<nav aria-label="Solvexo">${links(NAV.filter(n => n.path !== page.path))}</nav>`,
    '<p><a href="/privacy-policy">Privacy Policy</a> &middot; <a href="/terms-of-service">Terms of Service</a> &middot; <a href="/cookie-policy">Cookie Policy</a> &middot; <a href="mailto:sales@solvexo.store">sales@solvexo.store</a></p>',
    '</main>',
  ].join('\n      ');
  return html.replace(/<!--solvexo-platform-body-->[\s\S]*?<!--\/solvexo-platform-body-->/, `<!--solvexo-platform-body-->\n      ${body}\n    <!--/solvexo-platform-body-->`);
}

const GOOGLE_FONTS_LINK = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"[^>]*>/;

/**
 * Public pages only need Poppins and Lora, which index.html serves from this domain. The Google Fonts stylesheet for
 * the store themes' families (and its preconnect) is loaded a few seconds after the page has loaded instead of at
 * startup, so it never competes with the first paint; dashboards opened from a public page still get those fonts.
 */
export function deferThemeFonts(html: string): string {
  const m = GOOGLE_FONTS_LINK.exec(html);
  if (!m) return html;
  // Poppins and Lora are already served from this domain: drop them from the deferred request, or the browser would
  // download them a second time from Google once that stylesheet redefines them.
  const url = new URL(m[1].replace(/&amp;/g, '&'));
  const families = url.searchParams.getAll('family').filter(f => !/^(Poppins|Lora)(:|$)/.test(f));
  const href = `${url.origin}${url.pathname}?${families.map(f => `family=${encodeURIComponent(f).replace(/%3A/g, ':').replace(/%2C/g, ',').replace(/%3B/g, ';').replace(/%40/g, '@')}`).join('&')}&display=swap`;
  const preload = ['poppins-400-latin', 'poppins-600-latin'].map(f => `<link rel="preload" href="/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin />`).join('\n    ');
  const loader = `<script>addEventListener('load',function(){setTimeout(function(){var l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(href)};document.head.appendChild(l)},3000)})</script>`;
  return html
    .replace('<!--/solvexo-platform-head-->', `${preload}\n    <!--/solvexo-platform-head-->`)
    .replace(GOOGLE_FONTS_LINK, families.length ? loader : '')
    .replace(/<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*><\/noscript>\s*/, '')
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>\s*/g, '');
}

/** Every pre-built file: [published path inside the build, html]. */
export function prerenderAll(template: string): [string, string][] {
  return SITEMAP_PAGES.map(page => [prerenderedFile(page.path)!.slice(1), buildPrerenderedHtml(template, page)]);
}
