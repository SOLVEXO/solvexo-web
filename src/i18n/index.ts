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
const BOOT_PREFIX: string | null =
  IS_STOREFRONT_HOST && typeof window !== 'undefined' ? localeFromPathname(window.location.pathname) : null;
/** True when the URL carries a language folder (`/ur/...`); without one the language is the store's own default. */
export const BOOT_HAS_PREFIX: boolean = BOOT_PREFIX !== null;
export const BOOT_LOCALE: string = BOOT_PREFIX ?? DEFAULT_LOCALE;

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
  if (load) {
    i18n.addResourceBundle(lang, 'storefront', await load(), true, true);
    return;
  }
  // No file ships for this language: the API serves a bundle it translated once (and starts that the first time a language is used).
  const strings = await fetchGeneratedBundle(lang);
  if (strings) i18n.addResourceBundle(lang, 'storefront', strings, true, true);
}

/** Plural variants (key_one / key_other...) are per language, not missing text. */
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const FILL_TTL_MS = 24 * 60 * 60_000;

function flatKeys(obj: unknown, prefix = '', out: string[] = []): string[] {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.push(key); else flatKeys(v, key, out);
  }
  return out;
}

/**
 * Labels added to the storefront after a language's bundle was written exist only in English there. Ask the API for just
 * those (translated once, then stored) and lay them over the bundle. Best effort and cached for a day.
 */
export async function fillMissingKeys(lang: string): Promise<void> {
  if (lang === DEFAULT_LOCALE) return;
  try {
    const missing = flatKeys(storefrontEn).filter(k => !PLURAL_SUFFIX.test(k) && !i18n.exists(k, { lng: lang, ns: 'storefront', fallbackLng: [] }));
    if (!missing.length) return;
    const cacheKey = `solvexo_uifill_${lang}`;
    let cached: { t: number; strings: Record<string, string>; tried: string[] } = { t: 0, strings: {}, tried: [] };
    try { const raw = JSON.parse(localStorage.getItem(cacheKey) ?? 'null'); if (raw && Date.now() - raw.t < FILL_TTL_MS) cached = raw; } catch { /* optional */ }
    const fresh = missing.filter(k => !(k in cached.strings) && !cached.tried.includes(k)).slice(0, 60);
    if (fresh.length) {
      const { default: client } = await import('@/api/client');
      const res = await client.post<never, { data?: { strings?: Record<string, string> } }>(`/api/public/ui-locale/${lang}/fill`, { keys: fresh });
      Object.assign(cached.strings, res.data?.strings ?? {});
      cached.tried.push(...fresh.filter(k => !(k in cached.strings)));
      cached.t = cached.t || Date.now();
      try { localStorage.setItem(cacheKey, JSON.stringify(cached)); } catch { /* quota */ }
    }
    for (const [key, value] of Object.entries(cached.strings)) i18n.addResource(lang, 'storefront', key, value);
    if (Object.keys(cached.strings).length) await i18n.changeLanguage(i18n.language);
  } catch { /* English stays for those labels */ }
}

const GENERATED_TTL_MS = 24 * 60 * 60_000;

async function fetchGeneratedBundle(lang: string): Promise<Record<string, unknown> | null> {
  const key = `solvexo_ui_${lang}`;
  try {
    const cached = JSON.parse(localStorage.getItem(key) ?? 'null') as { t: number; strings: Record<string, unknown> } | null;
    if (cached && Date.now() - cached.t < GENERATED_TTL_MS) return cached.strings;
  } catch { /* the cache is optional */ }
  try {
    const { default: client } = await import('@/api/client'); // lazy: i18n boots before the API client is needed
    const res = await client.get<never, { data?: { status: string; strings?: Record<string, unknown> } }>(`/api/public/ui-locale/${lang}`);
    const data = res.data;
    if (data?.status !== 'ready' || !data.strings) return null; // still being generated (or unavailable): English text for now
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), strings: data.strings })); } catch { /* quota */ }
    return data.strings;
  } catch {
    return null;
  }
}

/** Resolves once the boot language's storefront bundle is registered (main.tsx awaits it before rendering). */
export const i18nReady: Promise<void> = ensureBundle(uiLanguageFor(BOOT_LOCALE))
  .then(() => { void i18n.changeLanguage(uiLanguageFor(BOOT_LOCALE)).then(() => fillMissingKeys(uiLanguageFor(BOOT_LOCALE))); })
  .catch(() => undefined);

/** Applies <html lang/dir> + script fonts for the CONTENT language (may be one with no UI strings, e.g. fr). */
export function applyDocumentLanguage(lang: string): void {
  applyDocumentDirection(lang);
  applyScriptFonts(lang);
}

if (typeof document !== 'undefined' && IS_STOREFRONT_HOST) applyDocumentLanguage(BOOT_LOCALE);

/** Loads the UI bundle of `lang` and switches to it (a store whose own language is not English opens in it). */
export async function activateLanguage(lang: string): Promise<void> {
  const ui = uiLanguageFor(lang);
  await ensureBundle(ui).catch(() => undefined);
  await i18n.changeLanguage(ui);
  void fillMissingKeys(ui);
  if (IS_STOREFRONT_HOST) applyDocumentLanguage(lang);
}

/**
 * The seller's own wording of built-in buttons / labels (`ui#<key>` entries of Translate & adapt → Buttons & labels)
 * laid over the language's bundle. The bundle is loaded first so the override never hides it.
 */
export async function applyUiOverrides(lang: string, strings: Record<string, string>): Promise<void> {
  const entries = Object.entries(strings).filter(([k, v]) => k.startsWith('ui#') && v);
  if (!entries.length) return;
  const ui = uiLanguageFor(lang);
  await ensureBundle(ui).catch(() => undefined);
  for (const [key, value] of entries) i18n.addResource(ui, 'storefront', key.slice(3), value);
  await i18n.changeLanguage(i18n.language); // re-render what is already on screen
}

/** Switches the active content language without a reload (UI strings fall back to English when missing). */
export function setActiveLanguage(lang: string): void {
  const ui = uiLanguageFor(lang);
  void ensureBundle(ui).then(() => i18n.changeLanguage(ui)).then(() => fillMissingKeys(ui));
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
  if (!IS_STOREFRONT_HOST || !BOOT_HAS_PREFIX) return path;
  return `/${BOOT_LOCALE}${path.startsWith("/") ? path : `/${path}`}`;
}
