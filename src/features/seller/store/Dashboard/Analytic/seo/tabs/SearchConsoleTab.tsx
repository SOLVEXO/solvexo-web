import { useState } from 'react';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { IntegrationCard, type IntegrationProvider } from '@/components/comman/seo';
import { useSeoIntegrations, useSeoIntegrationMutations } from '@/hooks/seller/seo/useSeoIntegrations';

interface SearchConsoleTabProps {
  storeId: string;
}

const PROVIDERS: IntegrationProvider[] = ['gsc', 'ga4', 'merchant_center', 'bing'];
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/seo/integrations/callback` : '';

export function SearchConsoleTab({ storeId }: SearchConsoleTabProps) {
  const { data, loading, error, refetch } = useSeoIntegrations(storeId);
  const { getAuthUrl, disconnect, submitting } = useSeoIntegrationMutations();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  const rowFor = (provider: IntegrationProvider) => data?.find(r => r.provider === provider);

  const handleConnect = async (provider: IntegrationProvider) => {
    setBusyProvider(provider);
    const url = await getAuthUrl(storeId, provider, REDIRECT_URI);
    setBusyProvider(null);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    setBusyProvider(provider);
    if (await disconnect(storeId, provider)) refetch();
    setBusyProvider(null);
  };

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      {PROVIDERS.map(provider => {
        const row = rowFor(provider);
        return (
          <IntegrationCard
            key={provider}
            provider={provider}
            status={row?.status ?? 'disconnected'}
            lastSyncedAt={row?.lastSyncedAt}
            lastError={row?.lastError}
            loading={loading}
            busy={submitting && busyProvider === provider}
            onConnect={() => handleConnect(provider)}
            onDisconnect={() => handleDisconnect(provider)}
          />
        );
      })}
    </div>
  );
}
