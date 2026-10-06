import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type NewsletterSource = 'platform_footer' | 'store_footer' | 'store_section' | 'checkout';

export interface SubscribeNewsletterOptions {
  /** The store whose subscriber list to join — omit for Solvexo's own list. */
  storeId?: string;
  source?: NewsletterSource;
}

/** Public — no auth required (a logged-in buyer's token, if any, just links
 *  the subscription to their account). */
export function apiSubscribeNewsletter(email: string, options: SubscribeNewsletterOptions = {}) {
  // `data.pendingConfirmation` = the store uses double opt-in; show `message` ("check your inbox").
  return client.post<never, ApiResponse<{ pendingConfirmation?: boolean } | null>>(ENDPOINTS.NEWSLETTER.SUBSCRIBE, { email, ...options });
}

/** Logged-in buyer opts in to one store's marketing emails with the email
 *  on their account — the checkout "Email me with news and offers" box. */
export function apiSubscribeMeToStore(storeId: string) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.NEWSLETTER.SUBSCRIBE_ME, { storeId });
}

// ── Subscriber lists (seller: a store's own list · admin: Solvexo's list) ──

export type SubscriberStatusFilter = 'active' | 'unsubscribed' | 'pending' | 'all';

export interface Subscriber {
  _id:            string;
  email:          string;
  name:           string | null;
  /** 'pending' = double opt-in sign-up that hasn't clicked the confirm link yet. */
  status:         'subscribed' | 'unsubscribed' | 'pending';
  source:         string;
  consentAt:      string | null;
  unsubscribedAt: string | null;
  createdAt:      string | null;
}

export interface SubscriberListResponse {
  items:      Subscriber[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary:    { active: number; unsubscribed: number; pending: number; newLast30Days: number; bySource: Record<string, number> };
}

export interface SubscriberListParams {
  status?: SubscriberStatusFilter;
  search?: string;
  source?: string;
  page?:   number;
  limit?:  number;
}

export function apiListStoreSubscribers(storeId: string, params: SubscriberListParams = {}) {
  return client.get<never, ApiResponse<SubscriberListResponse>>(ENDPOINTS.NEWSLETTER.STORE_SUBSCRIBERS(storeId), { params });
}

/** Returns the CSV as a Blob — save it with an <a download>. */
export function apiExportStoreSubscribers(storeId: string, params: Pick<SubscriberListParams, 'status' | 'search' | 'source'> = {}) {
  return client.get<never, Blob>(ENDPOINTS.NEWSLETTER.STORE_SUBSCRIBERS_EXPORT(storeId), { params, responseType: 'blob' });
}

export function apiAddStoreSubscriber(storeId: string, email: string) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.NEWSLETTER.STORE_SUBSCRIBERS(storeId), { email });
}

/** Unsubscribe (`false`). Re-subscribing someone who opted out is rejected by the API. */
export function apiSetStoreSubscriberStatus(storeId: string, subscriberId: string, subscribed: boolean) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.NEWSLETTER.STORE_SUBSCRIBER(storeId, subscriberId), { subscribed });
}

export function apiDeleteStoreSubscriber(storeId: string, subscriberId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.NEWSLETTER.STORE_SUBSCRIBER(storeId, subscriberId));
}

export function apiListPlatformSubscribers(params: SubscriberListParams = {}) {
  return client.get<never, ApiResponse<SubscriberListResponse>>(ENDPOINTS.NEWSLETTER.ADMIN_SUBSCRIBERS, { params });
}

export function apiExportPlatformSubscribers(params: Pick<SubscriberListParams, 'status' | 'search' | 'source'> = {}) {
  return client.get<never, Blob>(ENDPOINTS.NEWSLETTER.ADMIN_SUBSCRIBERS_EXPORT, { params, responseType: 'blob' });
}

export function apiSetPlatformSubscriberStatus(subscriberId: string, subscribed: boolean) {
  return client.patch<never, ApiResponse<null>>(ENDPOINTS.NEWSLETTER.ADMIN_SUBSCRIBER(subscriberId), { subscribed });
}

export function apiDeletePlatformSubscriber(subscriberId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.NEWSLETTER.ADMIN_SUBSCRIBER(subscriberId));
}

export interface NewsletterBroadcast {
  _id:            string;
  subject:        string;
  message:        string;
  status:         'sending' | 'sent' | 'failed';
  recipientCount: number;
  sentCount:      number;
  failedCount:    number;
  createdAt:      string;
  completedAt:    string | null;
}

export function apiListBroadcasts() {
  return client.get<never, ApiResponse<NewsletterBroadcast[]>>(ENDPOINTS.NEWSLETTER.ADMIN_BROADCASTS);
}

/** Plain-text `message` ({{storeName}}/{{customerName}} merge tags). With
 *  `testEmail`, sends a "[Test]" copy to that address only. */
export function apiSendBroadcast(subject: string, message: string, testEmail?: string) {
  return client.post<never, ApiResponse<NewsletterBroadcast | null>>(ENDPOINTS.NEWSLETTER.ADMIN_BROADCASTS, { subject, message, ...(testEmail ? { testEmail } : {}) });
}
