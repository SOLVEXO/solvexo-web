import client from '../client';
import { ENDPOINTS } from '../endpoints';
import { getAnonymousVisitorId } from '@/utils/anonymousVisitorId';

interface ApiResponse<T> { success: boolean; message?: string; data?: T }
interface RecordViewResult { recorded: boolean }

/**
 * POST /api/product-views — Phase 5 tracking foundation. Public (no login
 * required): the axios client already attaches the buyer's JWT when they're
 * logged in (see api/client.ts's request interceptor), so the backend
 * resolves userId from that on its own — this call only needs to supply the
 * anonId fallback identity for a not-logged-in visitor.
 *
 * Fire-and-forget by design: a tracking beacon failing must never break the
 * product page, so callers should not surface its rejection to the user.
 */
export function apiRecordProductView(productId: string) {
  const anonId = getAnonymousVisitorId();
  return client.post<never, ApiResponse<RecordViewResult>>(ENDPOINTS.PRODUCT_VIEWS.RECORD, {
    productId,
    anonId,
  });
}
