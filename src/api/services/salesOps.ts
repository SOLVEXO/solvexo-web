import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** Mirrors `solvexo-api/src/sales-ops/sales-ops.constants.ts`. */
export const LEAD_STAGES = ['new', 'contacted', 'demo', 'trial', 'won', 'lost'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New', contacted: 'Contacted', demo: 'Demo', trial: 'Trial', won: 'Won', lost: 'Lost',
};

export const LEAD_SOURCES = ['website_form', 'website_chat', 'contact_message', 'manual', 'import', 'stalled_signup', 'whatsapp', 'social', 'referral', 'event', 'other'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];
export const SOURCE_LABELS: Record<LeadSource, string> = {
  website_form: 'Book-a-demo form', website_chat: 'Website chat', contact_message: 'Contact message', manual: 'Added by hand', import: 'Import',
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
  utm?: { source: string | null; medium: string | null; campaign: string | null } | null;
  aiDraft?: { channel: 'whatsapp' | 'email'; text: string; createdAt: string } | null;
}
export interface LeadSummary {
  stages: { stage: LeadStage; count: number; valuePKR: number }[];
  openLeads: number; openValuePKR: number; overdueFollowUps: number; wonThisMonth: number;
}
export interface LeadList { items: SalesLead[]; total: number; page: number; limit: number; summary: LeadSummary }
export interface SalesActivity {
  _id: string; leadId: string; type: string; subject: string | null; body: string; outcome: string | null;
  adminId: string | null; adminName: string | null; createdAt: string;
  /** Older entries kept the outcome here; `ai` marks what the AI assistant wrote. */
  meta?: { outcome?: string | null; ai?: boolean } | null;
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

// ── Lead capture ───────────────────────────────────────────────────────────

export interface ImportRow { name?: string; email?: string; phone?: string; businessName?: string; city?: string; businessType?: string; dealValuePKR?: string; note?: string }
export interface ImportResult {
  total: number; created: number; wouldCreate: number; dryRun: boolean;
  duplicates: { row: number; name: string; existingLeadId: string | null; inFile?: boolean }[];
  invalid: { row: number; reason: string }[];
}
export const apiImportLeads = (body: { rows: ImportRow[]; ownerAdminId?: string | null; sourceDetail?: string | null; tags?: string[]; dryRun?: boolean }) =>
  client.post<never, ApiResponse<ImportResult>>(`${BASE}/imports`, body);
export const apiAddContactToPipeline = (contactId: string) =>
  client.post<never, ApiResponse<{ leadId: string; created: boolean; visible: boolean }>>(`${BASE}/contact-messages/${contactId}/lead`);
export const apiSyncStalled = () => client.post<never, { success: boolean; checked: number; added: number }>(`${BASE}/stalled/sync`);

export interface DemoRequest {
  name: string; phone: string; email?: string; businessName?: string; city?: string; businessType?: string; message?: string;
  preferredTime?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; page?: string; website?: string; partnerCode?: string;
}
/** Public, no login: the Book-a-demo form on solvexo.store. */
export const apiDemoRequest = (body: DemoRequest) => client.post<never, { success: boolean; message: string }>('/api/sales/demo-request', body);

/** "PKR 1,250,000" — whole rupees, grouped the way Pakistan reads them. */
export const formatPKR = (n: number | null | undefined) => `PKR ${Math.round(n ?? 0).toLocaleString('en-PK')}`;

/** Fill `{{name}}`-style fields the same way the server does, for the composer preview. */
export const fillTemplate = (text: string, vars: Record<string, string | null | undefined>) =>
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => (vars[k] != null ? String(vars[k]) : m));

// ── Campaigns & team ────────────────────────────────────────────────────────

export const CAMPAIGN_CHANNELS = ['facebook', 'instagram', 'google', 'tiktok', 'youtube', 'whatsapp', 'email', 'sms', 'influencer', 'event', 'other'] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];
export const CHANNEL_LABELS: Record<CampaignChannel, string> = {
  facebook: 'Facebook', instagram: 'Instagram', google: 'Google', tiktok: 'TikTok', youtube: 'YouTube', whatsapp: 'WhatsApp',
  email: 'Email', sms: 'SMS', influencer: 'Influencer', event: 'Event', other: 'Other',
};

