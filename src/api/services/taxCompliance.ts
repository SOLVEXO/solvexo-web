import client from '../client';
import type { ComplianceState } from '@/utils/complianceWording';

export interface ComplianceHistoryEntry {
  from: ComplianceState; to: ComplianceState; at: string; by: string; byName: string | null;
  source: string | null; accountantName: string | null; note: string | null; auto: boolean;
}
export interface VerifiedRule { country: string; supplyType: string; treatment: string; ratePercent: number | null; source: string | null; accountantName: string | null; verifiedAt: string | null }
export interface ComplianceView {
  subjectId: string; country: string; authority: string; state: ComplianceState;
  snapshot: { registrationNumber: string | null; rulePackHash: string | null; adapterVersion: string | null; tokenFingerprint: string | null };
  history: ComplianceHistoryEntry[]; liveApprovedAt: string | null; liveApprovedBy: string | null;
  complianceAllowsProduction: boolean; productionLocked: boolean; verifiedRules: VerifiedRule[];
}
export interface RuleBody { country: string; supplyType?: string; treatment: string; ratePercent?: number | null; source: string; accountantName: string }

interface ApiResponse<T> { success: boolean; data: T }
// Platform-only routes (Super Admin moves it up; a team admin can only read).
const BASE = '/api/admin/tax-compliance';

export const apiGetCompliance = () => client.get<never, ApiResponse<ComplianceView>>(BASE);
export const apiMarkResearched = (body: { source: string; note?: string }) => client.post<never, ApiResponse<ComplianceView>>(`${BASE}/research`, body);
export const apiSaveVerifiedRule = (body: RuleBody) => client.put<never, ApiResponse<ComplianceView>>(`${BASE}/rules`, body);
export const apiVerifyRules = (body: { source: string; accountantName: string; note?: string }) => client.post<never, ApiResponse<ComplianceView>>(`${BASE}/verify-rules`, body);
export const apiApproveLive = (confirmation: string) => client.post<never, ApiResponse<ComplianceView>>(`${BASE}/approve-live`, { confirmation });
export const apiRevokeLive = (note?: string) => client.post<never, ApiResponse<ComplianceView>>(`${BASE}/revoke-live`, { note });
