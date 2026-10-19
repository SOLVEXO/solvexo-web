/**
 * Static locale configuration shared by the router (boot-time basename), the
 * i18n bootstrap and the storefront language switcher. Pure + dependency free
 * so it can run before React / i18next load.
 *
 * Only `en` and `ur` ship UI string files; every other code falls back to the
 * English UI while seller CONTENT (products, pages, menus...) still shows its
 * translation.
 */
export const DEFAULT_LOCALE = 'en';

export const SUPPORTED_UI_LOCALES = [
  'en', 'ur', 'ar', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'tr', 'hi', 'bn', 'fa', 'he', 'id', 'ru', 'zh', 'ja', 'ko',
  'ms', 'pa', 'pl', 'sv', 'ta', 'th', 'vi', // must stay a superset of utils/languages.ts (what sellers can pick)
] as const;
export type UiLocale = (typeof SUPPORTED_UI_LOCALES)[number];

/** Locales with a real UI string bundle. */
export const UI_STRING_LOCALES: readonly string[] = [
  'en', 'ur', 'ar', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'tr', 'hi', 'fa', 'id', 'ru', 'zh', 'ja', 'ko', 'ms', 'pl', 'sv', 'th', 'vi',
]; // bn/he/pa/ta bundles not written yet: they fall back to English UI

export const RTL_LOCALES: readonly string[] = ['ur', 'ar', 'he', 'fa'];

export const LANGUAGE_STORAGE_KEY = 'solvexo_language';

/** Endonyms for the language switcher. */
export const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ur: 'اردو', ar: 'العربية', fr: 'Français', de: 'Deutsch', es: 'Español', it: 'Italiano',
  pt: 'Português', nl: 'Nederlands', tr: 'Türkçe', hi: 'हिन्दी', bn: 'বাংলা', fa: 'فارسی', he: 'עברית',
  id: 'Bahasa Indonesia', ru: 'Русский', zh: '中文', ja: '日本語', ko: '한국어',
  ms: 'Bahasa Melayu', pa: 'ਪੰਜਾਬੀ', pl: 'Polski', sv: 'Svenska', ta: 'தமிழ்', th: 'ไทย', vi: 'Tiếng Việt',
};

export function isSupportedLocale(code: string | null | undefined): code is UiLocale {
  return !!code && (SUPPORTED_UI_LOCALES as readonly string[]).includes(code.toLowerCase());
}

export function isRtlLocale(code: string | null | undefined): boolean {
  return !!code && RTL_LOCALES.includes(code.toLowerCase());
}

/** `/ur/product/x` -> `ur`; the default locale is never a prefix (`/en/...` is not treated as one). */
export function localeFromPathname(pathname: string): UiLocale | null {
  const seg = pathname.split('/')[1]?.toLowerCase();
  if (seg && seg !== DEFAULT_LOCALE && isSupportedLocale(seg)) return seg;
  return null;
}

/** Router basename for a pathname: `/ur` or `/` (React Router accepts `/`). */
export function basenameFromPathname(pathname: string): string {
  const l = localeFromPathname(pathname);
  return l ? `/${l}` : '/';
}

/** Same path in another language: strips any current prefix, adds the new one (none for the default). */
export function switchLocalePath(pathname: string, search: string, hash: string, target: string): string {
  const current = localeFromPathname(pathname);
  let rest = current ? pathname.slice(current.length + 1) : pathname;
  if (!rest.startsWith('/')) rest = `/${rest}`;
  const prefix = target && target !== DEFAULT_LOCALE ? `/${target}` : '';
  const path = rest === '/' && prefix ? prefix + '/' : prefix + rest;
  return `${path}${search}${hash}`;
}

/** Locales that may be used for UI (locales without a bundle resolve to English UI). */
export function uiLanguageFor(code: string): string {
  return UI_STRING_LOCALES.includes(code) ? code : DEFAULT_LOCALE;
}
