import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface FeatureFlags {
  aiStudio: boolean;
  marketplace: boolean;
  digitalUploads: boolean;
  affiliateProgram: boolean;
  giftCards: boolean;
  posMode: boolean;
  storeBuilder: boolean;
  bulkProductImport: boolean;
}

export interface AiConfig {
  monthlyCreditLimit: number;
  aiModel: string;
}

export interface EmailConfig {
  fromName: string;
  fromEmail: string | null;
  replyToEmail: string | null;
  provider: string;
}

export interface PlatformConfig {
  _id: string;
  maintenanceMode: boolean;
  featureFlags: FeatureFlags;
  aiConfig: AiConfig;
  emailConfig: EmailConfig;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetPlatformConfig() {
  return client.get<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.GET);
}

export function apiUpdateFeatureFlags(payload: Partial<FeatureFlags>) {
  return client.put<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.UPDATE_FEATURE_FLAGS, payload);
}

export function apiUpdateAiConfig(payload: Partial<AiConfig>) {
  return client.put<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.UPDATE_AI, payload);
}

export function apiUpdateEmailConfig(payload: Partial<EmailConfig>) {
  return client.put<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.UPDATE_EMAIL, payload);
}

export function apiUpdateMaintenanceMode(maintenanceMode: boolean) {
  return client.patch<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.UPDATE_MAINTENANCE, { maintenanceMode });
}
