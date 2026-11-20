import { formatLocal, type LocalCurrency } from '@/features/buyer/pages/pricing/localPrice';

/**
 * Display helpers for a seller whose country has a local currency (Pakistan → Rs). Plans are ALWAYS billed in US dollars
 * (Stripe); the local amount is an approximation at the admin-managed FX rate, so the US$ amount stays visible next to it.
 */

const trim = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/** "$29" without a local currency, "Rs 8,020" with one (big price lines). */
export function priceOnly(usd: number, local: LocalCurrency | null): string {
  return local ? formatLocal(usd, local) : trim(usd);
}

/** "$29" without a local currency, "Rs 8,020 (≈ $29)" with one (lines where the real US$ amount matters). */
export function priceWithUsd(usd: number, local: LocalCurrency | null): string {
  return local ? `${formatLocal(usd, local)} (≈ ${trim(usd)})` : trim(usd);
}

/** The one-line disclosure shown under prices (null when there is no local currency). */
export function localPriceNote(local: LocalCurrency | null): string | null {
  if (!local) return null;
  const sym = local.code === 'PKR' ? 'Rs' : local.code;
  return `Prices in ${sym} are approximate, at today's rate of US$1 = ${local.ratePerUSD.toFixed(2)} ${local.code}. You are billed in US dollars; your bank converts at its own rate.`;
}

/**
 * Wraps the English checkout wording so its price fragments show the local amount (the Arabic site and the charge / legal
 * sentences stay in US$ on purpose: they state what is really charged). Fragments with a "$29" amount become "Rs 8,020";
 * the sublines that explain what happens when also carry the real "(≈ $29)".
 */
const BIG_PRICE_KEYS = ['money', 'moPrice', 'billedYearly', 'introThen', 'perYearRenews', 'perMonthThen'] as const;
const INLINE_KEYS = ['yearlySubline', 'introSubline', 'monthlySubline'] as const;
const USD_AMOUNT = /\$(\d+(?:\.\d+)?)/g;

export function localizeCheckoutText<T extends Record<string, unknown>>(t: T, local: LocalCurrency | null): T {
  if (!local) return t;
  const out: Record<string, unknown> = { ...t };
  const wrap = (key: string, withUsd: boolean) => {
    const fn = t[key];
    if (typeof fn !== 'function') return;
    out[key] = (...args: unknown[]) => {
      const text = (fn as (...a: unknown[]) => unknown)(...args);
      return typeof text === 'string'
        ? text.replace(USD_AMOUNT, (_m, n: string) => (withUsd ? priceWithUsd(Number(n), local) : priceOnly(Number(n), local)))
        : text;
    };
  };
  BIG_PRICE_KEYS.forEach(k => wrap(k, false));
  INLINE_KEYS.forEach(k => wrap(k, true));
  return out as T;
}
