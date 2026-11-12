import client from '../client';

export interface PlatformAppPublic {
  id: string; name: string; slug: string; description: string; developerName: string; clientId: string;
  scopes: string[]; redirectUrls: string[]; hasEmbed: boolean; embedTitle: string;
}
export interface AvailableApp extends PlatformAppPublic { installed: boolean; scopeLabels: string[] }
export interface InstalledApp { installId: string; app: PlatformAppPublic; grantedScopes: string[]; scopeLabels: string[]; installedAt: string; embed: { title: string } | null }
export interface AuthorizePreview { app: PlatformAppPublic; scopes: string[]; scopeLabels: string[]; redirectUri: string; state: string; alreadyInstalled: boolean }

const base = (storeId: string) => `/api/app-platform/${storeId}`;
export const apiAvailableApps = (storeId: string) => client.get(`${base(storeId)}/available`) as Promise<AvailableApp[]>;
export const apiInstalledApps = (storeId: string) => client.get(`${base(storeId)}/installed`) as Promise<InstalledApp[]>;
export const apiAuthorizePreview = (storeId: string, q: { client_id: string; redirect_uri: string; scope: string; state: string }) =>
  client.get(`${base(storeId)}/authorize-preview`, { params: q }) as Promise<AuthorizePreview>;
export const apiAuthorizeApp = (storeId: string, body: { client_id: string; redirect_uri: string; scope: string; state: string }) =>
  client.post(`${base(storeId)}/authorize`, body) as Promise<{ redirectTo: string }>;
export const apiUninstallApp = (storeId: string, installId: string) => client.delete(`${base(storeId)}/installs/${installId}`) as Promise<{ success: boolean }>;
export const apiAppSessionToken = (storeId: string, installId: string) =>
  client.post(`${base(storeId)}/installs/${installId}/session-token`) as Promise<{ token: string; origin: string; embedUrl: string; storeId: string }>;

// ── Solvexo admin: the registry ──
export interface AdminAppRow {
  _id: string; name: string; slug: string; description: string; developerName: string; developerEmail: string; clientId: string; clientSecretHint: string;
  redirectUrls: string[]; requestedScopes: string[]; webhookUrl: string | null; webhookEvents: string[]; uninstallWebhookUrl: string | null; embedUrl: string | null; embedTitle: string;
  status: 'draft' | 'approved' | 'suspended';
}
export interface AdminAppInput {
  name: string; description?: string; developerName?: string; developerEmail?: string; redirectUrls: string[]; requestedScopes: string[];
  webhookUrl?: string | null; webhookEvents?: string[]; uninstallWebhookUrl?: string | null; embedUrl?: string | null; embedTitle?: string;
}
export const apiAdminListApps = () => client.get('/api/admin/app-platform') as Promise<AdminAppRow[]>;
export const apiAdminCreateApp = (body: AdminAppInput) => client.post('/api/admin/app-platform', body) as Promise<{ id: string; clientId: string; clientSecret: string; sessionSecret: string }>;
export const apiAdminUpdateApp = (id: string, body: Partial<AdminAppInput>) => client.patch(`/api/admin/app-platform/${id}`, body) as Promise<AdminAppRow>;
export const apiAdminApproveApp = (id: string) => client.post(`/api/admin/app-platform/${id}/approve`) as Promise<AdminAppRow>;
export const apiAdminSuspendApp = (id: string) => client.post(`/api/admin/app-platform/${id}/suspend`) as Promise<{ success: boolean; uninstalled: number }>;
export const apiAdminRotateAppSecrets = (id: string) => client.post(`/api/admin/app-platform/${id}/rotate-secrets`) as Promise<{ clientSecret: string; sessionSecret: string }>;
