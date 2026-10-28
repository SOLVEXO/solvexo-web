import client from '../client';
import { dedupedGet } from '../../utils/dedupedGet';
import { ENDPOINTS } from '../endpoints';
import type { MarketPricingRule } from '@/utils/marketPriceMath';

export interface PublicStoreMarket {
  id: string;
  name: string;
  /** ISO-3166 alpha-2; [] = catch-all / domestic. */
  countries: string[];
  currency: string;
  languages: string[];
  isPrimary: boolean;
  subfolder: string | null;
  domain: string | null;
  pricingRule: MarketPricingRule;
}

export interface PublicStoreMarkets {
  defaultLanguage: string;
  languages: string[];
  markets: PublicStoreMarket[];
}

/** GET /api/public/store-markets/:storeId (no auth) */
export function apiGetPublicStoreMarkets(storeId: string) {
  return dedupedGet(`markets:${storeId}`, () => client.get<never, { success: boolean; data: PublicStoreMarkets }>(ENDPOINTS.STORE.PUBLIC_MARKETS(storeId)));
}

export interface PublicMarketFixedPrice {
  productId: string;
  variantId: string | null;
  fixedPrice: number;
  compareAtPrice?: number | null;
}

/** GET /api/public/store-markets/:storeId/:marketId/prices (no auth): the market's fixed catalog prices. */
export function apiGetPublicMarketPrices(storeId: string, marketId: string) {
  return dedupedGet(`market-prices:${marketId}`, () => client.get<never, { success: boolean; data: PublicMarketFixedPrice[] }>(ENDPOINTS.STORE.PUBLIC_MARKET_PRICES(storeId, marketId)));
}

/** Market resolution shared with the server: first market listing the country,
 *  else the primary market, else null. */
export function resolveMarket(markets: PublicStoreMarket[], country: string | null | undefined): PublicStoreMarket | null {
  const c = (country ?? '').toUpperCase();
  if (c) {
    const hit = markets.find(m => m.countries.some(x => x.toUpperCase() === c));
    if (hit) return hit;
  }
  return markets.find(m => m.isPrimary) ?? null;
}
