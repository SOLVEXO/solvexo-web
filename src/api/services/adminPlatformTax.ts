import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type PlatformTaxAuthority = 'FBR' | 'SRB' | 'PRA' | 'KPRA' | 'BRA' | 'OTHER';

export interface PlatformTaxRate {
  id?: string;
  country: string;
  label: string;
  ratePercent: number;
  status: 'draft' | 'confirmed';
  effectiveFrom: string | null;
}

export interface PlatformTaxSettings {
  legalName: string;
  ntn: string;
  strn: string;
  authority: PlatformTaxAuthority;
  address: string;
  rates: PlatformTaxRate[];
}

export interface ApplyTaxResult { total: number; withTax: number; withoutTax: number; failed: number; dryRun: boolean }

interface ApiResponse<T> { success: boolean; data: T }

/** GET /api/admin/platform-tax — Solvexo's own tax identity + country-wise rates on plan fees. */
export function apiGetPlatformTax() {
  return client.get<never, ApiResponse<PlatformTaxSettings>>(ENDPOINTS.ADMIN_PLATFORM_TAX.BASE);
}

export function apiUpdatePlatformTax(body: Partial<PlatformTaxSettings>) {
  return client.put<never, ApiResponse<PlatformTaxSettings>>(ENDPOINTS.ADMIN_PLATFORM_TAX.BASE, body);
}

/** dryRun:true only counts the subscriptions that would change. */
export function apiApplyPlatformTax(dryRun: boolean) {
  return client.post<never, ApiResponse<ApplyTaxResult>>(ENDPOINTS.ADMIN_PLATFORM_TAX.APPLY, { dryRun });
}

export interface PlatformTaxGap { country: string; stores: number; reason: string }

/** Paying sellers' countries that currently get NO tax (rate missing / draft / not started). */
export function apiGetPlatformTaxCoverage() {
  return client.get<never, ApiResponse<PlatformTaxGap[]>>(ENDPOINTS.ADMIN_PLATFORM_TAX.COVERAGE);
}

export interface PlatformTaxQuote { netUSD: number; taxUSD: number; totalUSD: number; ratePercent: number; label: string | null; country: string | null }

/** What Solvexo's tax adds to `amountUSD` for this seller's store (seller sees it before paying). */
export function apiGetPlatformTaxQuote(storeId: string, amountUSD: number) {
  return client.get<never, ApiResponse<PlatformTaxQuote>>(`${ENDPOINTS.ADMIN_PLATFORM_TAX.SELLER_QUOTE}/${storeId}`, { params: { amountUSD } });
}
