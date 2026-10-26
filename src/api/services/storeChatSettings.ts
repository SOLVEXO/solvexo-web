import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** How the store shows itself in the buyer chat. `null` = use the default (store logo / store name / standard line). */
export interface StoreChatSettings { avatarUrl: string | null; name: string | null; statusLine: string | null; greeting: string | null }
export type StoreChatSettingsInput = { avatarUrl?: string; name?: string; statusLine?: string; greeting?: string };

export const apiGetStoreChatSettings = (storeId: string) =>
  client.get<never, ApiResponse<StoreChatSettings>>(`/api/store-chat-settings/${storeId}`);
export const apiSaveStoreChatSettings = (storeId: string, body: StoreChatSettingsInput) =>
  client.patch<never, ApiResponse<StoreChatSettings>>(`/api/store-chat-settings/${storeId}`, body);
/** Public, no login: used by the storefront chat header. */
export const apiGetPublicStoreChatSettings = (storeId: string) =>
  client.get<never, ApiResponse<StoreChatSettings>>(`/api/public/store-chat-settings/${storeId}`);
