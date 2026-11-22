import client from '../client';

/** Channel Partner Programme: applications, vetting, agreement and onboarding (backend `partner-onboarding.service`). */

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export type PartnerStage = 'applied' | 'documents' | 'review' | 'agreement' | 'onboarding' | 'live' | 'rejected';
export type PartnerEntity = 'business' | 'individual';
export type PartnerModel = 'referral' | 'reseller' | 'service' | 'regional';
export type PartnerTier = 'registered' | 'silver' | 'gold' | 'regional';
export type DocStatus = 'pending' | 'verified' | 'rejected';

export const STAGES: PartnerStage[] = ['applied', 'documents', 'review', 'agreement', 'onboarding', 'live', 'rejected'];
export const STAGE_LABELS: Record<PartnerStage, string> = {
  applied: 'New application', documents: 'Uploading documents', review: 'Checking documents', agreement: 'Agreement',
  onboarding: 'Onboarding (30 days)', live: 'Live', rejected: 'Not taken forward',
};
export const STAGE_COLORS: Record<PartnerStage, 'blue' | 'yellow' | 'orange' | 'green' | 'gray' | 'red'> = {
  applied: 'blue', documents: 'yellow', review: 'orange', agreement: 'orange', onboarding: 'yellow', live: 'green', rejected: 'red',
};
export const MODEL_LABELS: Record<PartnerModel, string> = {
  referral: 'Referral Agent', reseller: 'Authorised Reseller', service: 'Service Partner', regional: 'Regional Partner',
};
export const TIER_LABELS: Record<PartnerTier, string> = { registered: 'Registered', silver: 'Silver', gold: 'Gold', regional: 'Regional' };
export const DOC_TYPES = ['company_registration', 'ntn', 'cnic', 'bank_account', 'partnership_proof', 'business_plan', 'reference_letter', 'agreement', 'other'] as const;
export type PartnerDocType = (typeof DOC_TYPES)[number];

export interface ChecklistItem { key: string; label: string; week: number; auto: boolean; done: boolean; doneAt: string | null; dueAt: string | null; overdue: boolean }
export interface PartnerDocument { _id: string; type: PartnerDocType; label: string; fileName: string; uploadedAt: string; uploadedByRole: 'manager' | 'partner'; status: DocStatus; reviewNote: string | null; reviewedAt: string | null }
export interface TierRule { key: PartnerTier; minPayingSellers: number | null; retentionTargetPercent: number | null; certifiedStaff: number; commissionPercent: number | null; demoStores: number }
export interface Agreement { version: string | null; entity: string | null; signedAt: string; startsAt: string; pilotEndsAt: string; termEndsAt: string; noticeBy: string; note: string | null }
export interface ApplicationInfo {
  contactName?: string; contactRole?: string | null; legalName?: string | null; registrationNo?: string | null; ntn?: string | null; address?: string | null;
  teamSize?: number | null; salesContact?: string | null; supportContact?: string | null; website?: string | null; claimedPartnerships?: string | null;
  segments?: string | null; plan90?: string | null; heardFrom?: string | null; message?: string | null;
  references?: { name: string; company: string | null; phone: string | null; email: string | null }[];
}

export interface PartnerOnboarding {
  _id: string; name: string; code: string; email: string | null; phone: string | null; city: string | null; status: 'active' | 'paused';
  stage: PartnerStage; entityType: PartnerEntity; model: PartnerModel | null; resellerMode: 'agency' | 'resale' | null; tier: PartnerTier | null;
  tierRule: (TierRule & { commissionApproved: boolean }) | null;
  territory: string | null; exclusive: boolean; exclusiveFrom: string | null; exclusiveUntil: string | null; houseAccounts?: string[];
  application?: ApplicationInfo | null;
  appliedAt: string | null; invitedAt: string | null; approvedAt: string | null; rejectedAt: string | null; rejectReason: string | null;
  hasLogin: boolean; loginActivatedAt: string | null;
  docs: { required: PartnerDocType[]; missing: PartnerDocType[]; verified: PartnerDocType[]; allUploaded: boolean; allVerified: boolean; labels: Record<PartnerDocType, string> };
  documents: PartnerDocument[];
  agreement: Agreement | null;
  staff: { name: string; phone: string | null; email: string | null; certifiedAt: string | null }[];
  demoStores: { _id: string; name: string; slug: string }[];
  checklist: ChecklistItem[];
  facts: { prospects: number; liveSellers: number };
  attention: string[];
}

export interface BoardRow {
  _id: string; name: string; city: string | null; entityType: PartnerEntity | null; model: PartnerModel | null; tier: PartnerTier | null; territory: string | null;
  stage: PartnerStage; appliedAt: string | null;
  docs: { required: number; verified: number; waiting: number };
  checklist: { done: number; total: number; overdue: number };
  pilotEndsAt: string | null; noticeBy: string | null; attention: string[];
}

