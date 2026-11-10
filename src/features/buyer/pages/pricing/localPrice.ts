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

/** "Rs 8,020": a US$ amount in the local currency, rounded to a friendly figure (nearest 10 above 100). */
export function formatLocal(usd: number, local: LocalCurrency): string {
  const raw = usd * local.ratePerUSD;
  const rounded = raw >= 100 ? Math.round(raw / 10) * 10 : Math.round(raw);
  const label = local.code === 'PKR' ? 'Rs' : local.code;
  return `${label} ${rounded.toLocaleString('en-US')}`;
}
