import { useEffect, useState } from 'react';
import { apiGetCurrentRates, type CurrentRatesMap } from '@/api/services/exchangeRate';
import { countryFromPathname } from '@/utils/countryPrefix';

/**
 * Plans are priced and billed in US dollars. A visitor browsing a country site (`/pk/pricing`) sees the
 * prices in that country's currency as well, converted at the admin-managed rate (Super Admin → FX), with
 * the US$ amount that is actually billed shown next to it. Display only: checkout always charges US$.
 */

/** Currency for the country part of the URL. Only shown when the FX service also has a rate for it. */
const COUNTRY_CURRENCY: Record<string, string> = {
  pk: 'PKR', ae: 'AED', sa: 'SAR', qa: 'QAR', om: 'OMR', kw: 'KWD', bh: 'BHD', gb: 'GBP', in: 'INR', bd: 'BDT',
  lk: 'LKR', np: 'NPR', ca: 'CAD', au: 'AUD', nz: 'NZD', my: 'MYR', sg: 'SGD', tr: 'TRY', za: 'ZAR', eg: 'EGP',
  de: 'EUR', fr: 'EUR', it: 'EUR', es: 'EUR', nl: 'EUR', ie: 'EUR', be: 'EUR', at: 'EUR', pt: 'EUR', fi: 'EUR',
};

export interface LocalCurrency { code: string; ratePerUSD: number }

export function localCurrencyCode(pathname: string): string | null {
  const country = countryFromPathname(pathname);
  return country ? COUNTRY_CURRENCY[country] ?? null : null;
}

/** Picks the local currency for this visitor, or null to show US$ only. */
export function pickLocalCurrency(pathname: string, rates: CurrentRatesMap | null): LocalCurrency | null {
  const code = localCurrencyCode(pathname);
  const rate = code && code !== 'USD' ? rates?.[code]?.ratePerUSD : null;
  return code && typeof rate === 'number' && rate > 0 ? { code, ratePerUSD: rate } : null;
}

/** Currency for a store's country (ISO alpha-2, any case) — the dashboard has no /pk/ URL, so it uses the store's own country. */
export function currencyCodeForCountry(country: string | null | undefined): string | null {
  return country ? COUNTRY_CURRENCY[country.trim().toLowerCase()] ?? null : null;
}

/** Local currency for a store's country, or null (US$ only) when the country has none or the FX service has no rate for it. */
export function pickLocalCurrencyForCountry(country: string | null | undefined, rates: CurrentRatesMap | null): LocalCurrency | null {
  const code = currencyCodeForCountry(country);
  const rate = code && code !== 'USD' ? rates?.[code]?.ratePerUSD : null;
  return code && typeof rate === 'number' && rate > 0 ? { code, ratePerUSD: rate } : null;
}

// One fetch per page load, shared by every price on the screen.
let ratesPromise: Promise<CurrentRatesMap | null> | null = null;
function loadRatesOnce(): Promise<CurrentRatesMap | null> {
  if (!ratesPromise) ratesPromise = apiGetCurrentRates().then(res => res.data ?? null).catch(() => { ratesPromise = null; return null; });
  return ratesPromise;
}

