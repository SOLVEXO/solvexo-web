import fs from 'node:fs/promises';
import path from 'node:path';

const API_ORIGIN = (process.env.SOLVEXO_API_URL || process.env.VITE_API_URL || 'https://api.solvexo.store').replace(/\/$/, '');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function injectMetadata(html, meta) {
  const tags = [
    `<title>${escapeHtml(meta.title || 'Online Store')}</title>`,
    meta.description ? `<meta name="description" content="${escapeHtml(meta.description)}">` : '',
    meta.canonicalUrl ? `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}">` : '',
    meta.favicon || meta.ogImage ? `<link rel="icon" href="${escapeHtml(meta.favicon || meta.ogImage)}">` : '',
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow'}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(meta.ogTitle || meta.title || '')}">`,
    `<meta property="og:description" content="${escapeHtml(meta.ogDescription || meta.description || '')}">`,
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
    .replace(/<link\s+rel=["'](?:icon|shortcut icon)["'][^>]*>/ig, '')
    .replace(/<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/ig, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/ig, '');
  return withoutOldSeo.replace('</head>', `    ${tags}\n  </head>`);
}

async function sendStorefrontShell(response, status = 200) {
  const file = path.join(process.cwd(), 'dist', 'index.html');
  const shell = await fs.readFile(file, 'utf8');
  const fallbackShell = shell
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>Online Store</title>')
    .replace('</head>', '    <meta name="robots" content="noindex, nofollow">\n  </head>');
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Vary', 'Host');
  response.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').send(fallbackShell);
}

export default async function handler(request, response) {
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
    const apiUrl = new URL(`${API_ORIGIN}/api/storefront-seo/document`);
    apiUrl.searchParams.set('host', host);
    apiUrl.searchParams.set('path', routePath);
    const apiResponse = await fetch(apiUrl, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
    if (!apiResponse.ok) {
      if (apiResponse.status === 404) {
        const file = path.join(process.cwd(), 'dist', 'index.html');
        const shell = await fs.readFile(file, 'utf8');
        response.setHeader('Cache-Control', 'private, no-store');
        response.setHeader('Vary', 'Host');
        const notFoundShell = shell
          .replace(/<title>[\s\S]*?<\/title>/i, '<title>Page not found</title>')
          .replace('</head>', '    <meta name="robots" content="noindex, nofollow">\n  </head>');
        response.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send(notFoundShell);
        return;
      }
      if (apiResponse.status >= 500) {
        // Metadata is an SEO enhancement; a transient metadata outage must not
        // prevent the client storefront from rendering a valid deep link.
        await sendStorefrontShell(response);
        return;
      }
      response.status(apiResponse.status).send('Invalid storefront route');
      return;
    }
    const meta = await apiResponse.json();
    if (meta.redirect && [301, 302, 303, 307, 308].includes(Number(meta.statusCode))) {
      response.setHeader('Cache-Control', 'public, max-age=300');
      response.setHeader('Location', meta.redirect);
      response.status(Number(meta.statusCode)).send('');
      return;
    }
    const file = path.join(process.cwd(), 'dist', 'index.html');
    const shell = await fs.readFile(file, 'utf8');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Vary', 'Host');
    response.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(injectMetadata(shell, meta));
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
