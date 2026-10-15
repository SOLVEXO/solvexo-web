import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@/api/services/exchangeRate', () => ({
  apiGetCurrentRates: () => Promise.resolve({ data: { PKR: { ratePerUSD: 280 }, EUR: { ratePerUSD: 0.9 } } }),
}));
vi.mock('@/api/services/store', () => ({
  apiGetEnabledCurrencies: () => Promise.resolve({ data: [{ code: 'USD' }, { code: 'PKR' }, { code: 'EUR' }] }),
}));
vi.mock('@/api/services/auth', () => ({
  TokenStorage: { isLoggedIn: () => false, getUser: () => null },
  apiEditProfile: () => Promise.resolve(),
}));

import { CurrencyPreferenceProvider, useCurrencyPreference } from './CurrencyPreferenceContext';

const wrapper = ({ children }: { children: ReactNode }) => <CurrencyPreferenceProvider>{children}</CurrencyPreferenceProvider>;
const usdMarket = { currency: 'USD', pricingRule: { type: 'auto' as const, percentageAdjustment: null, useRounding: true, roundingRule: '0.99' as const, conversionFee: null } };

describe('CurrencyPreferenceContext market pricing', () => {
  it('plain FX without a market rule; rule applies only when buyer currency == market currency', async () => {
    localStorage.clear();
    const { result } = renderHook(() => useCurrencyPreference(), { wrapper });
    await waitFor(() => expect(result.current.ratesLoaded).toBe(true));
    act(() => result.current.setCurrencyAuto('USD'));
    expect(result.current.convert(2800, 'PKR')).toBe(10);
    act(() => result.current.setMarketPricing(usdMarket));
    expect(result.current.convert(2800, 'PKR')).toBe(9.99);
    // buyer currency differs from the market currency: rule ignored
    act(() => result.current.setCurrencyAuto('EUR'));
    expect(result.current.convert(2800, 'PKR')).toBe(9);
    // native amount already in the buyer currency is untouched when no rounding applies
    act(() => result.current.setMarketPricing(null));
    expect(result.current.convert(5, 'EUR')).toBe(5);
  });
  it('auto default is not an explicit choice; setCurrency is', async () => {
    localStorage.clear();
    const { result } = renderHook(() => useCurrencyPreference(), { wrapper });
    act(() => result.current.setCurrencyAuto('PKR'));
    expect(result.current.hasExplicitCurrency()).toBe(false);
    expect(localStorage.getItem('solvexo_currency_preference')).toBe('PKR');
    act(() => result.current.setCurrency('EUR'));
    expect(result.current.hasExplicitCurrency()).toBe(true);
  });
});
