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
  promotions: boolean;
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

export interface PlacementLimits {
  homepageHero: number;
  marketplaceHero: number;
  educationHero: number;
  categoryHero: number;
  storeHero: number;
  storeFeaturedProducts: number;
}

export interface FestivalPricingOverride {
  name: string;
  startAt: string;
  endAt: string;
  rate: number;
}

export interface PlacementRateCard {
  hourly?: number;
  daily?: number;
  weekly?: number;
  monthly?: number;
  weekendMultiplier?: number;
  peakMultiplier?: number;
  festivalOverrides?: FestivalPricingOverride[];
}

export type PromotionPricing = Partial<Record<'homepageHero' | 'marketplaceHero' | 'educationHero' | 'categoryHero', PlacementRateCard>>;

export interface PlatformConfig {
  _id: string;
  maintenanceMode: boolean;
  featureFlags: FeatureFlags;
  aiConfig: AiConfig;
  emailConfig: EmailConfig;
  placementLimits: PlacementLimits;
  promotionPricing: PromotionPricing;
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

export function apiUpdatePlacementLimits(payload: Partial<PlacementLimits>) {
  return client.put<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.UPDATE_PLACEMENT_LIMITS, payload);
}

export function apiUpdatePromotionPricing(payload: PromotionPricing) {
  return client.put<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.UPDATE_PROMOTION_PRICING, payload);
}
