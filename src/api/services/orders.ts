import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderActionResponse {
  success: boolean;
  message: string;
}

export interface UpdateStatusPayload {
  orderId: string;
  storeId: string;
  status:  'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  tracking?: {
    carrier:        string;
    trackingNumber: string;
    trackingUrl:    string;
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

export function apiMarkOrderPaid(orderId: string) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.MARK_PAID(orderId));
}

export function apiUpdateOrderStatus(payload: UpdateStatusPayload) {
  return client.put<never, OrderActionResponse>(ENDPOINTS.ORDERS.UPDATE_STATUS, payload);
}

export function apiGetDownloadUrl(orderId: string, productId: string) {
  return client.get<never, { success: boolean; message: string; data: { downloadUrl: string } }>(
    `${ENDPOINTS.ORDERS.DOWNLOAD_URL}?orderId=${orderId}&productId=${productId}`,
  );
}
