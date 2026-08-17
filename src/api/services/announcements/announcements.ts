import client from '../../client';
import { ENDPOINTS } from '../../endpoints';
import type { Announcement } from './adminAnnouncements';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** Public — no auth required. `audience` is which side of the app is asking. */
export function apiGetActiveAnnouncements(audience: 'buyers' | 'sellers') {
  return client.get<never, ApiResponse<Announcement[]>>(ENDPOINTS.ANNOUNCEMENTS.ACTIVE, { params: { audience } });
}
