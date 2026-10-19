import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ur from './locales/ur.json';
import storefrontEn from './locales/storefront.en.json';
import storefrontUr from './locales/storefront.ur.json';
import { applyScriptFonts } from '@/utils/fonts';
import { applyDocumentDirection } from '@/utils/rtl';
import { getStoreSlugFromHost, isCustomDomainCandidate } from '@/utils/storefrontUrl';
import {
  DEFAULT_LOCALE,
  LANGUAGE_STORAGE_KEY,
  localeFromPathname,
  uiLanguageFor,
} from './localeConfig';

export * from './localeConfig';

/** True when this page load serves a storefront (store subdomain / custom domain). Decided once, like the router. */
export const IS_STOREFRONT_HOST: boolean =
  typeof window !== 'undefined' && !!(getStoreSlugFromHost() || isCustomDomainCandidate());

/**
 * Language of this page load. Only storefronts are localised: it comes from the
 * path prefix (`/ur/...`), no prefix = the default language. Seller/admin/marketing
 * apps always stay English (the browser language must never flip them to RTL).
 */
export const BOOT_LOCALE: string =
  (IS_STOREFRONT_HOST && typeof window !== 'undefined' ? localeFromPathname(window.location.pathname) : null) ?? DEFAULT_LOCALE;

// `translation` = app-wide strings; `storefront` = buyer-facing storefront UI (shared bundle);
// `theme` = the active theme's own locale files (registerThemeTranslations), used as the fallback layer.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en, storefront: storefrontEn },
      ur: { translation: ur, storefront: storefrontUr },
    },
    ns: ['translation', 'storefront', 'theme'],
    defaultNS: 'translation',
    // Keys the shared storefront bundle does not define fall back to the active theme's own locale files.
    fallbackNS: ['theme'],
    fallbackLng: DEFAULT_LOCALE,
    lng: uiLanguageFor(BOOT_LOCALE),
    debug: false,
    interpolation: { escapeValue: false }, // React already escapes
  });

// Other languages' storefront bundles are lazy chunks (only the visitor's language is downloaded).
const lazyStorefront = import.meta.glob('./locales/storefront.*.json', { import: 'default' }) as Record<string, () => Promise<Record<string, unknown>>>;

export async function ensureBundle(lang: string): Promise<void> {
  if (i18n.hasResourceBundle(lang, 'storefront')) return;
  const load = lazyStorefront[`./locales/storefront.${lang}.json`];
  if (!load) return;
  i18n.addResourceBundle(lang, 'storefront', await load(), true, true);
}

/** Resolves once the boot language's storefront bundle is registered (main.tsx awaits it before rendering). */
export const i18nReady: Promise<void> = ensureBundle(uiLanguageFor(BOOT_LOCALE))
  .then(() => { void i18n.changeLanguage(uiLanguageFor(BOOT_LOCALE)); })
  .catch(() => undefined);

/** Applies <html lang/dir> + script fonts for the CONTENT language (may be one with no UI strings, e.g. fr). */
export function applyDocumentLanguage(lang: string): void {
  applyDocumentDirection(lang);
  applyScriptFonts(lang);
}

if (typeof document !== 'undefined' && IS_STOREFRONT_HOST) applyDocumentLanguage(BOOT_LOCALE);

/** Switches the active content language without a reload (UI strings fall back to English when missing). */
export function setActiveLanguage(lang: string): void {
  const ui = uiLanguageFor(lang);
  void ensureBundle(ui).then(() => i18n.changeLanguage(ui));
  if (IS_STOREFRONT_HOST) applyDocumentLanguage(lang);
}

export function rememberLanguage(lang: string): void {
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch { /* per-viewer convenience */ }
}

export function savedLanguage(): string | null {
  try { return localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { return null; }
}

// Theme locale bundles (theme-XX/locales/{en,ur}.json), bundled eagerly: they are tiny.
const themeBundles = import.meta.glob('../features/storefront-themes/*/locales/*.json', { eager: true, import: 'default' }) as Record<string, Record<string, unknown>>;

/** Registers one theme's locale bundles (theme-XX/locales/{en,ur}.json) as the `theme` namespace. Safe to call repeatedly. */
export function registerThemeTranslations(themeId: string): void {
  for (const [path, bundle] of Object.entries(themeBundles)) {
    const m = path.match(/storefront-themes\/([^/]+)\/locales\/([^/.]+)\.json$/);
    if (!m || m[1] !== themeId || m[2] === 'en.default') continue;
    i18n.addResourceBundle(m[2], 'theme', bundle, true, true);
  }
}

export default i18n;

/** Prefixes an in-app absolute path with the active language folder (/login -> /ur/login) for hard links
 *  (a href, window.location, payment return URLs) that bypass the router basename. */
export function localePath(path: string): string {
  if (!IS_STOREFRONT_HOST || BOOT_LOCALE === DEFAULT_LOCALE) return path;
  return `/${BOOT_LOCALE}${path.startsWith("/") ? path : `/${path}`}`;
}
