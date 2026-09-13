import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface TrackingPixelSettings {
  facebookPixelId:          string | null;
  googleAnalyticsId:        string | null;
  googleAdsId:               string | null;
  googleAdsConversionLabel: string | null;
  tiktokPixelId:             string | null;
}

export type UpdateTrackingPixelSettingsPayload = Partial<Record<keyof TrackingPixelSettings, string>>;

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** GET /api/tracking-pixels/:storeId — seller-facing, returns current settings. */
export function apiGetTrackingPixelSettings(storeId: string) {
  return client.get<never, ApiResponse<TrackingPixelSettings>>(ENDPOINTS.TRACKING_PIXELS.SETTINGS(storeId));
}

/** PATCH /api/tracking-pixels/:storeId — seller-facing, send '' to clear a field. */
export function apiUpdateTrackingPixelSettings(storeId: string, payload: UpdateTrackingPixelSettingsPayload) {
  return client.patch<never, ApiResponse<TrackingPixelSettings>>(ENDPOINTS.TRACKING_PIXELS.SETTINGS(storeId), payload);
}

/** GET /api/tracking-pixels/:storeId/public — unauthenticated, used by the storefront. */
export function apiGetPublicTrackingPixelSettings(storeId: string) {
  return client.get<never, ApiResponse<TrackingPixelSettings>>(ENDPOINTS.TRACKING_PIXELS.PUBLIC(storeId));
}
