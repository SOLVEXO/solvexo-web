import client from '../client';

/** A developer's own app (any seller account can build apps). Secrets are never listed, only shown once when made. */
export interface DevApp {
  id: string; name: string; slug: string; description: string; developerName: string; developerEmail: string;
  clientId: string; clientSecretHint: string; redirectUrls: string[]; requestedScopes: string[];
  webhookUrl: string | null; webhookEvents: string[]; uninstallWebhookUrl: string | null; embedUrl: string | null; embedTitle: string;
  status: 'draft' | 'approved' | 'suspended'; listed: boolean;
  reviewStatus: 'none' | 'submitted' | 'rejected'; reviewNote: string; submittedAt: string | null;
  installs: number; createdAt: string; updatedAt: string;
}
export interface DevAppInput {
  name: string; description?: string; developerName?: string; developerEmail?: string; redirectUrls: string[]; requestedScopes: string[];
  webhookUrl?: string | null; webhookEvents?: string[]; uninstallWebhookUrl?: string | null; embedUrl?: string | null; embedTitle?: string;
}
export interface AppSecrets { clientId?: string; clientSecret: string; sessionSecret: string }
export interface DevStore { id: string; name: string; slug: string; currency: string; createdAt: string }

const APPS = '/api/developer/apps';
const STORES = '/api/developer/stores';

export const apiDevApps = () => client.get(APPS) as Promise<{ items: DevApp[]; max: number }>;
export const apiDevCreateApp = (body: DevAppInput) => client.post(APPS, body) as Promise<{ id: string; clientId: string; clientSecret: string; sessionSecret: string }>;
export const apiDevUpdateApp = (id: string, body: Partial<DevAppInput>) => client.patch(`${APPS}/${id}`, body) as Promise<DevApp & { relisting: boolean }>;
export const apiDevRotateSecrets = (id: string) => client.post(`${APPS}/${id}/rotate-secrets`) as Promise<{ clientSecret: string; sessionSecret: string }>;
export const apiDevSubmitApp = (id: string) => client.post(`${APPS}/${id}/submit`) as Promise<DevApp>;
export const apiDevDeleteApp = (id: string) => client.delete(`${APPS}/${id}`) as Promise<{ success: boolean; uninstalled: number }>;

export const apiDevStores = () => client.get(STORES) as Promise<{ items: DevStore[]; max: number }>;
export const apiDevCreateStore = (body: { name: string; currency?: string }) =>
  client.post(STORES, body) as Promise<{ id: string; name: string; slug: string; currency: string; password: string }>;
export const apiDevDeleteStore = (id: string) => client.delete(`${STORES}/${id}`) as Promise<{ success: boolean }>;

/** What a developer app's state means to its developer. */
export function devAppState(a: Pick<DevApp, 'status' | 'reviewStatus'>): { label: string; color: 'gray' | 'yellow' | 'red' | 'green' } {
  if (a.status === 'suspended') return { label: 'Suspended', color: 'red' };
  if (a.status === 'approved') return { label: 'Listed', color: 'green' };
  if (a.reviewStatus === 'submitted') return { label: 'Waiting for review', color: 'yellow' };
  if (a.reviewStatus === 'rejected') return { label: 'Changes asked', color: 'red' };
  return { label: 'Private', color: 'gray' };
}
