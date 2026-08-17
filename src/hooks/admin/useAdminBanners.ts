import { useState, useEffect, useCallback } from 'react';
import { apiGetBanners, apiGetBannerCount, type Banner, type BannerCountData } from '@/api/services/banner';

export function useAdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    return apiGetBanners()
      .then(res => setBanners(res.data ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load banners.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { banners, loading, error, refetch };
}

export function useBannerCount(refreshKey: number) {
  const [count, setCount] = useState<BannerCountData | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetBannerCount()
      .then(res => { if (!cancelled) setCount(res.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey]);

  return count;
}
