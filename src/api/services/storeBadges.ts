import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type StoreBadgeCounts = Record<string, number>;

/** Counts of things that need the seller's attention (returns to review, open disputes, unread messages...), keyed by sidebar item id. */
export function apiGetStoreBadges(storeId: string) {
  return client.get<never, { success: boolean; data: StoreBadgeCounts }>(ENDPOINTS.STORE_BADGES.COUNTS(storeId));
}
