import { describe, expect, it } from 'vitest';
import { buildRobotsTxt, buildSitemapXml, canonicalUrl, seoForPath, SITEMAP_PAGES } from './publicPages';

describe('public site SEO', () => {
  it('gives every indexable page its own title and description', () => {
    const titles = SITEMAP_PAGES.map(p => p.title);
    const descriptions = SITEMAP_PAGES.map(p => p.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const p of SITEMAP_PAGES) {
      expect(p.title).toContain('Solvexo');
      expect(p.description.length).toBeGreaterThan(50);
      expect(p.description.length).toBeLessThanOrEqual(160);
    }
  });

  it('covers products and solutions, and keeps sign-in steps and unknown pages out', () => {
    expect(seoForPath('/products/pos')?.index).toBe(true);
    expect(seoForPath('/solutions/retail/')?.path).toBe('/solutions/retail');
    expect(seoForPath('/login')?.index).toBe(false);
    expect(seoForPath('/onboard/store')?.index).toBe(false);
    expect(seoForPath('/no-such-page')).toBeNull();
    expect(seoForPath('/store/abc/analytics')).toBeNull();
  });

  it('canonicalises to the www host without a trailing slash', () => {
    expect(canonicalUrl('/')).toBe('https://www.solvexo.store/');
    expect(canonicalUrl('/pricing/')).toBe('https://www.solvexo.store/pricing');
  });

  it('writes a sitemap of every indexable page and a robots.txt pointing at it', () => {
    const xml = buildSitemapXml('2026-11-06');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect((xml.match(/<url>/g) ?? []).length).toBe(SITEMAP_PAGES.length);
    expect(xml).toContain('<loc>https://www.solvexo.store/products/store-builder</loc>');
    expect(xml).not.toContain('/login');
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/); // no unescaped ampersands
    const robots = buildRobotsTxt();
    expect(robots).toContain('Sitemap: https://www.solvexo.store/sitemap.xml');
    expect(robots).toContain('Disallow: /store/');
  });
});
