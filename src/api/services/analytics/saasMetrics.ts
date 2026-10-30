import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

/** Must match solvexo-api/src/admin-analytics/saas-metrics.service.ts (getMetrics). Money is USD; percents are 0-100. */
export interface SaasMonth {
  month: string; // 'YYYY-MM'
  source: 'live' | 'snapshot' | 'reconstructed';
  mrr: number; arr: number; payingStores: number; arpu: number;
  startMrr: number; endMrr: number; startStores: number; endStores: number;
  newMrr: number; expansionMrr: number; contractionMrr: number; churnedMrr: number; reactivationMrr: number; netNewMrr: number;
  newStores: number; churnedStores: number; reactivatedStores: number; expandedStores: number; contractedStores: number;
  nrrPercent: number | null; grrPercent: number | null; logoChurnPercent: number | null; revenueChurnPercent: number | null; quickRatio: number | null;
}
export interface SaasCohort { cohort: string; stores: number; startMrr: number; retention: { month: number; storesPercent: number; revenuePercent: number | null }[] }
export interface SaasTrialMonth { month: string; started: number; converted: number; stillTrialing: number; conversionPercent: number | null; avgDaysToConvert: number | null }
export interface SaasMetrics {
  asOf: string;
  months: number;
  current: {
    mrr: number; arr: number; payingStores: number; arpu: number; netNewMrrThisMonth: number;
    nrrPercentTrailing12: number | null; nrrPercentThisMonth: number | null; grrPercentThisMonth: number | null;
    logoChurnPercentThisMonth: number | null; revenueChurnPercentThisMonth: number | null; quickRatioThisMonth: number | null;
    avgMonthlyLogoChurnPercent: number | null; ltv: number | null; expectedLifetimeMonths: number | null;
  };
  periodTotals: { newMrr: number; expansionMrr: number; reactivationMrr: number; contractionMrr: number; churnedMrr: number };
  monthly: SaasMonth[];
  byPlan: { planId: string; planName: string; stores: number; mrr: number }[];
  cohorts: SaasCohort[];
  trials: SaasTrialMonth[];
  dataQuality: { firstDailySnapshot: string | null; reconstructedMonths: string[] };
}

export const apiGetSaasMetrics = (months: number) =>
  client.get<never, { success: boolean; data: SaasMetrics }>(`${ENDPOINTS.ANALYTICS.ADMIN.SAAS_METRICS}?months=${months}`);

export async function apiExportSaasMetrics(months: number) {
  const blob = await client.get<never, Blob>(`${ENDPOINTS.ANALYTICS.ADMIN.SAAS_METRICS_EXPORT}?months=${months}`, { responseType: 'blob' } as never);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'solvexo-saas-metrics.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Merchant activation funnel (SaaS Metrics → Activation). Must match activation-funnel.util.ts. ──
export type FunnelStep = 'signed_up' | 'verified' | 'store' | 'product' | 'sale' | 'paying';
export interface ActivationFunnel {
  from: string; months: number;
  steps: { step: FunnelStep; label: string; merchants: number; percentOfSignups: number | null; percentOfPrevious: number | null; medianDaysFromSignup: number | null }[];
  byCohort: { month: string; signups: number; percent: Record<FunnelStep, number | null> }[];
  bySource: { source: string; signups: number; storePercent: number | null; salePercent: number | null; payingPercent: number | null }[];
  stuck: { sellerId: string; name: string | null; email: string | null; stuckAt: FunnelStep; nextStep: FunnelStep; daysStuck: number; signedUpDaysAgo: number }[];
}

export const apiGetActivationFunnel = (months: number) =>
  client.get<never, { success: boolean; data: ActivationFunnel }>(`${ENDPOINTS.ANALYTICS.ADMIN.ACTIVATION_FUNNEL}?months=${months}`);
