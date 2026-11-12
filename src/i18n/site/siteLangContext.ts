import { createContext, useContext } from 'react';
import type { SiteLang } from './siteLanguage';

export interface SiteLangValue {
  /** Language of the public site for this visitor (also when the current page is not a site page). */
  lang: SiteLang;
  /** Language the current page actually renders in: English on dashboards and other non-site pages. */
  pageLang: SiteLang;
  setLang: (lang: SiteLang) => void;
}

export const SiteLangContext = createContext<SiteLangValue>({ lang: 'en', pageLang: 'en', setLang: () => undefined });

/** Language the current page renders in, and the switch. */
export function useSiteLang(): SiteLangValue {
  return useContext(SiteLangContext);
}
