import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** Mirrors `solvexo-api/src/sales-ops/sales-ops.constants.ts`. */
export const LEAD_STAGES = ['new', 'contacted', 'demo', 'trial', 'won', 'lost'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New', contacted: 'Contacted', demo: 'Demo', trial: 'Trial', won: 'Won', lost: 'Lost',
};

export const LEAD_SOURCES = ['website_form', 'contact_message', 'manual', 'import', 'stalled_signup', 'whatsapp', 'social', 'referral', 'event', 'other'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];
export const SOURCE_LABELS: Record<LeadSource, string> = {
  website_form: 'Website form', contact_message: 'Contact message', manual: 'Added by hand', import: 'Import',
  stalled_signup: 'Stalled sign-up', whatsapp: 'WhatsApp', social: 'Social media', referral: 'Referral', event: 'Event', other: 'Other',
};

export const LOST_REASONS = ['price', 'chose_competitor', 'no_response', 'not_a_fit', 'timing', 'other'] as const;
export const LOST_REASON_LABELS: Record<(typeof LOST_REASONS)[number], string> = {
  price: 'Price', chose_competitor: 'Chose a competitor', no_response: 'No response', not_a_fit: 'Not a fit', timing: 'Bad timing', other: 'Other',
};

export type LogType = 'note' | 'call' | 'whatsapp' | 'meeting';

export interface SalesLead {
  _id: string; name: string; businessName: string | null; email: string | null; phone: string | null;
  city: string | null; country: string | null; businessType: string | null;
  source: LeadSource; sourceDetail: string | null; stage: LeadStage; lostReason: string | null; lostNote: string | null;
  ownerAdminId: string | null; ownerName: string | null; dealValuePKR: number | null; tags: string[];
  nextFollowUpAt: string | null; lastActivityAt: string | null; stageChangedAt: string | null; wonAt: string | null;
  sellerId: string | null; storeId: string | null; linkedAt: string | null; createdAt: string;
}
export interface LeadSummary {
  stages: { stage: LeadStage; count: number; valuePKR: number }[];
  openLeads: number; openValuePKR: number; overdueFollowUps: number; wonThisMonth: number;
}
export interface LeadList { items: SalesLead[]; total: number; page: number; limit: number; summary: LeadSummary }
export interface SalesActivity {
  _id: string; leadId: string; type: string; subject: string | null; body: string; outcome: string | null;
  adminId: string | null; adminName: string | null; createdAt: string;
}
export interface SalesTask {
  _id: string; leadId: string; title: string; dueAt: string; doneAt: string | null; assigneeAdminId: string | null;
  assigneeName?: string | null; leadName?: string; leadBusiness?: string | null; leadStage?: LeadStage | null;
}
export interface LinkedMerchant {
  sellerId: string; name: string; email: string; signedUpAt: string; state: 'signed_up' | 'trial' | 'paying' | 'not_paying';
  stores: { _id: string; name: string; slug: string }[];
}
export interface LeadDetail { lead: SalesLead; activities: SalesActivity[]; tasks: SalesTask[]; merchant: LinkedMerchant | null }
export interface SalesOwner { _id: string; name: string; email: string }
export interface SalesTemplate { _id: string; name: string; subject: string; body: string }

export interface LeadInput {
  name?: string; businessName?: string | null; email?: string | null; phone?: string | null; city?: string | null;
  businessType?: string | null; source?: LeadSource; sourceDetail?: string | null; ownerAdminId?: string | null;
  dealValuePKR?: number | null; tags?: string[];
}
export interface LeadQuery { stage?: LeadStage; owner?: string; source?: LeadSource; q?: string; due?: 'overdue' | 'today'; page?: number; limit?: number }

const BASE = '/api/admin/sales';

export const apiListLeads = (params: LeadQuery = {}) => client.get<never, ApiResponse<LeadList>>(`${BASE}/leads`, { params });
export const apiCreateLead = (input: LeadInput) => client.post<never, ApiResponse<LeadDetail>>(`${BASE}/leads`, input);
export const apiGetLead = (id: string) => client.get<never, ApiResponse<LeadDetail>>(`${BASE}/leads/${id}`);
export const apiUpdateLead = (id: string, input: LeadInput) => client.patch<never, ApiResponse<LeadDetail>>(`${BASE}/leads/${id}`, input);
export const apiDeleteLead = (id: string) => client.delete<never, ApiResponse<{ id: string }>>(`${BASE}/leads/${id}`);
export const apiChangeStage = (id: string, stage: LeadStage, lostReason?: string, note?: string) =>
  client.post<never, ApiResponse<LeadDetail>>(`${BASE}/leads/${id}/stage`, { stage, lostReason, note });
export const apiLogActivity = (id: string, type: LogType, body: string, outcome?: string) =>
  client.post<never, ApiResponse<LeadDetail>>(`${BASE}/leads/${id}/activities`, { type, body, outcome });
export const apiSendLeadEmail = (id: string, subject: string, body: string) =>
  client.post<never, ApiResponse<LeadDetail>>(`${BASE}/leads/${id}/email`, { subject, body });
export const apiCreateTask = (leadId: string, title: string, dueAt: string, assigneeAdminId?: string) =>
  client.post<never, ApiResponse<LeadDetail>>(`${BASE}/leads/${leadId}/tasks`, { title, dueAt, assigneeAdminId });
export const apiListTasks = (params: { scope?: 'mine' | 'all'; status?: 'open' | 'done' } = {}) =>
  client.get<never, ApiResponse<SalesTask[]>>(`${BASE}/tasks`, { params });
export const apiUpdateTask = (id: string, patch: { done?: boolean; title?: string; dueAt?: string }) =>
  client.patch<never, ApiResponse<{ id: string }>>(`${BASE}/tasks/${id}`, patch);
export const apiDeleteTask = (id: string) => client.delete<never, ApiResponse<{ id: string }>>(`${BASE}/tasks/${id}`);
export const apiSalesOwners = () => client.get<never, ApiResponse<SalesOwner[]>>(`${BASE}/owners`);
export const apiListTemplates = () => client.get<never, ApiResponse<SalesTemplate[]>>(`${BASE}/templates`);
export const apiSaveTemplate = (id: string | null, t: { name: string; subject: string; body: string }) =>
  id ? client.patch<never, ApiResponse<SalesTemplate[]>>(`${BASE}/templates/${id}`, t)
     : client.post<never, ApiResponse<SalesTemplate[]>>(`${BASE}/templates`, t);
export const apiDeleteTemplate = (id: string) => client.delete<never, ApiResponse<SalesTemplate[]>>(`${BASE}/templates/${id}`);

/** "PKR 1,250,000" — whole rupees, grouped the way Pakistan reads them. */
export const formatPKR = (n: number | null | undefined) => `PKR ${Math.round(n ?? 0).toLocaleString('en-PK')}`;

/** Fill `{{name}}`-style fields the same way the server does, for the composer preview. */
export const fillTemplate = (text: string, vars: Record<string, string | null | undefined>) =>
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => (vars[k] != null ? String(vars[k]) : m));
