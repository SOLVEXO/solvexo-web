import { describe, it, expect } from 'vitest';
import { currencyCodeForCountry, pickLocalCurrencyForCountry } from '@/features/buyer/pages/pricing/localPrice';
import { ONBOARDING_CHECKOUT_TEXT } from '@/features/auth/pages/onboard/OnboardingCheckout.text';
import { localPriceNote, localizeCheckoutText, priceOnly, priceWithUsd } from './localPlanPrice';

const PK = { code: 'PKR', ratePerUSD: 276.541346 };
const rates = { USD: { ratePerUSD: 1, effectiveFrom: '', source: 'admin' as const }, PKR: { ratePerUSD: 276.541346, effectiveFrom: '', source: 'provider' as const } };

describe('store country → local currency (dashboard, gate, checkout)', () => {
  it('uses the STORE country (any case), only when the FX service has a rate', () => {
    expect(currencyCodeForCountry('PK')).toBe('PKR');
    expect(currencyCodeForCountry('pk')).toBe('PKR');
    expect(currencyCodeForCountry(' Pk ')).toBe('PKR');
    expect(currencyCodeForCountry('US')).toBeNull();
    expect(currencyCodeForCountry(null)).toBeNull();
    expect(pickLocalCurrencyForCountry('PK', rates)).toEqual({ code: 'PKR', ratePerUSD: 276.541346 });
    expect(pickLocalCurrencyForCountry('PK', null)).toBeNull();            // no rates loaded → US$ only
    expect(pickLocalCurrencyForCountry('AE', rates)).toBeNull();           // country known, but no AED rate → US$ only
    expect(pickLocalCurrencyForCountry('US', rates)).toBeNull();
  });
});

describe('price helpers', () => {
  it('without a local currency everything stays US$', () => {
    expect(priceOnly(29, null)).toBe('$29');
    expect(priceOnly(7.5, null)).toBe('$7.50');
    expect(priceWithUsd(29, null)).toBe('$29');
    expect(localPriceNote(null)).toBeNull();
  });
  it('a Pakistani store sees Rs, and the lines that matter keep the real US$ next to it', () => {
    expect(priceOnly(29, PK)).toBe('Rs 8,020');
    expect(priceWithUsd(29, PK)).toBe('Rs 8,020 (≈ $29)');
    expect(priceWithUsd(7.5, PK)).toBe('Rs 2,070 (≈ $7.50)');
  });
  it('the disclosure says the amounts are approximate and that billing is in US dollars', () => {
    const n = localPriceNote(PK)!;
    expect(n).toMatch(/approximate/);
    expect(n).toMatch(/US\$1 = 276\.54 PKR/);
    expect(n).toMatch(/billed in US dollars/);
  });
});

describe('localizeCheckoutText (gate / checkout wording)', () => {
  const en = ONBOARDING_CHECKOUT_TEXT.en;
  it('is a no-op without a local currency', () => {
    expect(localizeCheckoutText(en, null)).toBe(en);
  });
  it('price lines show Rs, sublines also keep the real US$, and the charge / legal wording stays in US$', () => {
    const t = localizeCheckoutText(en, PK);
    expect(t.money(29)).toBe('Rs 8,020');
    expect(t.moPrice('29')).toBe('Rs 8,020/mo');
    expect(t.billedYearly(290)).toBe('billed Rs 80,200 yearly');
    expect(t.monthlySubline(29, 'Dec 20')).toBe('Pay Rs 8,020 (≈ $29)/month — next charge Dec 20.');
    expect(t.payLabel(29)).toBe('Subscribe for $29 USD');                       // what is really charged
    expect(t.amountPerMonth(29)).toBe('$29/mo');                                 // used in the consent sentence
    expect(t.trialSubline(3)).toBe(en.trialSubline(3));                          // untouched wording
  });
});
