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
  storefrontBlog: boolean;
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

export interface ManualPaymentConfig {
  enabled: boolean;
  bankName: string | null;
  accountTitle: string | null;
  accountNumber: string | null;
  iban: string | null;
  jazzcashNumber: string | null;
  easypaisaNumber: string | null;
  instructions: string | null;
  usdToPkrRate: number;
}

export interface FxConfig {
  autoRefreshEnabled: boolean;
  refreshIntervalHours: number;
  staleRateAlertThresholdHours: number;
  sanityBandMinPKR: number;
  sanityBandMaxPKR: number;
  abnormalJumpAlertPercent: number;
}

export interface PlatformConfig {
  _id: string;
  maintenanceMode: boolean;
  featureFlags: FeatureFlags;
  aiConfig: AiConfig;
  emailConfig: EmailConfig;
  placementLimits: PlacementLimits;
  promotionPricing: PromotionPricing;
  manualPaymentConfig: ManualPaymentConfig;
  fxConfig: FxConfig;
  createdAt: string;
  updatedAt: string;
}

export interface EnabledCurrency {
  code: string;
  sanityBandMin: number | null;
  sanityBandMax: number | null;
  /** null = never tried yet (the normal state for almost every currency);
   *  false = Stripe itself rejected an online card charge in this currency
   *  (learned from a real Stripe error, not a guess) — "Pay Online" is no
   *  longer offered for it at checkout; true = USD only (the fixed pivot). */
  stripeCardPaymentSupported: boolean | null;
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

export function apiUpdateManualPaymentConfig(payload: Partial<ManualPaymentConfig>) {
  return client.put<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.UPDATE_MANUAL_PAYMENT, payload);
}

export function apiUpdateFxConfig(payload: Partial<FxConfig>) {
  return client.put<never, ApiResponse<PlatformConfig>>(ENDPOINTS.PLATFORM_CONFIG.UPDATE_FX, payload);
}

// ── Dynamic, admin-managed currency list ("Markets") ──────────────────────────
export function apiGetAdminCurrencies() {
  return client.get<never, ApiResponse<EnabledCurrency[]>>(ENDPOINTS.PLATFORM_CONFIG.CURRENCIES);
}

export function apiAddCurrency(code: string, sanityBandMin: number, sanityBandMax: number) {
  return client.post<never, ApiResponse<FxConfig>>(ENDPOINTS.PLATFORM_CONFIG.CURRENCIES, { code, sanityBandMin, sanityBandMax });
}

export function apiUpdateCurrencyBand(code: string, sanityBandMin: number, sanityBandMax: number) {
  return client.patch<never, ApiResponse<FxConfig>>(ENDPOINTS.PLATFORM_CONFIG.CURRENCY_BAND(code), { sanityBandMin, sanityBandMax });
}

export function apiRemoveCurrency(code: string) {
  return client.delete<never, ApiResponse<FxConfig | undefined>>(ENDPOINTS.PLATFORM_CONFIG.CURRENCY_BAND(code));
}

// Enables every real ISO-4217 currency the platform's own metadata table
// knows about that isn't already enabled — see AdminConfigService.enableAllCurrencies.
export function apiEnableAllCurrencies() {
  return client.post<never, ApiResponse<{ added: string[]; alreadyEnabledCount: number }>>(ENDPOINTS.PLATFORM_CONFIG.CURRENCIES_ENABLE_ALL);
}

// Clears a currency's learned "Stripe rejected this" flag back to unknown —
// see AdminConfigService.retryStripeCardPaymentSupport.
export function apiRetryStripeCardPaymentSupport(code: string) {
  return client.post<never, ApiResponse<void>>(ENDPOINTS.PLATFORM_CONFIG.CURRENCY_RETRY_STRIPE(code));
}
