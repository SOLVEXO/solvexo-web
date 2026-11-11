import client from '../../client';
import { ENDPOINTS } from '../../endpoints';
import { downloadBlob } from '@/utils/downloadBlob';

// ── Seller trust & verification (Super Admin) ────────────────────────────────
// Every call and JSON shape the admin side uses for seller verification lives
// in this one file: the Seller trust page (summary, list, review, actions,
// reminders, enforcement), the client "Business profile" tab and the trust
// columns/filters/export on the Clients list. Must match
// solvexo-api/src/admin-seller-trust/ and AdminClientsService.getBusinessProfile.
// Responses use the same `{ success, data }` envelope as the other admin services.

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── Shared vocabulary ────────────────────────────────────────────────────────

export type VerificationStatus = 'not_started' | 'pending' | 'under_review' | 'needs_info' | 'verified' | 'rejected';
export type RiskLevel = 'low' | 'medium' | 'high';
export type RiskSeverity = 'info' | 'medium' | 'high';
export type BusinessType = 'individual' | 'company' | 'partnership';
export type NtnCheckResult = 'active' | 'not_found' | 'inactive';
export type YesNo = 'yes' | 'no';

export interface RiskReason { code: string; label: string; severity: RiskSeverity }

export interface PayoutHold { active: boolean; reason: string | null; by: string | null; at: string | null }

export interface TrustDeadline { dueAt: string | null; limited: boolean; enforcementStarted: boolean }

// ── Summary ──────────────────────────────────────────────────────────────────

export interface SellerTrustSummary {
  totalStores: number;
  withNtn: number;
  withoutNtn: number;
  byStatus: Record<VerificationStatus, number>;
  highRisk: number;
  mediumRisk: number;
  waitingReview: number;
  deadlinePassed: number;
  enforcement: { startedAt: string | null; graceDays: number; firstDueAt: string | null };
}

// ── Store list ───────────────────────────────────────────────────────────────

export interface SellerTrustQuery {
  search?: string;
  country?: string;
  ntn?: YesNo;
  status?: VerificationStatus;
  risk?: RiskLevel;
  limited?: YesNo;
  page?: number;
  limit?: number;
  sort?: 'submitted' | 'risk' | 'created';
}

export interface SellerTrustRow {
  storeId: string;
  storeName: string;
  slug: string | null;
  status: string;
  sellerId: string;
  sellerName: string | null;
  sellerEmail: string | null;
  sellerPhone: string | null;
  country: string | null;
  businessType: BusinessType | null;
  hasNtn: boolean;
  ntn: string | null;
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  riskLevel: RiskLevel;
  riskReasons: RiskReason[];
  dueAt: string | null;
  limited: boolean;
  payoutHold: PayoutHold | null;
  /** Regulated categories the seller declared (cosmetics, medicines, food, mobile_phones). */
  categories: string[];
  createdAt: string;
}

export interface SellerTrustListData { items: SellerTrustRow[]; total: number; page: number; limit: number }

// ── Store detail (review) ────────────────────────────────────────────────────

export interface BusinessProfileAnswers {
  sourcing?: 'manufacturer' | 'reseller' | 'importer' | 'dropshipper' | null;
  sellsBrandedGoods?: boolean | null;
  regulatedCategories?: string[];
  premises?: 'shop' | 'warehouse' | 'home' | null;
  yearsSelling?: 'lt_6m' | '6m_1y' | '1_3y' | 'gt_3y' | null;
  otherChannels?: string[];
  couriers?: string[];
  dispatchTime?: 'same_day' | '1_2_days' | '3_plus_days' | null;
  returnPolicy?: '7_day_returns' | 'exchange_only' | 'no_returns' | null;
  monthlyOrders?: 'lt_50' | '50_300' | 'gt_300' | null;
  bankAccountInOwnName?: boolean | null;
}

export interface VerificationHistoryEntry { action: string; note: string | null; actorId?: string | null; actorRole: 'seller' | 'admin' | string; at: string }

