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
