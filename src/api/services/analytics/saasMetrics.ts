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

// ── Revenue model (SaaS Metrics → Revenue model; finance.view). Must match admin-finance/revenue-model.{util,service}.ts. ──
export type RevenueStream = 'plans' | 'transactionFees' | 'commission' | 'addons' | 'posPlans' | 'promotions';
export interface RevenueModel {
  months: number; from: string;
  summary: {
    totalRevenue: number; totalGmv: number; takeRatePercent: number | null; transactionalTakeRatePercent: number | null;
    subscriptionSharePercent: number | null; thisMonthSoFar: number;
    lastFullMonth: { month: string; revenue: number; takeRatePercent: number | null } | null;
    revenuePerPayingStore: number | null; payingStores: number;
  };
  monthly: { month: string; streams: Record<RevenueStream, number>; total: number; subscription: number; transactional: number; gmv: number; orders: number; takeRatePercent: number | null; transactionalTakeRatePercent: number | null }[];
  streams: { stream: RevenueStream; label: string; total: number; sharePercent: number | null; lastMonth: number; previousMonth: number; changePercent: number | null }[];
  concentration: { top10SharePercent: number | null; top: { storeId: string; storeName: string; sellerId: string | null; amount: number; sharePercent: number | null }[] };
  notes: { excluded: string[]; unconvertedCurrencies?: string[] };
}

export const apiGetRevenueModel = (months: number) =>
  client.get<never, { success: boolean; data: RevenueModel }>(`${ENDPOINTS.FINANCE.ADMIN.REVENUE_MODEL}?months=${months}`);

// ── Plan insights (SaaS Metrics → Plans). Must match admin-analytics/plan-insights.{util,service}.ts. ──
export type PlanMoveKind = 'new' | 'upgrade' | 'downgrade' | 'interval' | 'lateral';
export interface PlanInsightRow {
  planId: string; name: string; status: string; isFree: boolean; isPublic: boolean; isCustomPricing: boolean;
  monthlyPriceUSD: number | null; yearlyPriceUSD: number | null; yearlyDiscountPercent: number | null;
  transactionFeePercent: number | null; maxProducts: number | null;
  stores: number; payingStores: number; yearlyStores: number; pastDueStores: number;
  mrr: number; mrrSharePercent: number | null; arpu: number | null;
  belowListStores: number; belowListGapMrr: number; cancelingStores: number; cancelingMrr: number;
  scheduledDowngrades: number; scheduledDowngradeMrr: number;
  newStores: number; upgradesIn: number; downgradesIn: number; upgradesOut: number; downgradesOut: number;
  payingAtStart: number; stoppedPaying: number; stoppedPayingPercent: number | null;
}
export interface PlanInsights {
  months: number; from: string;
  summary: {
    mrr: number; payingStores: number; trialingStores: number; freePlanStores: number; yearlySharePercent: number | null;
    newStores: number; newMrr: number; upgrades: number; upgradeMrr: number; downgrades: number; downgradeMrr: number;
    upgradeToDowngradeRatio: number | null; intervalSwitches: number; switchedToYearly: number;
    belowListStores: number; belowListGapMrr: number; cancelingStores: number; cancelingMrr: number;
    scheduledDowngrades: number; scheduledDowngradeMrr: number; outgrowingStores: number; upgradeOpportunityMrr: number;
  };
  plans: PlanInsightRow[];
  moves: { fromPlanId: string | null; fromName: string; toPlanId: string | null; toName: string; kind: PlanMoveKind; moves: number; mrrChange: number }[];
  monthly: { month: string; new: number; upgrades: number; downgrades: number; newMrr: number; upgradeMrr: number; downgradeMrr: number }[];
  candidates: {
    storeId: string; storeName: string; sellerId: string | null; planId: string; planName: string; products: number; maxProducts: number;
    usagePercent: number; suggestedPlanId: string | null; suggestedPlanName: string | null; mrrIfUpgraded: number | null; currentMrr: number;
  }[];
}

export const apiGetPlanInsights = (months: number) =>
  client.get<never, { success: boolean; data: PlanInsights }>(`${ENDPOINTS.ANALYTICS.ADMIN.PLAN_INSIGHTS}?months=${months}`);
