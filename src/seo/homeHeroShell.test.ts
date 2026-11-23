import { describe, expect, it } from 'vitest';
import { HOME_HERO_TEXT } from '@/features/buyer/components/HomeHeroLight.text';
import { HOME_HERO_SHELL_ID, HOME_HERO_SHELL_TEXT, homeHeroShellHtml } from './homeHeroShell';
import { buildPrerenderedHtml } from './prerender';
import { SITEMAP_PAGES } from './publicPages';

const TEMPLATE = '<html><head><title>x</title><!--/solvexo-platform-head--></head><body><div id="root"><!--solvexo-platform-body--><!--/solvexo-platform-body--></div></body></html>';

describe('home hero shell', () => {
  it('shows the same English copy as the real hero', () => {
    for (const [k, v] of Object.entries(HOME_HERO_SHELL_TEXT)) expect(HOME_HERO_TEXT.en[k as keyof typeof HOME_HERO_TEXT.en]).toBe(v);
  });

  it('is added after #root on the home page only', () => {
    const home = buildPrerenderedHtml(TEMPLATE, SITEMAP_PAGES.find(p => p.path === '/')!);
    expect(home).toContain(`<!--/solvexo-platform-body--></div>\n    ${homeHeroShellHtml()}`);
    const pricing = buildPrerenderedHtml(TEMPLATE, SITEMAP_PAGES.find(p => p.path === '/pricing')!);
    expect(pricing).not.toContain(HOME_HERO_SHELL_ID);
  });

  it('is hidden without JavaScript and for the Arabic site, and kept out of the accessibility tree', () => {
    const html = homeHeroShellHtml();
    expect(html).toContain(`html:not(.js) #${HOME_HERO_SHELL_ID},.sx-site-ar #${HOME_HERO_SHELL_ID}{display:none}`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toMatch(/<h[1-6]/);
  });
});
