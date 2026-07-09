import { useCallback, useState } from 'react';
import {
  apiAdminFinanceOverview,
  apiAdminFinanceRevenueOverTime,
  apiAdminFinanceCommissionOverTime,
  apiAdminSellerBalances,
  apiAdminSellerFinancialDetails,
  apiAdminSellerTransactions,
  apiAdminPlatformTransactions,
  apiAdminPayoutQueue,
  apiAdminApprovePayout,
  apiAdminRejectPayout,
  apiAdminRetryPayout,
  apiAdminCreateManualPayout,
  apiAdminProcessClearing,
  apiAdminRefundReport,
  apiAdminTaxReports,
  apiAdminSettlementReport,
  apiAdminMonthlyReport,
  apiAdminFinanceExport,
  type AdminFinanceParams,
  type AdminTransactionsParams,
  type PayoutQueueParams,
  type SellerBalancesParams,
  type AdminFinanceExportParams,
  type ManualPayoutPayload,
} from '@/api/services/finance/adminFinance';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

// ── A. Dashboard overview ───────────────────────────────────────────────────────

export function useAdminFinanceOverview(params: AdminFinanceParams) {
  return useAnalyticsQuery(apiAdminFinanceOverview, params);
}

// ── B. Revenue / commission trends ──────────────────────────────────────────────

export function useAdminFinanceRevenueOverTime(params: AdminFinanceParams) {
  return useAnalyticsQuery(apiAdminFinanceRevenueOverTime, params);
}

export function useAdminFinanceCommissionOverTime(params: AdminFinanceParams) {
  return useAnalyticsQuery(apiAdminFinanceCommissionOverTime, params);
}

// ── C/D. Sellers ──────────────────────────────────────────────────────────────────

export function useAdminSellerBalances(params: SellerBalancesParams) {
  return useAnalyticsQuery(apiAdminSellerBalances, params);
}

export function useAdminSellerFinancialDetails(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiAdminSellerFinancialDetails(p.storeId),
    { storeId },
  );
}

export function useAdminSellerTransactions(storeId: string, params: AdminTransactionsParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & AdminTransactionsParams) => apiAdminSellerTransactions(p.storeId, p),
    { storeId, ...params },
  );
}

// ── E. Platform transactions ──────────────────────────────────────────────────────

export function useAdminPlatformTransactions(params: AdminTransactionsParams) {
  return useAnalyticsQuery(apiAdminPlatformTransactions, params);
}

// ── F. Payout queue & lifecycle ───────────────────────────────────────────────────

export function useAdminPayoutQueue(params: PayoutQueueParams) {
  return useAnalyticsQuery(apiAdminPayoutQueue, params);
}

/** Mutation hook for the approve/reject/retry payout actions — caller calls `refetch()` on the queue hook after a successful action. */
export function useAdminPayoutActions() {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const approvePayout = useCallback(async (payoutId: string) => {
    setProcessingId(payoutId);
    setError('');
    try {
      await apiAdminApprovePayout(payoutId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve payout.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const rejectPayout = useCallback(async (payoutId: string, reason: string) => {
    setProcessingId(payoutId);
    setError('');
    try {
      await apiAdminRejectPayout(payoutId, reason);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject payout.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const retryPayout = useCallback(async (payoutId: string) => {
    setProcessingId(payoutId);
    setError('');
    try {
      await apiAdminRetryPayout(payoutId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry payout.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  return { approvePayout, rejectPayout, retryPayout, processingId, error };
}

export function useAdminManualPayout() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createManualPayout = useCallback(async (storeId: string, payload: ManualPayoutPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiAdminCreateManualPayout(storeId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create manual payout.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { createManualPayout, submitting, error };
}

export function useAdminProcessClearing() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ processed: number; totalAmount: number } | null>(null);

  const triggerClearing = useCallback(async () => {
    setProcessing(true);
    setError('');
    try {
      const res = await apiAdminProcessClearing();
      setResult(res.data);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process clearing balances.');
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  return { triggerClearing, processing, error, result };
}

// ── G. Reports ────────────────────────────────────────────────────────────────────

export function useAdminRefundReport(params: AdminFinanceParams) {
  return useAnalyticsQuery(apiAdminRefundReport, params);
}

export function useAdminTaxReports(params: { storeId?: string; year?: number }) {
  return useAnalyticsQuery(apiAdminTaxReports, params);
}

export function useAdminSettlementReport(params: AdminFinanceParams) {
  return useAnalyticsQuery(apiAdminSettlementReport, params);
}

export function useAdminMonthlyReport(params: { months?: number }) {
  return useAnalyticsQuery(apiAdminMonthlyReport, params);
}

// ── H. Export ─────────────────────────────────────────────────────────────────────

export function useAdminFinanceExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const exportReport = useCallback(async (params: AdminFinanceExportParams) => {
    setExporting(true);
    setError('');
    try {
      await apiAdminFinanceExport(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportReport, exporting, error };
}
