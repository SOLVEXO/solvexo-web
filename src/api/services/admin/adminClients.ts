import client from '../../client';
import { ENDPOINTS } from '../../endpoints';
import type { SellerDetail } from '../users/adminUsers';
import type { AdminOverviewData } from '../analytics/adminAnalytics';
import type { AdminSellerFinancialRollupData } from '../finance/adminFinance';
import type { SellerPlatformOverview } from '../platformPlans';
import type { ModerationReportRow } from '../moderation/adminModeration';
import type { AdminActivityLogEntry, AdminActivityCategory } from '../activityLog';

// ── The admin "Clients" workspace — one seller/business + every store they
// own, composed from the same already-existing sellerId-scoped services the
// rest of the admin already uses (Users/Analytics/Finance/platform-plans),
// rather than a seller-by-seller trip across 5 separate admin pages. ────────

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── Overview tab ─────────────────────────────────────────────────────────────

export interface ClientOverviewData {
  seller: SellerDetail;
  analytics: AdminOverviewData;
  finance: AdminSellerFinancialRollupData;
  billing: SellerPlatformOverview;
  openModerationReports: number;
}

export function apiGetClientOverview(sellerId: string) {
  return client.get<never, ApiResponse<ClientOverviewData>>(ENDPOINTS.CLIENTS.OVERVIEW(sellerId));
}

// ── Finance tab ──────────────────────────────────────────────────────────────
// Same rollup the Overview tab's KPI strip already pulls — the tab itself
// re-fetches it directly (via useAnalyticsQuery's own cache-by-params
// behavior) rather than threading it through as a prop.

export function apiGetClientFinance(sellerId: string) {
  return client.get<never, ApiResponse<AdminSellerFinancialRollupData>>(ENDPOINTS.CLIENTS.FINANCE(sellerId));
}

// ── Moderation tab ───────────────────────────────────────────────────────────

export interface ClientModerationData {
  reports: ModerationReportRow[];
  /** Surfaced in the tab's own UI — v1 covers direct seller reports plus
   *  reports on this seller's product listings/reviews; disclosed rather
   *  than letting a clean list read as "zero moderation history ever". */
  scopeNote: string;
}

export function apiGetClientModeration(sellerId: string) {
  return client.get<never, ApiResponse<ClientModerationData>>(ENDPOINTS.CLIENTS.MODERATION(sellerId));
}

// ── Activity tab ─────────────────────────────────────────────────────────────

export interface ClientActivityQuery {
  category?: AdminActivityCategory;
  isSecurityAlert?: boolean;
  page?: number;
  limit?: number;
}

export interface ClientActivityData {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  logs: AdminActivityLogEntry[];
}

export function apiGetClientActivity(sellerId: string, query: ClientActivityQuery = {}) {
  return client.get<never, ApiResponse<ClientActivityData>>(ENDPOINTS.CLIENTS.ACTIVITY(sellerId), { params: query });
}
