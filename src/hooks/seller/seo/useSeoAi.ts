import { useCallback, useState } from 'react';
import {
  apiAcceptSeoAiSuggestion,
  apiGenerateSeoAiSuggestion,
  apiGenerateSeoAiSuggestionBulk,
  apiGetSeoAiSuggestionHistory,
  type GenerateAiSuggestionPayload,
  type GenerateAiSuggestionBulkPayload,
  type AiSeoSuggestion,
  type SeoAiSuggestionsParams,
} from '@/api/services/seo/seller/ai.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoAiSuggestionHistory(storeId: string, params: SeoAiSuggestionsParams) {
  return useAnalyticsQuery(
    (p: { storeId: string } & SeoAiSuggestionsParams) => apiGetSeoAiSuggestionHistory(p.storeId, p),
    { storeId, ...params },
  );
}

/** Writes a previewed suggestion onto its product/store. `acceptingId` tells which one is in flight (history rows). */
export function useAcceptSeoAiSuggestion() {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const accept = useCallback(async (storeId: string, suggestionId: string) => {
    setAcceptingId(suggestionId);
    setError('');
    try {
      await apiAcceptSeoAiSuggestion(storeId, suggestionId);
      setAppliedId(suggestionId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply this suggestion.');
      return false;
    } finally {
      setAcceptingId(null);
    }
  }, []);

  const reset = useCallback(() => { setError(''); setAppliedId(null); }, []);

  return { accept, reset, accepting: acceptingId !== null, acceptingId, appliedId, error };
}

export function useGenerateSeoAiSuggestion() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<AiSeoSuggestion | null>(null);
  const acceptState = useAcceptSeoAiSuggestion();
  const { reset: resetAccept } = acceptState;

  const generate = useCallback(async (storeId: string, payload: GenerateAiSuggestionPayload) => {
    setGenerating(true);
    setError('');
    resetAccept();
    try {
      const res = await apiGenerateSeoAiSuggestion(storeId, payload);
      setSuggestion(res.data);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI SEO suggestion.');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [resetAccept]);

  const generateBulk = useCallback(async (storeId: string, payload: GenerateAiSuggestionBulkPayload) => {
    setGenerating(true);
    setError('');
    try {
      await apiGenerateSeoAiSuggestionBulk(storeId, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start bulk AI SEO generation.');
      return false;
    } finally {
      setGenerating(false);
    }
  }, []);

  const reset = useCallback(() => { setSuggestion(null); resetAccept(); }, [resetAccept]);

  return {
    generate, generateBulk, reset, generating, error, suggestion,
    accept: acceptState.accept,
    accepting: acceptState.accepting,
    acceptError: acceptState.error,
    applied: !!suggestion?.suggestionId && acceptState.appliedId === suggestion.suggestionId,
  };
}
