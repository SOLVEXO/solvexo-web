import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { TokenStorage } from '@/api/services/auth';
import { apiEditProfile } from '@/api/services/auth';
import { apiGetCurrentRates, type CurrentRatesMap } from '@/api/services/exchangeRate';
import { apiGetEnabledCurrencies, type SupportedCurrency } from '@/api/services/store';
import { computeMarketPrice, type MarketPricingTarget } from '@/utils/marketPriceMath';

// Re-exported so existing importers of this file's own `SupportedCurrency`
// don't need updating — the real type now lives in api/services/store.ts
// (the single source of truth, since it's a real, admin-configurable
// Markets list now, not a fixed 'PKR'|'USD' union — see that file's own doc
// comment).
export type { SupportedCurrency };

// Exported so a one-time "no saved preference yet" check (see
// `StorefrontLayout`'s IP-suggestion effect) can use the exact same key
// without duplicating it — that check must never fire after a real choice
// (explicit or account-level) already exists.
export const CURRENCY_STORAGE_KEY = 'solvexo_currency_preference';
/** Set only when the buyer picked a currency themselves (not an automatic market/IP default). */
export const CURRENCY_EXPLICIT_KEY = 'solvexo_currency_explicit';
const STORAGE_KEY = CURRENCY_STORAGE_KEY;

/**
 * Converts `amount` (denominated in `fromCurrency` — a product/cart item's
 * own native seller currency) into `toCurrency` (the buyer's chosen display
 * currency), through the USD pivot — same math as the backend's
 * ExchangeRateService.convertWithSnapshots, just against the live current
 * rate instead of a frozen checkout snapshot (this is DISPLAY-ONLY, before
 * any checkout exists — the real, authoritative, snapshotted conversion
 * still happens server-side at checkout creation).
 */
function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: CurrentRatesMap,
  market?: MarketPricingTarget | null,
): number {
  if (!fromCurrency) return amount;
  // Same currency and no rounding rule to apply => untouched.
  if (fromCurrency === toCurrency && !(market && market.currency === toCurrency && market.pricingRule.useRounding)) return amount;
  return computeMarketPrice(amount, fromCurrency, toCurrency, rates, market);
}

// Location detection only ever sets the INITIAL default for a guest with no
// saved preference yet — it never re-runs or overrides an explicit choice.
// Fallback currency when no preference is set. Changed from PKR to USD as a more neutral default.
// The real store base currency should be passed from StorefrontLayout in a future improvement.
const FALLBACK_CURRENCY = 'USD';

interface CurrencyPreferenceContextValue {
  currency: SupportedCurrency;
  /** Explicit buyer choice (persisted, never overridden by market/IP defaults). */
  setCurrency: (value: SupportedCurrency) => void;
  /** Automatic default (market / IP): persisted for checkout but not an explicit choice. */
  setCurrencyAuto: (value: SupportedCurrency) => void;
  /** True once the buyer chose a currency themselves. */
  hasExplicitCurrency: () => boolean;
  /** Storefront sets the active market's pricing rule; null = plain FX. */
  setMarketPricing: (market: MarketPricingTarget | null) => void;
  /** Converts a native-currency amount into the buyer's chosen display
   *  currency using the live current rate. This is what actually makes the
   *  navbar toggle change visible prices — every price display must call
   *  this instead of showing a product/cart item's raw stored amount. */
  convert: (amount: number, fromCurrency?: string | null) => number;
  /** Same conversion, but to an EXPLICIT target currency rather than the
   *  buyer's display preference — for a page that must match a specific
   *  already-resolved currency (e.g. a live Checkout's `checkout.currency`,
   *  which can differ from the raw preference when a store restricts its
   *  enabled Markets — see CheckoutService.resolveStoreCurrency). */
  convertTo: (amount: number, fromCurrency: string | null | undefined, toCurrency: string) => number;
  ratesLoaded: boolean;
  /** False when `from` can't be turned into the display currency (rates not loaded, or no rate for one of the two currencies): show a dash, never the native number under another symbol. */
  canConvert: (fromCurrency?: string | null, toCurrency?: string) => boolean;
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
  const [marketPricing, setMarketPricingState] = useState<MarketPricingTarget | null>(null);
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(['USD', 'PKR']);

  // Fetched once, globally — the same current-rate lookup every price
  // display on the site shares, so switching currency in the navbar updates
  // every price on screen without each component making its own API call.
  useEffect(() => {
    apiGetCurrentRates()
      .then(res => { setRates(res.data); setRatesLoaded(true); })
      .catch(() => { setRatesLoaded(false); }); // Do NOT set true on error — components will show dashes instead of wrong symbols
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

  const setCurrencyAuto = useCallback((value: SupportedCurrency) => {
    setCurrencyState(value);
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* per-viewer convenience */ }
  }, []);

  const hasExplicitCurrency = useCallback(() => {
    try { return localStorage.getItem(CURRENCY_EXPLICIT_KEY) === '1'; } catch { return false; }
  }, []);

  const setMarketPricing = useCallback((m: MarketPricingTarget | null) => setMarketPricingState(m), []);

  const setCurrency = useCallback((value: SupportedCurrency) => {
    setCurrencyState(value);
    localStorage.setItem(STORAGE_KEY, value);
    try { localStorage.setItem(CURRENCY_EXPLICIT_KEY, '1'); } catch { /* per-viewer convenience */ }
    if (TokenStorage.isLoggedIn()) {
      apiEditProfile({ currencyPreference: value }).catch(() => {
        // Best-effort — the local choice still applies to this device/browser
        // even if persisting it to the account fails.
      });
    }
  }, []);

  const convert = useCallback(
    (amount: number, fromCurrency?: string | null) => convertAmount(amount, fromCurrency ?? currency, currency, rates, marketPricing),
    [currency, rates, marketPricing],
  );

  const convertTo = useCallback(
    (amount: number, fromCurrency: string | null | undefined, toCurrency: string) => convertAmount(amount, fromCurrency ?? toCurrency, toCurrency, rates, marketPricing),
    [rates, marketPricing],
  );

  const canConvert = useCallback((fromCurrency?: string | null, toCurrency?: string) => {
    const from = fromCurrency ?? currency;
    const to = toCurrency ?? currency;
    if (!from || from === to) return true;
    if (!ratesLoaded) return false;
    const has = (c: string) => c === 'USD' || !!rates[c]?.ratePerUSD;
    return has(from) && has(to);
  }, [currency, rates, ratesLoaded]);

  const value = useMemo<CurrencyPreferenceContextValue>(
    () => ({ currency, setCurrency, setCurrencyAuto, hasExplicitCurrency, setMarketPricing, convert, convertTo, ratesLoaded, canConvert, enabledCurrencies }),
    [currency, setCurrency, setCurrencyAuto, hasExplicitCurrency, setMarketPricing, convert, convertTo, ratesLoaded, canConvert, enabledCurrencies],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Like useCurrencyPreference() but returns null when no provider is mounted (demo previews). */
export function useCurrencyPreferenceOptional(): CurrencyPreferenceContextValue | null {
  return useContext(Ctx);
}

export function useCurrencyPreference(): CurrencyPreferenceContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrencyPreference must be inside CurrencyPreferenceProvider');
  return ctx;
}
