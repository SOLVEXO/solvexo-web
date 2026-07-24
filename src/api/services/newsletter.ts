import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** Public — no auth required. */
export function apiSubscribeNewsletter(email: string) {
  return client.post<never, ApiResponse<null>>(ENDPOINTS.NEWSLETTER.SUBSCRIBE, { email });
}
