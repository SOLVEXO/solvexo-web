import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface CustomerEmailSetting {
  key: string;
  label: string;
  description: string;
  /** Merge tags this email can use, e.g. "orderNumber" → {{orderNumber}}. */
  variables: string[];
  resendable: boolean;
  /** false = always sent (cannot be switched off). */
  canDisable: boolean;
  defaultSubject: string;
  defaultBody: string;
  enabled: boolean;
  /** The seller's own text; null = the built-in default. */
  subject: string | null;
  body: string | null;
  customized: boolean;
}

export interface StoreNotificationSettings {
  senderName: string | null;
  replyToEmail: string | null;
  staffOrderEmails: string[];
  accentColor: string | null;
  footerText: string | null;
  showLogo: boolean;
  storeLogo: string | null;
  /** Set when the last few customer emails could not be delivered. */
  deliveryWarning: { consecutiveFailures: number; lastFailureAt: string | null } | null;
  storeName: string | null;
  storeContactEmail: string | null;
  events: CustomerEmailSetting[];
}

export interface UpdateStoreNotificationSettingsPayload {
  senderName?: string | null;
  replyToEmail?: string | null;
  staffOrderEmails?: string[];
  accentColor?: string | null;
  footerText?: string | null;
  showLogo?: boolean;
  events?: Record<string, { enabled?: boolean; subject?: string | null; body?: string | null; reset?: boolean }>;
}

export interface CustomerEmailPreview {
  subject: string;
  html: string;
  fromName: string;
  replyTo: string | null;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** GET /api/store-notifications/:storeId — the store's customer emails (switch, text, sender, reply-to). */
export function apiGetStoreNotificationSettings(storeId: string) {
  return client.get<never, ApiResponse<StoreNotificationSettings>>(ENDPOINTS.STORE_NOTIFICATIONS.SETTINGS(storeId));
}

/** PATCH /api/store-notifications/:storeId — returns the full, updated settings. */
export function apiUpdateStoreNotificationSettings(storeId: string, payload: UpdateStoreNotificationSettingsPayload) {
  return client.patch<never, ApiResponse<StoreNotificationSettings>>(ENDPOINTS.STORE_NOTIFICATIONS.SETTINGS(storeId), payload);
}

/** POST /api/store-notifications/:storeId/preview — renders one email with sample values (unsaved draft supported). */
export function apiPreviewCustomerEmail(storeId: string, payload: { event: string; subject?: string | null; body?: string | null }) {
  return client.post<never, ApiResponse<CustomerEmailPreview>>(ENDPOINTS.STORE_NOTIFICATIONS.PREVIEW(storeId), payload);
}
