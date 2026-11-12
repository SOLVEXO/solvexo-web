import type { SiteLang } from './siteLanguage';

/**
 * A page's text in every site language. The Arabic object must have exactly the English object's shape,
 * so a missing translation fails the type check instead of showing up blank.
 *
 *   const TEXT = siteText({ en: { title: 'Pricing' }, ar: { title: 'الأسعار' } });
 *   const t = useSiteText(TEXT); t.title
 */
export type SiteTexts<T> = Record<SiteLang, T>;
export function siteText<T>(texts: { en: T; ar: NoInfer<T> }): SiteTexts<T> {
  return texts;
}