export interface CampaignResult {
  id: string; code: string; name: string; channel: CampaignChannel; isArchived: boolean;
  startDate: string | null; endDate: string | null; budgetPKR: number | null;
  spendPKR: number; leads: number; wonLeads: number; signups: number; trials: number; paying: number; payingNow: number;
  mrrUSD: number; mrrPKR: number | null;
  costPerLeadPKR: number | null; costPerSignupPKR: number | null; costPerPayingPKR: number | null; paybackMonths: number | null;
  link: string | null;
}
export interface CampaignList {
  campaigns: CampaignResult[];
  totals: { spendPKR: number; leads: number; signups: number; paying: number; mrrUSD: number; costPerPayingPKR: number | null };
  untracked: { code: string; leads: number; signups: number }[];
  pkrPerUSD: number | null;
}
export interface CampaignDetail extends CampaignResult {
  utmSource: string | null; utmMedium: string | null; landingPath: string; notes: string | null;
  spend: { _id: string; date: string; amountPKR: number; note: string | null }[];
  recentLeads: { _id: string; name: string; businessName: string | null; stage: LeadStage; createdAt: string }[];
}
export interface CampaignInput {
  name?: string; code?: string; channel?: CampaignChannel; utmSource?: string | null; utmMedium?: string | null; landingPath?: string;
  startDate?: string | null; endDate?: string | null; budgetPKR?: number | null; notes?: string | null; isArchived?: boolean;
}

export const apiListCampaigns = (archived = false) => client.get<never, ApiResponse<CampaignList>>(`${BASE}/campaigns`, { params: archived ? { archived: 'true' } : {} });
export const apiGetCampaign = (id: string) => client.get<never, ApiResponse<CampaignDetail>>(`${BASE}/campaigns/${id}`);
export const apiSaveCampaign = (id: string | null, body: CampaignInput) =>
  id ? client.patch<never, ApiResponse<CampaignDetail>>(`${BASE}/campaigns/${id}`, body) : client.post<never, ApiResponse<CampaignDetail>>(`${BASE}/campaigns`, body);
export const apiAddSpend = (id: string, body: { date: string; amountPKR: number; note?: string }) =>
  client.post<never, ApiResponse<CampaignDetail>>(`${BASE}/campaigns/${id}/spend`, body);
export const apiRemoveSpend = (id: string, spendId: string) => client.delete<never, ApiResponse<CampaignDetail>>(`${BASE}/campaigns/${id}/spend/${spendId}`);

export interface Target { adminId: string; wonDeals: number | null; wonValuePKR: number | null; activities: number | null }
export interface LeaderRow {
  adminId: string; name: string; newLeads: number; activities: number; demos: number; won: number; wonValuePKR: number; lost: number;
  winRate: number | null; openLeads: number; openValuePKR: number; overdue: number; target: Target | null;
  progress: { wonDeals: number | null; wonValuePKR: number | null; activities: number | null };
}
export interface TeamReport { month: string; reps: LeaderRow[]; unassignedOpen: number }
export interface SalesSettings { autoAssign: boolean; assigneeIds: string[] }

export const apiSalesTeam = (month?: string) => client.get<never, ApiResponse<TeamReport>>(`${BASE}/team`, { params: month ? { month } : {} });
export const apiSaveTargets = (month: string, targets: Target[]) => client.put<never, ApiResponse<TeamReport>>(`${BASE}/targets`, { month, targets });
export const apiSalesSettings = () => client.get<never, ApiResponse<SalesSettings>>(`${BASE}/settings`);
export const apiSaveSalesSettings = (s: SalesSettings) => client.put<never, ApiResponse<SalesSettings>>(`${BASE}/settings`, s);

// ── Partners & commissions ──────────────────────────────────────────────────

export const PARTNER_KINDS = ['rep', 'reseller', 'agent'] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];
export const PARTNER_KIND_LABELS: Record<PartnerKind, string> = { rep: 'Sales rep', reseller: 'Reseller', agent: 'Agent' };
export const PAYOUT_METHODS = ['bank', 'jazzcash', 'easypaisa', 'cash', 'other'] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];
export const PAYOUT_LABELS: Record<PayoutMethod, string> = { bank: 'Bank transfer', jazzcash: 'JazzCash', easypaisa: 'Easypaisa', cash: 'Cash', other: 'Other' };
export const REFERRAL_SOURCE_LABELS: Record<string, string> = { code: 'Signed up with their link', demo_form: 'Booked a demo with their link', lead_owner: 'Their sales lead', manual: 'Added by a manager' };
export const LINE_STATUS_LABELS: Record<string, string> = { pending: 'On hold', payable: 'Payable', paid: 'Paid', void: 'Void' };

