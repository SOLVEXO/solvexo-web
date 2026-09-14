import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type StockCountStatus = 'open' | 'completed' | 'cancelled';

export interface StockCountItem {
  _id: string;
  variantId: string;
  productId: string;
  sku: string | null;
  productName: string;
  image: string | null;
  systemQty: number;
  countedQty: number | null;
}

export interface StockCount {
  _id: string;
  storeId: string;
  locationId: string | null;
  items: StockCountItem[];
  status: StockCountStatus;
  startedBy: string;
  startedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

export function apiStartStockCount(storeId: string, locationId?: string) {
  return client.post<never, ApiResponse<StockCount>>(ENDPOINTS.STOCK_COUNTS.START(storeId), { locationId });
}

export function apiListStockCounts(storeId: string) {
  return client.get<never, ApiResponse<StockCount[]>>(ENDPOINTS.STOCK_COUNTS.LIST(storeId));
}

export function apiGetStockCount(storeId: string, id: string) {
  return client.get<never, ApiResponse<StockCount>>(ENDPOINTS.STOCK_COUNTS.GET(storeId, id));
}

export function apiSubmitStockCountItem(storeId: string, id: string, itemId: string, countedQty: number) {
  return client.post<never, ApiResponse<StockCount>>(ENDPOINTS.STOCK_COUNTS.SUBMIT_ITEM(storeId, id, itemId), { countedQty });
}

export function apiCancelStockCount(storeId: string, id: string) {
  return client.post<never, ApiResponse<StockCount>>(ENDPOINTS.STOCK_COUNTS.CANCEL(storeId, id), {});
}

/** `idempotencyKey` should be generated once per finish ATTEMPT (reused
 *  across a retry of that same submission) — without it, a retried/
 *  double-clicked finish could apply the same discrepancy adjustments
 *  twice. */
export function apiFinishStockCount(storeId: string, id: string, idempotencyKey: string) {
  return client.post<never, ApiResponse<{ count: StockCount; applied: number }>>(
    ENDPOINTS.STOCK_COUNTS.FINISH(storeId, id), {}, { headers: { 'Idempotency-Key': idempotencyKey } },
  );
}
