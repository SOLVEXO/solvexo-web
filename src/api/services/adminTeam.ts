import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { AdminActivityLogEntry } from './activityLog';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** Must stay in sync with `solvexo-api/src/admin-team/admin-permissions.ts`. */
export const ADMIN_PERMISSIONS = [
  'analytics.view', 'clients.view', 'clients.manage', 'finance.view', 'finance.payouts', 'billing.manage',
  'commission.manage', 'seo.manage', 'ai.manage', 'content.manage', 'marketing.manage', 'marketplace.manage',
  'themes.manage', 'apps.manage', 'config.manage', 'activity.view', 'audit.view', 'team.manage',
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, { label: string; hint: string }> = {
  'analytics.view':     { label: 'Analytics', hint: 'Platform overview and analytics' },
  'clients.view':       { label: 'View clients', hint: 'Stores, sellers, buyers (read only)' },
  'clients.manage':     { label: 'Manage clients', hint: 'Suspend, activate, delete, moderation, refund requests' },
  'finance.view':       { label: 'View finance', hint: 'Finance dashboards, ledger, reports' },
  'finance.payouts':    { label: 'Payouts', hint: 'Approve, reverse or create payouts (money out)' },
  'billing.manage':     { label: 'Billing & plans', hint: 'Platform plans, subscriptions, POS plans' },
  'commission.manage':  { label: 'Commission & FX', hint: 'Commission rules and FX settings' },
  'seo.manage':         { label: 'SEO', hint: 'Platform SEO tools' },
  'ai.manage':          { label: 'AI Studio', hint: 'Admin AI Studio' },
  'content.manage':     { label: 'Content', hint: 'Announcements, FAQs, testimonials, contact messages, newsletter' },
  'marketing.manage':   { label: 'Marketing', hint: 'Platform coupons, promotions, banners' },
  'marketplace.manage': { label: 'Marketplace', hint: 'Marketplace curation' },
  'themes.manage':      { label: 'Theme catalog', hint: 'Theme catalog' },
  'apps.manage':        { label: 'Store app requests', hint: 'Approve or reject store app requests' },
  'config.manage':      { label: 'Platform config', hint: 'Platform config and email health' },
  'activity.view':      { label: 'Activity log', hint: 'Platform activity log' },
  'audit.view':         { label: 'Audit trail', hint: 'What every admin changed' },
  'team.manage':        { label: 'Team', hint: 'Admins, roles and approvals' },
};

export const ADMIN_PERMISSION_AREAS: { area: string; keys: AdminPermission[] }[] = [
  { area: 'Overview', keys: ['analytics.view', 'activity.view', 'audit.view'] },
  { area: 'Clients', keys: ['clients.view', 'clients.manage'] },
  { area: 'Money', keys: ['finance.view', 'finance.payouts', 'billing.manage', 'commission.manage'] },
  { area: 'Growth & content', keys: ['seo.manage', 'ai.manage', 'content.manage', 'marketing.manage', 'marketplace.manage', 'themes.manage', 'apps.manage'] },
  { area: 'Platform', keys: ['config.manage', 'team.manage'] },
];

export interface AdminRole {
  _id: string; name: string; description?: string; permissions: string[]; readOnly: boolean; isPreset?: boolean; key?: string; adminCount?: number;
}
export type AdminMemberState = 'active' | 'invited' | 'inactive' | 'access_expired';
export interface AdminMember {
  _id: string; name: string; email: string; phone: string; profileImage: string | null; isSuperAdmin: boolean;
  roleId: string | null; roleName: string | null; status: 'active' | 'inactive'; state: AdminMemberState;
  accessExpiresAt: string | null; inviteSentAt: string | null; inviteTokenExpiresAt: string | null;
  lastLoginAt: string | null; lastLoginIp: string | null; sessionCount: number; twoFactorEnabled?: boolean; createdAt: string;
}
export interface AdminApproval {
  _id: string; action: string; actionLabel: string; status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired';
  requestedByName?: string | null; summary?: string; decidedByName?: string | null; note?: string | null; stale?: boolean;
  createdAt: string; expiresAt: string;
}
export interface AdminSession { sid: string; ip: string | null; userAgent: string | null; createdAt: string; lastSeenAt: string; current: boolean }

export const apiGetAdminInvite = (token: string) => client.get<never, ApiResponse<{ name: string; email: string; roleName: string | null }>>(ENDPOINTS.ADMIN_TEAM.INVITE(token));
export const apiAcceptAdminInvite = (token: string, password: string) => client.post<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.ACCEPT(token), { password });
export const apiAdminForgotPassword = (email: string) => client.post<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.FORGOT, { email });
export const apiAdminResetPassword = (token: string, password: string) => client.post<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.RESET(token), { password });

