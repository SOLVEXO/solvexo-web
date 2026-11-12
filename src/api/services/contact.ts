import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type ContactSubmissionStatus = 'new' | 'read' | 'resolved';

export interface ContactSubmission {
  _id:       string;
  name:      string;
  email:     string;
  topic:     string;
  message:   string;
  status:    ContactSubmissionStatus;
  createdAt: string;
  updatedAt: string;
  /** 'seller' = a help request from a store dashboard; rows from before this field are 'public'. */
  source?:    'public' | 'seller';
  tier?:      'standard' | 'priority' | 'dedicated';
  category?:  string | null;
  storeId?:   string | null;
  storeName?: string | null;
  replies?:   { message: string; sentAt: string; sentBy: string }[];
}

export interface ContactStats { new: number; read: number; resolved: number }

export interface SubmitContactPayload {
  name:    string;
  email:   string;
  topic:   string;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────────────────
export function apiSubmitContact(payload: SubmitContactPayload) {
  return client.post<never, { success: boolean; message: string }>(ENDPOINTS.CONTACT.SUBMIT, payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetAllContactSubmissions() {
  return client.get<never, { success: boolean; count: number; stats: ContactStats; data: ContactSubmission[] }>(
    ENDPOINTS.CONTACT.ADMIN_ALL,
  );
}

export function apiUpdateContactStatus(id: string, status: ContactSubmissionStatus) {
  return client.patch<never, { success: boolean; message: string; data: ContactSubmission }>(
    ENDPOINTS.CONTACT.UPDATE_STATUS(id), { status },
  );
}

export function apiReplyContactSubmission(id: string, message: string) {
  return client.post<never, { success: boolean; data: ContactSubmission }>(ENDPOINTS.CONTACT.ADMIN_REPLY(id), { message });
}

export function apiDeleteContactSubmission(id: string) {
  return client.delete<never, { success: boolean; message: string }>(ENDPOINTS.CONTACT.DELETE(id));
}
