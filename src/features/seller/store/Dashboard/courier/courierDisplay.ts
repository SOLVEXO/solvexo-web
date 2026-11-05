import type { CourierStatus } from '@/api/services/courier';
import type { BadgeColor } from '@/types';

export const COURIER_STATUS_COLOR: Record<CourierStatus, BadgeColor> = {
  booked: 'gray', picked_up: 'blue', in_transit: 'blue', out_for_delivery: 'orange',
  delivered: 'green', returned: 'red', cancelled: 'gray', failed: 'yellow',
};

/** A fresh key per user intent (modal open / button press) — the server dedupes retries and double clicks with it. */
export function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
