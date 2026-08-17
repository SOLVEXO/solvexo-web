import client from '../../../client';
import { ENDPOINTS } from '../../../endpoints';

// ── Shared response envelope ─────────────────────────────────────────────────
// Mirrors adminFinance.ts — the backend's SeoResponseInterceptor wraps every
// admin SEO controller's return value in `{ success: true, data }` at the
// HTTP boundary (see seo/seo-response.interceptor.ts).

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ── Platform SEO settings ────────────────────────────────────────────────────

export const SEO_RULE_CODES = [
  'title_length', 'description_length', 'missing_alt_text', 'thin_content',
  'duplicate_meta', 'missing_canonical', 'broken_internal_link', 'missing_schema',
] as const;
export type SeoRuleCode = (typeof SEO_RULE_CODES)[number];
export type SeoRuleSeverity = 'info' | 'warning' | 'error';

export interface SeoMetaTemplate {
  key: string;
  titleTemplate: string;
  descriptionTemplate?: string | null;
}

export interface SeoRuleConfig {
  code: SeoRuleCode | string;
  enabled: boolean;
  thresholds: Record<string, number>;
  severity: SeoRuleSeverity | string;
}

export interface PlatformSeoSettingsData {
  _id: string;
  key: string;
  homepageTitle: string | null;
  homepageDescription: string | null;
  marketplaceTitle: string | null;
  marketplaceDescription: string | null;
  metaTemplates: SeoMetaTemplate[];
  robotsTxtBody: string;
  organizationSchema: Record<string, unknown> | null;
  websiteSchema: Record<string, unknown> | null;
  searchActionSchema: Record<string, unknown> | null;
  aiSeoEnabled: boolean;
  aiSeoConfig: Record<string, unknown>;
  rules: SeoRuleConfig[];
  updatedByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePlatformSeoSettingsPayload {
  homepageTitle?: string;
  homepageDescription?: string;
  marketplaceTitle?: string;
  marketplaceDescription?: string;
  metaTemplates?: SeoMetaTemplate[];
  robotsTxtBody?: string;
  organizationSchema?: Record<string, unknown>;
  websiteSchema?: Record<string, unknown>;
  searchActionSchema?: Record<string, unknown>;
  aiSeoEnabled?: boolean;
  aiSeoConfig?: Record<string, unknown>;
  rules?: Array<{ code: SeoRuleCode | string; enabled?: boolean; thresholds?: Record<string, number>; severity?: SeoRuleSeverity | string }>;
}

export interface UpsertSeoRulePayload {
  code: SeoRuleCode | string;
  enabled?: boolean;
  thresholds?: Record<string, number>;
  severity?: SeoRuleSeverity | string;
}

export interface DeleteResultData { success: boolean }

export function apiGetSeoSettings() {
  return client.get<never, ApiResponse<PlatformSeoSettingsData>>(ENDPOINTS.SEO.ADMIN.GET_SETTINGS);
}

export function apiUpdateSeoSettings(payload: UpdatePlatformSeoSettingsPayload) {
  return client.patch<never, ApiResponse<PlatformSeoSettingsData>>(ENDPOINTS.SEO.ADMIN.UPDATE_SETTINGS, payload);
}

// ── SEO rules ─────────────────────────────────────────────────────────────────

export function apiListSeoRules() {
  return client.get<never, ApiResponse<SeoRuleConfig[]>>(ENDPOINTS.SEO.ADMIN.RULES.LIST);
}

export function apiCreateSeoRule(payload: UpsertSeoRulePayload) {
  return client.post<never, ApiResponse<SeoRuleConfig>>(ENDPOINTS.SEO.ADMIN.RULES.CREATE, payload);
}

export function apiUpdateSeoRule(code: string, payload: Omit<UpsertSeoRulePayload, 'code'>) {
  return client.patch<never, ApiResponse<SeoRuleConfig>>(ENDPOINTS.SEO.ADMIN.RULES.UPDATE(code), payload);
}

export function apiDeleteSeoRule(code: string) {
  return client.delete<never, ApiResponse<DeleteResultData>>(ENDPOINTS.SEO.ADMIN.RULES.DELETE(code));
}
