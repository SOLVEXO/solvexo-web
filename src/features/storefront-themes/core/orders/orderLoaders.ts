import { apiGetOrderById, apiGetOrderByStatusToken, type OrderDetail } from '@/api/services/orders';

/** `order: null` means "does not exist / not yours / link expired" (a real answer, not a failure to retry). */
export interface OrderLoad { order: OrderDetail | null }

function statusOf(err: unknown): number | undefined {
  const e = err as { status?: number; response?: { status?: number } };
  return e?.status ?? e?.response?.status;
}

export async function loadOrder(orderId: string): Promise<OrderLoad> {
  try {
    const res = await apiGetOrderById(orderId);
    return { order: res.data ?? null };
  } catch (err) {
    const s = statusOf(err);
    if (s === 404 || s === 403) return { order: null };
    throw err;
  }
}

export async function loadOrderByToken(token: string): Promise<OrderLoad> {
  try {
    const res = await apiGetOrderByStatusToken(token);
    return { order: res.data ?? null };
  } catch (err) {
    const s = statusOf(err);
    if (s === 404 || s === 403 || s === 400 || s === 410) return { order: null };
    throw err;
  }
}
