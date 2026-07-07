import client from '../client';
import { ENDPOINTS } from '../endpoints';

interface ApiResponse<T> { success: boolean; message?: string; data?: T }

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** PUT /api/users/change-password */
export function apiChangePassword(payload: ChangePasswordPayload) {
  return client.put<never, ApiResponse<null>>(ENDPOINTS.USERS.CHANGE_PASSWORD, payload);
}

/** DELETE /api/users/profile — soft-deletes (deactivates) the account */
export function apiDeleteAccount() {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.USERS.DELETE_ACCOUNT);
}
