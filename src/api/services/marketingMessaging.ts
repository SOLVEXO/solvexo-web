import client from '../client';

/** WhatsApp / SMS marketing. Seller calls need the store id in the path; customer calls use the storefront token. */

export type Channel = 'whatsapp' | 'sms';

export interface ConsentRow { _id: string; channel: Channel; contactKey: string; name: string | null; status: 'opted_in' | 'opted_out'; optInSource: string | null; optedInAt: string | null; optedOutAt: string | null; optOutSource: string | null }
export interface ConsentList { items: ConsentRow[]; total: number; page: number; limit: number; optedIn: number; optedOut: number }

export interface WaTemplate { _id: string; name: string; language: string; category: string; status: string; bodyText: string; paramCount: number; rejectedReason: string | null; lastSyncedAt: string | null }

export interface Campaign {
  _id: string; channel: Channel; name: string; segmentId: string | null; templateId: string | null; params: string[]; smsText: string | null;
  status: 'draft' | 'sending' | 'completed' | 'canceled' | 'failed'; dailyLimit: number | null; startedAt: string | null; completedAt: string | null; createdAt: string;
}
export interface CampaignStats {
  campaign: Campaign; queued: number; sent: number; delivered: number; read: number; failed: number; skipped: number; total: number;
  billing: { billedUnit: string; note: string; deliveredMessages?: number; partsPerMessage?: number; encoding?: string; estimatedParts?: number };
}
export interface MessageRow { _id: string; contactKey: string; customerName: string | null; status: string; error: string | null; sentAt: string | null; deliveredAt: string | null; readAt: string | null }
export interface Paged<T> { items: T[]; total: number; page: number; limit: number }

export interface SmsHttpConfig { url: string; method: 'GET' | 'POST'; contentType: 'json' | 'form'; headers: Record<string, string>; body: string; successMatch: string | null; messageIdPath: string | null }
export interface SmsGateway {
  configured: boolean; enabled: boolean; verified: boolean; hasSecret?: boolean; hasWebhookSecret?: boolean; presetKey?: string | null;
  senderId?: string; dailyLimit?: number; http?: SmsHttpConfig | null; lastError?: string | null;
  presets: { key: string; label: string; verified: false; note: string }[];
}

const b = (storeId: string) => `/api/messaging/${storeId}`;

export const apiListConsents = (storeId: string, params: { channel: Channel; status?: string; page?: number; search?: string }) => client.get(`${b(storeId)}/consents`, { params: { limit: 20, ...params } }) as Promise<ConsentList>;
export const apiOptInContact = (storeId: string, body: { channel: Channel; phone: string; name?: string }) => client.post(`${b(storeId)}/consents/opt-in`, body) as Promise<{ contactKey: string }>;
export const apiOptOutContact = (storeId: string, body: { channel: Channel; phone: string }) => client.post(`${b(storeId)}/consents/opt-out`, body) as Promise<{ contactKey: string | null }>;
export const apiImportConsents = (storeId: string, body: { channel: Channel; rows: { phone: string; name?: string }[]; attested: boolean }) => client.post(`${b(storeId)}/consents/import`, body) as Promise<{ added: number; invalid: number; keptOptedOut: number }>;

export const apiListTemplates = (storeId: string) => client.get(`${b(storeId)}/templates`) as Promise<WaTemplate[]>;
export const apiSyncTemplates = (storeId: string) => client.post(`${b(storeId)}/templates/sync`) as Promise<{ synced: number }>;
export const apiSubmitTemplate = (storeId: string, body: { name: string; language: string; bodyText: string; examples: string[] }) => client.post(`${b(storeId)}/templates`, body) as Promise<WaTemplate>;
export const apiDeleteTemplate = (storeId: string, id: string) => client.delete(`${b(storeId)}/templates/${id}`) as Promise<{ success: boolean }>;

export const apiListCampaigns = (storeId: string, page = 1) => client.get(`${b(storeId)}/campaigns`, { params: { page, limit: 20 } }) as Promise<Paged<Campaign>>;
export const apiCreateCampaign = (storeId: string, body: Partial<Campaign> & { channel: Channel; name: string }) => client.post(`${b(storeId)}/campaigns`, body) as Promise<Campaign>;
export const apiDeleteCampaign = (storeId: string, id: string) => client.delete(`${b(storeId)}/campaigns/${id}`) as Promise<{ success: boolean }>;
export const apiLaunchCampaign = (storeId: string, id: string) => client.post(`${b(storeId)}/campaigns/${id}/launch`) as Promise<CampaignStats>;
export const apiCancelCampaign = (storeId: string, id: string) => client.post(`${b(storeId)}/campaigns/${id}/cancel`) as Promise<CampaignStats>;
export const apiCampaignStats = (storeId: string, id: string) => client.get(`${b(storeId)}/campaigns/${id}/stats`) as Promise<CampaignStats>;
export const apiCampaignMessages = (storeId: string, id: string, params: { page?: number; status?: string }) => client.get(`${b(storeId)}/campaigns/${id}/messages`, { params: { limit: 20, ...params } }) as Promise<Paged<MessageRow>>;

export const apiGetSmsGateway = (storeId: string) => client.get(`${b(storeId)}/sms-gateway`) as Promise<SmsGateway>;
export const apiSaveSmsGateway = (storeId: string, body: { presetKey?: string | null; senderId: string; dailyLimit: number; secret?: string; http: SmsHttpConfig }) => client.put(`${b(storeId)}/sms-gateway`, body) as Promise<SmsGateway>;
export const apiTestSmsGateway = (storeId: string, phone: string) => client.post(`${b(storeId)}/sms-gateway/test`, { phone }) as Promise<{ success: boolean }>;
export const apiEnableSmsGateway = (storeId: string, enabled: boolean) => client.post(`${b(storeId)}/sms-gateway/enable`, { enabled }) as Promise<SmsGateway>;
export const apiSmsWebhookSecret = (storeId: string) => client.post(`${b(storeId)}/sms-gateway/webhook-secret`) as Promise<{ secret: string; inboundPath: string; deliveryPath: string }>;

// ── customer (storefront) ──
export interface MyMessagingPrefs { available: { whatsapp: boolean; sms: boolean }; consents: { channel: Channel; status: 'opted_in' | 'opted_out'; phoneEnding: string; optedInAt: string | null; optedOutAt: string | null }[] }
export const apiGetMyMessagingPrefs = (storeId: string) => client.get('/api/messaging/storefront/me', { params: { storeId } }) as Promise<MyMessagingPrefs>;
export const apiMessagingOptIn = (storeId: string, body: { channel: Channel; phone: string; agreed: boolean }) => client.post('/api/messaging/storefront/opt-in', { storeId, ...body }) as Promise<MyMessagingPrefs>;
export const apiMessagingOptOut = (storeId: string, channel: Channel) => client.post('/api/messaging/storefront/opt-out', { storeId, channel }) as Promise<MyMessagingPrefs>;
