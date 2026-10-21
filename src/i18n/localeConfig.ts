/**
 * Static locale configuration shared by the router (boot-time basename), the
 * i18n bootstrap and the storefront language switcher. Pure + dependency free
 * so it can run before React / i18next load.
 *
 * Only `en` and `ur` ship UI string files; every other code falls back to the
 * English UI while seller CONTENT (products, pages, menus...) still shows its
 * translation.
 */
import { LANGUAGE_DATA } from './languageData';

export const DEFAULT_LOCALE = 'en';

export const SUPPORTED_UI_LOCALES: readonly string[] = LANGUAGE_DATA.map(l => l.code);
export type UiLocale = string;

/** Locales with a bundled UI string file. Every other language gets its bundle generated once and served by the API. */
export const UI_STRING_LOCALES: readonly string[] = [
  'en', 'ur', 'ar', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'tr', 'hi', 'fa', 'id', 'ru', 'zh', 'ja', 'ko', 'ms', 'pl', 'sv', 'th', 'vi',
];

export const RTL_LOCALES: readonly string[] = LANGUAGE_DATA.filter(l => l.rtl).map(l => l.code);

export const LANGUAGE_STORAGE_KEY = 'solvexo_language';

/** Endonyms for the language switcher. */
export const LOCALE_NAMES: Record<string, string> = Object.fromEntries(LANGUAGE_DATA.map(l => [l.code, l.native]));

export function isSupportedLocale(code: string | null | undefined): code is UiLocale {
  return !!code && (SUPPORTED_UI_LOCALES as readonly string[]).includes(code.toLowerCase());
}

export function isRtlLocale(code: string | null | undefined): boolean {
  return !!code && RTL_LOCALES.includes(code.toLowerCase());
}

/**
 * `/ur/product/x` -> `ur`. Any supported language can be a prefix, English too: a store written in another
 * language (its default, no prefix) serves English at `/en/...`. A store whose own language is the one in
 * the prefix redirects to the unprefixed URL (StorefrontMarketProvider).
 */
export function localeFromPathname(pathname: string): UiLocale | null {
  const seg = pathname.split('/')[1]?.toLowerCase();
  if (seg && isSupportedLocale(seg)) return seg;
  return null;
}

/** Router basename for a pathname: `/ur` or `/` (React Router accepts `/`). */
export function basenameFromPathname(pathname: string): string {
  const l = localeFromPathname(pathname);
  return l ? `/${l}` : '/';
}

/** Same path in another language: strips any current prefix, adds the new one (none for the store's default language). */
export function switchLocalePath(pathname: string, search: string, hash: string, target: string, defaultLocale: string = DEFAULT_LOCALE): string {
  const current = localeFromPathname(pathname);
  let rest = current ? pathname.slice(current.length + 1) : pathname;
  if (!rest.startsWith('/')) rest = `/${rest}`;
  const prefix = target && target !== defaultLocale ? `/${target}` : '';
  const path = rest === '/' && prefix ? prefix + '/' : prefix + rest;
  return `${path}${search}${hash}`;
}

/** Locales that may be used for UI (locales without a bundle resolve to English UI). */
export function uiLanguageFor(code: string): string {
  return isSupportedLocale(code) ? code.toLowerCase() : DEFAULT_LOCALE;
}
