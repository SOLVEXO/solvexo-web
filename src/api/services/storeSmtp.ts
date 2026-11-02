import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** The store's own sender email (SMTP). The password is never sent back: only `hasPassword`. */
export interface StoreSmtpView {
  mode: 'solvexo' | 'own';
  host: string;
  port: number;
  user: string;
  fromEmail: string;
  hasPassword: boolean;
  verifiedAt: string | null;
  /** Set while sending through the store's server keeps failing (mails go through Solvexo meanwhile). */
  lastError: string | null;
  consecutiveFailures: number;
}

export interface StoreSmtpInput { host: string; port: number; user: string; password?: string; fromEmail: string }

const base = (storeId: string) => `/api/store-notifications/${storeId}/smtp`;

export const apiGetStoreSmtp = (storeId: string) => client.get<never, ApiResponse<StoreSmtpView>>(base(storeId));
export const apiSaveStoreSmtp = (storeId: string, body: StoreSmtpInput) => client.put<never, ApiResponse<null>>(base(storeId), body);
export const apiDisableStoreSmtp = (storeId: string) => client.delete<never, ApiResponse<null>>(base(storeId));
