import { useCallback, useState } from 'react';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import {
  apiGetMarketplaceStats,
  apiGetMarketplaceListings,
  apiSetListingFeatured,
  apiRemoveListing,
  apiSetStoreBadge,
  type MarketplaceListingQuery,
  type GrantableStoreBadge,
} from '@/api/services/marketplace/adminMarketplace';

export function useMarketplaceStats() {
  return useAnalyticsQuery(() => apiGetMarketplaceStats(), {});
}

export function useMarketplaceListings(query: MarketplaceListingQuery) {
  return useAnalyticsQuery(apiGetMarketplaceListings, query);
}

export function useMarketplaceListingActions() {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const setFeatured = useCallback(async (id: string, isFeatured: boolean) => {
    setProcessingId(id);
    setError('');
    try {
      await apiSetListingFeatured(id, isFeatured);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const removeListing = useCallback(async (id: string) => {
    setProcessingId(id);
    setError('');
    try {
      await apiRemoveListing(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove listing.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const setStoreBadge = useCallback(async (storeId: string, badge: GrantableStoreBadge, grant: boolean) => {
    setProcessingId(storeId);
    setError('');
    try {
      await apiSetStoreBadge(storeId, badge, grant);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update store badge.');
      return false;
    } finally {
      setProcessingId(null);
    }
  }, []);

  return { setFeatured, removeListing, setStoreBadge, processingId, error };
}
