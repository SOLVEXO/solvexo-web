import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiGetAiStudioCredits,
  apiListAiGenerations,
  apiGetAiGeneration,
  apiAcceptAiGeneration,
  apiGenerateListing,
  apiGenerateSeoBooster,
  apiGenerateEmailCampaign,
  apiGenerateWorksheet,
  apiGeneratePriceOptimization,
  apiStartImageEnhance,
  apiGetImageEnhanceJob,
  type AiGenerationsListParams,
  type AcceptGenerationPayload,
  type GenerateListingPayload,
  type GenerateSeoPayload,
  type GenerateEmailPayload,
  type GenerateWorksheetPayload,
  type GeneratePricePayload,
  type GenerateImageEnhancePayload,
  type ListingWriterResult,
  type SeoBoosterResult,
  type EmailCampaignResult,
  type WorksheetResult,
  type PriceOptimizerResult,
  type ImageEnhanceJobResult,
} from '@/api/services/aiStudio';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

// ── Credits ────────────────────────────────────────────────────────────────────

export function useAiStudioCredits(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiGetAiStudioCredits(p.storeId),
    { storeId },
  );
}

// ── History ────────────────────────────────────────────────────────────────────

export function useAiGenerations(storeId: string, params: AiGenerationsListParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & AiGenerationsListParams) => apiListAiGenerations(p.storeId, p),
    { storeId, ...params },
  );
}

export function useAiGeneration(storeId: string, generationId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string; generationId: string }) => apiGetAiGeneration(p.storeId, p.generationId),
    { storeId, generationId },
  );
}