export interface TrustDocument {
  type: string;
  required: boolean;
  state: 'uploaded' | 'missing' | 'not_required';
  fileName: string | null;
  uploadedAt: string | null;
  /** Short-lived signed URL; null when nothing is uploaded. */
  viewUrl: string | null;
}

export interface SellerTrustDetail {
  storeId: string;
  storeName: string;
  slug: string | null;
  status: string;
  country: string | null;
  businessType: BusinessType | null;
  createdAt: string;
  categoryName?: string | null;
  invoiceTaxId?: string | null;
  seller: { id: string; name: string | null; email: string | null; phone: string | null; address?: string | null };
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  rejectionReason?: string | null;
  verification: {
    legalBusinessName: string | null;
    registrationNumber: string | null;
    taxId: string | null;
    strn: string | null;
    cnicNumber: string | null;
    businessAddress: string | null;
    idDocumentType: 'cnic' | 'passport' | 'national_id' | null;
    authorizedContact: { name?: string; designation?: string; email?: string; phone?: string } | null;
    businessProfile: BusinessProfileAnswers | null;
    ntnCheck: { checkedAt: string; checkedBy: string | null; checkedByName?: string | null; result: NtnCheckResult } | null;
    history: VerificationHistoryEntry[];
  };
  documents: TrustDocument[];
  requirements: { requiredFields: string[]; requiredDocuments: string[]; optionalDocuments: string[]; verificationLevel?: string };
  missingFields: string[];
  missingDocuments: string[];
  riskLevel: RiskLevel;
  riskReasons: RiskReason[];
  deadline: TrustDeadline;
  payoutHold: PayoutHold | null;
  /** Stripe Connect stores are paid by Stripe directly: a hold covers Solvexo-held balances only. */
  stripeConnect: boolean;
  lastTrustReminderAt?: string | null;
}

// ── Settings ─────────────────────────────────────────────────────────────────

export interface SellerTrustSettings { enforcementStartedAt: string | null; graceDays: number; firstDueAt?: string | null }
export interface SellerTrustSettingsPatch { enforcementStartedAt?: 'now' | null; graceDays?: number }

// ── Client business profile (Clients → client → Business profile) ───────────

export interface ClientBusinessProfile {
  seller: {
    name: string;
    email: string;
    emailVerified: boolean;
    phone: string | null;
    address: string | null;
    authProvider: string | null;
    createdAt: string;
    languagePreference: string | null;
    status: string;
    acquisition: { source?: string | null; medium?: string | null; campaign?: string | null; landingPage?: string | null; partnerCode?: string | null; capturedAt?: string | null } | null;
    onboardingAnswers: Record<string, unknown> | null;
  };
  stores: ClientTrustStore[];
}

export interface ClientTrustStore {
  storeId: string;
  name: string;
  slug: string | null;
  status: string;
  country: string | null;
  businessType: BusinessType | null;
  categoryName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  invoiceTaxId: string | null;
  taxRegistered: boolean | null;
  verificationStatus: VerificationStatus;
  hasNtn: boolean;
  /** Requested from the API (not in the first spec): what the seller entered on the verification form. */
  ntn?: string | null;
  legalBusinessName?: string | null;
  cnicNumber?: string | null;
  riskLevel: RiskLevel;
  riskReasons: RiskReason[];
  dueAt: string | null;
  limited: boolean;
  payoutHold: PayoutHold | null;
  createdAt: string;
}

// ── Trust columns added to the Clients list rows (GET /api/admin/users) ─────
// Optional on purpose: the list keeps working against an API that doesn't
// send them yet.
export interface ClientTrustColumns {
  phone?: string | null;
  country?: string | null;
  hasNtn?: boolean;
  ntn?: string | null;
  verificationStatus?: VerificationStatus | null;
  riskLevel?: RiskLevel | null;
  dueAt?: string | null;
  /** What the client sells: the primary store's category name. */
  sells?: string | null;
}

