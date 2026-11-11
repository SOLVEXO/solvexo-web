import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { detectSiteLang, isSitePath, saveSiteLang, type SiteLang } from './siteLanguage';
import { SiteLangContext } from './siteLangContext';

/**
 * Holds the public site's language and sets <html lang/dir> for site pages (right-to-left in Arabic).
 * Dashboards and other app pages always get English, left-to-right.
 */
export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [lang, setLangState] = useState<SiteLang>(() => (typeof window === 'undefined' ? 'en' : detectSiteLang(window.location.pathname)));
  const onSite = isSitePath(pathname);
  const pageLang: SiteLang = onSite ? lang : 'en';

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('lang', pageLang);
    el.setAttribute('dir', pageLang === 'ar' ? 'rtl' : 'ltr');
  }, [pageLang]);

  const setLang = useCallback((next: SiteLang) => { saveSiteLang(next); setLangState(next); }, []);
  const value = useMemo(() => ({ lang, pageLang, setLang }), [lang, pageLang, setLang]);
  return <SiteLangContext.Provider value={value}>{children}</SiteLangContext.Provider>;
}
