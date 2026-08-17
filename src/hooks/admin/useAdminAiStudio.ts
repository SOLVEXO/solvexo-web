import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiGetAdminAiStudioOverview,
  apiListAdminGenerations,
  apiGetAdminGeneration,
  apiListAdminWallets,
  apiGetAdminWalletLedger,
  apiAdjustAdminWallet,
  apiListAdminTransactions,
  apiGeneratePlatformSeo,
  apiGeneratePlatformEmail,
  apiStartPlatformImageEnhance,
  apiGetPlatformImageJob,
  type AdminGenerationsListParams,
  type AdminWalletsListParams,
  type AdjustWalletPayload,
  type AdminTransactionsListParams,
  type PlatformGenerateSeoPayload,
  type PlatformGenerateEmailPayload,
  type PlatformGenerateImagePayload,
  type PlatformSeoResult,
  type PlatformEmailResult,
  type PlatformImageJobResult,
} from '@/api/services/adminAiStudio';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

// ── Overview ───────────────────────────────────────────────────────────────────

export function useAdminAiStudioOverview(days: number) {
  return useAnalyticsQuery(
    (p: { days: number }) => apiGetAdminAiStudioOverview(p.days),
    { days },
  );
}

// ── Generations ────────────────────────────────────────────────────────────────

export function useAdminAiGenerations(params: AdminGenerationsListParams) {
  return useAnalyticsQuery(apiListAdminGenerations, params);
}

export function useAdminAiGeneration(generationId: string) {
  return useAnalyticsQuery(
    (p: { generationId: string }) => apiGetAdminGeneration(p.generationId),
    { generationId },
  );
}

// ── Wallets ────────────────────────────────────────────────────────────────────

export function useAdminAiWallets(params: AdminWalletsListParams) {
  return useAnalyticsQuery(apiListAdminWallets, params);
}

export function useAdminAiWalletLedger(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiGetAdminWalletLedger(p.storeId),
    { storeId },
  );
}

export function useAdjustAdminAiWallet() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const adjustWallet = useCallback(async (storeId: string, payload: AdjustWalletPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiAdjustAdminWallet(storeId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust wallet.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { adjustWallet, submitting, error };
}

// ── Transactions ───────────────────────────────────────────────────────────────

export function useAdminAiTransactions(params: AdminTransactionsListParams) {
  return useAnalyticsQuery(apiListAdminTransactions, params);
}

// ── Platform generation ──────────────────────────────────────────────────────────

export function useGeneratePlatformSeo() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlatformSeoResult | null>(null);

  const generate = useCallback(async (payload: PlatformGenerateSeoPayload) => {
    setGenerating(true);
    setError('');
    try {
      const res = await apiGeneratePlatformSeo(payload);
      setResult(res.data);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating, error, result };
}

export function useGeneratePlatformEmail() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlatformEmailResult | null>(null);

  const generate = useCallback(async (payload: PlatformGenerateEmailPayload) => {
    setGenerating(true);
    setError('');
    try {
      const res = await apiGeneratePlatformEmail(payload);
      setResult(res.data);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating, error, result };
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

export function usePlatformImageEnhance() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlatformImageJobResult | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef(0);

  useEffect(() => () => { if (pollTimer.current) clearInterval(pollTimer.current); }, []);

  const start = useCallback(async (payload: PlatformGenerateImagePayload) => {
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await apiStartPlatformImageEnhance(payload);
      pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;

      return await new Promise<PlatformImageJobResult | null>((resolve) => {
        pollTimer.current = setInterval(async () => {
          try {
            const jobRes = await apiGetPlatformImageJob(res.data.jobId);
            if (jobRes.data.status === 'processing' && Date.now() < pollDeadline.current) return;

            if (pollTimer.current) clearInterval(pollTimer.current);
            setGenerating(false);
            setResult(jobRes.data);
            if (jobRes.data.status === 'failed') setError(jobRes.data.errorMessage ?? 'Image enhancement failed.');
            resolve(jobRes.data);
          } catch (err) {
            if (pollTimer.current) clearInterval(pollTimer.current);
            setGenerating(false);
            setError(err instanceof Error ? err.message : 'Failed to poll enhancement job.');
            resolve(null);
          }
        }, POLL_INTERVAL_MS);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start image enhancement.');
      setGenerating(false);
      return null;
    }
  }, []);

  return { start, generating, error, result };
}
