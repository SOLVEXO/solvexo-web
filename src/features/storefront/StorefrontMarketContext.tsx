import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { apiSuggestLocationForStore } from '@/api/services/store';
import { apiGetPublicStoreMarkets, resolveMarket, type PublicStoreMarkets } from '@/api/services/markets';
import { TokenStorage } from '@/api/services/auth';
import { useCurrencyPreference, CURRENCY_STORAGE_KEY } from '@/contexts/CurrencyPreferenceContext';
import { setStorefrontLocaleInfo } from '@/utils/currentStorefront';
import { COUNTRY_STORAGE_KEY, StorefrontMarketCtx, type StorefrontMarketValue } from './storefrontMarket';
import { BOOT_HAS_PREFIX, BOOT_LOCALE, DEFAULT_LOCALE, rememberLanguage, savedLanguage, switchLocalePath, localeFromPathname } from '@/i18n';

function readSavedCountry(): string | null {
  try {
    const v = localStorage.getItem(COUNTRY_STORAGE_KEY);
    return v && /^[A-Z]{2}$/.test(v) ? v : null;
  } catch { return null; }
}

/** Markets + country + language for one storefront. Mount inside CurrencyPreferenceProvider. */
export function StorefrontMarketProvider({ storeId, allowedCurrencies, baseCurrency, sourceLanguage, children }: {
  storeId: string;
  /** The store's own restriction (Store.enabledCurrencies), null = platform list. */
  allowedCurrencies?: string[] | null;
  /** The store's own currency: the default for a first visit when no market or location says otherwise. */
  baseCurrency?: string | null;
  /** The language the store's content is written in (the store record knows it before the markets arrive). */
  sourceLanguage?: string | null;
  children: ReactNode;
}) {
  const { setCurrency, setCurrencyAuto, setMarketPricing, hasExplicitCurrency, enabledCurrencies } = useCurrencyPreference();
  const [data, setData] = useState<PublicStoreMarkets | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loaded = loadedFor === storeId;
  const [savedCountry, setSavedCountry] = useState<string | null>(readSavedCountry);
  const [detected, setDetected] = useState<{ country: string | null; suggestedCurrency: string | null } | null>(null);
  const [locationDone, setLocationDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetPublicStoreMarkets(storeId)
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setData(null); }) // fail open: single default market, plain FX
      .finally(() => { if (!cancelled) setLoadedFor(storeId); });
    return () => { cancelled = true; };
  }, [storeId]);

  useEffect(() => {
    let cancelled = false;
    apiSuggestLocationForStore(storeId)
      .then(res => { if (!cancelled) setDetected(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLocationDone(true); });
    return () => { cancelled = true; };
  }, [storeId]);

  const markets = useMemo(() => data?.markets ?? [], [data]);
  const defaultLanguage = data?.defaultLanguage ?? sourceLanguage ?? DEFAULT_LOCALE;
  const languages = useMemo(() => {
    const set = new Set<string>([defaultLanguage, ...(data?.languages ?? [])]);
    return Array.from(set);
  }, [data, defaultLanguage]);
  const country = savedCountry ?? detected?.country?.toUpperCase() ?? null;
  const market = useMemo(() => resolveMarket(markets, country), [markets, country]);
  const countries = useMemo(() => {
    const set = new Set<string>();
    markets.forEach(m => m.countries.forEach(c => set.add(c.toUpperCase())));
    return Array.from(set).sort();
  }, [markets]);

  // Pricing rule of the resolved market -> currency conversion (only bites when the buyer currency == market currency).
  useEffect(() => {
    setMarketPricing(market ? { currency: market.currency, pricingRule: market.pricingRule } : null);
    return () => setMarketPricing(null);
  }, [market, setMarketPricing]);

  // Currency default: an explicit choice (or a logged-in account preference) always wins; otherwise the
  // market's currency (when the store/platform enable it), else the old IP suggestion for a first visit.
  const accountHasCurrency = !!TokenStorage.getUser<{ currencyPreference?: string | null }>()?.currencyPreference && TokenStorage.isLoggedIn();
  useEffect(() => {
    if (!loaded || !locationDone) return;
    if (hasExplicitCurrency() || accountHasCurrency) return;
    const allowed = (c: string) => enabledCurrencies.includes(c) && (!allowedCurrencies?.length || allowedCurrencies.includes(c));
    if (market && allowed(market.currency)) { setCurrencyAuto(market.currency); return; }
    let hasSaved = false;
    try { hasSaved = !!localStorage.getItem(CURRENCY_STORAGE_KEY); } catch { /* ignore */ }
    const suggested = detected?.suggestedCurrency;
    if (!hasSaved && suggested && allowed(suggested)) { setCurrencyAuto(suggested); return; }
    // Nothing else decided: a first-time visitor sees the store's own currency, never a platform-wide guess.
    if (!hasSaved && baseCurrency && allowed(baseCurrency)) setCurrencyAuto(baseCurrency);
  }, [loaded, locationDone, market, detected, baseCurrency, enabledCurrencies, allowedCurrencies, hasExplicitCurrency, accountHasCurrency, setCurrencyAuto]);

  const language = BOOT_HAS_PREFIX ? BOOT_LOCALE : defaultLanguage;
  const redirected = useRef(false);
  // Keep the URL honest: a prefix the store does not offer is dropped; a remembered language gets its prefix.
  useEffect(() => {
    if (!loaded || redirected.current || !data) return;
    const { pathname, search, hash } = window.location;
    const current = localeFromPathname(pathname);
    let target: string | null = null;
    // A folder the store does not offer, or the store's own language (which has no folder), goes back to the plain URL.
    if (current && (!languages.includes(current) || current === defaultLanguage)) target = defaultLanguage;
    else if (!current) {
      const saved = savedLanguage();
      if (saved && saved !== defaultLanguage && languages.includes(saved)) target = saved;
    }
    if (target) {
      redirected.current = true;
      if (target === defaultLanguage) rememberLanguage(defaultLanguage);
      window.location.replace(switchLocalePath(pathname, search, hash, target, defaultLanguage));
    }
  }, [loaded, data, languages, defaultLanguage]);

  const setLanguage = useCallback((code: string) => {
    rememberLanguage(code);
    const { pathname, search, hash } = window.location;
    window.location.assign(switchLocalePath(pathname, search, hash, code, defaultLanguage));
  }, [defaultLanguage]);

  // Shopify: the country the buyer picks decides the currency (the market's), and a language the new
  // market does not offer falls back to that market's default language.
  const setCountry = useCallback((code: string) => {
    const c = code.toUpperCase();
    try { localStorage.setItem(COUNTRY_STORAGE_KEY, c); } catch { /* per-viewer convenience */ }
    setSavedCountry(c);
    const picked = resolveMarket(markets, c);
    if (picked && enabledCurrencies.includes(picked.currency) && (!allowedCurrencies?.length || allowedCurrencies.includes(picked.currency))) {
      setCurrency(picked.currency);
    }
    const offered = picked?.languages?.length ? picked.languages.filter(l => languages.includes(l)) : [];
    if (offered.length && !offered.includes(language)) setLanguage(offered.includes(defaultLanguage) ? defaultLanguage : offered[0]);
  }, [markets, enabledCurrencies, allowedCurrencies, setCurrency, languages, language, defaultLanguage, setLanguage]);

  useEffect(() => {
    setStorefrontLocaleInfo({ country, locale: language });
    return () => setStorefrontLocaleInfo({ country: null, locale: DEFAULT_LOCALE });
  }, [country, language]);

  const value = useMemo<StorefrontMarketValue>(() => ({
    loaded, markets, languages, defaultLanguage, country, countries, setCountry, market, language, setLanguage,
  }), [loaded, markets, languages, defaultLanguage, country, countries, setCountry, market, language, setLanguage]);

  return <StorefrontMarketCtx.Provider value={value}>{children}</StorefrontMarketCtx.Provider>;
}