export interface ProgrammeSettings {
  tiers: TierRule[]; pilotDays: number; termMonths: number; noticeDays: number; dealResponseWorkingDays: number; dealProtectionDays: number;
  pilotMinPayingSellers: number | null; pilotMinLiveStores: number | null; pilotMaxComplaintRatePercent: number | null;
  activationBonusPKR: number | null; minPayoutPKR: number | null; statementDay: number; payoutDay: number;
  agreementVersion: string; signingEntity: string | null; approvedKeys: string[];
}

export interface PartnerApplication {
  entityType: PartnerEntity; model?: 'reseller' | 'service'; contactName: string; contactRole?: string; legalName?: string; email: string; phone: string; city: string;
  registrationNo?: string; ntn?: string; address?: string; teamSize?: string; salesContact?: string; supportContact?: string; website?: string;
  claimedPartnerships?: string; segments?: string; plan90?: string; heardFrom?: string; message?: string;
  references?: { name: string; company?: string; phone?: string; email?: string }[]; consent: boolean; website2?: string;
}

const B = '/api/admin/sales/partner-programme';
const quiet = { toast: false };

export const apiApplyPartner = (body: PartnerApplication) => client.post<never, ApiResponse<null>>('/api/partners/apply', body, quiet);

export const apiProgrammeSettings = () => client.get<never, ApiResponse<ProgrammeSettings>>(`${B}/settings`);
export const apiSaveProgrammeSettings = (body: Partial<ProgrammeSettings>) => client.patch<never, ApiResponse<ProgrammeSettings>>(`${B}/settings`, body, quiet);
export const apiPartnerBoard = () => client.get<never, ApiResponse<BoardRow[]>>(`${B}/board`);
export const apiPartnerOnboarding = (id: string) => client.get<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}`);
export const apiInvitePartner = (id: string) => client.post<never, ApiResponse<PartnerOnboarding> & { inviteUrl?: string }>(`${B}/partners/${id}/invite`, {}, quiet);
export const apiRejectPartner = (id: string, reason: string) => client.post<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/reject`, { reason }, quiet);
export const apiReopenPartner = (id: string) => client.post<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/reopen`, {}, quiet);
export const apiApprovePartner = (id: string) => client.post<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/approve`, {}, quiet);
export const apiSavePartnerProfile = (id: string, body: Partial<Pick<PartnerOnboarding, 'model' | 'resellerMode' | 'tier' | 'territory' | 'exclusive' | 'exclusiveFrom' | 'exclusiveUntil' | 'houseAccounts'>>) =>
  client.patch<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/profile`, body, quiet);
export const apiRecordAgreement = (id: string, body: { signedAt?: string; version?: string; entity?: string; note?: string }) =>
  client.post<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/agreement`, body, quiet);
export const apiTickChecklist = (id: string, key: string, done: boolean) => client.post<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/checklist/${key}`, { done }, quiet);
export const apiSaveStaff = (id: string, staff: { name: string; phone?: string | null; email?: string | null; certified: boolean }[]) =>
  client.patch<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/staff`, { staff }, quiet);
export const apiSetDemoStores = (id: string, stores: string[]) => client.patch<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/demo-stores`, { stores }, quiet);
export const apiReviewDocument = (id: string, docId: string, status: 'verified' | 'rejected', note?: string) =>
  client.post<never, ApiResponse<PartnerOnboarding>>(`${B}/partners/${id}/documents/${docId}/review`, { status, note }, quiet);
export const apiDocumentUrl = (id: string, docId: string) => client.get<never, ApiResponse<{ url: string; fileName: string }>>(`${B}/partners/${id}/documents/${docId}/url`);

function uploadForm(type: string, file: File) {
  const f = new FormData();
  f.append('type', type);
  f.append('file', file);
  return f;
}
export const apiUploadPartnerDocument = (id: string, type: string, file: File) =>
  client.post<never, ApiResponse<null>>(`${B}/partners/${id}/documents`, uploadForm(type, file), { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000, ...quiet });

// The partner's own page
export const apiMyOnboarding = () => client.get<never, ApiResponse<PartnerOnboarding | null>>('/api/admin/partner-portal/onboarding');
export const apiUploadMyDocument = (type: string, file: File) =>
  client.post<never, ApiResponse<null>>('/api/admin/partner-portal/onboarding/documents', uploadForm(type, file), { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000, ...quiet });
export const apiMyDocumentUrl = (docId: string) => client.get<never, ApiResponse<{ url: string; fileName: string }>>(`/api/admin/partner-portal/onboarding/documents/${docId}/url`);

export const fmtDay = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
