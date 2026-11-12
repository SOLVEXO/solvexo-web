import { countryFromPathname } from '@/utils/countryPrefix';

/**
 * Language of Solvexo's own public website (marketing pages, sign-up and store setup). Separate from the
 * storefront/dashboard i18n: dashboards stay English, merchant storefronts keep their own languages.
 *  - a choice the visitor made (language switch) wins;
 *  - otherwise visitors on a GCC country address (/ae, /sa, /qa, /kw, /bh, /om) get Arabic;
 *  - everyone else gets English.
 */
export type SiteLang = 'en' | 'ar';
export const SITE_LANGS: SiteLang[] = ['en', 'ar'];
export const GCC_COUNTRIES = new Set(['ae', 'sa', 'qa', 'kw', 'bh', 'om']);
export const SITE_LANG_KEY = 'solvexo_site_lang';
export const SITE_LANG_COOKIE = 'sx_lang';

export function savedSiteLang(): SiteLang | null {
  try {
    const v = localStorage.getItem(SITE_LANG_KEY);
    return v === 'en' || v === 'ar' ? v : null;
  } catch { return null; }
}

export function saveSiteLang(lang: SiteLang): void {
  try { localStorage.setItem(SITE_LANG_KEY, lang); } catch { /* private mode: falls back to the country default */ }
  try { document.cookie = `${SITE_LANG_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`; } catch { /* cookies blocked */ }
}

/** The language a visitor on `fullPathname` (with its country prefix, i.e. window.location.pathname) should see. */
export function detectSiteLang(fullPathname: string, saved: SiteLang | null = savedSiteLang()): SiteLang {
  if (saved) return saved;
  const country = countryFromPathname(fullPathname);
  return country && GCC_COUNTRIES.has(country) ? 'ar' : 'en';
}

/** Router paths (country prefix already removed) that belong to the public website and sign-up: the only pages that switch to Arabic. */
const SITE_EXACT = new Set([
  '/', '/pricing', '/sellers', '/faq', '/contact-us', '/book-demo', '/about', '/security', '/products', '/solutions',
  '/manuals', '/start', '/login', '/register', '/signup', '/verify-otp', '/forgot-password', '/new-password', '/onboard',
]);
// Legal pages (privacy, terms, cookies) stay English: a legal text needs a reviewed translation, not a draft.
const SITE_PREFIXES = ['/products/', '/solutions/', '/onboard/'];

export function isSitePath(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return SITE_EXACT.has(p) || SITE_PREFIXES.some(prefix => p.startsWith(prefix));
}
