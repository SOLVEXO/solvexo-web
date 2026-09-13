import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type CommissionType = 'percentage' | 'fixed';

export interface AffiliateProgram {
  storeId:          string;
  enabled:          boolean;
  commissionType:   CommissionType;
  commissionValue:  number;
  cookieWindowDays: number;
}

export type UpdateAffiliateProgramPayload = Partial<Pick<AffiliateProgram, 'enabled' | 'commissionType' | 'commissionValue' | 'cookieWindowDays'>>;

export interface Affiliate {
  _id:              string;
  storeId:          string;
  userId:           string | null;
  name:             string;
  email:            string;
  referralCode:     string;
  referralLink:     string;
  commissionType:   CommissionType | null;
  commissionValue:  number | null;
  isActive:         boolean;
  totalClicks:      number;
  totalConversions: number;
  totalEarningsUSD: number;
  totalPaidUSD:     number;
  createdAt:        string;
}

export interface CreateAffiliatePayload {
  name:             string;
  email:            string;
  commissionType?:  CommissionType;
  commissionValue?: number;
}

export interface UpdateAffiliatePayload {
  name?:            string;
  isActive?:        boolean;
  commissionType?:  CommissionType | null;
  commissionValue?: number | null;
}

export interface AffiliateStats {
  affiliateCount:   number;
  totalClicks:      number;
  totalConversions: number;
  totalEarningsUSD: number;
  totalPaidUSD:     number;
  totalOwedUSD:     number;
}

export type AffiliateReferralStatus = 'pending' | 'paid';

export interface AffiliateReferral {
  _id:             string;
  affiliateId:     string;
  affiliateName:   string;
  affiliateEmail:  string | null;
  orderId:         string;
  orderRevenueUSD: number;
  commissionUSD:   number;
  status:          AffiliateReferralStatus;
  createdAt:       string;
  paidAt:          string | null;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface PaginatedAffiliates { affiliates: Affiliate[]; total: number; page: number; limit: number }
interface PaginatedReferrals { referrals: AffiliateReferral[]; total: number; page: number; limit: number }

/** GET /api/affiliate/:storeId/program */
export function apiGetAffiliateProgram(storeId: string) {
  return client.get<never, ApiResponse<AffiliateProgram>>(ENDPOINTS.AFFILIATE.PROGRAM(storeId));
}

/** PATCH /api/affiliate/:storeId/program */
export function apiUpdateAffiliateProgram(storeId: string, payload: UpdateAffiliateProgramPayload) {
  return client.patch<never, ApiResponse<AffiliateProgram>>(ENDPOINTS.AFFILIATE.PROGRAM(storeId), payload);
}

/** GET /api/affiliate/:storeId/stats */
export function apiGetAffiliateStats(storeId: string) {
  return client.get<never, ApiResponse<AffiliateStats>>(ENDPOINTS.AFFILIATE.STATS(storeId));
}

/** GET /api/affiliate/:storeId/referrals */
export function apiListAffiliateReferrals(storeId: string, params?: { page?: number; limit?: number; affiliateId?: string; status?: AffiliateReferralStatus }) {
  return client.get<never, ApiResponse<PaginatedReferrals>>(ENDPOINTS.AFFILIATE.REFERRALS(storeId), { params });
}

/** POST /api/affiliate/:storeId */
export function apiCreateAffiliate(storeId: string, payload: CreateAffiliatePayload) {
  return client.post<never, ApiResponse<Affiliate>>(ENDPOINTS.AFFILIATE.CREATE(storeId), payload);
}

/** GET /api/affiliate/:storeId */
export function apiListAffiliates(storeId: string, params?: { page?: number; limit?: number }) {
  return client.get<never, ApiResponse<PaginatedAffiliates>>(ENDPOINTS.AFFILIATE.LIST(storeId), { params });
}

/** PATCH /api/affiliate/:storeId/:affiliateId */
export function apiUpdateAffiliate(storeId: string, affiliateId: string, payload: UpdateAffiliatePayload) {
  return client.patch<never, ApiResponse<Affiliate>>(ENDPOINTS.AFFILIATE.UPDATE(storeId, affiliateId), payload);
}

/** DELETE /api/affiliate/:storeId/:affiliateId */
export function apiDeleteAffiliate(storeId: string, affiliateId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.AFFILIATE.DELETE(storeId, affiliateId));
}

/** POST /api/affiliate/:storeId/:affiliateId/pay — marks all pending referrals paid */
export function apiPayAffiliate(storeId: string, affiliateId: string) {
  return client.post<never, ApiResponse<Affiliate>>(ENDPOINTS.AFFILIATE.PAY(storeId, affiliateId));
}
