import { describe, expect, it } from 'vitest';
import { applyMarketRounding, computeMarketPrice, type MarketPricingRule } from './marketPriceMath';

const rates = { PKR: { ratePerUSD: 280 }, EUR: { ratePerUSD: 0.9 }, JPY: { ratePerUSD: 150 } };
const base: MarketPricingRule = { type: 'auto', percentageAdjustment: null, useRounding: false, roundingRule: 'nearest', conversionFee: null };
const mk = (currency: string, over: Partial<MarketPricingRule>) => ({ currency, pricingRule: { ...base, ...over } });

describe('applyMarketRounding (nearest price ending in .99/.95)', () => {
  it('.99', () => {
    expect(applyMarketRounding(10.0, 'USD', '0.99')).toBe(9.99);
    expect(applyMarketRounding(10.5, 'USD', '0.99')).toBe(10.99);
    expect(applyMarketRounding(10.01, 'USD', '0.99')).toBe(9.99);
    expect(applyMarketRounding(0.3, 'USD', '0.99')).toBe(0.99);
  });
  it('.95', () => {
    expect(applyMarketRounding(10.0, 'USD', '0.95')).toBe(9.95);
    expect(applyMarketRounding(10.99, 'USD', '0.95')).toBe(10.95);
  });
  it('0/3-decimal currencies fall back to nearest', () => {
    expect(applyMarketRounding(1234.4, 'JPY', '0.99')).toBe(1234);
    expect(applyMarketRounding(5.6, 'KWD', '0.95')).toBe(5.6); // 3 decimals: the currency's own precision, like the server
  });
});

describe('computeMarketPrice', () => {
  it('plain FX without a market', () => {
    expect(computeMarketPrice(2800, 'PKR', 'USD', rates)).toBe(10);
    expect(computeMarketPrice(10, 'USD', 'PKR', rates)).toBe(2800);
  });
  it('USD market with .99 rounding', () => {
    const m = mk('USD', { useRounding: true, roundingRule: '0.99' });
    expect(computeMarketPrice(2800, 'PKR', 'USD', rates, m)).toBe(9.99);
    expect(computeMarketPrice(2940, 'PKR', 'USD', rates, m)).toBe(10.99); // 10.5
    expect(computeMarketPrice(84, 'PKR', 'USD', rates, m)).toBe(0.99);
  });
  it('PKR market with 1.00 rounding', () => {
    expect(computeMarketPrice(10.004, 'USD', 'PKR', rates, mk('PKR', { useRounding: true, roundingRule: '1.00' }))).toBe(2801);
  });
  it('percentage + conversion fee', () => {
    const m = mk('PKR', { type: 'percentage', percentageAdjustment: 10, conversionFee: 2 });
    expect(computeMarketPrice(10, 'USD', 'PKR', rates, m)).toBe(3142); // 3141.6, PKR is 0-decimal here
  });
  it('percentage applies whenever set (same as the server)', () => {
    expect(computeMarketPrice(10, 'USD', 'PKR', rates, mk('PKR', { type: 'manual', percentageAdjustment: 10 }))).toBe(3080);
  });
  it('seller manual rate replaces the live rate (converted prices only)', () => {
    const m = mk('PKR', { type: 'manual', manualRate: 300 });
    expect(computeMarketPrice(10, 'USD', 'PKR', rates, m)).toBe(3000);
    expect(computeMarketPrice(10, 'PKR', 'PKR', rates, m)).toBe(10); // same currency: no conversion at all
  });
  it('conversion fee and rounding never touch a price that was not converted', () => {
    const m = mk('PKR', { conversionFee: 5, useRounding: true, roundingRule: '1.00' });
    expect(computeMarketPrice(1234.56, 'PKR', 'PKR', rates, m)).toBe(1235); // PKR is whole rupees
    const usd = mk('USD', { conversionFee: 5, useRounding: true, roundingRule: '0.99' });
    expect(computeMarketPrice(10.5, 'USD', 'USD', rates, usd)).toBe(10.5);
  });
  it("'nearest' keeps the currency's own precision, '1.00' means whole units", () => {
    expect(computeMarketPrice(10.004, 'EUR', 'USD', rates, mk('USD', { useRounding: true, roundingRule: 'nearest' }))).toBe(11.12); // 11.1156
    expect(computeMarketPrice(10, 'EUR', 'USD', rates, mk('USD', { useRounding: true, roundingRule: '1.00' }))).toBe(11);
  });
  it('a fixed market price wins as-is, only in the market currency', () => {
    const m = mk('USD', { conversionFee: 5, useRounding: true, roundingRule: '0.99' });
    expect(computeMarketPrice(2800, 'PKR', 'USD', rates, m, 12.34)).toBe(12.34);
    expect(computeMarketPrice(2800, 'PKR', 'EUR', rates, m, 12.34)).toBe(9);
  });
  it('JPY 0-decimals: charm rule falls back to nearest', () => {
    expect(computeMarketPrice(10.33, 'USD', 'JPY', rates, mk('JPY', { useRounding: true, roundingRule: '0.99' }))).toBe(1550);
  });
  it('rule ignored when buyer currency differs from market currency', () => {
    const m = mk('USD', { type: 'percentage', percentageAdjustment: 50, useRounding: true, roundingRule: '0.99', conversionFee: 5 });
    expect(computeMarketPrice(10, 'USD', 'EUR', rates, m)).toBe(9);
  });
  it('missing rates show native amount', () => {
    expect(computeMarketPrice(10, 'USD', 'XYZ', rates)).toBe(10);
  });
});
