import { apiGetMyBalance, apiGetRewards, type LoyaltyBalance, type Reward } from '@/api/services/loyalty';

export interface LoyaltyData { unavailable: boolean; balance: LoyaltyBalance | null; rewards: Reward[] }

/** A 4xx answer means the store has no (enabled) program for this buyer - that is "unavailable", not an error to retry.
 *  Network / 5xx failures still throw so the page can offer a retry. */
export async function loadLoyalty(storeId: string): Promise<LoyaltyData> {
  try {
    const [bal, rewards] = await Promise.all([apiGetMyBalance(storeId), apiGetRewards(storeId)]);
    return { unavailable: false, balance: bal.data, rewards: rewards.data ?? [] };
  } catch (err) {
    const e = err as { status?: number; response?: { status?: number } };
    const s = e?.status ?? e?.response?.status;
    if (s && s >= 400 && s < 500) return { unavailable: true, balance: null, rewards: [] };
    throw err;
  }
}