export interface CommissionPlan {
  _id: string; name: string; description: string | null; bountyPKR: number | null; percent: number | null; percentMonths: number | null;
  tiers: { minPaying: number; percent: number }[]; holdDays: number; minPayoutPKR: number; isArchived: boolean; partners?: number;
}
export type CommissionPlanInput = Partial<Omit<CommissionPlan, '_id' | 'partners'>>;
export interface Partner {
  _id: string; name: string; kind: PartnerKind; code: string; adminId: string | null; email: string | null; phone: string | null; city: string | null;
  planId: string | null; payoutMethod: PayoutMethod; payoutDetails: string | null; status: 'active' | 'paused'; notes?: string | null; createdAt: string;
}
export type PartnerInput = Partial<Omit<Partner, '_id' | 'createdAt'>>;
export interface PartnerRow extends Partner { planName: string | null; referred: number; payingNow: number; pendingPKR: number; payablePKR: number; paidPKR: number }
export interface CommissionLine { _id: string; earnedAt: string; payableAt: string; type: 'bounty' | 'percent' | 'adjustment'; description: string | null; merchant: string | null; amountPKR: number; status: string }
export interface PartnerPayout { _id: string; amountPKR: number; paidAt: string; method: PayoutMethod; reference: string | null; note?: string | null }
export interface PartnerDetail {
  partner: Partner; link: string; plan: CommissionPlan | null;
  balances: { pendingPKR: number; payablePKR: number; paidPKR: number; earnedPKR: number };
  referrals: { sellerId: string; merchant: string; source: string; effectiveFrom: string; payingNow: boolean; earnedPKR: number }[];
  lines: CommissionLine[]; payouts: PartnerPayout[];
}
export interface PartnerStatement {
  month: string; openingPKR: number; earnedPKR: number; paidPKR: number; closingPKR: number;
  lines: CommissionLine[]; payouts: PartnerPayout[];
}

export const apiCommissionPlans = () => client.get<never, ApiResponse<CommissionPlan[]>>(`${BASE}/commission-plans`);
export const apiSaveCommissionPlan = (id: string | null, body: CommissionPlanInput) =>
  id ? client.patch<never, ApiResponse<CommissionPlan[]>>(`${BASE}/commission-plans/${id}`, body) : client.post<never, ApiResponse<CommissionPlan[]>>(`${BASE}/commission-plans`, body);
export const apiPartners = () => client.get<never, ApiResponse<PartnerRow[]>>(`${BASE}/partners`);
export const apiPartner = (id: string) => client.get<never, ApiResponse<PartnerDetail>>(`${BASE}/partners/${id}`);
export const apiSavePartner = (id: string | null, body: PartnerInput) =>
  id ? client.patch<never, ApiResponse<PartnerDetail>>(`${BASE}/partners/${id}`, body) : client.post<never, ApiResponse<PartnerDetail>>(`${BASE}/partners`, body);
export const apiAddReferral = (id: string, body: { sellerEmail: string; effectiveFrom?: string | null }) => client.post<never, ApiResponse<PartnerDetail>>(`${BASE}/partners/${id}/referrals`, body);
export const apiRemoveReferral = (id: string, sellerId: string) => client.delete<never, ApiResponse<PartnerDetail>>(`${BASE}/partners/${id}/referrals/${sellerId}`);
export const apiAddAdjustment = (id: string, body: { amountPKR: number; description: string }) => client.post<never, ApiResponse<PartnerDetail>>(`${BASE}/partners/${id}/adjustments`, body);
export const apiPartnerStatement = (id: string, month: string) => client.get<never, ApiResponse<PartnerStatement>>(`${BASE}/partners/${id}/statement`, { params: { month } });
export const apiRecordPayout = (id: string, body: { method?: PayoutMethod; reference?: string; paidAt?: string; note?: string }) =>
  client.post<never, ApiResponse<PartnerDetail>>(`${BASE}/partners/${id}/payouts`, body);
