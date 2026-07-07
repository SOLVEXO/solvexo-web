import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface LoyaltyTier { name: string; minPoints: number; benefits: string[] }

export interface LoyaltyProgram {
  _id: string;
  storeId: string;
  isEnabled: boolean;
  pointsPerDollar: number;
  pointsPerReview: number;
  pointsPerReferral: number;
  birthdayBonusPoints: number;
  pointsExpiryMonths: number | null;
  tiers: LoyaltyTier[];
}

export interface LoyaltyOverview {
  programEnabled: boolean;
  programMembers: number;
  pointsIssuedLast30Days: number;
  pointsRedeemedTotal: number;
  revenueFromMembersLast30Days: number;
  memberDistribution: { tier: string; members: number; percent: number }[];
  pointsActivityLast30Days: Record<string, number>;
}

export interface LoyaltyMember {
  _id: string;
  userId: string;
  pointsBalance: number;
  lifetimePoints: number;
  currentTier: string | null;
  lastActivityAt: string;
  user: { name: string; email: string } | null;
}

export type LoyaltyTransactionType = 'purchase' | 'review' | 'referral' | 'birthday' | 'redeem' | 'expire' | 'adjustment';

export interface LoyaltyTransaction {
  _id: string;
  type: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  description: string | null;
  orderId: string | null;
  createdAt: string;
}

export type RewardType = 'fixed_discount' | 'free_product';

export interface Reward {
  _id: string;
  storeId: string;
  name: string;
  description: string | null;
  pointsCost: number;
  type: RewardType;
  discountValue: number | null;
  productId: string | null;
  stockLimit: number | null;
  redeemedCount: number;
  isActive: boolean;
}

export interface CreateRewardPayload {
  name: string;
  description?: string;
  pointsCost: number;
  type: RewardType;
  discountValue?: number;
  productId?: string;
  stockLimit?: number;
}

export type UpdateRewardPayload = Partial<CreateRewardPayload> & { isActive?: boolean };

export interface EarningRules {
  pointsPerDollar?: number;
  pointsPerReview?: number;
  pointsPerReferral?: number;
  birthdayBonusPoints?: number;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface PaginatedMembers { pagination: { page: number; limit: number; total: number; totalPages: number }; members: LoyaltyMember[] }
interface PaginatedTransactions { pagination: { page: number; limit: number; total: number; totalPages: number }; transactions: LoyaltyTransaction[] }

/** GET /api/loyalty/:storeId/overview */
export function apiGetLoyaltyOverview(storeId: string) {
  return client.get<never, ApiResponse<LoyaltyOverview>>(ENDPOINTS.LOYALTY.OVERVIEW(storeId));
}

/** GET /api/loyalty/:storeId/program */
export function apiGetLoyaltyProgram(storeId: string) {
  return client.get<never, ApiResponse<LoyaltyProgram>>(ENDPOINTS.LOYALTY.PROGRAM(storeId));
}

/** PATCH /api/loyalty/:storeId/program */
export function apiUpdateLoyaltyProgram(storeId: string, payload: { isEnabled?: boolean; pointsExpiryMonths?: number | null }) {
  return client.patch<never, ApiResponse<LoyaltyProgram>>(ENDPOINTS.LOYALTY.PROGRAM(storeId), payload);
}

/** PATCH /api/loyalty/:storeId/earning-rules */
export function apiUpdateEarningRules(storeId: string, payload: EarningRules) {
  return client.patch<never, ApiResponse<LoyaltyProgram>>(ENDPOINTS.LOYALTY.EARNING_RULES(storeId), payload);
}

/** PUT /api/loyalty/:storeId/tiers */
export function apiUpdateTiers(storeId: string, tiers: LoyaltyTier[]) {
  return client.put<never, ApiResponse<LoyaltyProgram>>(ENDPOINTS.LOYALTY.TIERS(storeId), { tiers });
}

/** GET /api/loyalty/:storeId/members */
export function apiGetLoyaltyMembers(storeId: string, page = 1, limit = 20) {
  return client.get<never, ApiResponse<PaginatedMembers>>(`${ENDPOINTS.LOYALTY.MEMBERS(storeId)}?page=${page}&limit=${limit}`);
}

/** GET /api/loyalty/:storeId/members/:memberId/transactions */
export function apiGetMemberTransactions(storeId: string, memberId: string, page = 1, limit = 20) {
  return client.get<never, ApiResponse<PaginatedTransactions>>(`${ENDPOINTS.LOYALTY.MEMBER_TRANSACTIONS(storeId, memberId)}?page=${page}&limit=${limit}`);
}

/** POST /api/loyalty/:storeId/members/:memberId/award */
export function apiAwardPoints(storeId: string, memberId: string, payload: { points: number; type: 'referral' | 'birthday' | 'adjustment'; description: string }) {
  return client.post<never, ApiResponse<LoyaltyTransaction>>(ENDPOINTS.LOYALTY.AWARD_POINTS(storeId, memberId), payload);
}

/** POST /api/loyalty/:storeId/rewards */
export function apiCreateReward(storeId: string, payload: CreateRewardPayload) {
  return client.post<never, ApiResponse<Reward>>(ENDPOINTS.LOYALTY.REWARDS.CREATE(storeId), payload);
}

/** GET /api/loyalty/:storeId/rewards */
export function apiGetRewards(storeId: string) {
  return client.get<never, ApiResponse<Reward[]>>(ENDPOINTS.LOYALTY.REWARDS.LIST(storeId));
}

/** PATCH /api/loyalty/:storeId/rewards/:rewardId */
export function apiUpdateReward(storeId: string, rewardId: string, payload: UpdateRewardPayload) {
  return client.patch<never, ApiResponse<Reward>>(ENDPOINTS.LOYALTY.REWARDS.UPDATE(storeId, rewardId), payload);
}

/** DELETE /api/loyalty/:storeId/rewards/:rewardId */
export function apiDeleteReward(storeId: string, rewardId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.LOYALTY.REWARDS.DELETE(storeId, rewardId));
}

// ── Buyer-facing ──────────────────────────────────────────────────────────────

export interface LoyaltyBalance {
  pointsBalance: number;
  lifetimePoints: number;
  currentTier: string | null;
  nextTier: { name: string; pointsNeeded: number } | null;
}

/** GET /api/loyalty/:storeId/my-balance */
export function apiGetMyBalance(storeId: string) {
  return client.get<never, ApiResponse<LoyaltyBalance>>(ENDPOINTS.LOYALTY.MY_BALANCE(storeId));
}

/** POST /api/loyalty/:storeId/redeem */
export function apiRedeemReward(storeId: string, rewardId: string) {
  return client.post<never, ApiResponse<{ transaction: LoyaltyTransaction; remainingBalance: number }>>(
    ENDPOINTS.LOYALTY.REDEEM(storeId), { rewardId },
  );
}
