// @vitest-environment node
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { buildPrerenderedHtml, prerenderAll, prerenderedFile, stripCountryPrefix } from './prerender';
import { seoForPath, SITEMAP_PAGES } from './publicPages';

const template = readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

describe('pre-built public pages', () => {
  it('writes one file per sitemap page', () => {
    const files = prerenderAll(template);
    expect(files).toHaveLength(SITEMAP_PAGES.length);
    expect(new Set(files.map(([f]) => f)).size).toBe(files.length);
    expect(prerenderedFile('/products/pos/')).toBe('/_pages/products__pos.html');
    expect(prerenderedFile('/login')).toBeNull();
    expect(stripCountryPrefix('/pk/pricing')).toBe('/pricing');
    expect(stripCountryPrefix('/pk')).toBe('/');
    expect(stripCountryPrefix('/pricing')).toBe('/pricing');
  });

  it("puts the page's own head tags and plain-HTML content in place, once", () => {
    const html = buildPrerenderedHtml(template, seoForPath('/products/pos')!);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain('<title>Point of Sale: Sell in person, synced with your store | Solvexo</title>');
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://www.solvexo.store/products/pos" />');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('<h1 style="font-size:30px;margin:0">Point of Sale: Sell in person, synced with your store</h1>');
    expect(html).toContain('<a href="/pricing">Pricing</a>');
    expect(html).not.toContain('How Solvexo uses Google sign-in');
    // The app still boots from the same file.
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
    expect(html).toContain('<div id="root"><!--solvexo-platform-body-->');
  });

  it('keeps the Google sign-in explanation and the plain "Solvexo" heading on the home page', () => {
    const html = buildPrerenderedHtml(template, seoForPath('/')!);
    expect(html).toContain('How Solvexo uses Google sign-in');
    expect(html).toContain('>Solvexo</h1>');
    expect(html).toContain('<a href="/products/store-builder">Store Builder</a>');
  });
});
