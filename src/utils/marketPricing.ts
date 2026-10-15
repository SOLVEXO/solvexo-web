import { getCurrencyDecimals } from './currency';

export type MarketPricingType = 'auto' | 'manual' | 'percentage' | 'fixed';
export type MarketRoundingRule = '0.95' | '0.99' | '1.00' | 'nearest';

export interface MarketPricingRule {
  type: MarketPricingType;
  percentageAdjustment?: number | null;
  conversionFee?: number | null;
  useRounding?: boolean;
  roundingRule?: MarketRoundingRule;
}

/** Apply a rounding rule in the market currency. .95/.99 only exist for 2-decimal currencies; others fall back to "nearest". */
export function applyRounding(price: number, rule: MarketRoundingRule, decimals: number): number {
  if ((rule === '0.95' || rule === '0.99') && decimals === 2) {
    const ending = rule === '0.95' ? 0.95 : 0.99;
    return Math.round((Math.max(0, Math.round(price - ending)) + ending) * 100) / 100;
  }
  return Math.round(price);
}

/** The price a buyer on this market sees for `amount` (store currency), mirroring the server maths in the Markets contract. */
export function previewMarketPrice(opts: { amount: number; rate: number; currency: string; rule: MarketPricingRule }): number {
  const { amount, rate, currency, rule } = opts;
  const decimals = getCurrencyDecimals(currency);
  let p = amount * rate;
  if (rule.type === 'percentage' && rule.percentageAdjustment) p *= 1 + rule.percentageAdjustment / 100;
  if (rule.conversionFee) p *= 1 + rule.conversionFee / 100;
  if (rule.useRounding) p = applyRounding(p, rule.roundingRule ?? 'nearest', decimals);
  const f = 10 ** decimals;
  return Math.round(p * f) / f;
}

const SUBFOLDER_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

/** Same rules as the server (2-50 chars, lowercase letters/digits/hyphens, no leading/trailing hyphen). Returns an error or ''. */
export function validateSubfolder(value: string): string {
  if (!value) return 'Enter a subfolder.';
  if (value.length < 2 || value.length > 50) return 'Use 2 to 50 characters.';
  if (!SUBFOLDER_RE.test(value)) return 'Use lowercase letters, numbers and hyphens only; no hyphen at the start or end.';
  return '';
}

export function validateMarketDomain(value: string): string {
  if (!value) return 'Enter a domain.';
  if (value.includes('/') || value.includes(':')) return 'Enter the domain only, without https:// or a path.';
  if (!DOMAIN_RE.test(value)) return 'Enter a valid domain such as eu.mystore.com.';
  return '';
}
