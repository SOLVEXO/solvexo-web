import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { TokenStorage } from '@/api/services/auth';
import { apiEditProfile } from '@/api/services/auth';
import { apiGetCurrentRates, type CurrentRatesMap } from '@/api/services/exchangeRate';
import { apiGetEnabledCurrencies, type SupportedCurrency } from '@/api/services/store';
import { getCurrencyDecimals } from '@/utils/currency';

// Re-exported so existing importers of this file's own `SupportedCurrency`
// don't need updating — the real type now lives in api/services/store.ts
// (the single source of truth, since it's a real, admin-configurable
// Markets list now, not a fixed 'PKR'|'USD' union — see that file's own doc
// comment).
export type { SupportedCurrency };

const STORAGE_KEY = 'solvexo_currency_preference';

/**
 * Converts `amount` (denominated in `fromCurrency` — a product/cart item's
 * own native seller currency) into `toCurrency` (the buyer's chosen display
 * currency), through the USD pivot — same math as the backend's
 * ExchangeRateService.convertWithSnapshots, just against the live current
 * rate instead of a frozen checkout snapshot (this is DISPLAY-ONLY, before
 * any checkout exists — the real, authoritative, snapshotted conversion
 * still happens server-side at checkout creation).
 */
function convertAmount(amount: number, fromCurrency: string, toCurrency: string, rates: CurrentRatesMap): number {
  if (!fromCurrency || fromCurrency === toCurrency) return amount;
  const fromRate = fromCurrency === 'USD' ? 1 : rates[fromCurrency]?.ratePerUSD;
  const toRate = toCurrency === 'USD' ? 1 : rates[toCurrency]?.ratePerUSD;
  if (!fromRate || !toRate) return amount; // rates not loaded yet — show native rather than guess
  const usd = amount / fromRate;
  const converted = usd * toRate;
  const decimals = getCurrencyDecimals(toCurrency);
  const factor = Math.pow(10, decimals);
  return Math.round(converted * factor) / factor;
}

// Location detection only ever sets the INITIAL default for a guest with no
// saved preference yet — it never re-runs or overrides an explicit choice.
// Deliberately out of scope for this pass (see the currency-architecture
// plan's disclosed exclusions): a real IP-detected suggestion exists only at
// seller Onboarding's currency step, not here — this stays the fixed
// Pakistan-origin default, unchanged.
const FALLBACK_CURRENCY = 'PKR';

interface CurrencyPreferenceContextValue {
  currency: SupportedCurrency;
  setCurrency: (value: SupportedCurrency) => void;
  /** Converts a native-currency amount into the buyer's chosen display
   *  currency using the live current rate. This is what actually makes the
   *  navbar toggle change visible prices — every price display must call
   *  this instead of showing a product/cart item's raw stored amount. */
  convert: (amount: number, fromCurrency?: string | null) => number;
  ratesLoaded: boolean;
  /** The platform's real, dynamic Markets currency list — the navbar
   *  switcher renders from this, never a hardcoded 2-entry array. */
  enabledCurrencies: string[];
}

const Ctx = createContext<CurrencyPreferenceContextValue | null>(null);

export function CurrencyPreferenceProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    return localStorage.getItem(STORAGE_KEY) || FALLBACK_CURRENCY;
  });
  const [rates, setRates] = useState<CurrentRatesMap>({});
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(['USD', 'PKR']);

  // Fetched once, globally — the same current-rate lookup every price
  // display on the site shares, so switching currency in the navbar updates
  // every price on screen without each component making its own API call.
  useEffect(() => {
    apiGetCurrentRates()
      .then(res => { setRates(res.data); setRatesLoaded(true); })
      .catch(() => { setRatesLoaded(true); }); // fail open — display falls back to native currency, never blocks the page
  }, []);

  // Real, dynamic Markets list — replaces the old hardcoded ['PKR','USD'].
  // Once loaded, a currently-selected currency that's no longer platform-
  // enabled (e.g. an admin disabled it since this browser last saved a
  // preference) silently falls back rather than leaving the UI on a dead
  // selection.
  useEffect(() => {
    apiGetEnabledCurrencies()
      .then(res => {
        const codes = res.data.map(c => c.code);
        setEnabledCurrencies(codes);
        setCurrencyState(prev => (codes.includes(prev) ? prev : FALLBACK_CURRENCY));
      })
      .catch(() => {}); // fail open — keeps the built-in USD/PKR fallback list
  }, []);

  // On login (or first mount while already logged in), the account's own
  // saved preference is the cross-device source of truth and wins over
  // whatever's in this browser's localStorage — but only if the account
  // actually has one set yet; otherwise the guest/local value carries over.
  useEffect(() => {
    if (!TokenStorage.isLoggedIn()) return;
    const user = TokenStorage.getUser<{ currencyPreference?: string | null }>();
    if (user?.currencyPreference) {
      setCurrencyState(user.currencyPreference);
      localStorage.setItem(STORAGE_KEY, user.currencyPreference);
    }
  }, []);

  const setCurrency = useCallback((value: SupportedCurrency) => {
    setCurrencyState(value);
    localStorage.setItem(STORAGE_KEY, value);
    if (TokenStorage.isLoggedIn()) {
      apiEditProfile({ currencyPreference: value }).catch(() => {
        // Best-effort — the local choice still applies to this device/browser
        // even if persisting it to the account fails.
      });
    }
  }, []);

  const convert = useCallback(
    (amount: number, fromCurrency?: string | null) => convertAmount(amount, fromCurrency ?? currency, currency, rates),
    [currency, rates],
  );

  const value = useMemo<CurrencyPreferenceContextValue>(
    () => ({ currency, setCurrency, convert, ratesLoaded, enabledCurrencies }),
    [currency, setCurrency, convert, ratesLoaded, enabledCurrencies],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrencyPreference(): CurrencyPreferenceContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrencyPreference must be inside CurrencyPreferenceProvider');
  return ctx;
}
