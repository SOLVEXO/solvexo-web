import { describe, expect, it } from 'vitest';
import { detectSiteLang, isSitePath } from './siteLanguage';

describe('public site language', () => {
  it('shows Arabic to GCC visitors and English to everyone else, unless they chose', () => {
    for (const cc of ['ae', 'sa', 'qa', 'kw', 'bh', 'om']) expect(detectSiteLang(`/${cc}/pricing`, null)).toBe('ar');
    expect(detectSiteLang('/pk/pricing', null)).toBe('en');
    expect(detectSiteLang('/pricing', null)).toBe('en');
    expect(detectSiteLang('/ae/pricing', 'en')).toBe('en');
    expect(detectSiteLang('/pk', 'ar')).toBe('ar');
  });

  it('only switches the public site and sign-up, never dashboards', () => {
    for (const p of ['/', '/pricing', '/products/pos', '/solutions/fashion', '/register', '/onboard', '/start']) expect(isSitePath(p)).toBe(true);
    for (const p of ['/store/abc/dashboard', '/admin', '/seller/stores', '/blog', '/account']) expect(isSitePath(p)).toBe(false);
  });
});
