import client from '../client';
import { ENDPOINTS } from '../endpoints';

export type SupportTier = 'standard' | 'priority' | 'dedicated';
export type SupportCategory = 'orders' | 'payments' | 'store' | 'billing' | 'technical' | 'other';
export type SupportStatus = 'new' | 'read' | 'resolved';

export const SUPPORT_CATEGORY_LABEL: Record<SupportCategory, string> = {
  orders: 'Orders', payments: 'Payments & payouts', store: 'My store', billing: 'Plan & billing', technical: 'Something is not working', other: 'Other',
};

/** Badge text only: no response times are promised anywhere. */
export const SUPPORT_TIER_LABEL: Record<SupportTier, string> = {
  standard: 'Standard', priority: 'Priority', dedicated: 'Dedicated manager',
};

export interface SupportReply { message: string; sentAt: string; sentBy: string }

export interface SupportRequest {
  _id: string;
  subject: string;
  message: string;
  category: SupportCategory;
  status: SupportStatus;
  tier: SupportTier;
  createdAt: string;
  replies: SupportReply[];
}

export interface SupportRequestPage {
  items: SupportRequest[];
  total: number;
  page: number;
  limit: number;
  /** The store's CURRENT tier, from its plan. */
  tier: SupportTier;
}

export interface CreateSupportRequestPayload { category: SupportCategory; subject: string; message: string }

export const apiListSupportRequests = (storeId: string, params: { page?: number; limit?: number } = {}) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return client.get<never, SupportRequestPage>(`${ENDPOINTS.SUPPORT.REQUESTS(storeId)}${qs ? `?${qs}` : ''}`);
};

export const apiCreateSupportRequest = (storeId: string, payload: CreateSupportRequestPayload) =>
  client.post<never, { success: boolean; data: SupportRequest }>(ENDPOINTS.SUPPORT.REQUESTS(storeId), payload);