export interface ClientTrustFilters {
  country?: string;
  ntn?: YesNo;
  verification?: VerificationStatus;
  risk?: RiskLevel;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const clean = <T extends object>(q: T) =>
  Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as Partial<T>;

const today = () => new Date().toISOString().slice(0, 10);

// ── API: Seller trust ────────────────────────────────────────────────────────

export const apiGetSellerTrustSummary = () =>
  client.get<never, ApiResponse<SellerTrustSummary>>(ENDPOINTS.SELLER_TRUST.SUMMARY);

export const apiListSellerTrustStores = (q: SellerTrustQuery) =>
  client.get<never, ApiResponse<SellerTrustListData>>(ENDPOINTS.SELLER_TRUST.STORES, { params: clean(q) });

export async function apiExportSellerTrustStores(q: SellerTrustQuery) {
  const blob = await client.get<never, Blob>(ENDPOINTS.SELLER_TRUST.EXPORT, { params: clean({ ...q, page: undefined, limit: undefined }), responseType: 'blob' });
  downloadBlob(blob, `solvexo-seller-trust-${today()}.csv`);
}

export const apiGetSellerTrustStore = (storeId: string) =>
  client.get<never, ApiResponse<SellerTrustDetail>>(ENDPOINTS.SELLER_TRUST.STORE(storeId));

export const apiTrustMarkUnderReview = (storeId: string) =>
  client.post<never, ApiResponse<unknown>>(ENDPOINTS.SELLER_TRUST.UNDER_REVIEW(storeId));

export const apiTrustApprove = (storeId: string) =>
  client.post<never, ApiResponse<unknown>>(ENDPOINTS.SELLER_TRUST.APPROVE(storeId));

export const apiTrustReject = (storeId: string, reason: string) =>
  client.post<never, ApiResponse<unknown>>(ENDPOINTS.SELLER_TRUST.REJECT(storeId), { reason });

export const apiTrustRequestInfo = (storeId: string, message: string) =>
  client.post<never, ApiResponse<unknown>>(ENDPOINTS.SELLER_TRUST.REQUEST_INFO(storeId), { message });

export const apiTrustNtnCheck = (storeId: string, result: NtnCheckResult) =>
  client.post<never, ApiResponse<unknown>>(ENDPOINTS.SELLER_TRUST.NTN_CHECK(storeId), { result });

export const apiTrustPayoutHold = (storeId: string, active: boolean, reason?: string) =>
  client.post<never, ApiResponse<unknown>>(ENDPOINTS.SELLER_TRUST.PAYOUT_HOLD(storeId), clean({ active, reason }));

/** Either explicit stores or "everyone matching this filter" (verified stores and
 *  stores reminded in the last 24h are skipped by the API). */
export const apiTrustRemind = (body: { storeIds?: string[]; filter?: Omit<SellerTrustQuery, 'page' | 'limit' | 'sort'> }) =>
  client.post<never, ApiResponse<{ sent: number; skipped: number }>>(ENDPOINTS.SELLER_TRUST.REMIND, body.filter ? { filter: clean(body.filter) } : body);

export const apiGetSellerTrustSettings = () =>
  client.get<never, ApiResponse<SellerTrustSettings>>(ENDPOINTS.SELLER_TRUST.SETTINGS);

export const apiUpdateSellerTrustSettings = (patch: SellerTrustSettingsPatch) =>
  client.patch<never, ApiResponse<SellerTrustSettings>>(ENDPOINTS.SELLER_TRUST.SETTINGS, patch);

// ── API: Client business profile ─────────────────────────────────────────────

export const apiGetClientBusinessProfile = (sellerId: string) =>
  client.get<never, ApiResponse<ClientBusinessProfile>>(ENDPOINTS.CLIENTS.BUSINESS_PROFILE(sellerId));

// ── API: Clients list export (same filters as the list) ─────────────────────

export async function apiExportClients(q: { search?: string; status?: string } & ClientTrustFilters) {
  const blob = await client.get<never, Blob>(ENDPOINTS.USERS.ADMIN.EXPORT, { params: clean({ role: 'seller', ...q }), responseType: 'blob' });
  downloadBlob(blob, `solvexo-clients-${today()}.csv`);
}
