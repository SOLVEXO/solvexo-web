import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type EmailCampaignAudience = 'all' | 'buyers' | 'abandoned';
export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface EmailCampaign {
  _id:             string;
  storeId:         string;
  name:            string;
  subject:         string;
  message:         string;
  audience:        EmailCampaignAudience;
  status:          EmailCampaignStatus;
  scheduledAt:     string | null;
  sentAt:          string | null;
  recipientCount:  number;
  sentCount:       number;
  failedCount:     number;
  openCount:       number;
  clickCount:      number;
  createdAt:       string;
}

export interface CreateEmailCampaignPayload {
  name:     string;
  subject:  string;
  message:  string;
  audience: EmailCampaignAudience;
}

export type UpdateEmailCampaignPayload = Partial<CreateEmailCampaignPayload>;

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface PaginatedEmailCampaigns {
  campaigns: EmailCampaign[];
  total:     number;
  page:      number;
  limit:     number;
}

/** POST /api/email-campaigns/:storeId */
export function apiCreateEmailCampaign(storeId: string, payload: CreateEmailCampaignPayload) {
  return client.post<never, ApiResponse<EmailCampaign>>(ENDPOINTS.EMAIL_CAMPAIGNS.CREATE(storeId), payload);
}

/** GET /api/email-campaigns/:storeId */
export function apiListEmailCampaigns(storeId: string, params?: { page?: number; limit?: number; status?: EmailCampaignStatus }) {
  return client.get<never, ApiResponse<PaginatedEmailCampaigns>>(ENDPOINTS.EMAIL_CAMPAIGNS.LIST(storeId), { params });
}

/** GET /api/email-campaigns/:storeId/audience-preview?audience=... */
export function apiPreviewEmailCampaignAudience(storeId: string, audience: EmailCampaignAudience) {
  return client.get<never, ApiResponse<{ recipientCount: number }>>(ENDPOINTS.EMAIL_CAMPAIGNS.AUDIENCE_PREVIEW(storeId), { params: { audience } });
}

/** PATCH /api/email-campaigns/:storeId/:campaignId — draft only */
export function apiUpdateEmailCampaign(storeId: string, campaignId: string, payload: UpdateEmailCampaignPayload) {
  return client.patch<never, ApiResponse<EmailCampaign>>(ENDPOINTS.EMAIL_CAMPAIGNS.UPDATE(storeId, campaignId), payload);
}

/** DELETE /api/email-campaigns/:storeId/:campaignId — draft/scheduled only */
export function apiDeleteEmailCampaign(storeId: string, campaignId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.EMAIL_CAMPAIGNS.DELETE(storeId, campaignId));
}

/** POST /api/email-campaigns/:storeId/:campaignId/send */
export function apiSendEmailCampaignNow(storeId: string, campaignId: string) {
  return client.post<never, ApiResponse<EmailCampaign>>(ENDPOINTS.EMAIL_CAMPAIGNS.SEND(storeId, campaignId));
}

/** POST /api/email-campaigns/:storeId/:campaignId/schedule */
export function apiScheduleEmailCampaign(storeId: string, campaignId: string, scheduledAt: string) {
  return client.post<never, ApiResponse<EmailCampaign>>(ENDPOINTS.EMAIL_CAMPAIGNS.SCHEDULE(storeId, campaignId), { scheduledAt });
}
