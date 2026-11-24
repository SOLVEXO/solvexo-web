import fs from 'node:fs/promises';
import path from 'node:path';
import { waitUntil } from '@vercel/functions';

const API_ORIGIN = (process.env.SOLVEXO_API_URL || process.env.VITE_API_URL || 'https://api.solvexo.store').replace(/\/$/, '');

// A store without its own favicon shows no icon at all (never the platform's).
const BLANK_ICON = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

/** Remove Solvexo's own platform description (index.html markers): a store's site must never present itself as Solvexo. */
function stripPlatformContent(html) {
  return html
    .replace(/<!--solvexo-platform-head-->[\s\S]*?<!--\/solvexo-platform-head-->/g, '')
    .replace(/<!--solvexo-platform-body-->[\s\S]*?<!--\/solvexo-platform-body-->/g, '');
}

function injectMetadata(html, meta) {
  const tags = [
    `<title>${escapeHtml(meta.title || 'Online Store')}</title>`,
    meta.description ? `<meta name="description" content="${escapeHtml(meta.description)}">` : '',
    meta.canonicalUrl ? `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}">` : '',
    ...(Array.isArray(meta.alternates) ? meta.alternates.map((a) => `<link rel="alternate" hreflang="${escapeHtml(a.hreflang)}" href="${escapeHtml(a.href)}">`) : []),
    `<link rel="icon" href="${meta.favicon ? escapeHtml(meta.favicon) : BLANK_ICON}">`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow'}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(meta.ogTitle || meta.title || '')}">`,
    `<meta property="og:description" content="${escapeHtml(meta.ogDescription || meta.description || '')}">`,
    // Seller's Google Merchant Center / Search Console token. Re-checked here so only a URL-safe token can ever reach <head>.
    /^[A-Za-z0-9_-]{10,200}$/.test(String(meta.googleSiteVerification ?? '')) ? `<meta name="google-site-verification" content="${meta.googleSiteVerification}">` : '',
    meta.url ? `<meta property="og:url" content="${escapeHtml(meta.url)}">` : '',
    meta.ogImage ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}">` : '',
    `<meta name="twitter:card" content="${escapeHtml(meta.twitterCard || (meta.ogImage ? 'summary_large_image' : 'summary'))}">`,
    `<meta name="twitter:title" content="${escapeHtml(meta.ogTitle || meta.title || '')}">`,
    `<meta name="twitter:description" content="${escapeHtml(meta.ogDescription || meta.description || '')}">`,
    ...(Array.isArray(meta.jsonLd) ? meta.jsonLd.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`) : []),
  ].filter(Boolean).join('\n    ');

  const withoutOldSeo = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/ig, '')
    .replace(/<link\s+rel=["']alternate["'][^>]*hreflang[^>]*>/ig, '')
    .replace(/<link\s+rel=["'](?:icon|shortcut icon)["'][^>]*>/ig, '')
    .replace(/<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/ig, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/ig, '');
  const withLang = /^[a-z]{2,3}$/i.test(String(meta.lang ?? '')) ? withoutOldSeo.replace(/<html([^>]*?)\slang="[^"]*"/i, `<html$1 lang="${meta.lang}"`) : withoutOldSeo;
  return withLang.replace('</head>', `    ${tags}\n  </head>`);
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const hexOr = (value, fallback) => (typeof value === 'string' && HEX.test(value.trim()) ? value.trim() : fallback);
const MAX_INLINE_BYTES = 380_000;

const PLATFORM_APEXES = (process.env.VITE_PLATFORM_APEX_DOMAINS || 'solvexo.store').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);

/** `hello.solvexo.store` -> `hello` (a store's own subdomain); a connected custom domain has no slug. Same rule the browser uses. */
function slugFromHost(host) {
  for (const apex of PLATFORM_APEXES) {
    if (host.endsWith(`.${apex}`)) {
      const sub = host.slice(0, -(apex.length + 1));
      if (sub && !sub.includes('.')) return sub;
    }
  }
  return null;
}

/** One request for the store, its live theme and its home page (the same endpoint the browser would call after loading). */
async function fetchBootstrap(host, timeoutMs = 2500) {
  try {
    const url = new URL(`${API_ORIGIN}/api/store/public/bootstrap`);
    const slug = slugFromHost(host);
    if (slug) url.searchParams.set('slug', slug); else url.searchParams.set('host', host);
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

/** JSON that is safe inside an inline <script>: no "</script>", no line-separator characters. */
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/**
 * Static first-paint placeholder per theme (the same shapes as each theme's own boot skeleton), painted BEFORE any JavaScript
 * runs, in the seller's page colours. React replaces it when the app mounts.
 */
function skeletonHtml(themeId, p) {
  const block = `color-mix(in srgb, ${p.ink} 8%, ${p.bg})`;
  const line = `color-mix(in srgb, ${p.ink} 12%, ${p.bg})`;
  const css = `<style>@keyframes sxp{50%{opacity:.55}}.sxb{animation:sxp 1.6s ease-in-out infinite}.sxb *{box-sizing:border-box}@media(max-width:767px){.sxb .sxm{display:none!important}}</style>`;
  const bar = (w, h, r, bg = block) => `<div style="width:${w};height:${h};border-radius:${r};background:${bg}"></div>`;
  if (themeId === 'theme-04-tech') {
    return `${css}<div class="sxb" aria-hidden="true" style="min-height:100vh;background:${p.bg}"><div style="height:32px;background:${p.accent};opacity:.9"></div><div style="display:flex;align-items:center;gap:24px;height:76px;padding:0 clamp(16px,4vw,40px);border-bottom:1px solid ${line}">${bar('120px', '26px', '6px')}<div class="sxm" style="flex:1;max-width:560px;height:44px;border-radius:999px;background:${block}"></div><div style="margin-inline-start:auto;display:flex;gap:10px">${bar('36px', '36px', '999px')}${bar('36px', '36px', '999px')}</div></div><div style="display:grid;gap:16px;padding:clamp(12px,2vw,24px) clamp(16px,4vw,40px);grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))">${bar('100%', 'min(50vh,420px)', '12px')}${bar('100%', 'min(50vh,420px)', '12px')}</div></div>`;
  }
  if (themeId === 'theme-05-ledup') {
    return `${css}<div class="sxb" aria-hidden="true" style="min-height:100vh;background:${p.bg};position:relative"><div style="height:min(100svh,760px);background:${block};border-radius:0 0 50px 50px"></div><div style="position:absolute;top:24px;left:clamp(12px,4vw,75px);right:clamp(12px,4vw,75px);height:56px;border-radius:999px;background:${p.bg};opacity:.85;display:flex;align-items:center;gap:22px;padding:0 24px">${bar('104px', '20px', '999px', line)}<div style="margin-inline-start:auto;display:flex;gap:10px">${bar('34px', '34px', '999px', line)}${bar('34px', '34px', '999px', line)}</div></div></div>`;
  }
  return `${css}<div class="sxb" aria-hidden="true" style="min-height:100vh;background:${p.bg}"><div style="height:72px;display:flex;align-items:center;gap:28px;padding:0 clamp(16px,4vw,40px);border-bottom:1px solid ${line}">${bar('112px', '22px', '8px')}<div style="margin-inline-start:auto;display:flex;gap:10px">${bar('34px', '34px', '999px')}${bar('34px', '34px', '999px')}${bar('34px', '34px', '999px')}</div></div><div style="padding:clamp(12px,2vw,24px) clamp(16px,4vw,40px)"><div style="height:min(70vh,560px);border-radius:28px;background:${block}"></div></div></div>`;
}

/**
 * Puts the store + theme + home page into the HTML (`window.__SX_BOOT__`) so the browser makes no bootstrap request and
 * paints the real storefront at once, and paints the seller's page colour + a themed placeholder before JS runs.
 * Only a plain public store is ever inlined. The per-visitor field (`cookieBannerEnabled`) is left out on purpose: the
 * page is cached for everyone, and the browser asks the live endpoint for it right after loading.
 */
function injectBoot(html, boot, { omitHome = false } = {}) {
  const store = boot?.store;
  const theme = boot?.theme;
  if (!store?.storeId || (store.privacyMode && store.privacyMode !== 'public') || !theme) return { html, inlined: false };
  const { cookieBannerEnabled: _visitorOnly, ...publicStore } = store;
  // The home page travels once: in `__SX_DATA__` when the page was server-rendered, here otherwise.
  let snapshot = { store: publicStore, theme, home: omitHome ? null : boot.home ?? null, at: Date.now() };
  let json = safeJson(snapshot);
  if (json.length > MAX_INLINE_BYTES) { snapshot = { ...snapshot, home: null }; json = safeJson(snapshot); }
  if (json.length > MAX_INLINE_BYTES) return { html, inlined: false };
  const palette = {
    bg: hexOr(theme.theme?.bgColor, '#FFFFFF'),
    ink: hexOr(theme.theme?.textColor, '#111111'),
    accent: hexOr(theme.theme?.primaryColor, '#111111'),
  };
  const head = `<style>html,body{background:${palette.bg}}</style>\n    <script>window.__SX_BOOT__=${json};</script>`;
  const themeId = typeof theme.themeDefinitionId === 'string' ? theme.themeDefinitionId : '';
  const withHead = html.replace('</head>', () => `    ${head}\n  </head>`);
  // The markers let `injectSsr` swap the placeholder for the real server-rendered page.
  const withBody = withHead.replace(/<div id="root">\s*<\/div>/, () => `<div id="root"><!--sx-root-->${skeletonHtml(themeId, palette)}<!--/sx-root--></div>`);
  return { html: withBody, inlined: true };
}

// Server rendering of the page itself (see src/entry-server.tsx). Off unless SSR_ENABLED=1, or asked for one request with ?__ssr=1.
let ssrModule;
async function loadSsr() {
  ssrModule ??= import('../dist-ssr/entry-server.js').catch((error) => {
    console.error('SSR bundle could not be loaded', error);
    return null;
  });
  return ssrModule;
}

let manifestPromise;
async function loadManifest() {
  manifestPromise ??= fs.readFile(path.join(process.cwd(), 'dist', '.vite', 'manifest.json'), 'utf8').then(JSON.parse).catch(() => null);
  return manifestPromise;
}

/** Source files of the chunks a theme needs on its first page (they are lazy chunks of the browser build). */
const THEME_ENTRIES = {
  'theme-04-tech': ['src/features/storefront-themes/theme-04-tech/layout/TechLayout.tsx', 'src/features/storefront-themes/theme-04-tech/pages/TechContentPages.tsx'],
  'theme-05-ledup': ['src/features/storefront-themes/theme-05-ledup/layout/LedupLayout.tsx', 'src/features/storefront-themes/theme-05-ledup/pages/LedupContentPages.tsx'],
};

/** Stylesheets + scripts of the theme's lazy chunks, so the server-rendered page is styled the moment it paints and the scripts start early. */
function themeAssetLinks(manifest, themeId) {
  const roots = THEME_ENTRIES[themeId];
  if (!manifest || !roots) return '';
  const css = new Set();
  const js = new Set();
  const seen = new Set();
  const visit = (key) => {
    const chunk = manifest[key];
    if (!chunk || seen.has(key)) return;
    seen.add(key);
    if (chunk.file) js.add(chunk.file);
    for (const file of chunk.css ?? []) css.add(file);
    for (const imported of chunk.imports ?? []) visit(imported);
  };
  roots.forEach(visit);
  const safe = (file) => /^[\w./-]+$/.test(file);
  return [
    ...[...css].filter(safe).map((file) => `<link rel="stylesheet" href="/${file}">`),
    ...[...js].filter(safe).map((file) => `<link rel="modulepreload" crossorigin href="/${file}">`),
  ].join('\n    ');
}

/** Puts the server-rendered page (and the data it used) into the HTML. */
function injectSsr(html, rendered, manifest) {
  const data = safeJson(rendered.data ?? {});
  const links = themeAssetLinks(manifest, rendered.themeId);
  const head = `${links ? `${links}\n    ` : ''}<script>window.__SX_DATA__=${data};</script>`;
  const withHead = html.replace('</head>', () => `    ${head}\n  </head>`);
  return withHead.replace(/<!--sx-root-->[\s\S]*?<!--\/sx-root-->/, () => rendered.html);
}

async function sendStorefrontShell(response, status = 200) {
  const file = path.join(process.cwd(), 'dist', 'index.html');
  const shell = stripPlatformContent(await fs.readFile(file, 'utf8'));
  const fallbackShell = shell
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>Online Store</title>')
    .replace('</head>', '    <meta name="robots" content="noindex, nofollow">\n  </head>');
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Vary', 'Host');
  response.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').send(fallbackShell);
}

const sleep = (ms) => new Promise((resolve) => { const timer = setTimeout(resolve, ms); timer.unref?.(); });

/** Runs work after the visitor was answered (Vercel keeps the function alive for it); a plain Node run just lets it continue. */
function background(promise) {
  const safe = Promise.resolve(promise).catch((error) => console.error('Storefront background job failed', error));
  try { waitUntil(safe); } catch { /* not on Vercel (local run): the promise simply keeps running */ }
}

/** The SEO document of a page: its meta tags, or why there is none. */
async function fetchDocument(host, routePath) {
  const apiUrl = new URL(`${API_ORIGIN}/api/storefront-seo/document`);
  apiUrl.searchParams.set('host', host);
  apiUrl.searchParams.set('path', routePath);
  const res = await fetch(apiUrl, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    if (res.status === 404) return { kind: 'notfound' };
    // Metadata is an SEO enhancement; a transient metadata outage must not prevent the client storefront from rendering a valid deep link.
    if (res.status >= 500) return { kind: 'unavailable' };
    return { kind: 'other', status: res.status };
  }
  const meta = await res.json();
  if (meta.redirect && [301, 302, 303, 307, 308].includes(Number(meta.statusCode))) return { kind: 'redirect', meta };
  return { kind: 'ok', meta };
}

// ---- Never slower than the plain app shell ------------------------------------------------------------------------------
// The visitor waits for the store data and the server render only as long as the budgets below allow. Whatever is not ready
// is finished in the BACKGROUND and kept in this instance's memory, so the next request for the same page is answered at once
// (and, through the CDN, so is everyone after). The page a visitor gets is always at least as good as the plain shell.
const FIRST_BYTE_BUDGET_MS = 2000; // how long (from the start) the store data may take before the shell is sent without it
const SSR_DEADLINE_MS = 2800; // by when (from the start) a visitor-facing render must be finished
const WARM_FRESH_MS = 30_000; // a built page is served as is for this long ...
const WARM_USABLE_MS = 120_000; // ... and, while it is refreshed in the background, for this long after
const WARM_MAX_ENTRIES = 100;
const WARM_UNFINISHED_MS = 8_000;
const NO_SSR_MS = 120_000; // a page that cannot be server-rendered (password store, other language...) is not retried for this long

const warm = new Map(); // key (host + path) -> { at, meta, boot, result, complete }
const refreshing = new Map(); // key -> running refresh (one per page)
const noSsrUntil = new Map(); // key -> timestamp

function warmGet(key) {
  const entry = warm.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > WARM_USABLE_MS) { warm.delete(key); return null; }
  warm.delete(key); warm.set(key, entry); // most recently used last
  return entry;
}

function warmSet(key, entry) {
  warm.delete(key);
  warm.set(key, entry);
  while (warm.size > WARM_MAX_ENTRIES) warm.delete(warm.keys().next().value);
}

/** Builds the page again with the full time budget (store data, SEO tags, server render) and keeps it in memory. */
function refreshWarm(key, host, routePath) {
  const running = refreshing.get(key);
  if (running) return running;
  const job = (async () => {
    try {
      const doc = await fetchDocument(host, routePath);
      if (doc.kind !== 'ok') { warm.delete(key); return; } // the page is gone / moved: never serve the old copy again
      const boot = await fetchBootstrap(host, 6000);
      const ssr = await loadSsr();
      if (!ssr || !boot?.store?.storeId || !boot.theme) return;
      if (ssr.ssrSkipReason({ path: routePath, store: boot.store, theme: boot.theme })) { noSsrUntil.set(key, Date.now() + NO_SSR_MS); warm.delete(key); return; }
      const result = await ssr.renderStorefront({ host, path: routePath, store: boot.store, theme: boot.theme, home: boot.home, budgetMs: 4500 });
      if (result?.html) warmSet(key, { at: Date.now(), meta: doc.meta, boot, result, complete: !!result.complete });
    } finally {
      refreshing.delete(key);
    }
  })();
  refreshing.set(key, job);
  return job;
}

/** Turns the pieces into the HTML page and sends it. `result` is the server render (or null), `boot` the store data (or null). */
async function sendPage(response, meta, boot, result, { source, pending, noStore }) {
  const file = path.join(process.cwd(), 'dist', 'index.html');
  const shell = stripPlatformContent(await fs.readFile(file, 'utf8'));
  let { html, inlined } = injectBoot(injectMetadata(shell, meta), boot, { omitHome: !!result?.html });
  let rendered = false;
  if (inlined && result?.html) {
    html = injectSsr(html, result, await loadManifest());
    rendered = true;
  }
  response.setHeader('X-Solvexo-SSR', rendered ? 'hit' : 'off');
  response.setHeader('X-Solvexo-SSR-Source', source);
  // Lets one store's cached pages be purged together (e.g. when the seller publishes).
  if (inlined && /^[a-f0-9]{24}$/i.test(String(boot?.store?.storeId))) response.setHeader('Vercel-Cache-Tag', `store-${boot.store.storeId}`);
  // A request that forced SSR with ?__ssr=1 is a test: never cached. With the store data inside the page the cache is kept
  // short so a publish shows up within seconds. A page that is not finished yet is kept only a moment, so the CDN soon asks
  // again and picks up the finished copy the background job has built.
  response.setHeader('Cache-Control', noStore ? 'private, no-store' : pending ? 'public, s-maxage=5, stale-while-revalidate=120' : inlined ? 'public, s-maxage=30, stale-while-revalidate=120' : 'public, s-maxage=60, stale-while-revalidate=300');
  response.setHeader('Vary', 'Host');
  response.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
}

export default async function handler(request, response) {
  response.setHeader('X-Powered-By', 'Solvexo');
  response.setHeader('X-Solvexo-Platform', '1');
  const host = String(request.headers['x-forwarded-host'] || request.headers.host || '').split(',')[0].trim().toLowerCase();
  const routePath = typeof request.query.path === 'string' ? request.query.path : '/';
  if (!host || routePath.length > 2048 || !routePath.startsWith('/') || routePath.startsWith('//')) {
    response.status(400).send('Invalid storefront request');
    return;
  }

  try {
    if (routePath === '/robots.txt' || /^\/sitemap(?:-\d+)?\.xml$/.test(routePath)) {
      const crawlPath = routePath === '/robots.txt'
        ? '/api/storefront-seo/robots.txt'
        : `/api/storefront-seo/${routePath.slice(1)}`;
      const crawlUrl = new URL(`${API_ORIGIN}${crawlPath}`);
      crawlUrl.searchParams.set('host', host);
      const crawlResponse = await fetch(crawlUrl, { signal: AbortSignal.timeout(5000) });
      response.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
      response.setHeader('Vary', 'Host');
      response.status(crawlResponse.status).setHeader('Content-Type', crawlResponse.headers.get('content-type') || 'text/plain; charset=utf-8');
      response.send(await crawlResponse.text());
      return;
    }
    // Real server rendering: only for a plain public store, and only when switched on (SSR_ENABLED=1) or asked for (?__ssr=1).
    const ssrFlag = String(request.query.ssr ?? '');
    // ?__ssr=1 = test the server render itself (skips the in-memory copy, waits long for the data); ?__ssr=2 = test the real
    // production path (memory copy + time budget) for this request only. Neither is cached by the CDN. ?__ssr=0 = off.
    const ssrForced = ssrFlag === '1';
    const ssrWarmTest = ssrFlag === '2';
    const testRequest = ssrForced || ssrWarmTest;
    const ssrOn = ssrFlag !== '0' && (process.env.SSR_ENABLED === '1' || testRequest);
    const key = `${host}${routePath}`;

    // A page this instance already built: answer from memory at once (no API calls); refresh it in the background when it is old.
    if (ssrOn && !ssrForced) {
      const entry = warmGet(key);
      if (entry) {
        // A copy with parts still missing is refreshed sooner than a finished one.
        if (Date.now() - entry.at > (entry.complete ? WARM_FRESH_MS : WARM_UNFINISHED_MS)) background(refreshWarm(key, host, routePath));
        await sendPage(response, entry.meta, entry.boot, entry.result, { source: 'warm', pending: !entry.complete, noStore: testRequest });
        return;
      }
    }

    const startedAt = Date.now();
    // Started now, in parallel with the metadata request, so it adds no waiting time of its own. It keeps running after the visitor was answered.
    const bootPromise = fetchBootstrap(host, 6000);
    const doc = await fetchDocument(host, routePath);
    if (doc.kind === 'notfound') {
      const file = path.join(process.cwd(), 'dist', 'index.html');
      const shell = stripPlatformContent(await fs.readFile(file, 'utf8'));
      response.setHeader('Cache-Control', 'private, no-store');
      response.setHeader('Vary', 'Host');
      const notFoundShell = shell
        .replace(/<title>[\s\S]*?<\/title>/i, '<title>Page not found</title>')
        .replace('</head>', '    <meta name="robots" content="noindex, nofollow">\n  </head>');
      response.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send(notFoundShell);
      return;
    }
    if (doc.kind === 'unavailable') {
      await sendStorefrontShell(response);
      return;
    }
    if (doc.kind === 'other') {
      response.status(doc.status).send('Invalid storefront route');
      return;
    }
    if (doc.kind === 'redirect') {
      response.setHeader('Cache-Control', 'public, max-age=300');
      response.setHeader('Location', doc.meta.redirect);
      response.status(Number(doc.meta.statusCode)).send('');
      return;
    }
    const meta = doc.meta;

    // The visitor never waits long for the store data: what is not there in time is finished in the background.
    const wait = Math.max(0, (ssrForced ? 6000 : FIRST_BYTE_BUDGET_MS) - (Date.now() - startedAt));
    const boot = await Promise.race([bootPromise, sleep(wait).then(() => null)]);

    let result = null;
    let finishInBackground = ssrOn && !ssrForced && !(noSsrUntil.get(key) > Date.now());
    if (ssrOn && boot?.store?.storeId && boot.theme) {
      try {
        const ssr = await loadSsr();
        if (ssr && ssr.ssrSkipReason({ path: routePath, store: boot.store, theme: boot.theme })) {
          noSsrUntil.set(key, Date.now() + NO_SSR_MS); // this page is never server-rendered: nothing to finish later either
          finishInBackground = false;
        } else if (ssr) {
          result = await ssr.renderStorefront({
            host, path: routePath, store: boot.store, theme: boot.theme, home: boot.home,
            budgetMs: ssrForced ? 3500 : Math.max(400, SSR_DEADLINE_MS - (Date.now() - startedAt)),
            skipIfBusy: !ssrForced,
          });
        }
      } catch (error) {
        console.error('Storefront SSR failed, serving the app shell', error);
      }
    }
    if (ssrOn && !ssrForced && finishInBackground) {
      if (boot && result?.complete) warmSet(key, { at: Date.now(), meta, boot, result, complete: true });
      else background(refreshWarm(key, host, routePath));
    }
    // `pending`: a finished copy is being built in the background, so the CDN should ask again soon instead of keeping this one.
    const pending = ssrOn && !ssrForced && finishInBackground && !(boot && result?.complete);
    await sendPage(response, meta, boot, result, { source: 'fresh', pending, noStore: testRequest });
  } catch (error) {
    console.error('Storefront document rendering failed', error);
    if (routePath === '/robots.txt' || /^\/sitemap(?:-\d+)?\.xml$/.test(routePath)) {
      response.status(503).send('Storefront metadata is temporarily unavailable');
      return;
    }
    try {
      // Keep storefront navigation available if the metadata API times out.
      await sendStorefrontShell(response);
    } catch (shellError) {
      console.error('Storefront fallback shell could not be loaded', shellError);
      response.status(503).send('Storefront is temporarily unavailable');
    }
  }
}