// The visitor's IP country, once per page load (Vercel function /api/geo). null when unavailable (local dev, blocked).
let geoPromise: Promise<string | null> | null = null;
function loadGeoOnce(): Promise<string | null> {
  if (!geoPromise) {
    geoPromise = fetch('/api/geo', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((j: { country?: string | null } | null) => (typeof j?.country === 'string' ? j.country : null))
      .catch(() => null);
  }
  return geoPromise;
}

/**
 * Dashboard / gate / checkout: the visitor's IP country decides (Pakistan → Rs), exactly like the pricing page; when the IP
 * country cannot be read it falls back to the store's own country. Display only — billing is unchanged.
 */
export function useLocalCurrencyForCountry(storeCountry: string | null | undefined): LocalCurrency | null {
  const [rates, setRates] = useState<CurrentRatesMap | null>(null);
  const [ipCountry, setIpCountry] = useState<string | null | undefined>(undefined); // undefined = still asking
  useEffect(() => {
    let alive = true;
    loadGeoOnce().then(c => { if (alive) setIpCountry(c); });
    return () => { alive = false; };
  }, []);
  const country = ipCountry ?? storeCountry; // IP first; the store's country only when the IP is unknown
  const wanted = currencyCodeForCountry(country);
  useEffect(() => {
    if (!wanted) return;
    let alive = true;
    loadRatesOnce().then(r => { if (alive) setRates(r); });
    return () => { alive = false; };
  }, [wanted]);
  return ipCountry === undefined ? null : pickLocalCurrencyForCountry(country, rates);
}

const usdText = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/** "$29" without a local currency, "Rs 8,020" with one. */
export function priceOnly(usd: number, local: LocalCurrency | null): string {
  return local ? formatLocal(usd, local) : usdText(usd);
}

/** The one-line note under local prices (null without a local currency). */
export function localPriceNote(local: LocalCurrency | null): string | null {
  if (!local) return null;
  return `Prices in ${local.code === 'PKR' ? 'Rs' : local.code} are approximate and follow the exchange rate.`;
}

/**
 * Wraps the English checkout wording so every "$29" in a price phrase becomes the local amount ("Rs 8,020"; a trailing
 * " USD" is dropped). The Arabic site is left alone (its own wording).
 */
const PRICE_KEYS = [
  'money', 'moPrice', 'billedYearly', 'introThen', 'perYearRenews', 'perMonthThen', 'amountPerYear', 'amountPerMonth',
  'yearlySubline', 'introSubline', 'monthlySubline', 'payLabel', 'startFor',
] as const;
const USD_AMOUNT = /\$(\d+(?:\.\d+)?)(?: USD)?/g;

export function localizeCheckoutText<T extends Record<string, unknown>>(t: T, local: LocalCurrency | null): T {
  if (!local) return t;
  const out: Record<string, unknown> = { ...t };
  for (const key of PRICE_KEYS) {
    const fn = t[key];
    if (typeof fn !== 'function') continue;
    out[key] = (...args: unknown[]) => {
      const text = (fn as (...a: unknown[]) => unknown)(...args);
      return typeof text === 'string' ? text.replace(USD_AMOUNT, (_m, n: string) => priceOnly(Number(n), local)) : text;
    };
  }
  return out as T;
}

export function useLocalCurrency(): LocalCurrency | null {
  const [rates, setRates] = useState<CurrentRatesMap | null>(null);
  const wanted = typeof window !== 'undefined' ? localCurrencyCode(window.location.pathname) : null;
  useEffect(() => {
    if (!wanted) return;
    let alive = true;
    apiGetCurrentRates().then(res => { if (alive) setRates(res.data ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, [wanted]);
  return typeof window !== 'undefined' ? pickLocalCurrency(window.location.pathname, rates) : null;
}

/** Currency names the Arabic site uses (GCC). */
const ARABIC_SYMBOL: Record<string, string> = { AED: 'د.إ', SAR: 'ر.س', QAR: 'ر.ق', KWD: 'د.ك', BHD: 'د.ب', OMR: 'ر.ع', USD: 'دولار' };

/**
 * "Rs 8,020" / "AED 107" (Arabic site: "107 د.إ"): a US$ amount in the local currency, rounded to a friendly figure
 * (nearest 10 above 100; whole units below).
 */
export function formatLocal(usd: number, local: LocalCurrency, lang: 'en' | 'ar' = 'en'): string {
  const raw = usd * local.ratePerUSD;
  const rounded = raw >= 100 ? Math.round(raw / 10) * 10 : Math.round(raw);
  const n = rounded.toLocaleString('en-US');
  if (lang === 'ar') return `${n} ${ARABIC_SYMBOL[local.code] ?? local.code}`;
  const label = local.code === 'PKR' ? 'Rs' : local.code;
  return `${label} ${n}`;
}
