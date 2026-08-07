import { createContext, useContext, type ReactNode } from 'react';
import type { PublicStoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';

export interface StorefrontCfg {
  primaryColor: string;
  bgColor:      string;
  textColor:    string;
  accentColor:  string;
  font:         string;
}

export const STOREFRONT_CFG_DEFAULT: StorefrontCfg = {
  primaryColor: '#D97757',
  bgColor:      '#FAF9F5',
  textColor:    '#2C2A28',
  accentColor:  '#B95A3A',
  font:         'Poppins',
};

export interface StorefrontContextValue {
  store:  PublicStoreData;
  theme:  StoreThemeData | null;
  cfg:    StorefrontCfg;
  /** Resolves a nav_link/footer-link block's `{linkType, pageSlug?, url?}` into a real in-app path or external href. */
  resolveLink: (link: { linkType: string; pageSlug?: string; url?: string }) => { to?: string; href?: string };
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function StorefrontProvider({ value, children }: { value: StorefrontContextValue; children: ReactNode }) {
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront must be used within a StorefrontProvider (StorefrontLayout)');
  return ctx;
}
