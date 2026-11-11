import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type FbrMode = 'sandbox' | 'production';
// held_rule = on hold: no verified tax rule for this supply yet (never sent). unknown_outcome = FBR may already have it: a person must check the FBR portal.
export type FbrStatus = 'pending' | 'submitted' | 'failed' | 'rejected' | 'needs_info' | 'needs_review' | 'skipped' | 'held_rule' | 'unknown_outcome';
export type FbrStats = Record<FbrStatus, number>;

export interface FbrInvoiceRow {
  _id: string; issuer: 'platform' | 'store'; source: 'plan_invoice' | 'order'; sourceId: string; storeId: string;
  kind: 'sale' | 'adjustment'; status: FbrStatus; mode: FbrMode; reference: string; attempts: number;
  nextAttemptAt: string | null; lastAttemptAt: string | null; fbrInvoiceNumber: string | null; fbrDated: string | null;
  errors: { code: string | null; message: string; itemSNo?: string | null }[]; authError: boolean; note: string | null;
  netAmount: number; taxAmount: number; createdAt: string;
  /** unknown_outcome can be settled once: who did it and how. */
  resolvedAt?: string | null; resolvedBy?: string | null; resolution?: 'filed' | 'resend' | null;
}
export type FbrResolveInput = { action: 'filed'; fbrInvoiceNumber: string; fbrDated?: string } | { action: 'resend' };
export interface FbrList { items: FbrInvoiceRow[]; total: number; page: number; limit: number }

export interface FbrSettingsInput {
  enabled?: boolean; mode?: FbrMode; province?: string; legalName?: string; scenarioId?: string;
  hsCode?: string; uom?: string; saleType?: string;
}
export interface FbrTestResult { ok: boolean; message: string; errors: { code: string | null; message: string }[] }

export interface PlatformFbrSettings {
  enabled: boolean; mode: FbrMode; province: string; scenarioId: string; hsCode: string; uom: string; saleType: string;
  enabledSince: string | null; lastTestAt: string | null; lastTestOk: boolean | null; lastTestMessage: string | null;
  tokenConfigured: { sandbox: boolean; production: boolean };
  /** Live (production) filing is hard-locked by the server; only the FBR sandbox is available. */
  productionLocked: boolean;
  identity: { legalName: string; ntn: string; strn: string; address: string; authority: string };
  stats: FbrStats;
}

export interface StoreFbrSettings {
  enabled: boolean; mode: FbrMode; province: string; legalName: string; scenarioId: string; hsCode: string; uom: string; saleType: string;
  enabledSince: string | null;
  tokenSandbox: { set: boolean; hint: string | null }; tokenProduction: { set: boolean; hint: string | null };
  productionLocked: boolean;
  lastTestAt: string | null; lastTestOk: boolean | null; lastTestMessage: string | null;
  identity: { taxId: string; taxRegistered: boolean; address: string; storeName: string };
  blockers: string[];
  /** Solvexo could not invoice this store yet: its province / address is missing. */
  solvexoInvoicesNeedInfo: number;
  stats: FbrStats;
}

export interface OrderFbrInfo { status: FbrStatus; mode: FbrMode; fbrInvoiceNumber: string | null; fbrDated: string | null; qrText: string | null }
export interface PlanInvoiceFbr extends OrderFbrInfo { sourceId: string }

export interface SolvexoInvoiceDoc {
  invoice: { id: string; number: string; date: string; status: string; type: string; planName: string; currency: string; subtotal: number; tax: number; taxLabel: string | null; taxRatePercent: number; total: number; refunded: number };
  seller: { legalName: string; ntn: string; strn: string; address: string; authority: string };
  buyer: { name: string; taxId: string; address: string; province: string };
  fbr: { status: FbrStatus; mode: FbrMode; invoiceNumber: string | null; dated: string | null; qrText: string | null; netPKR: number | null; taxPKR: number | null; fxRate: number | null } | null;
}

