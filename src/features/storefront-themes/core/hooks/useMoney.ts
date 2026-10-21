import { useCallback } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { moneyText } from '../money';

/** Formats an amount in the shopper's chosen display currency. `from` defaults to the store's base currency. */
export function useMoney() {
  const { store } = useStorefront();
  const { currency, convert, canConvert } = useCurrencyPreference();
  const base = String(store.baseCurrency ?? currency);
  const money = useCallback((amount: number | null | undefined, from?: string | null) => {
    if (amount == null) return '';
    // No rate yet (or none for this currency): a dash, never the native number under another currency's symbol.
    if (!canConvert(from ?? base)) return '—';
    return moneyText(convert(amount, from ?? base), currency);
  }, [convert, canConvert, currency, base]);
  return { money, currency, baseCurrency: base };
}
