import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type AnnouncementAudience = 'all' | 'sellers' | 'buyers';
export type AnnouncementStatus = 'draft' | 'published' | 'scheduled';

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementQuery {
  status?: AnnouncementStatus;
  audience?: AnnouncementAudience;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AnnouncementListData {
  items: Announcement[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  audience?: AnnouncementAudience;
  status?: AnnouncementStatus;
  scheduledAt?: string;
}

export type UpdateAnnouncementPayload = Partial<Pick<CreateAnnouncementPayload, 'title' | 'message' | 'audience' | 'scheduledAt'>>;

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
export function apiListAnnouncements(query: AnnouncementQuery = {}) {
  return client.get<never, ApiResponse<AnnouncementListData>>(ENDPOINTS.ANNOUNCEMENTS.LIST, { params: query });
}

export function apiCreateAnnouncement(payload: CreateAnnouncementPayload) {
  return client.post<never, ApiResponse<Announcement>>(ENDPOINTS.ANNOUNCEMENTS.CREATE, payload);
}

export function apiUpdateAnnouncement(id: string, payload: UpdateAnnouncementPayload) {
  return client.put<never, ApiResponse<Announcement>>(ENDPOINTS.ANNOUNCEMENTS.UPDATE(id), payload);
}

export function apiSetAnnouncementStatus(id: string, status: AnnouncementStatus, scheduledAt?: string) {
  return client.patch<never, ApiResponse<Announcement>>(ENDPOINTS.ANNOUNCEMENTS.SET_STATUS(id), { status, scheduledAt });
}

export function apiDeleteAnnouncement(id: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.ANNOUNCEMENTS.DELETE(id));
}