const admin = '/api/admin/fbr-di';
const store = (storeId: string) => `/api/fbr-di/${encodeURIComponent(storeId)}`;
const qs = (p: Record<string, string | number | undefined>) => {
  const e = Object.entries(p).filter(([, v]) => v !== undefined && v !== '');
  return e.length ? `?${e.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}` : '';
};

// ── Super Admin: Solvexo's own invoicing ──
export const apiGetPlatformFbr = () => client.get<never, ApiResponse<PlatformFbrSettings>>(`${admin}/settings`);
export const apiUpdatePlatformFbr = (body: FbrSettingsInput) => client.put<FbrSettingsInput, ApiResponse<PlatformFbrSettings>>(`${admin}/settings`, body);
export const apiTestPlatformFbr = () => client.post<never, ApiResponse<FbrTestResult>>(`${admin}/test`);
export const apiPlatformFbrProvinces = () => client.get<never, ApiResponse<string[]>>(`${admin}/provinces`);
export const apiListPlatformFbrInvoices = (p: { status?: string; page?: number }) => client.get<never, ApiResponse<FbrList>>(`${admin}/invoices${qs(p)}`);
export const apiRetryPlatformFbrInvoice = (id: string) => client.post<never, ApiResponse<FbrInvoiceRow>>(`${admin}/invoices/${encodeURIComponent(id)}/retry`);
export const apiResolvePlatformFbrInvoice = (id: string, body: FbrResolveInput) => client.post<FbrResolveInput, ApiResponse<FbrInvoiceRow>>(`${admin}/invoices/${encodeURIComponent(id)}/resolve`, body);

// ── Seller: the store's own invoicing ──
export const apiGetStoreFbr = (storeId: string) => client.get<never, ApiResponse<StoreFbrSettings>>(`${store(storeId)}/settings`);
export const apiUpdateStoreFbr = (storeId: string, body: FbrSettingsInput) => client.put<FbrSettingsInput, ApiResponse<StoreFbrSettings>>(`${store(storeId)}/settings`, body);
export const apiSetStoreFbrToken = (storeId: string, mode: FbrMode, token: string) => client.put<unknown, ApiResponse<StoreFbrSettings>>(`${store(storeId)}/token`, { mode, token });
export const apiDeleteStoreFbrToken = (storeId: string, mode: FbrMode) => client.delete<never, ApiResponse<StoreFbrSettings>>(`${store(storeId)}/token/${mode}`);
export const apiTestStoreFbr = (storeId: string) => client.post<never, ApiResponse<FbrTestResult>>(`${store(storeId)}/test`);
export const apiStoreFbrProvinces = (storeId: string) => client.get<never, ApiResponse<string[]>>(`${store(storeId)}/provinces`);
export const apiListStoreFbrInvoices = (storeId: string, p: { status?: string; page?: number }) => client.get<never, ApiResponse<FbrList>>(`${store(storeId)}/invoices${qs(p)}`);
export const apiRetryStoreFbrInvoice = (storeId: string, id: string) => client.post<never, ApiResponse<FbrInvoiceRow>>(`${store(storeId)}/invoices/${encodeURIComponent(id)}/retry`);
export const apiResolveStoreFbrInvoice = (storeId: string, id: string, body: FbrResolveInput) => client.post<FbrResolveInput, ApiResponse<FbrInvoiceRow>>(`${store(storeId)}/invoices/${encodeURIComponent(id)}/resolve`, body);
export const apiGetOrderFbr = (storeId: string, orderId: string) => client.get<never, ApiResponse<OrderFbrInfo | null>>(`${store(storeId)}/order/${encodeURIComponent(orderId)}`);
export const apiGetPlanInvoicesFbr = (storeId: string) => client.get<never, ApiResponse<PlanInvoiceFbr[]>>(`${store(storeId)}/plan-invoices`);
export const apiGetSolvexoInvoiceDoc = (storeId: string, invoiceId: string) => client.get<never, ApiResponse<SolvexoInvoiceDoc>>(`${store(storeId)}/solvexo-invoice/${encodeURIComponent(invoiceId)}`);
