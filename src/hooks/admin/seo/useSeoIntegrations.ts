import { useCallback, useState } from 'react';
import {
  apiListSeoIntegrations,
  apiGetSeoIntegrationAuthUrl,
  apiConnectSeoIntegration,
  apiDisconnectSeoIntegration,
  apiSyncSeoIntegration,
  type SeoIntegrationProvider,
  type ConnectIntegrationPayload,
} from '@/api/services/seo/admin/integrations.service';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';

export function useSeoIntegrations() {
  return useAnalyticsQuery((_p: Record<string, never>) => apiListSeoIntegrations(), {});
}

export function useSeoIntegrationMutations() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getAuthUrl = useCallback(async (provider: SeoIntegrationProvider | string, redirectUri: string) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiGetSeoIntegrationAuthUrl(provider, redirectUri);
      return res.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get authorization URL.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const connect = useCallback(async (provider: SeoIntegrationProvider | string, payload: ConnectIntegrationPayload) => {
    setSubmitting(true);
    setError('');
    try {
      await apiConnectSeoIntegration(provider, payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect integration.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const disconnect = useCallback(async (provider: SeoIntegrationProvider | string) => {
    setSubmitting(true);
    setError('');
    try {
      await apiDisconnectSeoIntegration(provider);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const sync = useCallback(async (provider: SeoIntegrationProvider | string, days?: number) => {
    setSubmitting(true);
    setError('');
    try {
      await apiSyncSeoIntegration(provider, days);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync integration.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { getAuthUrl, connect, disconnect, sync, submitting, error };
}
