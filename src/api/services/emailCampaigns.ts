import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type EmailCampaignAudience = 'all' | 'buyers' | 'abandoned';
export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

/** Optional filters ANDed on top of the audience (all optional). */
export interface EmailCampaignSegment {
  minOrders?:            number;
  minTotalSpent?:        number;
  orderedWithinDays?:    number;
  notOrderedWithinDays?: number;
  tags?:                 string[];
}

export interface EmailCampaign {
  _id:             string;
  storeId:         string;
  name:            string;
  subject:         string;
  message:         string;
  audience:        EmailCampaignAudience;
  segment?:        EmailCampaignSegment | null;
  /** Drag-and-drop editor design (see marketing/emailDesign.ts) — `message` is its rendered HTML. */
  design?:         object | null;
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
  segment?: EmailCampaignSegment | null;
  design?:  object | null;
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

/** POST /api/email-campaigns/:storeId/audience-preview — with segment filters */
export function apiPreviewEmailCampaignSegment(storeId: string, audience: EmailCampaignAudience, segment?: EmailCampaignSegment | null) {
  return client.post<never, ApiResponse<{ recipientCount: number }>>(ENDPOINTS.EMAIL_CAMPAIGNS.AUDIENCE_PREVIEW(storeId), { audience, segment: segment ?? null });
}

/** POST /api/email-campaigns/:storeId/:campaignId/test — sends "[Test] ..." to `email`, or to the seller's own account email */
export function apiSendEmailCampaignTest(storeId: string, campaignId: string, email?: string) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.EMAIL_CAMPAIGNS.TEST(storeId, campaignId), email ? { email } : {});
}

/** POST /api/email-campaigns/:storeId/:campaignId/schedule */
export function apiScheduleEmailCampaign(storeId: string, campaignId: string, scheduledAt: string) {
  return client.post<never, ApiResponse<EmailCampaign>>(ENDPOINTS.EMAIL_CAMPAIGNS.SCHEDULE(storeId, campaignId), { scheduledAt });
}
