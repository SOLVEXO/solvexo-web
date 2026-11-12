import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type ContactMessageStatus = 'new' | 'read' | 'archived';

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  /** Every answer of the seller-built form, in the order of the form. */
  fields?: { id: string; label: string; type: string; value: string }[];
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
}

export interface ContactMessageFilters { status?: ContactMessageStatus | ''; /** A form name, or '__unnamed' for messages of forms without a name. */ form?: string; q?: string }

export const apiListContactMessages = (storeId: string, params: { page?: number } & ContactMessageFilters = {}) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.status) q.set('status', params.status);
  if (params.form) q.set('form', params.form);
  if (params.q?.trim()) q.set('q', params.q.trim());
  const qs = q.toString();
  return client.get<never, ContactMessagePage>(`/api/store-contact/${storeId}${qs ? `?${qs}` : ''}`);
};

export const apiSetContactMessageStatus = (storeId: string, id: string, status: ContactMessageStatus) =>
  client.patch<never, ApiResponse<ContactMessage>>(`/api/store-contact/${storeId}/${id}`, { status });

export const apiDeleteContactMessage = (storeId: string, id: string) =>
  client.delete<never, ApiResponse<null>>(`/api/store-contact/${storeId}/${id}`);

/** A visitor sends a message to the store (public). `website` is the bot-trap field and must stay empty. */
export const apiSubmitContactMessage = (storeId: string, body: { sectionId?: string; answers: { fieldId: string; value: string | string[] }[]; website?: string }) =>
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
  const qs = q.toString();
  return client.get<never, Blob>(`/api/store-contact/${storeId}/export${qs ? `?${qs}` : ''}`, { responseType: 'blob' });
};
