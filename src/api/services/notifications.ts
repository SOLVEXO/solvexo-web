import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface NotificationItem {
  _id:           string;
  recipientId:   string;
  recipientRole: 'user' | 'seller';
  storeId:       string | null;
  type:          string;
  title:         string;
  body:          string;
  data:          Record<string, any> | null;
  isRead:        boolean;
  readAt:        string | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface ListNotificationsQuery {
  page?:       number;
  limit?:      number;
  unreadOnly?: boolean;
  type?:       string;
  /** Scope to one store's own notifications — omit for the account-wide inbox across every store. */
  storeId?:    string;
}

export interface ListNotificationsData {
  items:       NotificationItem[];
  total:       number;
  unreadCount: number;
  page:        number;
  limit:       number;
}

export interface NotificationPreferenceFlags {
  orders:        boolean;
  messages:      boolean;
  promotions:    boolean;
  loyalty:       boolean;
  subscriptions: boolean;
}

export interface NotificationPreferenceData {
  _id:          string;
  userId:       string;
  role:         'user' | 'seller';
  prefs:        NotificationPreferenceFlags;
  pushEnabled:  boolean;
  emailEnabled: boolean;
  createdAt:    string;
  updatedAt:    string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
}

export function apiListNotifications(query?: ListNotificationsQuery) {
  const params: Record<string, string> = {};
  if (query?.page) params.page = String(query.page);
  if (query?.limit) params.limit = String(query.limit);
  if (query?.unreadOnly !== undefined) params.unreadOnly = String(query.unreadOnly);
  if (query?.type) params.type = query.type;
  if (query?.storeId) params.storeId = query.storeId;

  return client.get<never, ApiResponse<ListNotificationsData>>(ENDPOINTS.NOTIFICATIONS.LIST, { params });
}

export function apiGetUnreadCount(storeId?: string) {
  const params: Record<string, string> = {};
  if (storeId) params.storeId = storeId;
  return client.get<never, ApiResponse<{ unreadCount: number }>>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, { params });
}

export function apiGetPreferences() {
  return client.get<never, ApiResponse<NotificationPreferenceData>>(ENDPOINTS.NOTIFICATIONS.PREFERENCES);
}

export function apiUpdatePreferences(dto: Partial<NotificationPreferenceFlags> & { pushEnabled?: boolean; emailEnabled?: boolean }) {
  return client.patch<never, ApiResponse<NotificationPreferenceData>>(ENDPOINTS.NOTIFICATIONS.UPDATE_PREFERENCES, dto);
}

export function apiRegisterDeviceToken(fcmToken: string, platform: string) {
  return client.post<never, ApiResponse<{ message: string }>>(ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE_TOKEN, { fcmToken, platform });
}

export function apiRemoveDeviceToken(fcmToken: string) {
  return client.delete<never, ApiResponse<{ message: string }>>(ENDPOINTS.NOTIFICATIONS.REMOVE_DEVICE_TOKEN, { data: { fcmToken } });
}

export function apiMarkAllNotificationsRead(storeId?: string) {
  const params: Record<string, string> = {};
  if (storeId) params.storeId = storeId;
  return client.patch<never, ApiResponse<{ message: string }>>(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, undefined, { params });
}

export function apiMarkNotificationRead(id: string) {
  return client.patch<never, ApiResponse<NotificationItem>>(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
}

export function apiDeleteNotification(id: string) {
  return client.delete<never, ApiResponse<{ message: string }>>(ENDPOINTS.NOTIFICATIONS.REMOVE(id));
}
