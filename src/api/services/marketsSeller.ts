import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { MarketPricingType, MarketRoundingRule } from '@/utils/marketPricing';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface SellerMarket {
  _id: string;
  name: string;
  countries: string[];
  currency: string;
  languages: string[];
  domainType: 'primary' | 'subdomain' | 'subfolder';
  domain: string | null;
  subfolder: string | null;
  isActive: boolean;
  isPrimary: boolean;
  pricingRule: {
    type: MarketPricingType;
    percentageAdjustment?: number | null;
    useRounding?: boolean;
    roundingRule?: MarketRoundingRule;
    conversionFee?: number | null;
  };
  shippingSettings?: { currencyMode: 'store' | 'local' };
}

/** Body of POST/PUT — mirrors CreateMarketDto / UpdateMarketDto in solvexo-api/src/markets/dto. */
export interface SellerMarketPayload {
  name: string;
  countries: string[];
  currency: string;
  languages?: string[];
  domainType?: 'primary' | 'subdomain' | 'subfolder';
  domain?: string;
  subfolder?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  pricingRule?: {
    type?: MarketPricingType;
    percentageAdjustment?: number;
    useRounding?: boolean;
    roundingRule?: MarketRoundingRule;
    conversionFee?: number;
  };
  shippingSettings?: { currencyMode?: 'store' | 'local' };
}

export function apiListSellerMarkets(storeId: string) {
  return client.get<never, ApiResponse<SellerMarket[]>>(ENDPOINTS.MARKETS_SELLER.LIST(storeId));
}
export function apiCreateSellerMarket(storeId: string, payload: SellerMarketPayload) {
  return client.post<never, ApiResponse<SellerMarket>>(ENDPOINTS.MARKETS_SELLER.LIST(storeId), payload);
}
export function apiUpdateSellerMarket(storeId: string, marketId: string, payload: Partial<SellerMarketPayload>) {
  return client.put<never, ApiResponse<SellerMarket>>(ENDPOINTS.MARKETS_SELLER.ONE(storeId, marketId), payload);
}
export function apiDeleteSellerMarket(storeId: string, marketId: string) {
  return client.delete<never, { success: boolean; message?: string }>(ENDPOINTS.MARKETS_SELLER.ONE(storeId, marketId));
}

/** Languages with no bundled UI text get their buttons/labels translated the first time they are asked for; asking right
 *  after a market is saved means buyers find them ready. Best effort: a failure here changes nothing for the seller. */
export function apiWarmUiLocales(languages: string[]): void {
  const bundled = new Set(['en', 'ur', 'ar', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'tr', 'hi', 'fa', 'id', 'ru', 'zh', 'ja', 'ko', 'ms', 'pl', 'sv', 'th', 'vi']);
  languages.filter(l => l && !bundled.has(l)).forEach(l => { void client.get(`/api/public/ui-locale/${l}`).catch(() => undefined); });
}
