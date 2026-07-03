import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PosSettings {
  _id:              string;
  storeId:          string;
  taxRate:          number;   // 0.05 = 5%
  receiptHeader:    string | null;
  receiptFooter:    string | null;
  businessName:     string | null;
  businessAddress:  string | null;
  currencySymbol:   string | null;
  createdAt:        string;
  updatedAt:        string;
}

export interface UpdatePosSettingsPayload {
  taxRate?:         number;
  receiptHeader?:   string;
  receiptFooter?:   string;
  businessName?:    string;
  businessAddress?: string;
  currencySymbol?:  string;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── API ───────────────────────────────────────────────────────────────────────

/** GET /api/pos/settings/:storeId */
export function apiGetPosSettings(storeId: string) {
  return client.get<never, ApiResponse<PosSettings>>(ENDPOINTS.POS.SETTINGS.GET(storeId));
}

/** PATCH /api/pos/settings/:storeId */
export function apiUpdatePosSettings(storeId: string, payload: UpdatePosSettingsPayload) {
  return client.patch<never, ApiResponse<PosSettings>>(ENDPOINTS.POS.SETTINGS.UPDATE(storeId), payload);
}
