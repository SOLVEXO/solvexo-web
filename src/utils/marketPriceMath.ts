import { getCurrencyDecimals } from '@/utils/currency';

/** Pricing rule of a storefront market (mirrors the public store-markets API). */
export interface MarketPricingRule {
  type: 'auto' | 'manual' | 'percentage' | 'fixed';
  percentageAdjustment: number | null;
  useRounding: boolean;
  roundingRule: '0.95' | '0.99' | '1.00' | 'nearest';
  conversionFee: number | null;
}

export interface MarketPricingTarget {
  currency: string;
  pricingRule: MarketPricingRule;
}

/** `ratePerUSD` = units of that currency per 1 USD (USD itself is 1). */
export type MarketRates = Record<string, { ratePerUSD: number } | null | undefined>;

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** Plain FX through the USD pivot, unrounded. Missing rate => amount unchanged. */
export function fxConvertRaw(amount: number, from: string, to: string, rates: MarketRates): number {
  if (!from || from === to) return amount;
  const fromRate = from === 'USD' ? 1 : rates[from]?.ratePerUSD;
  const toRate = to === 'USD' ? 1 : rates[to]?.ratePerUSD;
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
}

/** Market rounding in the market currency. .95/.99 = NEAREST price ending in that value (2-decimal currencies only). */
export function applyMarketRounding(price: number, currency: string, rule: MarketPricingRule['roundingRule']): number {
  const charm = rule === '0.95' || rule === '0.99';
  if (charm && getCurrencyDecimals(currency) === 2) {
    const e = rule === '0.95' ? 0.95 : 0.99;
    const k = Math.max(0, Math.round(price - e));
    return Math.round((k + e) * 100) / 100;
  }
  return Math.round(price);
}

/**
 * Price shown to a buyer. The market rule (percentage, conversion fee,
 * rounding) applies ONLY when the buyer's currency equals the market
 * currency; otherwise this is plain FX rounded to the currency's decimals.
 * Must stay in step with the server's checkout math.
 */
export function computeMarketPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: MarketRates,
  market?: MarketPricingTarget | null,
): number {
  let p = fxConvertRaw(amount, fromCurrency, toCurrency, rates);
  const rule = market && market.currency === toCurrency ? market.pricingRule : null;
  if (rule) {
    if (rule.type === 'percentage' && rule.percentageAdjustment) p *= 1 + rule.percentageAdjustment / 100;
    if (rule.conversionFee) p *= 1 + rule.conversionFee / 100;
    if (rule.useRounding) p = applyMarketRounding(p, toCurrency, rule.roundingRule);
  }
  return roundTo(p, getCurrencyDecimals(toCurrency));
}
