import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type CustomerEmailGroup = 'orders' | 'returns' | 'invoices';

export interface CustomerEmailSetting {
  key: string;
  /** Where this email is listed on the Customer emails page. */
  group: CustomerEmailGroup;
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
  /** Translated subject/body per email and language; absent/empty = every email goes out in English. */
  eventTranslations?: EventTranslations;
  /** Built-in text a language falls back to when the seller has not translated: locale -> email key -> text. */
  defaultTranslations?: Record<string, Record<string, { subject: string; body: string }>>;
}

export interface UpdateStoreNotificationSettingsPayload {
  senderName?: string | null;
  replyToEmail?: string | null;
  staffOrderEmails?: string[];
  accentColor?: string | null;
  footerText?: string | null;
  showLogo?: boolean;
  events?: Record<string, { enabled?: boolean; subject?: string | null; body?: string | null; reset?: boolean }>;
  /** Per email, per language change: set subject/body (null or '' clears a field), or `reset: true` removes the language. 'en' is rejected. */
  eventTranslations?: Record<string, Record<string, { subject?: string | null; body?: string | null; reset?: true }>>;
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
export function apiPreviewCustomerEmail(storeId: string, payload: { event: string; subject?: string | null; body?: string | null; locale?: string }) {
  return client.post<never, ApiResponse<CustomerEmailPreview>>(ENDPOINTS.STORE_NOTIFICATIONS.PREVIEW(storeId), payload);
}

/** POST /api/store-notifications/:storeId/test-email — mails the sample email (unsaved draft supported) to the person who clicked. */
export function apiSendTestCustomerEmail(storeId: string, payload: { event: string; subject?: string | null; body?: string | null; locale?: string }) {
  return client.post<never, { success: boolean; message: string; data: { to: string } }>(ENDPOINTS.STORE_NOTIFICATIONS.TEST_EMAIL(storeId), payload);
}

/** Per-language subject/body of each customer email, keyed event -> locale (plain text + {{tags}}, same rules as English). */
export type EventTranslations = Record<string, Record<string, { subject: string; body: string }>>;
