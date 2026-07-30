import client from '../client';
import { ENDPOINTS } from '../endpoints';

// Note: unlike most admin endpoints in this app, the commission-rules
// controller returns its service result directly (no `{success, data}`
// envelope) — every function below expects the raw body accordingly.

export type CommissionRateSource = 'seller_override' | 'platform_plan' | 'global_default' | 'hardcoded_fallback';

export interface ResolvedCommissionRate {
  rate: number;
  source: CommissionRateSource;
}

export interface CommissionRule {
  _id: string;
  scope: 'global' | 'seller';
  storeId: string | null;
  rate: number;
  isActive: boolean;
  notes: string | null;
  createdByAdminId: string;
  supersededAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerOverrideRow extends CommissionRule {
  storeName: string;
}

export interface SellerOverridesPage {
  rules: SellerOverrideRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Global default
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetGlobalCommissionDefault() {
  return client.get<never, CommissionRule | null>(ENDPOINTS.COMMISSION_RULES.GLOBAL);
}

export function apiSetGlobalCommissionDefault(rate: number, notes?: string) {
  return client.put<never, CommissionRule>(ENDPOINTS.COMMISSION_RULES.GLOBAL, { rate, notes });
}

export function apiGetGlobalCommissionHistory() {
  return client.get<never, CommissionRule[]>(ENDPOINTS.COMMISSION_RULES.GLOBAL_HISTORY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-seller overrides
// ─────────────────────────────────────────────────────────────────────────────
export function apiListSellerCommissionOverrides(page = 1, limit = 20) {
  return client.get<never, SellerOverridesPage>(ENDPOINTS.COMMISSION_RULES.SELLERS, { params: { page, limit } });
}

export function apiResolveCommissionRate(storeId: string) {
  return client.get<never, ResolvedCommissionRate>(ENDPOINTS.COMMISSION_RULES.RESOLVE(storeId));
}

export function apiGetSellerCommissionOverride(storeId: string) {
  return client.get<never, CommissionRule | null>(ENDPOINTS.COMMISSION_RULES.SELLER_OVERRIDE_GET(storeId));
}

export function apiGetSellerCommissionHistory(storeId: string) {
  return client.get<never, CommissionRule[]>(ENDPOINTS.COMMISSION_RULES.SELLER_HISTORY(storeId));
}

export function apiSetSellerCommissionOverride(storeId: string, rate: number, notes?: string) {
  return client.put<never, CommissionRule>(ENDPOINTS.COMMISSION_RULES.SELLER_OVERRIDE_SET(storeId), { rate, notes });
}

export function apiRemoveSellerCommissionOverride(storeId: string) {
  return client.delete<never, { removed: boolean }>(ENDPOINTS.COMMISSION_RULES.SELLER_OVERRIDE_SET(storeId));
}
