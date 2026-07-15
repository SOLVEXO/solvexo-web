import { useCallback, useState } from 'react';
import {
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

export function useGenerateSeoAiSuggestion() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<AiSeoSuggestion | null>(null);

  const generate = useCallback(async (storeId: string, payload: GenerateAiSuggestionPayload) => {
    setGenerating(true);
    setError('');
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
  }, []);

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

  const reset = useCallback(() => setSuggestion(null), []);

  return { generate, generateBulk, reset, generating, error, suggestion };
}