export const apiListAdmins = () => client.get<never, ApiResponse<AdminMember[]>>(ENDPOINTS.ADMIN_TEAM.ADMINS);
export const apiInviteAdmin = (b: { name: string; email: string; roleId: string; accessExpiresAt?: string | null }) =>
  client.post<never, ApiResponse<AdminMember> & { emailSent?: boolean; inviteUrl?: string }>(ENDPOINTS.ADMIN_TEAM.ADMINS, b);
export const apiUpdateAdmin = (id: string, b: { name?: string; roleId?: string; status?: 'active' | 'inactive'; accessExpiresAt?: string | null }) =>
  client.patch<never, ApiResponse<AdminMember>>(ENDPOINTS.ADMIN_TEAM.ADMIN(id), b);
export const apiResendAdminInvite = (id: string) => client.post<never, { success: boolean; emailSent?: boolean; inviteUrl?: string }>(ENDPOINTS.ADMIN_TEAM.RESEND(id));
export const apiRevokeAdminSessions = (id: string) => client.post<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.REVOKE_SESSIONS(id));
export const apiResetAdminTwoFactor = (id: string) => client.post<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.RESET_2FA(id));
export const apiSetAdminSuper = (id: string, isSuperAdmin: boolean) => client.put<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.SUPER(id), { isSuperAdmin });
export const apiDeleteAdmin = (id: string) => client.delete<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.ADMIN(id));

export const apiListAdminRoles = () => client.get<never, ApiResponse<AdminRole[]>>(ENDPOINTS.ADMIN_TEAM.ROLES);
export const apiCreateAdminRole = (b: { name: string; description?: string; permissions: string[]; readOnly?: boolean }) => client.post<never, ApiResponse<AdminRole>>(ENDPOINTS.ADMIN_TEAM.ROLES, b);
export const apiUpdateAdminRole = (id: string, b: { name?: string; description?: string; permissions?: string[]; readOnly?: boolean }) => client.patch<never, ApiResponse<AdminRole>>(ENDPOINTS.ADMIN_TEAM.ROLE(id), b);
export const apiDeleteAdminRole = (id: string) => client.delete<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.ROLE(id));

export const apiListAdminApprovals = (status = 'pending') => client.get<never, ApiResponse<AdminApproval[]>>(ENDPOINTS.ADMIN_TEAM.APPROVALS, { params: { status } });
export const apiDecideAdminApproval = (id: string, approve: boolean, note?: string) => client.post<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.DECIDE(id), { approve, note });

export const apiGetAdminAudit = (params: { page?: number; limit?: number; actorId?: string; search?: string; category?: string } = {}) =>
  client.get<never, ApiResponse<{ pagination: { page: number; limit: number; total: number; totalPages: number }; logs: AdminActivityLogEntry[] }>>(ENDPOINTS.ADMIN_TEAM.AUDIT, { params });

export const apiMyAdminSessions = () => client.get<never, ApiResponse<AdminSession[]>>(ENDPOINTS.ADMIN_TEAM.MY_SESSIONS);
export const apiRevokeMyAdminSession = (sid: string) => client.delete<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.MY_SESSION(sid));
export const apiRevokeAllMyAdminSessions = () => client.post<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TEAM.MY_SESSIONS_REVOKE_ALL);

export interface ViewAsStoreResult { accessToken: string; storeId: string; storeName: string; minutes: number; staff: Record<string, unknown> }
export const apiViewAsStore = (storeId: string) => client.post<never, ApiResponse<ViewAsStoreResult>>(ENDPOINTS.ADMIN_TEAM.VIEW_AS_STORE(storeId));

// ── two-factor sign-in (own account) ──
export interface AdminTwoFactorStatus { enabled: boolean; enabledAt: string | null; recoveryCodesLeft: number }
export interface AdminTwoFactorSetup { secret: string; otpauthUri: string; issuer: string; account: string }
export const apiAdminTwoFactorStatus = () => client.get<never, ApiResponse<AdminTwoFactorStatus>>(ENDPOINTS.ADMIN_TWO_FACTOR.STATUS);
export const apiStartAdminTwoFactor = () => client.post<never, ApiResponse<AdminTwoFactorSetup>>(ENDPOINTS.ADMIN_TWO_FACTOR.SETUP);
export const apiEnableAdminTwoFactor = (code: string) => client.post<never, ApiResponse<{ recoveryCodes: string[] }>>(ENDPOINTS.ADMIN_TWO_FACTOR.ENABLE, { code });
export const apiDisableAdminTwoFactor = (password: string, code: string) => client.post<never, ApiResponse<unknown>>(ENDPOINTS.ADMIN_TWO_FACTOR.DISABLE, { password, code });
export const apiNewAdminRecoveryCodes = (password: string, code: string) =>
  client.post<never, ApiResponse<{ recoveryCodes: string[] }>>(ENDPOINTS.ADMIN_TWO_FACTOR.RECOVERY_CODES, { password, code });
