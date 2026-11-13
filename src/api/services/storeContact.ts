import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type ContactMessageStatus = 'new' | 'read' | 'archived' | 'spam';

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  /** Every answer of the seller-built form, in the order of the form. */
  fields?: { id: string; label: string; type: string; value: string; /** A file the visitor attached (open it with apiContactFileLink). */ fileId?: string }[];
  /** The page the form was sent from, where the visitor came from, and the store's customer account (when the email matches one). */
  pageUrl?: string | null;
  source?: { trafficSource?: string | null; referrerHost?: string | null; landingPath?: string | null; utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null; deviceType?: string | null; country?: string | null } | null;
  customerId?: string | null;
  customerOrders?: number;
  /** Why a message is in the Spam tab. */
  spamReason?: string | null;
  /** Which form it came from ('' for an unnamed one). */
  formName?: string;
  status: ContactMessageStatus;
  /** What the store answered from the inbox (oldest first). */
  replies?: { message: string; sentAt: string; sentBy: string }[];
  createdAt: string;
}

export interface ContactMessagePage {
  success: boolean;
  data: ContactMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Messages nobody has opened yet (across all pages). */
  unread: number;
  /** Messages in the Spam tab. */
  spam?: number;
}

export interface ContactMessageFilters { status?: ContactMessageStatus | ''; /** A form name, or '__unnamed' for messages of forms without a name. */ form?: string; q?: string; source?: string }

export const apiListContactMessages = (storeId: string, params: { page?: number } & ContactMessageFilters = {}) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.status) q.set('status', params.status);
  if (params.form) q.set('form', params.form);
  if (params.q?.trim()) q.set('q', params.q.trim());
  if (params.source) q.set('source', params.source);
  const qs = q.toString();
  return client.get<never, ContactMessagePage>(`/api/store-contact/${storeId}${qs ? `?${qs}` : ''}`);
};

export const apiSetContactMessageStatus = (storeId: string, id: string, status: ContactMessageStatus) =>
  client.patch<never, ApiResponse<ContactMessage>>(`/api/store-contact/${storeId}/${id}`, { status });

export const apiDeleteContactMessage = (storeId: string, id: string) =>
  client.delete<never, ApiResponse<null>>(`/api/store-contact/${storeId}/${id}`);

/** A visitor sends a message to the store (public). `website` is the bot-trap field and must stay empty. */
export const apiSubmitContactMessage = (storeId: string, body: { sectionId?: string; answers: { fieldId: string; value: string | string[] }[]; website?: string; captchaToken?: string; analyticsSessionId?: string; pageUrl?: string }) =>
  client.post<never, ApiResponse<null>>(`/api/public/store-contact/${storeId}`, body);

export const apiReplyContactMessage = (storeId: string, id: string, message: string) =>
  client.post<never, ApiResponse<ContactMessage>>(`/api/store-contact/${storeId}/${id}/reply`, { message });

/** The forms that received messages, with counts (for the inbox filter). */
export const apiListContactForms = (storeId: string) =>
  client.get<never, { success: boolean; data: { name: string; total: number; unread: number }[] }>(`/api/store-contact/${storeId}/forms`);

/** CSV of the messages matching the filters (a file download, so the response is a blob). */
export const apiExportContactMessages = (storeId: string, params: ContactMessageFilters = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.form) q.set('form', params.form);
  if (params.q?.trim()) q.set('q', params.q.trim());
  if (params.source) q.set('source', params.source);
  const qs = q.toString();
  return client.get<never, Blob>(`/api/store-contact/${storeId}/export${qs ? `?${qs}` : ''}`, { responseType: 'blob' });
};

/** A visitor attaches a file to a form field (private storage). The answer sent with the form is the returned `uploadId`. */
export const apiUploadContactFile = (storeId: string, body: { sectionId: string; fieldId: string; file: File }) => {
  const fd = new FormData();
  fd.append('sectionId', body.sectionId);
  fd.append('fieldId', body.fieldId);
  fd.append('file', body.file);
  return client.post<never, ApiResponse<{ uploadId: string; name: string; size: number }>>(`/api/public/store-contact/${storeId}/upload`, fd, { timeout: 60_000 });
};

/** Which CAPTCHA the store's forms use: only the public site key. */
export const apiGetContactFormConfig = (storeId: string) =>
  client.get<never, ApiResponse<{ captcha: { provider: 'turnstile'; siteKey: string } | null }>>(`/api/public/store-contact/${storeId}/config`);

/** A 2-minute link to one file a visitor attached (seller inbox). */
export const apiContactFileLink = (storeId: string, messageId: string, fileId: string) =>
  client.get<never, ApiResponse<{ url: string; fileName: string }>>(`/api/store-contact/${storeId}/${messageId}/file/${fileId}`);

export interface SpamProtection { turnstile: { configured: boolean; siteKey: string } }
export const apiGetSpamProtection = (storeId: string) => client.get<never, ApiResponse<SpamProtection>>(`/api/store-contact/${storeId}/spam-protection`);
export const apiSaveSpamProtection = (storeId: string, body: { siteKey: string; secretKey: string }) =>
  client.put<never, ApiResponse<SpamProtection>>(`/api/store-contact/${storeId}/spam-protection`, body);
export const apiClearSpamProtection = (storeId: string) => client.delete<never, ApiResponse<SpamProtection>>(`/api/store-contact/${storeId}/spam-protection`);

export interface SavedForm { _id: string; name: string; settings: Record<string, any> }
export const apiListSavedForms = (storeId: string) =>
  client.get<never, { success: boolean; data: SavedForm[] }>(`/api/store-contact/saved-forms/${storeId}`);
export const apiSaveForm = (storeId: string, name: string, settings: Record<string, any>) =>
  client.post<never, { success: boolean; data: SavedForm }>(`/api/store-contact/saved-forms/${storeId}`, { name, settings });
export const apiDeleteSavedForm = (storeId: string, id: string) =>
  client.delete<never, { success: boolean }>(`/api/store-contact/saved-forms/${storeId}/${id}`);

export interface FormReportRow { sectionId: string; name: string; views: number; starts: number; sent: number; spam: number; sources: Record<string, number>; fieldTouches?: Record<string, number>; fields?: { id: string; label: string; touched: number }[] }
export const apiContactFormReport = (storeId: string, days: number) =>
  client.get<never, { success: boolean; data: { days: number; forms: FormReportRow[]; daily?: { day: string; views: number; sent: number }[] } }>(`/api/store-contact/${storeId}/report?days=${days}`);
/** Anonymous counters for the seller's form report; a failure is never shown to the visitor. */
export const apiTrackFormEvent = (storeId: string, sectionId: string, kind: 'view' | 'start' | 'field', fieldId?: string) =>
  client.post<never, unknown>(`/api/public/store-contact/${storeId}/event`, { sectionId, kind, fieldId }).catch(() => undefined);
