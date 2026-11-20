import { describe, expect, it } from 'vitest';
import { ONBOARDING_CHECKOUT_TEXT } from '@/features/auth/pages/onboard/OnboardingCheckout.text';
import { currencyCodeForCountry, formatLocal, localCurrencyCode, localizeCheckoutText, localPriceNote, pickLocalCurrency, pickLocalCurrencyForCountry, priceOnly } from './localPrice';

const rates = { USD: { ratePerUSD: 1, effectiveFrom: '', source: 'admin' as const }, PKR: { ratePerUSD: 276.541346, effectiveFrom: '', source: 'provider' as const } };

describe('pricing page local currency', () => {
  it('uses the country in the URL, only when a rate exists', () => {
    expect(localCurrencyCode('/pk/pricing')).toBe('PKR');
    expect(localCurrencyCode('/pricing')).toBeNull();
    expect(pickLocalCurrency('/pk/pricing', rates)).toEqual({ code: 'PKR', ratePerUSD: 276.541346 });
    expect(pickLocalCurrency('/ae/pricing', rates)).toBeNull(); // no AED rate yet → US$ only
    expect(pickLocalCurrency('/us/pricing', rates)).toBeNull();
    expect(pickLocalCurrency('/pk/pricing', null)).toBeNull();
  });

  it('rounds to a friendly rupee figure', () => {
    const pk = { code: 'PKR', ratePerUSD: 276.541346 };
    expect([6, 29, 59, 179, 1].map(n => formatLocal(n, pk))).toEqual(['Rs 1,660', 'Rs 8,020', 'Rs 16,320', 'Rs 49,500', 'Rs 280']);
    expect(formatLocal(0.2, pk)).toBe('Rs 55');
  });
});

describe('Arabic site currency labels', () => {
  it('writes the amount first with the Arabic currency name', () => {
    expect(formatLocal(29, { code: 'AED', ratePerUSD: 3.6725 }, 'ar')).toBe('110 د.إ');
    expect(formatLocal(6, { code: 'SAR', ratePerUSD: 3.75 }, 'ar')).toBe('23 ر.س');
    expect(formatLocal(29, { code: 'AED', ratePerUSD: 3.6725 })).toBe('AED 110');
  });
});

const PK = { code: 'PKR', ratePerUSD: 276.541346 };

describe('dashboard / gate / checkout (a visitor in Pakistan sees Rs, nothing else written)', () => {
  it('country → currency, only when the FX service has a rate', () => {
    expect(currencyCodeForCountry('PK')).toBe('PKR');
    expect(currencyCodeForCountry('pk')).toBe('PKR');
    expect(currencyCodeForCountry('US')).toBeNull();
    expect(currencyCodeForCountry(null)).toBeNull();
    expect(pickLocalCurrencyForCountry('PK', rates)).toEqual(PK);
    expect(pickLocalCurrencyForCountry('PK', null)).toBeNull();
    expect(pickLocalCurrencyForCountry('AE', rates)).toBeNull();
  });
  it('prices are Rs only — no US$ written beside them', () => {
    expect(priceOnly(29, null)).toBe('$29');
    expect(priceOnly(7.5, null)).toBe('$7.50');
    expect(priceOnly(29, PK)).toBe('Rs 8,020');
    expect(priceOnly(7.5, PK)).toBe('Rs 2,070');
    expect(priceOnly(29, PK)).not.toMatch(/\$|USD/);
  });
  it('the note says approximate, and never mentions dollars', () => {
    expect(localPriceNote(null)).toBeNull();
    expect(localPriceNote(PK)).toBe('Prices in Rs are approximate and follow the exchange rate.');
    expect(localPriceNote(PK)).not.toMatch(/\$|USD|dollar/i);
  });
  it('the gate / checkout wording shows Rs in every price phrase, including the pay button, with no USD left', () => {
    const en = ONBOARDING_CHECKOUT_TEXT.en;
    expect(localizeCheckoutText(en, null)).toBe(en);
    const t = localizeCheckoutText(en, PK);
    expect(t.money(29)).toBe('Rs 8,020');
    expect(t.moPrice('29')).toBe('Rs 8,020/mo');
    expect(t.billedYearly(290)).toBe('billed Rs 80,200 yearly');
    expect(t.monthlySubline(29, 'Dec 20')).toBe('Pay Rs 8,020/month — next charge Dec 20.');
    expect(t.payLabel(29)).toBe('Subscribe for Rs 8,020');
    expect(t.amountPerMonth(29)).toBe('Rs 8,020/mo');
    expect(t.trialSubline(3)).toBe(en.trialSubline(3));
    for (const s of [t.money(29), t.payLabel(29), t.amountPerYear(290), t.introThen(3, 29), t.startFor('Grow', 1)]) expect(s).not.toMatch(/\$|USD/);
  });
});
