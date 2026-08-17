import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface MarketplaceStats {
  totalListings: number;
  active: number;
  flagged: number;
  gmvThisMonth: number;
}

export type ListingStatus = 'active' | 'inactive' | 'draft' | 'scheduled' | 'flagged';

export interface MarketplaceListingQuery {
  search?: string;
  categoryId?: string;
  status?: ListingStatus;
  page?: number;
  limit?: number;
}

export interface MarketplaceListingRow {
  id: string;
  title: string;
  sellerId: string;
  sellerName: string;
  storeId: string;
  storeBadges: string[];
  categoryId: string;
  price: number | null;
  purchaseCount: number;
  status: string;
  isFeatured: boolean;
}

export type GrantableStoreBadge = 'verified' | 'top_seller' | 'verified_educator';

export interface MarketplaceListingsData {
  items: MarketplaceListingRow[];
  total: number;
  page: number;
  limit: number;
}

// ── Leads (new-store approval queue) ────────────────────────────────────────
export interface LeadsQuery {
  search?: string;
  /** Omit for the default pending/under_review review queue; `'all'` removes
   *  the status filter entirely so every lead (verified/rejected/not_started
   *  included) shows up. */
  verificationStatus?: LeadVerificationStatus | 'all';
  page?: number;
  limit?: number;
}

export type LeadVerificationStatus = 'not_started' | 'pending' | 'under_review' | 'verified' | 'rejected';
export type LeadVerificationLevel = 'basic' | 'business' | 'enhanced';

export interface LeadRow {
  id: string;
  storeName: string;
  logo: string | null;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  sellerType: string | null;
  productTypes: string[];
  baseCurrency: string | null;
  submittedAt: string;
  /** Marketplace listing lifecycle — independent of verificationStatus below. */
  storeStatus: string;
  country: string;
  businessType: string | null;
  verificationLevel: LeadVerificationLevel | null;
  verificationStatus: LeadVerificationStatus;
  seller: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
}

export interface LeadsData {
  items: LeadRow[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadDocumentView {
  type: string;
  required: boolean;
  state: 'missing' | 'uploaded' | 'not_required';
  fileName: string | null;
  uploadedAt: string | null;
  viewUrl: string | null;
}

export interface LeadHistoryEntry {
  action: string;
  note: string | null;
  actorId: string | null;
  actorRole: 'seller' | 'admin';
  at: string;
}

export interface LeadDetail {
  id: string;
  storeName: string;
  logo: string | null;
  description: string | null;
  categoryName: string | null;
  sellerType: string | null;
  productTypes: string[];
  storeStatus: string;
  rejectionReason: string | null;
  submittedAt: string;
  seller: { id: string; name: string; email: string | null; phone: string | null; address: string | null };
  country: string;
  businessType: string | null;
  verificationLevel: LeadVerificationLevel;
  verificationStatus: LeadVerificationStatus;
  legalBusinessName: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  businessAddress: string | null;
  idDocumentType: string | null;
  authorizedContact: { name: string | null; designation: string | null; email: string | null; phone: string | null } | null;
  documents: LeadDocumentView[];
  missingFields: string[];
  missingDocuments: string[];
  /** True only when every required field/document is satisfied — mirrors
   *  the backend's own gate, so the UI can disable Approve for exactly the
   *  same reason the server would reject it. */
  canApprove: boolean;
  history: LeadHistoryEntry[];
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetMarketplaceStats() {
  return client.get<never, ApiResponse<MarketplaceStats>>(ENDPOINTS.MARKETPLACE.ADMIN.STATS);
}

export function apiGetMarketplaceListings(query: MarketplaceListingQuery = {}) {
  return client.get<never, ApiResponse<MarketplaceListingsData>>(ENDPOINTS.MARKETPLACE.ADMIN.LISTINGS, { params: query });
}

export function apiSetListingFeatured(id: string, isFeatured: boolean) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.MARKETPLACE.ADMIN.FEATURE(id), { isFeatured });
}

export function apiRemoveListing(id: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.MARKETPLACE.ADMIN.REMOVE(id));
}

/** PATCH /api/admin/marketplace/stores/:id/badge — grants/revokes a store trust badge (e.g. 'verified_educator'). */
export function apiSetStoreBadge(storeId: string, badge: GrantableStoreBadge, grant: boolean) {
  return client.patch<never, ApiResponse<{ badges: string[] }>>(
    ENDPOINTS.MARKETPLACE.ADMIN.SET_STORE_BADGE(storeId), { badge, grant },
  );
}

export function apiGetLeads(query: LeadsQuery = {}) {
  return client.get<never, ApiResponse<LeadsData>>(ENDPOINTS.MARKETPLACE.ADMIN.LEADS, { params: query });
}

export function apiGetLeadDetail(id: string) {
  return client.get<never, ApiResponse<LeadDetail>>(ENDPOINTS.MARKETPLACE.ADMIN.LEAD_DETAIL(id));
}

export function apiMarkLeadUnderReview(id: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.MARKETPLACE.ADMIN.LEAD_UNDER_REVIEW(id));
}

export function apiApproveLead(id: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.MARKETPLACE.ADMIN.APPROVE_LEAD(id));
}

/** `reason` is mandatory — the backend rejects the request without one. */
export function apiRejectLead(id: string, reason: string) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.MARKETPLACE.ADMIN.REJECT_LEAD(id), { reason });
}