export const apiRunCommissions = () => client.post<never, { success: boolean; attributed: number; created: number; matured: number; skipped?: string }>(`${BASE}/commissions/run`);

/** The signed-in admin's own partner account (null when they are not a partner). */
export const apiMyPartner = (month?: string) => client.get<never, ApiResponse<(PartnerDetail & { statement: PartnerStatement }) | null>>('/api/admin/partner-portal', { params: month ? { month } : {} });
export const apiMyStatement = (month: string) => client.get<never, ApiResponse<PartnerStatement>>('/api/admin/partner-portal/statement', { params: { month } });

/** "20% for 12 months · PKR 5,000 per new paying merchant" */
export function describePlan(p: Pick<CommissionPlan, 'bountyPKR' | 'percent' | 'percentMonths' | 'tiers' | 'holdDays'>): string {
  const parts: string[] = [];
  if (p.bountyPKR) parts.push(`${formatPKR(p.bountyPKR)} per new paying merchant`);
  if (p.percent) parts.push(`${p.percent}% of what they pay ${p.percentMonths === null ? 'for as long as they pay' : p.percentMonths === 0 ? 'on their first payment' : `for ${p.percentMonths} months`}`);
  if (p.tiers?.length) parts.push(p.tiers.map(t => `${t.percent}% from ${t.minPaying} paying`).join(', '));
  return parts.join(' · ') || 'Nothing set';
}
export interface PartnerLogin { _id: string; name: string; email: string; status: string; roleName: string | null; partnerName: string | null }
export const apiPartnerLogins = () => client.get<never, ApiResponse<PartnerLogin[]>>(`${BASE}/partner-logins`);

// ── AI sales agent ──────────────────────────────────────────────────────────

export interface AgentConfig {
  connected: boolean; aiEnabled: boolean; aiFirstReply: boolean; aiChat: boolean; aiAgentName: string; aiGreeting: string | null;
  aiKnowledge: string | null; defaultKnowledge: string; aiRules: string | null; aiSignOff: string | null; aiReplyTo: string | null;
  aiChatDailyLimit: number; chatsToday: number;
}
export type AgentConfigInput = Partial<Omit<AgentConfig, 'connected' | 'defaultKnowledge' | 'chatsToday'>>;
export interface ChatMessage { role: 'visitor' | 'agent'; text: string; at?: string }
export interface ChatTranscript {
  _id: string; leadId: string | null; status: 'open' | 'handed_over'; summary: string | null; language: string | null;
  details: Record<string, string>; page: string | null; createdAt: string; updatedAt: string; messages: ChatMessage[];
}
export interface AgentPreview { reply: string; language: string | null; details: Record<string, string>; wantsDemo: boolean; wantsHuman: boolean; preferredTime: string; summary: string }

export const apiAgentConfig = () => client.get<never, ApiResponse<AgentConfig>>(`${BASE}/ai-agent`);
export const apiSaveAgentConfig = (body: AgentConfigInput) => client.put<never, ApiResponse<AgentConfig>>(`${BASE}/ai-agent`, body);
export const apiPreviewAgent = (message: string, history: ChatMessage[]) => client.post<never, ApiResponse<AgentPreview>>(`${BASE}/ai-agent/preview`, { message, history: history.map(h => ({ role: h.role, text: h.text })) });
export const apiAgentChats = () => client.get<never, ApiResponse<ChatTranscript[]>>(`${BASE}/ai-agent/chats`);
export const apiLeadChats = (leadId: string) => client.get<never, ApiResponse<ChatTranscript[]>>(`${BASE}/leads/${leadId}/chats`);
export const apiResolveAiDraft = (leadId: string, sent: boolean) => client.post<never, ApiResponse<LeadDetail>>(`${BASE}/leads/${leadId}/ai-draft`, { sent });

/** Public (no login): the website chat. */
export const apiChatConfig = () => client.get<never, ApiResponse<{ enabled: boolean; agentName: string; greeting: string }>>('/api/sales/chat/config');
export const apiChatStart = (body: { page?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; partnerCode?: string }) =>
  client.post<never, ApiResponse<{ token: string; agentName: string; greeting: string }>>('/api/sales/chat/start', body);
export const apiChatSend = (token: string, message: string) =>
  client.post<never, ApiResponse<{ reply: string; leadCreated: boolean; handedOver: boolean }>>(`/api/sales/chat/${token}/message`, { message });
