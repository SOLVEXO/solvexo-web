import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface EmailHealth {
  configured: boolean;
  host: string;
  port: number;
  from: string | null;
  appName: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  lastErrorAt: string | null;
  totals: { sent: number; failed: number };
  days: { date: string; sent: number; failed: number; marketingSent?: number; marketingFailed?: number }[];
  /** The dedicated marketing sender (MARKETING_SMTP_*) for campaigns, newsletters, automations and abandoned carts. */
  marketing?: {
    configured: boolean;
    host: string | null;
    port: number | null;
    from: string | null;
    consecutiveFailures: number;
    lastError: string | null;
    lastErrorAt: string | null;
    totals: { sent: number; failed: number };
  };
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** GET /api/admin/email-health — SMTP settings (never the password) + the last 14 days of sends. */
export function apiGetEmailHealth() {
  return client.get<never, ApiResponse<EmailHealth>>(ENDPOINTS.ADMIN_EMAIL_HEALTH.GET);
}

/** POST /api/admin/email-health/test — logs in to the sender and mails a test message to the calling admin. */
export function apiSendTestEmail(channel: 'transactional' | 'marketing' = 'transactional') {
  return client.post<never, { success: boolean; message: string }>(ENDPOINTS.ADMIN_EMAIL_HEALTH.TEST, undefined, channel === 'marketing' ? { params: { channel } } : undefined);
}
