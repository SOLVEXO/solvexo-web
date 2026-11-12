import { useSiteLang } from './siteLangContext';
import type { SiteTexts } from './siteText';

/** The current page's text in the visitor's site language. */
export function useSiteText<T>(texts: SiteTexts<T>): T {
  return texts[useSiteLang().pageLang];
}
