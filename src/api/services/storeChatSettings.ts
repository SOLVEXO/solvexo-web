import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** How the store shows itself in the buyer chat. `null` = use the default (store logo / store name / standard line). */
export interface StoreChatSettings { avatarUrl: string | null; name: string | null; statusLine: string | null; greeting: string | null }
/** One weekday of the chat hours: 0 = Sunday ... 6 = Saturday, times "HH:mm" in the store time zone. */
export interface ChatHoursDay { day: number; open: boolean; from: string; to: string }
export interface QuickReply { title: string; text: string }
/** What the seller sees and edits (the public read only returns the four display fields above). */
export interface StoreChatSettingsFull extends StoreChatSettings {
  autoReplyEnabled: boolean; autoReplyText: string | null; autoReplyOnlyOutsideHours: boolean; hours: ChatHoursDay[]; quickReplies: QuickReply[];
}
export type StoreChatSettingsInput = {
  avatarUrl?: string; name?: string; statusLine?: string; greeting?: string;
  autoReplyEnabled?: boolean; autoReplyText?: string; autoReplyOnlyOutsideHours?: boolean; hours?: ChatHoursDay[]; quickReplies?: QuickReply[];
};

export const apiGetStoreChatSettings = (storeId: string) =>
  client.get<never, ApiResponse<StoreChatSettingsFull>>(`/api/store-chat-settings/${storeId}`);
export const apiSaveStoreChatSettings = (storeId: string, body: StoreChatSettingsInput) =>
  client.patch<never, ApiResponse<StoreChatSettingsFull>>(`/api/store-chat-settings/${storeId}`, body);
/** Public, no login: used by the storefront chat header. */
export const apiGetPublicStoreChatSettings = (storeId: string) =>
  client.get<never, ApiResponse<StoreChatSettings>>(`/api/public/store-chat-settings/${storeId}`);
