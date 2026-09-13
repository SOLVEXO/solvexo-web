import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface AbandonedCartSettings {
  storeId:      string;
  enabled:      boolean;
  delayMinutes: number;
  subject:      string;
  message:      string;
}

export type UpdateAbandonedCartSettingsPayload = Partial<Pick<AbandonedCartSettings, 'enabled' | 'delayMinutes' | 'subject' | 'message'>>;

export interface AbandonedCartStats {
  abandonedCount:   number;
  emailsSent:       number;
  clicked:          number;
  recovered:        number;
  recoveredRevenue: number;
}

export type AbandonedCartRecoveryStatus = 'pending' | 'sent' | 'clicked' | 'recovered';

export interface AbandonedCartItem {
  checkoutId:     string;
  customerName:   string;
  customerEmail:  string | null;
  itemCount:      number;
  cartValue:      number;
  currency:       string;
  abandonedAt:    string;
  recoveryStatus: AbandonedCartRecoveryStatus;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface PaginatedAbandonedCarts {
  items: AbandonedCartItem[];
  total: number;
  page:  number;
  limit: number;
}

/** GET /api/abandoned-cart/:storeId/settings — absence of a saved doc still
 *  comes back as "enabled with defaults" (see the backend schema's own doc
 *  comment on why recovery is on by default). */
export function apiGetAbandonedCartSettings(storeId: string) {
  return client.get<never, ApiResponse<AbandonedCartSettings>>(ENDPOINTS.ABANDONED_CART.SETTINGS(storeId));
}

/** PATCH /api/abandoned-cart/:storeId/settings */
export function apiUpdateAbandonedCartSettings(storeId: string, payload: UpdateAbandonedCartSettingsPayload) {
  return client.patch<never, ApiResponse<AbandonedCartSettings>>(ENDPOINTS.ABANDONED_CART.SETTINGS(storeId), payload);
}

/** GET /api/abandoned-cart/:storeId/stats */
export function apiGetAbandonedCartStats(storeId: string) {
  return client.get<never, ApiResponse<AbandonedCartStats>>(ENDPOINTS.ABANDONED_CART.STATS(storeId));
}

/** GET /api/abandoned-cart/:storeId — paginated list of this store's abandoned checkouts. */
export function apiListAbandonedCarts(storeId: string, params?: { page?: number; limit?: number; recoveryStatus?: AbandonedCartRecoveryStatus }) {
  return client.get<never, ApiResponse<PaginatedAbandonedCarts>>(ENDPOINTS.ABANDONED_CART.LIST(storeId), { params });
}