export function useAcceptAiGeneration() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const accept = useCallback(async (storeId: string, generationId: string, payload: AcceptGenerationPayload = {}) => {
    setSubmitting(true);
    setError('');
    try {
      await apiAcceptAiGeneration(storeId, generationId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept generation.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { accept, submitting, error };
}

// ── Generic error extraction ──────────────────────────────────────────────────
// AI Studio failures return a structured 402/422/503 body (errorCode, message,
// data: {required, balance} | {retryable}) — surface the message + errorCode.

interface AiErrorShape { errorCode?: string; message?: string; data?: { required?: number; balance?: number; retryable?: boolean } }

function extractAiError(err: unknown): { message: string; errorCode?: string; required?: number; balance?: number } {
  const anyErr = err as { response?: { data?: AiErrorShape }; message?: string };
  const body = anyErr?.response?.data;
  if (body?.message) {
    return { message: body.message, errorCode: body.errorCode, required: body.data?.required, balance: body.data?.balance };
  }
  return { message: err instanceof Error ? err.message : 'Generation failed.' };
}

// ── 1. Listing Writer ─────────────────────────────────────────────────────────

export function useGenerateListing() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [result, setResult] = useState<ListingWriterResult | null>(null);

  const generate = useCallback(async (storeId: string, payload: GenerateListingPayload) => {
    setGenerating(true);
    setError('');
    setErrorCode(undefined);
    try {
      const res = await apiGenerateListing(storeId, payload);
      setResult(res.data);
      return res.data;
    } catch (err) {
      const { message, errorCode: code } = extractAiError(err);
      setError(message);
      setErrorCode(code);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(''); setErrorCode(undefined); }, []);

  return { generate, reset, generating, error, errorCode, result };
}

// ── 2. SEO Booster ─────────────────────────────────────────────────────────────

export function useGenerateSeoBooster() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [result, setResult] = useState<SeoBoosterResult | null>(null);

  const generate = useCallback(async (storeId: string, payload: GenerateSeoPayload) => {
    setGenerating(true);
    setError('');
    setErrorCode(undefined);
    try {
      const res = await apiGenerateSeoBooster(storeId, payload);
      setResult(res.data);
      return res.data;
    } catch (err) {
      const { message, errorCode: code } = extractAiError(err);
      setError(message);
      setErrorCode(code);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(''); setErrorCode(undefined); }, []);

  return { generate, reset, generating, error, errorCode, result };
}

// ── 3. Email Campaigns ─────────────────────────────────────────────────────────

export function useGenerateEmailCampaign() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [result, setResult] = useState<EmailCampaignResult | null>(null);

  const generate = useCallback(async (storeId: string, payload: GenerateEmailPayload) => {
    setGenerating(true);
    setError('');
    setErrorCode(undefined);
    try {
      const res = await apiGenerateEmailCampaign(storeId, payload);
      setResult(res.data);
      return res.data;
    } catch (err) {
      const { message, errorCode: code } = extractAiError(err);
      setError(message);
      setErrorCode(code);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(''); setErrorCode(undefined); }, []);

  return { generate, reset, generating, error, errorCode, result };
}

// ── 4. Worksheet Builder ───────────────────────────────────────────────────────

export function useGenerateWorksheet() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [result, setResult] = useState<WorksheetResult | null>(null);

  const generate = useCallback(async (storeId: string, payload: GenerateWorksheetPayload) => {
    setGenerating(true);
    setError('');
    setErrorCode(undefined);
    try {
      const res = await apiGenerateWorksheet(storeId, payload);
      setResult(res.data);
      return res.data;
    } catch (err) {
      const { message, errorCode: code } = extractAiError(err);
      setError(message);
      setErrorCode(code);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(''); setErrorCode(undefined); }, []);

  return { generate, reset, generating, error, errorCode, result };
}

// ── 5. Price Optimizer ─────────────────────────────────────────────────────────

export function useGeneratePriceOptimization() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [result, setResult] = useState<PriceOptimizerResult | null>(null);

  const generate = useCallback(async (storeId: string, payload: GeneratePricePayload) => {
    setGenerating(true);
    setError('');
    setErrorCode(undefined);
    try {
      const res = await apiGeneratePriceOptimization(storeId, payload);
      setResult(res.data);
      return res.data;
    } catch (err) {
      const { message, errorCode: code } = extractAiError(err);
      setError(message);
      setErrorCode(code);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(''); setErrorCode(undefined); }, []);

  return { generate, reset, generating, error, errorCode, result };
}

// ── 6. Image Enhancer (async, polls until settled) ─────────────────────────────

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

export function useImageEnhance() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [result, setResult] = useState<ImageEnhanceJobResult | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef(0);

  useEffect(() => () => { if (pollTimer.current) clearInterval(pollTimer.current); }, []);

  const start = useCallback(async (storeId: string, payload: GenerateImageEnhancePayload) => {
    setGenerating(true);
    setError('');
    setErrorCode(undefined);
    setResult(null);
    try {
      const res = await apiStartImageEnhance(storeId, payload);
      pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;

      return await new Promise<ImageEnhanceJobResult | null>((resolve) => {
        pollTimer.current = setInterval(async () => {
          try {
            const jobRes = await apiGetImageEnhanceJob(storeId, res.data.jobId);
            if (jobRes.data.status === 'processing' && Date.now() < pollDeadline.current) return;

            if (pollTimer.current) clearInterval(pollTimer.current);
            setGenerating(false);
            if (jobRes.data.status === 'failed') {
              setError(jobRes.data.errorMessage ?? 'Image enhancement failed.');
              setResult(jobRes.data);
              resolve(null);
            } else {
              setResult(jobRes.data);
              resolve(jobRes.data);
            }
          } catch (err) {
            if (pollTimer.current) clearInterval(pollTimer.current);
            setGenerating(false);
            const { message, errorCode: code } = extractAiError(err);
            setError(message);
            setErrorCode(code);
            resolve(null);
          }
        }, POLL_INTERVAL_MS);
      });
    } catch (err) {
      const { message, errorCode: code } = extractAiError(err);
      setError(message);
      setErrorCode(code);
      setGenerating(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    setResult(null);
    setError('');
    setErrorCode(undefined);
    setGenerating(false);
  }, []);

  return { start, reset, generating, error, errorCode, result };
}
