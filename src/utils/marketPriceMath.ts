import { getCurrencyDecimals } from '@/utils/currency';

/** Pricing rule of a storefront market (mirrors the public store-markets API). */
export interface MarketPricingRule {
  type: 'auto' | 'manual' | 'percentage' | 'fixed';
  /** The seller's own rate (1 store-currency unit = `manualRate` market units) when `type` is 'manual'. */
  manualRate?: number | null;
  percentageAdjustment: number | null;
  useRounding: boolean;
  roundingRule: '0.95' | '0.99' | '1.00' | 'nearest';
  conversionFee: number | null;
}

export interface MarketPricingTarget {
  currency: string;
  pricingRule: MarketPricingRule;
}

/** Shopify catalog fixed prices of the active market, keyed `productId:variantId` (or `productId:` for the whole product). */
export type FixedPriceMap = Map<string, { price: number; compareAt: number | null }>;

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
  const decimals = getCurrencyDecimals(currency);
  const charm = rule === '0.95' || rule === '0.99';
  if (charm && decimals === 2) {
    const e = rule === '0.95' ? 0.95 : 0.99;
    const k = Math.max(0, Math.round(price - e));
    return Math.round((k + e) * 100) / 100;
  }
  // '1.00' = whole units; 'nearest' (and a charm rule on a currency without cents) = the currency's own precision.
  return rule === '1.00' ? Math.round(price) : roundTo(price, decimals);
}

/** The seller's manual exchange rate, when the rule uses a valid one. */
function manualRateOf(rule: MarketPricingRule): number | null {
  const rate = Number(rule.manualRate);
  return rule.type === 'manual' && Number.isFinite(rate) && rate > 0 ? rate : null;
}

/** Key of a fixed price in a `FixedPriceMap` (variant first, then the whole product). */
export function fixedPriceKey(productId: string, variantId?: string | null): string {
  return `${productId}:${variantId ?? ''}`;
}

/**
 * Price shown to a buyer. Mirrors the server's checkout math (`market-price.util.ts` `marketUnitPrice`, Shopify's order):
 *  - a fixed market price wins as-is (never adjusted or rounded);
 *  - else the amount is converted at the seller's manual rate (if set) or the live rate, then percentage adjustment,
 *    conversion fee, rounding. The fee and rounding apply only to CONVERTED prices (`from` != market currency).
 * The market rule applies ONLY when the buyer's currency equals the market currency; otherwise it is plain FX.
 */
export function computeMarketPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: MarketRates,
  market?: MarketPricingTarget | null,
  fixedPrice?: number | null,
): number {
  const decimals = getCurrencyDecimals(toCurrency);
  const rule = market && market.currency === toCurrency ? market.pricingRule : null;
  if (rule && fixedPrice != null && Number.isFinite(fixedPrice) && fixedPrice >= 0) return roundTo(fixedPrice, decimals);

  const converted = !!fromCurrency && fromCurrency !== toCurrency;
  const manual = rule && converted ? manualRateOf(rule) : null;
  const inMarket = manual ? amount * manual : fxConvertRaw(amount, fromCurrency, toCurrency, rates);
  if (!rule) return roundTo(inMarket, decimals);

  let p = inMarket;
  const pct = Number(rule.percentageAdjustment);
  if (pct) p *= 1 + pct / 100;
  const fee = Number(rule.conversionFee);
  if (fee && converted) p = Math.round(p * (1 + fee / 100) * 1e8) / 1e8;
  if (rule.useRounding && converted) p = applyMarketRounding(p, toCurrency, rule.roundingRule);
  return roundTo(p, decimals);
}
