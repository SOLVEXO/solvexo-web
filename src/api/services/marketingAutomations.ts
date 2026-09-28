import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/* Plain-text messages with merge tags:
 *   all:          {{customerName}} {{storeName}}
 *   backInStock:  + {{productName}}
 *   priceDrop:    + {{productName}} {{oldPrice}} {{newPrice}}          */
export interface MarketingAutomationSettings {
  /** Shopify's "Confirm email subscription": storefront/checkout sign-ups must click a confirmation email first. */
  doubleOptIn: boolean;
  welcome:     { enabled: boolean; subject: string; message: string; discountCode: string | null; design: object | null; html: string | null };
  backInStock: { enabled: boolean; subject: string; message: string; design: object | null; html: string | null };
  priceDrop:   { enabled: boolean; minDropPercent: number; subject: string; message: string; design: object | null; html: string | null };
  winBack:     { enabled: boolean; afterDays: number; subject: string; message: string; discountCode: string | null; design: object | null; html: string | null };
}

export type AutomationType = 'welcome' | 'back_in_stock' | 'price_drop' | 'win_back';

export interface MarketingAutomationStats {
  last30Days:            Partial<Record<AutomationType, number>>;
  allTime:               Partial<Record<AutomationType, number>>;
  pendingBackInStock:    number;
  topBackInStockProducts: { productId: string; name: string; requests: number }[];
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };

export function apiGetAutomationSettings(storeId: string) {
  return client.get<never, ApiResponse<MarketingAutomationSettings>>(ENDPOINTS.MARKETING_AUTOMATIONS.SETTINGS(storeId));
}

/** Partial — send only the sections/fields that changed. A discountCode must
 *  be an existing coupon code of the store (API returns 400 otherwise);
 *  null/'' clears it. minDropPercent 1–90, afterDays 14–365. */
export function apiUpdateAutomationSettings(storeId: string, patch: DeepPartial<MarketingAutomationSettings>) {
  return client.put<never, ApiResponse<MarketingAutomationSettings>>(ENDPOINTS.MARKETING_AUTOMATIONS.SETTINGS(storeId), patch);
}

export function apiGetAutomationStats(storeId: string) {
  return client.get<never, ApiResponse<MarketingAutomationStats>>(ENDPOINTS.MARKETING_AUTOMATIONS.STATS(storeId));
}

/** Public — whether the storefront should offer "Notify me when available". */
export function apiGetAutomationPublicConfig(storeId: string) {
  return client.get<never, ApiResponse<{ backInStockEnabled: boolean }>>(ENDPOINTS.MARKETING_AUTOMATIONS.PUBLIC_CONFIG(storeId));
}

/** Public — "Notify me when available" on a sold-out variant. `data.inStock`
 *  is true when the item is actually available right now. */
export function apiRequestBackInStock(payload: { storeId: string; productId: string; variantId: string; email: string }) {
  return client.post<never, ApiResponse<{ inStock: boolean }>>(ENDPOINTS.MARKETING_AUTOMATIONS.BACK_IN_STOCK, payload);
}

export type AutomationSection = 'welcome' | 'backInStock' | 'priceDrop' | 'winBack';

/** "[Test]" copy of one automation email with sample data; `email` defaults to the seller's account email. */
export function apiSendAutomationTest(storeId: string, section: AutomationSection, email?: string) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.MARKETING_AUTOMATIONS.TEST(storeId, section), email ? { email } : {});
}
