import { createContext, useContext } from 'react';
import type { PublicStoreMarket } from '@/api/services/markets';
import { DEFAULT_LOCALE } from '@/i18n/localeConfig';

export const COUNTRY_STORAGE_KEY = 'solvexo_country';

export interface StorefrontMarketValue {
  loaded: boolean;
  markets: PublicStoreMarket[];
  /** Languages this store really offers (always includes the default). */
  languages: string[];
  defaultLanguage: string;
  /** Buyer country (ISO2): saved choice, else IP detection, else null. */
  country: string | null;
  /** Countries that can be picked (union of the markets' countries). */
  countries: string[];
  setCountry: (code: string) => void;
  market: PublicStoreMarket | null;
  /** Active CONTENT language (path prefix; 'en' = no prefix). */
  language: string;
  /** Switches language by reloading the same path with the new prefix. */
  setLanguage: (code: string) => void;
}

export const StorefrontMarketCtx = createContext<StorefrontMarketValue | null>(null);

/** Null outside a storefront (theme-editor demo previews). */
export function useStorefrontMarketOptional(): StorefrontMarketValue | null {
  return useContext(StorefrontMarketCtx);
}

/** Active content language for translating seller content ('en' when there is no provider). */
export function useContentLocale(): string {
  return useContext(StorefrontMarketCtx)?.language ?? DEFAULT_LOCALE;
}
