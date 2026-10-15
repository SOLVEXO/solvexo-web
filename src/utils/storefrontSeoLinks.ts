import { DEFAULT_LOCALE, localeFromPathname } from '@/i18n/localeConfig';

/** Path without any language prefix (`/ur/cart` -> `/cart`). */
export function stripLocalePrefix(pathname: string): string {
  const l = localeFromPathname(pathname);
  if (!l) return pathname || '/';
  const rest = pathname.slice(l.length + 1);
  return rest.startsWith('/') ? rest : `/${rest}`;
}

/** Absolute URL of a (prefix-free) path in a language. The default language has no prefix. */
export function localizedUrl(origin: string, barePath: string, locale: string, defaultLocale: string = DEFAULT_LOCALE): string {
  const prefix = locale && locale !== defaultLocale ? `/${locale}` : '';
  return `${origin.replace(/\/$/, '')}${prefix}${barePath}`;
}

export interface HreflangLink { hreflang: string; href: string }

/**
 * `<link rel="alternate" hreflang>` set for a page. Only languages the store
 * really offers are listed; with a single language nothing is emitted. The
 * `x-default` entry is the default-language (unprefixed) URL.
 */
export function buildHreflangLinks(origin: string, pathname: string, offeredLanguages: string[], defaultLocale: string = DEFAULT_LOCALE): HreflangLink[] {
  const langs = Array.from(new Set(offeredLanguages));
  if (langs.length < 2) return [];
  const bare = stripLocalePrefix(pathname);
  const links = langs.map(l => ({ hreflang: l, href: localizedUrl(origin, bare, l, defaultLocale) }));
  links.push({ hreflang: 'x-default', href: localizedUrl(origin, bare, defaultLocale, defaultLocale) });
  return links;
}

/** Self-referencing canonical for the page in the language being viewed. */
export function buildCanonicalUrl(origin: string, pathname: string, locale: string, defaultLocale: string = DEFAULT_LOCALE): string {
  return localizedUrl(origin, stripLocalePrefix(pathname), locale, defaultLocale);
}

/** Replaces the page's hreflang links (idempotent). Pass [] to remove them. */
export function applyHreflangLinks(links: HreflangLink[]): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('link[rel="alternate"][data-seo-hreflang]').forEach(el => el.remove());
  links.forEach(l => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', l.hreflang);
    el.setAttribute('href', l.href);
    el.setAttribute('data-seo-hreflang', '1');
    document.head.appendChild(el);
  });
}
