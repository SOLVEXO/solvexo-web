import { useCallback, useState } from 'react';
import {
  apiListSeoIntegrations,
  apiGetSeoIntegrationAuthUrl,
  apiConnectSeoIntegration,
  apiDisconnectSeoIntegration,
  type SeoIntegrationProvider,
  type ConnectIntegrationPayload,
} from '@/api/services/seo/seller/integrations.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoIntegrations(storeId: string) {
  return useAnalyticsQuery(
    (p: { storeId: string }) => apiListSeoIntegrations(p.storeId),
    { storeId },
  );
}

export function useSeoIntegrationMutations() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getAuthUrl = useCallback(async (storeId: string, provider: SeoIntegrationProvider | string, redirectUri: string) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiGetSeoIntegrationAuthUrl(storeId, provider, redirectUri);
      return res.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get authorization URL.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const connect = useCallback(async (storeId: string, provider: SeoIntegrationProvider | string, payload: ConnectIntegrationPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiConnectSeoIntegration(storeId, provider, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect integration.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const disconnect = useCallback(async (storeId: string, provider: SeoIntegrationProvider | string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiDisconnectSeoIntegration(storeId, provider);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { getAuthUrl, connect, disconnect, submitting, error };
}
