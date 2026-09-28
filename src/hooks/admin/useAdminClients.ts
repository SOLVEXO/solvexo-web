import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import {
  apiGetClientOverview, apiGetClientFinance, apiGetClientModeration, apiGetClientActivity,
  type ClientActivityQuery,
} from '@/api/services/admin/adminClients';
import { apiAdminGetSellerPlatformOverview } from '@/api/services/platformPlans';
import { apiAdminSellerTransactionsBySeller, type AdminTransactionsParams } from '@/api/services/finance/adminFinance';

/** The Clients workspace's Overview tab — a single composed call, see
 *  AdminClientsService.getOverview on the backend for what it fans out to. */
export function useClientOverview(sellerId: string) {
  return useAnalyticsQuery((p: { sellerId: string }) => apiGetClientOverview(p.sellerId), { sellerId });
}

/** Cross-store balance/transactions rollup — same one Overview's KPI strip
 *  already pulls, re-fetched independently so the Finance tab doesn't
 *  depend on Overview having loaded first (each tab lazy-loads its own
 *  data on first open — see useKeepAliveTabs). */
export function useClientFinance(sellerId: string) {
  return useAnalyticsQuery((p: { sellerId: string }) => apiGetClientFinance(p.sellerId), { sellerId });
}

/** Reports against this seller's account, product listings, and reviews —
 *  not just direct seller reports (see the tab's own scopeNote). */
export function useClientModeration(sellerId: string) {
  return useAnalyticsQuery((p: { sellerId: string }) => apiGetClientModeration(p.sellerId), { sellerId });
}

/** Per-store plan/status table — plans are store-level entities (a client
 *  with 3 stores can be on 3 different plans), so this is shown as a table
 *  of stores, not collapsed into one value. Same cross-store rollup the
 *  seller's own Billing Center uses (`getSellerOverview`), just reached
 *  through the admin-authorized route. */
export function useClientBilling(sellerId: string) {
  return useAnalyticsQuery((p: { sellerId: string }) => apiAdminGetSellerPlatformOverview(p.sellerId), { sellerId });
}

/** This client's transaction ledger across every store they own — a single
 *  indexed `sellerId` query server-side (see `FinanceService.adminGetSellerTransactionsBySeller`),
 *  not a per-store loop. */
export function useClientTransactions(sellerId: string, params: AdminTransactionsParams = {}) {
  return useAnalyticsQuery(
    (p: { sellerId: string } & AdminTransactionsParams) => apiAdminSellerTransactionsBySeller(p.sellerId, p),
    { sellerId, ...params },
  );
}

/** Every action across this client's stores, plus the platform-scoped admin
 *  actions (suspend/unsuspend, moderation actions) that are about THIS
 *  client specifically — see AdminClientsService.getActivity's own comment
 *  for why this needed a corrected query, not a blind targetId match. */
export function useClientActivity(sellerId: string, query: ClientActivityQuery = {}) {
  return useAnalyticsQuery(
    (p: { sellerId: string } & ClientActivityQuery) => apiGetClientActivity(p.sellerId, p),
    { sellerId, ...query },
  );
}
