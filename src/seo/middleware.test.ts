// @vitest-environment node
import { describe, expect, it } from 'vitest';
import middleware from '../../middleware';

const BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
function call(url: string, ua = BOT) {
  const u = new URL(url);
  return middleware(new Request(url, { headers: { host: u.host, 'user-agent': ua, accept: 'text/html' } })) as Response;
}
const rewriteOf = (r: Response) => r.headers.get('x-middleware-rewrite');

describe('middleware: country redirect', () => {
  const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
  const visit = (ua: string) => middleware(new Request('https://www.solvexo.store/pricing', { headers: { host: 'www.solvexo.store', 'user-agent': ua, accept: 'text/html', 'x-vercel-ip-country': 'PK' } })) as Response;
  it("sends people to their country's address but never Google's crawlers or Search Console's inspection tool", () => {
    expect(visit(CHROME).status).toBe(307);
    expect(visit(CHROME).headers.get('location')).toBe('https://www.solvexo.store/pk/pricing');
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)',
      'Mozilla/5.0 (compatible; GoogleOther)',
    ]) expect(visit(ua).status, ua).not.toBe(307);
  });
});

describe('middleware: pre-built public pages', () => {
  it('serves each public page its own pre-built HTML, country addresses included', () => {
    expect(rewriteOf(call('https://www.solvexo.store/'))).toBe('https://www.solvexo.store/_pages/index.html');
    expect(rewriteOf(call('https://www.solvexo.store/pricing'))).toBe('https://www.solvexo.store/_pages/pricing.html');
    expect(rewriteOf(call('https://www.solvexo.store/pk/products/pos'))).toBe('https://www.solvexo.store/_pages/products__pos.html');
  });

  it('leaves dashboards, unknown pages and other hosts alone', () => {
    expect(rewriteOf(call('https://www.solvexo.store/store/abc/analytics'))).toBeNull();
    expect(rewriteOf(call('https://www.solvexo.store/no-such-page'))).toBeNull();
    expect(rewriteOf(call('https://seller.solvexo.store/pricing'))).toBeNull();
    // A store's own domain still goes to its storefront document.
    expect(rewriteOf(call('https://shop.example.com/pricing'))).toContain('/api/storefront-document');
  });

  it('keeps search engines out of the seller panel', async () => {
    const res = call('https://seller.solvexo.store/robots.txt');
    expect(await res.text()).toBe('User-agent: *\nDisallow: /\n');
  });
});
